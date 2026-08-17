import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { generateTokens, verifyRefreshToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', (req: AuthRequest, res: Response): void => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const { username, password } = parsed.data;
  const db = getDb();

  const user = db.prepare(
    'SELECT id, username, password_hash, role, display_name FROM users WHERE username = ?'
  ).get(username) as { id: number; username: string; password_hash: string; role: string; display_name: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const authUser = { id: user.id, username: user.username, role: user.role as 'admin' | 'operator' | 'viewer' };
  const { accessToken, refreshToken } = generateTokens(authUser);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    user.id, refreshToken, expiresAt
  );

  logAudit(req, 'LOGIN', 'user', String(user.id), `User ${username} logged in`);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
    },
  });
});

router.post('/refresh', (req: AuthRequest, res: Response): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  const result = verifyRefreshToken(refreshToken);
  if (!result) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT id, username, role, display_name FROM users WHERE id = ?').get(result.id) as {
    id: number; username: string; role: string; display_name: string;
  } | undefined;

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const authUser = { id: user.id, username: user.username, role: user.role as 'admin' | 'operator' | 'viewer' };
  const tokens = generateTokens(authUser);

  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    user.id, tokens.refreshToken, expiresAt
  );

  res.json(tokens);
});

router.post('/logout', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { refreshToken } = req.body;
  const db = getDb();

  if (refreshToken) {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  }

  logAudit(req, 'LOGOUT', 'user', String(req.user?.id));

  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, username, role, display_name, created_at FROM users WHERE id = ?'
  ).get(req.user!.id) as { id: number; username: string; role: string; display_name: string; created_at: string } | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name,
    createdAt: user.created_at,
  });
});

export default router;
