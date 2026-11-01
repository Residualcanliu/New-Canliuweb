import { hash, verify } from '@node-rs/argon2';
import crypto from 'node:crypto';
import type { DB } from './db.ts';

export const SESSION_COOKIE = 'gch_sid';

export function hashPassword(pass: string): Promise<string> {
  return hash(pass, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export function verifyPassword(hashStr: string, pass: string): Promise<boolean> {
  return verify(hashStr, pass).catch(() => false);
}

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export type SessionInfo = { adminId: number; username: string; csrf: string };

export function createSession(db: DB, adminId: number, ttlMs: number): { token: string; csrf: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const csrf = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  db.prepare('INSERT INTO sessions (id, admin_id, csrf, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(sha(token), adminId, csrf, now, now + ttlMs);
  return { token, csrf };
}

export function readSession(db: DB, token: string | undefined): SessionInfo | null {
  if (!token) return null;
  const row = db.prepare(`
    SELECT s.admin_id AS adminId, s.csrf AS csrf, a.username AS username, s.expires_at AS expiresAt
    FROM sessions s JOIN admins a ON a.id = s.admin_id
    WHERE s.id = ?
  `).get(sha(token)) as { adminId: number; csrf: string; username: string; expiresAt: number } | undefined;
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sha(token));
    return null;
  }
  return { adminId: row.adminId, username: row.username, csrf: row.csrf };
}

export function destroySession(db: DB, token: string | undefined): void {
  if (token) db.prepare('DELETE FROM sessions WHERE id = ?').run(sha(token));
}

export function cleanExpiredSessions(db: DB): void {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}
