import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import view from '@fastify/view';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';
import { cfg as defaultCfg, type Cfg } from './config.ts';
import type { DB } from './db.ts';
import { publicRoutes } from './routes/public.ts';
import { adminRoutes } from './routes/admin.ts';

const viewsRoot = fileURLToPath(new URL('./views', import.meta.url));

export async function buildApp(db: DB, cfg: Cfg = defaultCfg): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    trustProxy: cfg.trustProxy,
    bodyLimit: 64 * 1024
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'same-origin' }
  });
  await app.register(fastifyCookie, { secret: cfg.hashSalt, hook: 'onRequest' });
  await app.register(formbody);
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    keyGenerator: req => req.ip,
    errorResponseBuilder: () => ({ error: '请求过于频繁，稍后再试' })
  });
  await app.register(view, { engine: { ejs }, root: viewsRoot });

  publicRoutes(app, db, cfg);
  adminRoutes(app, db, cfg);

  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'not found' });
    return reply.code(404).type('text/plain; charset=utf-8').send('Not found');
  });

  app.setErrorHandler((err, req, reply) => {
    const e = err as { statusCode?: number; message?: string; stack?: string };
    if (cfg.isProd) {
      if (req.url.startsWith('/api/')) return reply.code(500).send({ error: '服务器错误' });
      return reply.code(500).type('text/plain; charset=utf-8').send('Server error');
    }
    console.error(e);
    if (req.url.startsWith('/api/')) return reply.code(e.statusCode ?? 500).send({ error: e.message ?? 'error' });
    return reply.code(500).type('text/plain; charset=utf-8').send(String(e.stack ?? e));
  });

  return app;
}
