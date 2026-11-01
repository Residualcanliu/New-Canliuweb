import crypto from 'node:crypto';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { DB } from '../db.ts';
import type { Cfg } from '../config.ts';

const messageSchema = z.object({
  name: z.string().trim().min(1).max(20),
  content: z.string().trim().min(1).max(300),
  website: z.string().optional().default('')
});

const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

export function publicRoutes(app: FastifyInstance, db: DB, cfg: Cfg): void {
  app.get('/api/messages', async (_req, reply) => {
    const rows = db.prepare(`
      SELECT public_id AS id, name, content, x, y, rot, scale
      FROM messages WHERE status = 'approved'
      ORDER BY approved_at ASC LIMIT 300
    `).all();
    reply.header('cache-control', 'public, max-age=60');
    return { messages: rows };
  });

  app.post('/api/messages', {
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
  }, async (req, reply) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: '名字或内容不符合要求' });

    const { name, content, website } = parsed.data;
    // 蜜罐：机器人会填这个隐藏字段，直接假装成功
    if (website.trim() !== '') return { ok: true };

    const ip = req.ip.replace(/^::ffff:/, '');
    const ipHash = crypto.createHash('sha256').update(ip + cfg.hashSalt).digest('hex').slice(0, 32);

    db.prepare(`
      INSERT INTO messages (public_id, name, content, status, ip_hash, created_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).run(crypto.randomUUID(), clean(name), clean(content), ipHash, Date.now());

    return { ok: true };
  });

  app.get('/api/notes', async (_req, reply) => {
    const chapters = db.prepare('SELECT id, label, en FROM chapters ORDER BY sort, id').all() as {
      id: number; label: string; en: string;
    }[];
    const notes = db.prepare('SELECT id, chapter_id, tag, q, a FROM notes ORDER BY sort, id').all() as {
      id: number; chapter_id: number; tag: string; q: string; a: string;
    }[];
    const byChapter = new Map<number, typeof notes>();
    for (const n of notes) {
      const list = byChapter.get(n.chapter_id) ?? [];
      list.push(n);
      byChapter.set(n.chapter_id, list);
    }
    reply.header('cache-control', 'public, max-age=120');
    return {
      chapters: chapters.map(c => ({
        id: c.id,
        label: c.label,
        en: c.en,
        notes: (byChapter.get(c.id) ?? []).map(n => ({ id: n.id, tag: n.tag, q: n.q, a: n.a }))
      }))
    };
  });
}
