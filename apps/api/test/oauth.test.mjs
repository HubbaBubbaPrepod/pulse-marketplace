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
  let providerId = 'provider-user-1',
    providerFailed = false;
  const provider = {
    available: () => true,
    async authorization(_name, flow) {
      return `https://provider.example/authorize?state=${flow.state}`;
    },
    async identity(_name, _url, flow) {
      if (providerFailed) throw new Error('Provider exchange failed');
      assert.equal(_url.pathname, `/api/v1/auth/${_name}/callback/`);
      assert.ok(flow.verifier.length >= 43);
      assert.ok(flow.nonce);
      return {
        id: providerId,
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

    const sessionCookie = success.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith('pulse-session='))
      .split(';')[0];
    const current = await (
      await fetch(`${base}/auth/session`, { headers: { cookie: sessionCookie } })
    ).json();
    await db.pool.query("UPDATE sessions SET created_at=now()-interval '1 hour' WHERE user_id=$1", [
      current.user.id,
    ]);
    const staleLink = await fetch(`${base}/auth/link/github`, {
      method: 'POST',
      headers: {
        cookie: sessionCookie,
        origin: 'http://127.0.0.1:3100',
        'content-type': 'application/json',
        'x-csrf-token': current.csrfToken,
      },
      body: '{}',
    });
    assert.equal(staleLink.status, 409, 'A stale session cannot attach a new sign-in method');
    await db.pool.query('UPDATE sessions SET created_at=now() WHERE user_id=$1', [current.user.id]);
    await db.pool.query(
      "INSERT INTO identities(provider,provider_id,user_id) VALUES ('github','provider-user-1',$1)",
      [existing],
    );
    const link = async (cookie = sessionCookie, csrf = current.csrfToken) => {
      const start = await fetch(`${base}/auth/link/github`, {
        method: 'POST',
        headers: {
          cookie,
          origin: 'http://127.0.0.1:3100',
          'content-type': 'application/json',
          'x-csrf-token': csrf,
        },
        body: '{}',
      });
      assert.equal(start.status, 201);
      const { url } = await start.json();
      const state = new URL(url).searchParams.get('state');
      return {
        callback: `${base}/auth/github/callback?state=${state}&code=test-code`,
        cookie: `${cookie}; ${start.headers.get('set-cookie').split(';')[0]}`,
      };
    };
    const conflictFlow = await link();
    const conflict = await fetch(conflictFlow.callback, {
      headers: { cookie: conflictFlow.cookie },
      redirect: 'manual',
    });
    assert.equal(conflict.headers.get('location'), '/ru/author/?link=conflict');
    const unchanged = await (
      await fetch(`${base}/auth/session`, { headers: { cookie: sessionCookie } })
    ).json();
    assert.equal(unchanged.user.id, current.user.id);
    assert.equal(unchanged.user.githubId, null);
    const owner = await db.pool.query(
      "SELECT user_id FROM identities WHERE provider='github' AND provider_id='provider-user-1'",
    );
    assert.equal(owner.rows[0].user_id, existing);

    const failedFlow = await link();
    providerFailed = true;
    const failed = await fetch(failedFlow.callback, {
      headers: { cookie: failedFlow.cookie },
      redirect: 'manual',
    });
    assert.equal(failed.headers.get('location'), '/ru/author/?link=failed');
    providerFailed = false;

    providerId = 'unlinked-github-user';
    const validFlow = await link();
    const linked = await fetch(validFlow.callback, {
      headers: { cookie: validFlow.cookie },
      redirect: 'manual',
    });
    assert.equal(linked.headers.get('location'), '/ru/author/?link=connected');
    const linkedCookie = linked.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith('pulse-session='))
      .split(';')[0];
    const linkedSession = await (
      await fetch(`${base}/auth/session`, { headers: { cookie: linkedCookie } })
    ).json();
    assert.equal(linkedSession.user.id, current.user.id);
    assert.equal(linkedSession.user.githubId, providerId);

    // A valid OAuth binding alone cannot authorize a link after session loss.
    const lostSessionFlow = await link(linkedCookie, linkedSession.csrfToken);
    providerId = 'must-not-link-without-session';
    const lost = await fetch(lostSessionFlow.callback, {
      headers: { cookie: lostSessionFlow.cookie.split('; ').at(-1) },
      redirect: 'manual',
    });
    assert.equal(lost.headers.get('location'), '/ru/author/?link=failed');
    const rejected = await db.pool.query('SELECT 1 FROM identities WHERE provider_id=$1', [
      providerId,
    ]);
    assert.equal(rejected.rowCount, 0);
    const privatePost = (path, body, cookie = linkedCookie, csrf = linkedSession.csrfToken) =>
      fetch(base + path, {
        method: 'POST',
        headers: {
          cookie,
          origin: 'http://127.0.0.1:3100',
          'content-type': 'application/json',
          'x-csrf-token': csrf,
        },
        body: JSON.stringify(body),
        redirect: 'manual',
      });
    assert.equal(
      (await privatePost('/auth/account/merge/confirm', { confirmation: 'MERGE' })).status,
      409,
      'A matching email or session alone is not proof of the other account',
    );
    assert.equal(
      (await privatePost('/auth/account/unlink', { provider: 'github', confirmation: 'UNLINK' }))
        .status,
      200,
    );
    providerId = 'provider-user-1';
    const merge = await privatePost('/auth/account/merge/github', {});
    assert.equal(merge.status, 201);
    const mergeState = new URL((await merge.json()).url).searchParams.get('state');
    const mergeCallback = await fetch(
      `${base}/auth/github/callback?state=${mergeState}&code=merge-code`,
      {
        headers: { cookie: linkedCookie + '; ' + merge.headers.get('set-cookie').split(';')[0] },
        redirect: 'manual',
      },
    );
    assert.equal(mergeCallback.headers.get('location'), '/ru/author/?merge=ready');
    assert.equal(
      (
        await db.pool.query(
          "SELECT user_id FROM identities WHERE provider='github' AND provider_id='provider-user-1'",
        )
      ).rows[0].user_id,
      existing,
      'OAuth confirmation must not merge accounts before explicit confirmation',
    );
    const pending = await (
      await fetch(`${base}/auth/account`, { headers: { cookie: linkedCookie } })
    ).json();
    assert.equal(pending.merge.displayName, 'Existing');
    const combined = await privatePost('/auth/account/merge/confirm', { confirmation: 'MERGE' });
    assert.equal(combined.status, 200);
    const combinedCookie = combined.headers
      .getSetCookie()
      .find((x) => x.startsWith('pulse-session='))
      .split(';')[0];
    const combinedSession = await (
      await fetch(`${base}/auth/session`, { headers: { cookie: combinedCookie } })
    ).json();
    assert.equal(combinedSession.user.id, current.user.id);
    assert.equal(combinedSession.user.githubId, 'provider-user-1');
    assert.equal(
      (await (await fetch(`${base}/auth/session`, { headers: { cookie: linkedCookie } })).json())
        .user,
      null,
    );
    assert.equal(
      (await db.pool.query('SELECT email,display_name FROM users WHERE id=$1', [existing])).rows[0]
        .display_name,
      'Deleted user',
    );
    assert.equal(
      (
        await privatePost(
          '/auth/account/merge/confirm',
          { confirmation: 'MERGE' },
          combinedCookie,
          combinedSession.csrfToken,
        )
      ).status,
      409,
      'Merge proof is single-use',
    );
  } finally {
    if (app) await app.close();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
  }
});
