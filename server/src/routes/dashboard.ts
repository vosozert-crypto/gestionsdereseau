import { Router, Response } from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/kpi', (req: AuthRequest, res: Response): void => {
  const db = getDb();

  const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices').get() as { count: number };

  const statusCounts = db.prepare(
    'SELECT status, COUNT(*) as count FROM devices GROUP BY status'
  ).all() as { status: string; count: number }[];

  const categoryCounts = db.prepare(
    'SELECT category, COUNT(*) as count FROM devices GROUP BY category'
  ).all() as { category: string; count: number }[];

  const categoryOnline = db.prepare(
    "SELECT category, COUNT(*) as count FROM devices WHERE status = 'online' GROUP BY category"
  ).all() as { category: string; count: number }[];

  const totalRam = db.prepare(
    "SELECT SUM(CAST(json_extract(hardware_json, '$.ramGB') AS INTEGER)) as total FROM devices WHERE json_extract(hardware_json, '$.ramGB') IS NOT NULL"
  ).get() as { total: number | null };

  const avgLatency = db.prepare(
    "SELECT AVG(latency_ms) as avg FROM devices WHERE latency_ms < 999 AND status != 'critical'"
  ).get() as { avg: number | null };

  const criticalDevices = db.prepare(
    "SELECT id, name, status, ip, location, department FROM devices WHERE status IN ('critical', 'warning') ORDER BY CASE status WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 END"
  ).all() as { id: string; name: string; status: string; ip: string; location: string; department: string }[];

  const osDistribution = db.prepare(
    "SELECT json_extract(software_json, '$.osName') as os_name, COUNT(*) as count FROM devices WHERE json_extract(software_json, '$.osName') IS NOT NULL GROUP BY os_name ORDER BY count DESC"
  ).all() as { os_name: string; count: number }[];

  const securityStats = db.prepare(
    "SELECT json_extract(software_json, '$.antivirusStatus') as av_status, COUNT(*) as count FROM devices WHERE json_extract(software_json, '$.antivirusStatus') IS NOT NULL GROUP BY av_status"
  ).all() as { av_status: string; count: number }[];

  const firewallEnabled = db.prepare(
    "SELECT COUNT(*) as total, SUM(CASE WHEN json_extract(software_json, '$.firewallEnabled') = 1 THEN 1 ELSE 0 END) as enabled FROM devices WHERE json_extract(software_json, '$.firewallEnabled') IS NOT NULL"
  ).get() as { total: number; enabled: number | null };

  const onlineMap: Record<string, number> = {};
  for (const row of categoryOnline) {
    onlineMap[row.category] = row.count;
  }

  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) {
    statusMap[row.status] = row.count;
  }

  const total = totalDevices.count || 1;

  res.json({
    totalDevices: totalDevices.count,
    onlineCount: statusMap['online'] || 0,
    warningCount: statusMap['warning'] || 0,
    criticalCount: statusMap['critical'] || 0,
    offlineCount: statusMap['offline'] || 0,
    totalRamGB: totalRam.total || 0,
    avgLatencyMs: avgLatency.avg ? Math.round(avgLatency.avg * 10) / 10 : 0,
    healthPercent: Math.round(((statusMap['online'] || 0) / total) * 100),
    categories: categoryCounts.map(c => ({
      name: c.category,
      total: c.count,
      online: onlineMap[c.category] || 0,
    })),
    criticalDevices,
    osDistribution: osDistribution.map(o => ({ name: o.os_name, count: o.count })),
    security: {
      antivirus: securityStats.map(s => ({ status: s.av_status, count: s.count })),
      firewallEnabled: firewallEnabled.enabled || 0,
      firewallTotal: firewallEnabled.total || 0,
      firewallPercent: firewallEnabled.total
        ? Math.round(((firewallEnabled.enabled || 0) / firewallEnabled.total) * 100)
        : 0,
    },
  });
});

export default router;
