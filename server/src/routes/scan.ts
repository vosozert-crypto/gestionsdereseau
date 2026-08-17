import { Router, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { scanSubnet, isScanActive, createDiscoveryDevice } from '../services/ipScanner.js';
import { wmiClient } from '../services/wmiClient.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();
router.use(authenticateToken);

const scanSchema = z.object({
  subnet: z.string().optional().default('10.10.0.0'),
  startIp: z.number().int().min(1).max(254).optional().default(1),
  endIp: z.number().int().min(1).max(254).optional().default(254),
});

router.get('/status', (req: AuthRequest, res: Response): void => {
  res.json({ active: isScanActive() });
});

router.post('/', requireRole('admin', 'operator'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = scanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid scan parameters', details: parsed.error.flatten() });
    return;
  }

  if (isScanActive()) {
    res.status(409).json({ error: 'A scan is already in progress' });
    return;
  }

  const { subnet, startIp, endIp } = parsed.data;

  logAudit(req, 'SCAN_START', 'network', subnet, `Scanning ${subnet}.${startIp}-${endIp}`);

  try {
    const results = await scanSubnet(subnet, startIp, endIp);
    const discovered = results.filter(r => !r.isRegistered);

    logAudit(req, 'SCAN_COMPLETE', 'network', subnet, `Found ${results.length} hosts, ${discovered.length} new`);

    res.json({
      totalHosts: results.length,
      discoveredHosts: discovered.length,
      results,
      discovered: discovered.map(d => ({
        ...createDiscoveryDevice(d),
        _scanResult: d,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Scan failed', details: (err as Error).message });
  }
});

router.post('/import-discovered', requireRole('admin', 'operator'), (req: AuthRequest, res: Response): void => {
  const { devices: importDevices } = req.body;

  if (!Array.isArray(importDevices) || importDevices.length === 0) {
    res.status(400).json({ error: 'Devices array required' });
    return;
  }

  const db = getDb();
  let imported = 0;

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO devices (id, name, category, type, ip, mac, vlan, status, uptime, latency_ms, tx_rate, rx_rate, department, assigned_user, location, notes, hardware_json, software_json, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'online', '00h 01m', 0, '0.0 MB/s', '0.0 MB/s', ?, ?, ?, ?, ?, ?, 'Just now')
  `);

  const importMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) {
      const id = `dev-scan-${Date.now()}-${imported}`;
      insertStmt.run(
        id,
        item.name || 'SCANNED-NODE',
        item.category || 'computer',
        item.type || 'Desktop PC',
        item.ip || '',
        item.mac || '',
        item.vlan || 20,
        item.department || '',
        item.assignedUser || '',
        item.location || '',
        item.notes || '',
        JSON.stringify(item.hardware || {}),
        JSON.stringify(item.software || {})
      );
      imported++;
    }
  });

  importMany(importDevices);

  logAudit(req, 'IMPORT_SCAN', 'device', undefined, `Imported ${imported} scanned devices`);
  res.json({ message: `Imported ${imported} devices`, count: imported });
});

router.post('/wmi-enrich/:deviceId', requireRole('admin', 'operator'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const deviceId = String(req.params.deviceId);
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Record<string, unknown> | undefined;

  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const agentAvailable = await wmiClient.isAgentAvailable();
  if (!agentAvailable) {
    res.status(503).json({ error: 'PcRemoteManager agent not available' });
    return;
  }

  const ip = (device.ip as string).replace(/\/\d+$/, '');
  const enriched = await wmiClient.enrichDeviceInfo(ip);

  if (!enriched) {
    res.status(502).json({ error: 'WMI query failed for this host' });
    return;
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (enriched.hardware.cpuName) {
    const hw = JSON.parse(device.hardware_json as string || '{}');
    hw.cpu = enriched.hardware.cpuName;
    hw.cpuCores = enriched.hardware.cpuCores;
    hw.ramGB = enriched.hardware.ramTotalGB;
    hw.gpu = enriched.hardware.gpuName;
    hw.serialNumber = enriched.hardware.serialNumber || hw.serialNumber;
    hw.macAddress = enriched.hardware.macAddress || hw.macAddress;
    updates.push('hardware_json = ?');
    values.push(JSON.stringify(hw));
  }

  if (enriched.software.osName) {
    const sw = JSON.parse(device.software_json as string || '{}');
    sw.osName = enriched.software.osName;
    sw.osArchitecture = enriched.software.osArchitecture;
    sw.kernelVersion = enriched.software.kernelVersion;
    sw.antivirusStatus = enriched.software.antivirusStatus;
    sw.firewallEnabled = enriched.software.firewallEnabled;
    sw.installedApps = enriched.software.installedApps || sw.installedApps;
    updates.push('software_json = ?');
    values.push(JSON.stringify(sw));
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(req.params.deviceId);
    db.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  logAudit(req, 'WMI_ENRICH', 'device', deviceId, `Enriched via WMI from ${ip}`);

  const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Record<string, unknown>;
  res.json({ message: 'Device enriched via WMI', device: updated });
});

export default router;
