import { Router, Response } from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const {
    page = '1',
    limit = '50',
    severity,
    sourceIp,
    search,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
  const offset = (pageNum - 1) * limitNum;

  let where = 'WHERE 1=1';
  const params: unknown[] = [];

  if (severity) {
    where += ' AND severity = ?';
    params.push(severity);
  }

  if (sourceIp) {
    where += ' AND source_ip = ?';
    params.push(sourceIp);
  }

  if (search) {
    where += ' AND (message LIKE ? OR message_ar LIKE ? OR protocol LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM security_logs ${where}`).get(...params) as { total: number };

  const rows = db.prepare(
    `SELECT * FROM security_logs ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset) as Record<string, unknown>[];

  const logs = rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    severity: row.severity,
    sourceIp: row.source_ip,
    message: row.message,
    messageAr: row.message_ar,
    protocol: row.protocol,
    createdAt: row.created_at,
  }));

  res.json({
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / limitNum),
    },
  });
});

router.get('/stats', (req: AuthRequest, res: Response): void => {
  const db = getDb();

  const severityCounts = db.prepare(
    'SELECT severity, COUNT(*) as count FROM security_logs GROUP BY severity'
  ).all() as { severity: string; count: number }[];

  const recentCritical = db.prepare(
    "SELECT COUNT(*) as count FROM security_logs WHERE severity = 'CRITICAL' AND created_at >= datetime('now', '-24 hours')"
  ).get() as { count: number };

  const stats: Record<string, number> = {};
  for (const row of severityCounts) {
    stats[row.severity] = row.count;
  }

  res.json({
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    bySeverity: stats,
    criticalLast24h: recentCritical.count,
  });
});

export default router;
