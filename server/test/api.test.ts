import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb, seedAdmin } from '../src/db.ts';
import { hashPassword } from '../src/auth.ts';
import { buildApp } from '../src/app.ts';
import { cfg as baseCfg } from '../src/config.ts';

async function setup(overrides: Partial<typeof baseCfg> = {}) {
  const db = openDb(':memory:');
  seedAdmin(db, 'admin', await hashPassword('test-pass-123'));
  const cfg = { ...baseCfg, hashSalt: 'test-salt', secureCookie: false, adminIps: [] as string[], ...overrides };
  const app = await buildApp(db, cfg);
  return { db, app, cfg };
}

const csrfOf = (html: string) => /name="_csrf" value="([a-f0-9]+)"/.exec(html)?.[1] ?? '';

test('留言：校验、待审、通过后才公开', async () => {
  const { app } = await setup();
  try {
    const bad = await app.inject({ method: 'POST', url: '/api/messages', payload: { name: '', content: 'x' } });
    assert.equal(bad.statusCode, 400);

    const ok = await app.inject({ method: 'POST', url: '/api/messages', payload: { name: '阿宁', content: '第一版比现在好看' } });
    assert.equal(ok.statusCode, 200);

    const before = await app.inject({ method: 'GET', url: '/api/messages' });
    assert.deepEqual(before.json().messages, []);

    const login = await app.inject({ method: 'POST', url: '/admin/login', payload: { username: 'admin', password: 'test-pass-123' } });
    assert.equal(login.statusCode, 302);
    const cookie = String(login.headers['set-cookie']).split(';')[0];

    const list = await app.inject({ method: 'GET', url: '/admin/messages?status=pending', headers: { cookie } });
    assert.equal(list.statusCode, 200);
    const csrf = csrfOf(list.body);
    assert.ok(csrf, '页面里应该有 csrf token');

    const noCsrf = await app.inject({ method: 'POST', url: '/admin/messages/1/approve', headers: { cookie }, payload: { _csrf: 'wrong' } });
    assert.equal(noCsrf.statusCode, 403);

    const approve = await app.inject({ method: 'POST', url: '/admin/messages/1/approve', headers: { cookie }, payload: { _csrf: csrf } });
    assert.equal(approve.statusCode, 302);

    const after = await app.inject({ method: 'GET', url: '/api/messages' });
    const msgs = after.json().messages;
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].name, '阿宁');
    assert.equal(typeof msgs[0].x, 'number');
    assert.equal(typeof msgs[0].y, 'number');
  } finally {
    await app.close();
  }
});

test('后台：未登录跳转，IP 白名单外 404', async () => {
  const { app } = await setup();
  try {
    const anon = await app.inject({ method: 'GET', url: '/admin' });
    assert.equal(anon.statusCode, 302);
    assert.match(String(anon.headers.location), /\/admin\/login/);
  } finally {
    await app.close();
  }

  const { app: strict } = await setup({ adminIps: ['203.0.113.9'] });
  try {
    const blocked = await strict.inject({ method: 'GET', url: '/admin/login', remoteAddress: '198.51.100.1' });
    assert.equal(blocked.statusCode, 404);
    const allowed = await strict.inject({ method: 'GET', url: '/admin/login', remoteAddress: '203.0.113.9' });
    assert.equal(allowed.statusCode, 200);
  } finally {
    await strict.close();
  }
});

test('后台页面会转义留言内容，不执行 HTML', async () => {
  const { db, app } = await setup();
  try {
    const login = await app.inject({ method: 'POST', url: '/admin/login', payload: { username: 'admin', password: 'test-pass-123' } });
    const cookie = String(login.headers['set-cookie']).split(';')[0];
    const page = await app.inject({ method: 'GET', url: '/admin/messages', headers: { cookie } });
    const csrf = csrfOf(page.body);

    await app.inject({
      method: 'POST', url: '/api/messages',
      payload: { name: 'xss', content: '<script>alert(1)</script>' }
    });
    const id = (db.prepare('SELECT id FROM messages ORDER BY id DESC LIMIT 1').get() as { id: number }).id;
    await app.inject({ method: 'POST', url: `/admin/messages/${id}/approve`, headers: { cookie }, payload: { _csrf: csrf } });

    const rendered = await app.inject({ method: 'GET', url: '/admin/messages?status=all', headers: { cookie } });
    assert.ok(rendered.body.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!rendered.body.includes('<script>alert(1)</script>'));
  } finally {
    await app.close();
  }
});
