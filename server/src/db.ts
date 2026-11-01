import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type DB = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  csrf TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  ip_hash TEXT,
  created_at INTEGER NOT NULL,
  approved_at INTEGER,
  x REAL, y REAL, rot REAL, scale REAL
);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status, approved_at);
CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  en TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  tag TEXT NOT NULL DEFAULT '',
  q TEXT NOT NULL,
  a TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notes_chapter ON notes(chapter_id, sort);
`;

export function openDb(file: string): DB {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(SCHEMA);
  return db;
}

export function seedAdmin(db: DB, username: string, passHash: string): void {
  const row = db.prepare('SELECT COUNT(*) AS n FROM admins').get() as { n: number };
  if (row.n === 0) {
    db.prepare('INSERT INTO admins (username, pass_hash, created_at) VALUES (?, ?, ?)')
      .run(username, passHash, Date.now());
  }
}

export function seedNotesIfEmpty(db: DB, chapters: { label: string; en: string; notes: { tag: string; q: string; a: string }[] }[]): void {
  const row = db.prepare('SELECT COUNT(*) AS n FROM chapters').get() as { n: number };
  if (row.n > 0) return;
  const insC = db.prepare('INSERT INTO chapters (label, en, sort) VALUES (?, ?, ?)');
  const insN = db.prepare('INSERT INTO notes (chapter_id, tag, q, a, sort) VALUES (?, ?, ?, ?, ?)');
  const tx = db.transaction(() => {
    chapters.forEach((c, ci) => {
      const info = insC.run(c.label, c.en, ci);
      c.notes.forEach((n, ni) => insN.run(info.lastInsertRowid, n.tag, n.q, n.a, ni));
    });
  });
  tx();
}
