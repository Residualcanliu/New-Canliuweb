import 'dotenv/config';

const bool = (v: string | undefined, d = false) => (v === undefined ? d : v === '1' || v === 'true');

export const cfg = {
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? '127.0.0.1',
  dbPath: process.env.DB_PATH ?? 'data/site.db',
  adminUser: process.env.ADMIN_USER ?? 'admin',
  adminPass: process.env.ADMIN_PASS ?? '',
  adminIps: (process.env.ADMIN_IPS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  secureCookie: process.env.NODE_ENV === 'production',
  sessionTtlMs: Number(process.env.SESSION_TTL_HOURS ?? 12) * 3600_000,
  trustProxy: bool(process.env.TRUST_PROXY, true),
  hashSalt: process.env.HASH_SALT ?? 'dev-salt-change-me',
  isProd: process.env.NODE_ENV === 'production'
};

export type Cfg = typeof cfg;
