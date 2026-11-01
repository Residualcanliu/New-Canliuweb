import crypto from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DB } from '../db.ts';
import type { Cfg } from '../config.ts';
import {
  SESSION_COOKIE, createSession, destroySession, readSession, verifyPassword, type SessionInfo
} from '../auth.ts';

declare module 'fastify' {
  interface FastifyRequest {
    session?: SessionInfo;
  }
}

const safeEq = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

const ipOf = (req: FastifyRequest) => req.ip.replace(/^::ffff:/, '');

function assignPosition(db: DB, id: number): void {
  const taken = db.prepare("SELECT x, y FROM messages WHERE status='approved' AND x IS NOT NULL").all() as { x: number; y: number }[];
  let best = { x: 50, y: 50 };
  for (let i = 0; i < 24; i++) {
    const cand = { x: 8 + Math.random() * 84, y: 20 + Math.random() * 64 };
    const ok = taken.every(t => Math.hypot(t.x - cand.x, t.y - cand.y) > 7);
    best = cand;
    if (ok) break;
  }
  db.prepare('UPDATE messages SET x = ?, y = ?, rot = ?, scale = ? WHERE id = ?')
    .run(
      Number(best.x.toFixed(2)),
      Number(best.y.toFixed(2)),
      Number((Math.random() * 30 - 15).toFixed(1)),
      Number((0.85 + Math.random() * 0.4).toFixed(2)),
      id
    );
}

