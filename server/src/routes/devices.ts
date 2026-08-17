import { Router, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();
router.use(authenticateToken);

function getParamId(req: AuthRequest): string {
  return String(req.params.id);
}

const deviceSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['computer', 'printer', 'network', 'server', 'iot']),
  type: z.string().min(1),
  ip: z.string().min(1),
  mac: z.string().min(1),
  vlan: z.number().int().min(1).max(4094),
  department: z.string().optional().default(''),
  assignedUser: z.string().optional().default(''),
  location: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  hardware: z.record(z.unknown()).optional().default({}),
  software: z.record(z.unknown()).optional().default({}),
});

router.get('/', (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const {
    page = '1',
    limit = '50',
    category,
    status,
    search,
    sort = 'name',
    order = 'asc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
  const offset = (pageNum - 1) * limitNum;

  const allowedSorts = ['name', 'ip', 'status', 'category', 'vlan', 'uptime', 'department', 'last_seen', 'created_at'];
  const sortCol = allowedSorts.includes(sort as string) ? sort : 'name';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  let where = 'WHERE 1=1';
  const params: unknown[] = [];

  if (category && category !== 'ALL') {
    where += ' AND category = ?';
    params.push(category);
  }

  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    where += ' AND (name LIKE ? OR ip LIKE ? OR mac LIKE ? OR department LIKE ? OR location LIKE ? OR assigned_user LIKE ? OR notes LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term, term);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM devices ${where}`).get(...params) as { total: number };

  const rows = db.prepare(
    `SELECT * FROM devices ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset) as Record<string, unknown>[];

  const devices = rows.map(mapDeviceRow);

  res.json({
    devices,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / limitNum),
    },
  });
});

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const deviceId = req.params.id as string;
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  res.json(mapDeviceRow(row));
});

router.post('/', requireRole('admin', 'operator'), (req: AuthRequest, res: Response): void => {
  const parsed = deviceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const db = getDb();
  const id = 'dev-' + Date.now();
  const data = parsed.data;

  db.prepare(`
    INSERT INTO devices (id, name, category, type, ip, mac, vlan, status, uptime, latency_ms, tx_rate, rx_rate, department, assigned_user, location, notes, hardware_json, software_json, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'online', '00h 01m', 0, '0.0 MB/s', '0.0 MB/s', ?, ?, ?, ?, ?, ?, 'Just now')
  `).run(id, data.name, data.category, data.type, data.ip, data.mac, data.vlan, data.department, data.assignedUser, data.location, data.notes, JSON.stringify(data.hardware), JSON.stringify(data.software));

  logAudit(req, 'CREATE', 'device', id, `Created device ${data.name}`);

  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json(mapDeviceRow(row));
});

router.put('/:id', requireRole('admin', 'operator'), (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const deviceId = getParamId(req);
  const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Record<string, unknown> | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const parsed = deviceSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const updates: string[] = [];
  const values: unknown[] = [];

  const fieldMap: Record<string, string> = {
    name: 'name', category: 'category', type: 'type', ip: 'ip',
    mac: 'mac', vlan: 'vlan', department: 'department',
    assignedUser: 'assigned_user', location: 'location', notes: 'notes',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (data[key as keyof typeof data] !== undefined) {
      updates.push(`${col} = ?`);
      values.push(data[key as keyof typeof data]);
    }
  }

  if (data.hardware !== undefined) {
    updates.push('hardware_json = ?');
    values.push(JSON.stringify(data.hardware));
  }
  if (data.software !== undefined) {
    updates.push('software_json = ?');
    values.push(JSON.stringify(data.software));
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  updates.push("updated_at = datetime('now')");
  values.push(deviceId);

  db.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  logAudit(req, 'UPDATE', 'device', deviceId, `Updated device fields: ${Object.keys(data).join(', ')}`);

  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Record<string, unknown>;
  res.json(mapDeviceRow(row));
});

router.delete('/:id', requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const deviceId = getParamId(req);
  const existing = db.prepare('SELECT name FROM devices WHERE id = ?').get(deviceId) as { name: string } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  db.prepare('DELETE FROM devices WHERE id = ?').run(deviceId);
  logAudit(req, 'DELETE', 'device', deviceId, `Deleted device ${existing.name}`);

  res.json({ message: 'Device deleted', id: deviceId });
});

router.post('/:id/reboot', requireRole('admin', 'operator'), (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const deviceId = getParamId(req);
  const existing = db.prepare('SELECT id, name FROM devices WHERE id = ?').get(deviceId) as { id: string; name: string } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  db.prepare("UPDATE devices SET uptime = '00h 00m', status = 'online', updated_at = datetime('now') WHERE id = ?").run(deviceId);

  logAudit(req, 'REBOOT', 'device', deviceId, `Rebooted device ${existing.name}`);

  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Record<string, unknown>;
  res.json(mapDeviceRow(row));
});

router.post('/import', requireRole('admin', 'operator'), (req: AuthRequest, res: Response): void => {
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
      const id = `dev-import-${Date.now()}-${imported}`;
      insertStmt.run(
        id,
        item.name || 'IMPORTED-NODE',
        item.category || 'computer',
        item.type || 'Desktop PC',
        item.ip || '',
        item.mac || '',
        item.vlan || 1,
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

  logAudit(req, 'IMPORT', 'device', undefined, `Imported ${imported} devices`);

  res.json({ message: `Imported ${imported} devices`, count: imported });
});

router.post('/clear', requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM devices').get() as { c: number };
  db.prepare('DELETE FROM devices').run();

  logAudit(req, 'CLEAR_ALL', 'device', undefined, `Cleared ${count.c} devices`);

  res.json({ message: 'All devices cleared', count: count.c });
});

function mapDeviceRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.type,
    ip: row.ip,
    mac: row.mac,
    vlan: row.vlan,
    status: row.status,
    uptime: row.uptime,
    latencyMs: row.latency_ms,
    txRate: row.tx_rate,
    rxRate: row.rx_rate,
    department: row.department,
    assignedUser: row.assigned_user,
    location: row.location,
    notes: row.notes,
    hardware: parseJsonField(row.hardware_json as string),
    software: parseJsonField(row.software_json as string),
    lastSeen: row.last_seen,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseJsonField(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export default router;
