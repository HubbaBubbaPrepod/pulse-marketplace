import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { Test } from '@nestjs/testing';
import { AppModule } from '../dist/app.module.js';
import { CONFIG } from '../dist/config.js';
import { Database } from '../dist/database/database.service.js';
import { Providers } from '../dist/auth/providers.js';
test('OAuth state is browser-bound, expiring and one-use; provider email never merges accounts', async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }),
    schema = `oauth_test_${Date.now()}`;
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const databaseUrl = new URL(process.env.DATABASE_URL);
  databaseUrl.searchParams.set('options', `-c search_path=${schema}`);
  const provider = {
    available: () => true,
    async authorization(_name, flow) {
      return `https://provider.example/authorize?state=${flow.state}`;
    },
    async identity(_name, _url, flow) {
      assert.equal(_url.pathname, `/api/v1/auth/${_name}/callback/`);
      assert.ok(flow.verifier.length >= 43);
      assert.ok(flow.nonce);
      return {
        id: 'provider-user-1',
        displayName: 'Provider user',
        email: 'existing@example.test',
      };
    },
  };
  let app;
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CONFIG)
      .useValue({
        databaseUrl: databaseUrl.href,
        origin: 'http://127.0.0.1:3100',
        production: false,
        port: 0,
        packageDirectory: 'unused',
        discoveryEnabled: false,
      })
      .overrideProvider(Providers)
      .useValue(provider)
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    const base = (await app.getUrl()) + '/api/v1',
      db = app.get(Database);
    const existing = (
      await db.pool.query(
        "INSERT INTO users(display_name,email,email_verified) VALUES ('Existing','existing@example.test',true) RETURNING id",
      )
    ).rows[0].id;
    const start = await fetch(`${base}/auth/google/start?next=https://evil.test`, {
      redirect: 'manual',
    });
    assert.equal(start.status, 302);
    const state = new URL(start.headers.get('location')).searchParams.get('state'),
      binding = start.headers.get('set-cookie').split(';')[0];
    const callback = `${base}/auth/google/callback?state=${state}&code=test-code`;
    const wrong = await fetch(callback, { redirect: 'manual' });
    assert.ok(wrong.headers.get('location').includes('error=oauth'));
    const success = await fetch(callback, { headers: { cookie: binding }, redirect: 'manual' });
    assert.equal(success.status, 302);
    assert.equal(success.headers.get('location'), '/ru/author/');
    const identity = (
      await db.pool.query(
        "SELECT user_id FROM identities WHERE provider='google' AND provider_id='provider-user-1'",
      )
    ).rows[0];
    assert.notEqual(identity.user_id, existing);
    const replay = await fetch(callback, { headers: { cookie: binding }, redirect: 'manual' });
    assert.ok(replay.headers.get('location').includes('error=oauth'));
    const expired = await fetch(`${base}/auth/google/start`, { redirect: 'manual' });
    const expiredState = new URL(expired.headers.get('location')).searchParams.get('state');
    await db.pool.query("UPDATE oauth_states SET expires_at=now()-interval '1 second'");
    const expiredCallback = await fetch(
      `${base}/auth/google/callback?state=${expiredState}&code=expired`,
      { headers: { cookie: expired.headers.get('set-cookie').split(';')[0] }, redirect: 'manual' },
    );
    assert.ok(expiredCallback.headers.get('location').includes('error=oauth'));
  } finally {
    if (app) await app.close();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
  }
});