export function adminRoutes(app: FastifyInstance, db: DB, cfg: Cfg): void {
  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/admin')) return;
    if (cfg.adminIps.length && !cfg.adminIps.includes(ipOf(req))) {
      return reply.code(404).type('text/plain; charset=utf-8').send('Not found');
    }
  });

  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith('/admin')) return;
    if (req.url.startsWith('/admin/login')) return;

    const token = req.cookies[SESSION_COOKIE];
    const session = readSession(db, token);
    if (!session) return reply.redirect('/admin/login');
    req.session = session;

    if (req.method === 'POST' && !req.url.startsWith('/admin/logout')) {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const csrf = typeof body._csrf === 'string' ? body._csrf : '';
      if (!safeEq(csrf, session.csrf)) return reply.code(403).type('text/plain; charset=utf-8').send('CSRF token invalid');
    }
  });

  app.get('/admin/login', async (req, reply) => {
    if (readSession(db, req.cookies[SESSION_COOKIE])) return reply.redirect('/admin');
    return reply.view('login.ejs', { error: '', csrf: '' });
  });

  app.post('/admin/login', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
  }, async (req, reply) => {
    const { username = '', password = '' } = (req.body ?? {}) as { username?: string; password?: string };
    const admin = db.prepare('SELECT id, username, pass_hash FROM admins WHERE username = ?').get(username) as
      | { id: number; username: string; pass_hash: string }
      | undefined;
    const ok = admin ? await verifyPassword(admin.pass_hash, password) : false;
    if (!admin || !ok) {
      return reply.code(401).view('login.ejs', { error: '用户名或密码错误', csrf: '' });
    }
    const { token } = createSession(db, admin.id, cfg.sessionTtlMs);
    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: cfg.secureCookie,
      maxAge: Math.floor(cfg.sessionTtlMs / 1000)
    });
    return reply.redirect('/admin');
  });

  app.post('/admin/logout', async (req, reply) => {
    destroySession(db, req.cookies[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.redirect('/admin/login');
  });

  app.get('/admin', async (req, reply) => {
    const counts = db.prepare(`
      SELECT
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected
      FROM messages
    `).get() as { pending: number | null; approved: number | null; rejected: number | null };
    return reply.view('dashboard.ejs', {
      session: req.session,
      csrf: req.session!.csrf,
      counts: { pending: counts.pending ?? 0, approved: counts.approved ?? 0, rejected: counts.rejected ?? 0 },
      notesCount: (db.prepare('SELECT COUNT(*) AS n FROM notes').get() as { n: number }).n
    });
  });

  app.get('/admin/messages', async (req, reply) => {
    const status = String((req.query as { status?: string }).status ?? 'pending');
    const allowed = ['pending', 'approved', 'rejected', 'all'];
    const filter = allowed.includes(status) ? status : 'pending';
    const rows = (filter === 'all'
      ? db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200').all()
      : db.prepare('SELECT * FROM messages WHERE status = ? ORDER BY created_at DESC LIMIT 200').all(filter)) as
      { id: number; name: string; content: string; status: string; created_at: number; x: number | null; y: number | null }[];
    return reply.view('messages.ejs', {
      session: req.session, csrf: req.session!.csrf, filter,
      messages: rows.map(r => ({ ...r, when: new Date(r.created_at).toLocaleString('zh-CN') }))
    });
  });

  app.post('/admin/messages/:id/:action', async (req, reply) => {
    const { id, action } = req.params as { id: string; action: string };
    const row = db.prepare('SELECT id, status FROM messages WHERE id = ?').get(Number(id)) as { id: number; status: string } | undefined;
    if (!row) return reply.code(404).type('text/plain; charset=utf-8').send('Not found');
    if (action === 'approve') {
      db.prepare("UPDATE messages SET status='approved', approved_at=? WHERE id=?").run(Date.now(), row.id);
      const pos = db.prepare('SELECT x FROM messages WHERE id=?').get(row.id) as { x: number | null } | undefined;
      if (!pos || pos.x == null) assignPosition(db, row.id);
    } else if (action === 'reject') {
      db.prepare("UPDATE messages SET status='rejected' WHERE id=?").run(row.id);
    } else if (action === 'delete') {
      db.prepare('DELETE FROM messages WHERE id=?').run(row.id);
    } else {
      return reply.code(400).type('text/plain; charset=utf-8').send('Bad action');
    }
    const back = (req.body as { back?: string })?.back ?? '/admin/messages';
    return reply.redirect(back.startsWith('/admin') ? back : '/admin/messages');
  });

  app.get('/admin/notes', async (req, reply) => {
    const chapters = db.prepare('SELECT id, label, en FROM chapters ORDER BY sort, id').all() as { id: number; label: string; en: string }[];
    const notes = db.prepare('SELECT id, chapter_id, tag, q, a FROM notes ORDER BY sort, id').all() as
      { id: number; chapter_id: number; tag: string; q: string; a: string }[];
    return reply.view('notes.ejs', { session: req.session, csrf: req.session!.csrf, chapters, notes });
  });

  app.post('/admin/chapters', async (req, reply) => {
    const { label = '', en = '' } = (req.body ?? {}) as { label?: string; en?: string };
    if (label.trim()) {
      const sort = (db.prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS s FROM chapters').get() as { s: number }).s;
      db.prepare('INSERT INTO chapters (label, en, sort) VALUES (?, ?, ?)').run(label.trim().slice(0, 30), en.trim().slice(0, 40), sort);
    }
    return reply.redirect('/admin/notes');
  });

  app.post('/admin/chapters/:id/delete', async (req, reply) => {
    db.prepare('DELETE FROM chapters WHERE id = ?').run(Number((req.params as { id: string }).id));
    return reply.redirect('/admin/notes');
  });

  app.post('/admin/notes', async (req, reply) => {
    const { chapter_id = '', tag = '', q = '', a = '' } = (req.body ?? {}) as Record<string, string>;
    const cid = Number(chapter_id);
    if (cid && q.trim() && a.trim()) {
      const sort = (db.prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS s FROM notes WHERE chapter_id = ?').get(cid) as { s: number }).s;
      db.prepare('INSERT INTO notes (chapter_id, tag, q, a, sort) VALUES (?, ?, ?, ?, ?)')
        .run(cid, tag.trim().slice(0, 20), q.trim().slice(0, 200), a.trim().slice(0, 2000), sort);
    }
    return reply.redirect('/admin/notes');
  });

  app.post('/admin/notes/:id/delete', async (req, reply) => {
    db.prepare('DELETE FROM notes WHERE id = ?').run(Number((req.params as { id: string }).id));
    return reply.redirect('/admin/notes');
  });

}
