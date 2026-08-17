import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { getDb } from '../db/index.js';

export function logAudit(
  req: AuthRequest,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: string
): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    req.user?.id ?? null,
    req.user?.username ?? 'system',
    action,
    targetType ?? null,
    targetId ?? null,
    details ?? null,
    req.ip ?? req.socket.remoteAddress ?? null
  );
}

export function auditMiddleware(action: string, targetType: string) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const targetId = req.params.id || req.body?.id;
    logAudit(req, action, targetType, targetId);
    next();
  };
}
