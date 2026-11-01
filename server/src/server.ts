import { cfg } from './config.ts';
import { openDb, seedAdmin, seedNotesIfEmpty } from './db.ts';
import { hashPassword } from './auth.ts';
import { buildApp } from './app.ts';
import fs from 'node:fs';

const db = openDb(cfg.dbPath);

const hasAdmin = (db.prepare('SELECT COUNT(*) AS n FROM admins').get() as { n: number }).n > 0;
if (!hasAdmin) {
  if (!cfg.adminPass) {
    console.error('首次启动需要在 .env 里设置 ADMIN_PASS（至少 12 位）');
    process.exit(1);
  }
  const hash = await hashPassword(cfg.adminPass);
  seedAdmin(db, cfg.adminUser, hash);
  console.log(`已创建管理员：${cfg.adminUser}`);
}

const seedFile = new URL('../seed/notes.json', import.meta.url);
if (fs.existsSync(seedFile)) {
  const seed = JSON.parse(fs.readFileSync(seedFile, 'utf8')) as { chapters: { label: string; en: string; notes: { tag: string; q: string; a: string }[] }[] };
  seedNotesIfEmpty(db, seed.chapters);
}

const app = await buildApp(db, cfg);
await app.listen({ port: cfg.port, host: cfg.host });
console.log(`listening on http://${cfg.host}:${cfg.port}`);

const shutdown = async () => {
  await app.close();
  db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
