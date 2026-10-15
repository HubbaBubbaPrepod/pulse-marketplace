import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { Test } from '@nestjs/testing';
import { AppModule } from '../dist/app.module.js';
import { CONFIG } from '../dist/config.js';
import { Mailer, EmailAccounts } from '../dist/auth/email.service.js';
test('email confirmation and reset are one-use, generic and revoke previous sessions', async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }),
    schema = `email_test_${Date.now()}`;
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  const outbox = [],
    mailer = {
      available: () => true,
      async send(to, url, purpose) {
        outbox.push({ to, url, purpose });
      },
    };
  let app;
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CONFIG)
      .useValue({
        databaseUrl: url.href,
        origin: 'http://127.0.0.1:3100',
        production: false,
        port: 0,
        packageDirectory: 'unused',
        discoveryEnabled: false,
        mailTokenKey: 'a'.repeat(64),
      })
      .overrideProvider(Mailer)
      .useValue(mailer)
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    const base = (await app.getUrl()) + '/api/v1';
    const post = (path, body) =>
      fetch(base + path, {
        method: 'POST',
        headers: { origin: 'http://127.0.0.1:3100', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    const registration = await post('/auth/register', {
      email: 'user@example.test',
      displayName: 'User',
    });
    assert.equal(registration.status, 202);
    assert.deepEqual(await registration.json(), { accepted: true });
    await app.get(EmailAccounts).flush();
    const token = new URL(outbox[0].url).searchParams.get('token');
    const verified = await post('/auth/verify-email', {
      token,
      password: 'original-test-password',
    });
    assert.equal(verified.status, 200);
    assert.equal(
      (await post('/auth/verify-email', { token, password: 'other-test-password' })).status,
      400,
    );
    const login = await post('/auth/login', {
      email: 'user@example.test',
      password: 'original-test-password',
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const reset = await post('/auth/request-reset', { email: 'user@example.test' }),
      unknown = await post('/auth/request-reset', { email: 'unknown@example.test' });
    assert.equal(reset.status, 202);
    assert.deepEqual(await reset.json(), await unknown.json());
    await app.get(EmailAccounts).flush();
    const resetToken = new URL(outbox.at(-1).url).searchParams.get('token');
    assert.equal(
      (await post('/auth/reset-password', { token: resetToken, password: 'changed-test-password' }))
        .status,
      200,
    );
    assert.equal(
      (
        await post('/auth/reset-password', {
          token: resetToken,
          password: 'different-test-password',
        })
      ).status,
      400,
    );
    assert.equal((await fetch(base + '/author/repositories', { headers: { cookie } })).status, 401);
    assert.equal(
      (
        await post('/auth/login', {
          email: 'user@example.test',
          password: 'original-test-password',
        })
      ).status,
      401,
    );
    assert.equal(
      (await post('/auth/login', { email: 'user@example.test', password: 'changed-test-password' }))
        .status,
      200,
    );
  } finally {
    if (app) await app.close();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
  }
});
