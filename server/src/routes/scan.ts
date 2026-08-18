import { Router, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { scanSubnet, isScanActive, createDiscoveryDevice } from '../services/ipScanner.js';
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

export default router;
