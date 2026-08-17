import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { getDb } from '../db/index.js';

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'operator' | 'viewer';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function generateTokens(user: AuthUser) {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: 900 } as any
  );

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: 604800 } as any
  );

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): { id: number } | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: number; type: string };
    if (decoded.type !== 'refresh') return null;

    const db = getDb();
    const stored = db.prepare('SELECT id FROM refresh_tokens WHERE token = ?').get(token);
    if (!stored) return null;

    return { id: decoded.id };
  } catch {
    return null;
  }
}
