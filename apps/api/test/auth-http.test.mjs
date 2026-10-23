import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { Test } from '@nestjs/testing';
import { AppModule } from '../dist/app.module.js';
import { CONFIG } from '../dist/config.js';
import { Database } from '../dist/database/database.service.js';
import { derivePassword } from '../src/auth/passwords.mjs';
import { digest, Sessions } from '../dist/auth/session.service.js';
import { GITHUB_CLIENT } from '../dist/discovery/discovery.service.js';
test('HTTP sessions enforce origin, CSRF, current roles, logout and repository ownership', async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const schema = `auth_test_${Date.now()}`;
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  let app;
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CONFIG)
      .useValue({
        databaseUrl: url.href,
        origin: 'http://127.0.0.1:3100',
        production: false,
        port: 0,
        packageDirectory: new URL('../../../artifacts/test-packages/', import.meta.url).pathname,
      })
      .overrideProvider(GITHUB_CLIENT)
      .useValue({
        async json() {
          return {
            id: 123,
            owner: { id: 101, type: 'User' },
            full_name: 'Author/module',
            default_branch: 'main',
            private: false,
            archived: false,
          };
        },
        async marker() {
          return { schemaVersion: 1, moduleId: 'module', packageAsset: 'module.json' };
        },
      })
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    const base = (await app.getUrl()) + '/api/v1';
    const origin = 'http://127.0.0.1:3100';
    const db = app.get(Database);
    const hash = await derivePassword('test-only-password-123');
    const user = (
      await db.pool.query(
        "INSERT INTO users(email,display_name,password_hash,email_verified) VALUES ('author@example.test','Author',$1,true) RETURNING id",
        [hash],
      )
    ).rows[0];
    const moderator = (
      await db.pool.query(
        "INSERT INTO users(email,display_name,password_hash,email_verified,role) VALUES ('mod@example.test','Moderator',$1,true,'moderator') RETURNING id",
        [hash],
      )
    ).rows[0];
    await db.pool.query(
      "INSERT INTO identities(provider,provider_id,user_id) VALUES ('github','101',$1),('github','102',$2)",
      [user.id, moderator.id],
    );
    await db.pool.query(
      "INSERT INTO repositories(id,owner_id,owner,name,module_id,asset_name) VALUES ('999','202','Other','module','module','module.json')",
    );
    const request = (path, data, cookie, csrf, requestOrigin = origin) =>
      fetch(base + path, {
        method: data === undefined ? 'GET' : 'POST',
        headers: {
          origin: requestOrigin,
          ...(data === undefined ? {} : { 'content-type': 'application/json' }),
          ...(cookie ? { cookie } : {}),
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
    assert.equal((await request('/health')).status, 200);
    assert.deepEqual(await (await request('/auth/session')).json(), {
      user: null,
      csrfToken: null,
    });
    assert.equal((await request('/author/repositories')).status, 401);
    assert.equal((await request('/moderation/revisions')).status, 401);
    assert.equal(
      (
        await request(
          '/auth/login',
          { email: 'author@example.test', password: 'test-only-password-123' },
          null,
          null,
          'https://other.test',
        )
      ).status,
      403,
    );
    assert.equal(
      (await request('/auth/login', { email: 'author@example.test', password: 'wrong-password' }))
        .status,
      401,
    );
    const login = await request('/auth/login', {
      email: 'author@example.test',
      password: 'test-only-password-123',
    });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get('set-cookie');
    assert.ok(setCookie.includes('HttpOnly'));
    assert.ok(setCookie.includes('SameSite=Lax'));
    const cookie = setCookie.split(';')[0];
    const session = await (await request('/auth/session', undefined, cookie)).json();
    assert.equal(session.user.id, user.id);
    assert.ok(session.csrfToken);
    assert.equal((await request('/author/repositories', undefined, cookie)).status, 200);
    assert.equal((await request('/author/repositories/999', undefined, cookie)).status, 404);
    assert.equal((await request('/author/revisions', undefined, cookie)).status, 200);
    assert.equal(
      (
        await request(
          '/author/repositories',
          { repository: 'https://evil.test/repo' },
          cookie,
          session.csrfToken,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          '/author/repositories',
          { repository: 'Author/module' },
          cookie,
          session.csrfToken,
        )
      ).status,
      202,
    );
    assert.equal(
      (await db.pool.query("SELECT count(*)::int n FROM discovery_jobs WHERE repository_id='123'"))
        .rows[0].n,
      1,
    );
    assert.equal((await request('/moderation/revisions', undefined, cookie)).status, 403);
    assert.equal((await request('/auth/logout', {}, cookie)).status, 403);
    assert.equal((await request('/auth/logout', {}, cookie, session.csrfToken)).status, 204);
    assert.equal((await request('/author/repositories', undefined, cookie)).status, 401);
    let limited = false;
    for (let i = 0; i < 31; i++) {
      const denied = await request('/auth/login', { email: 'author@example.test', password: '' });
      if (denied.status === 429) {
        limited = true;
        break;
      }
      assert.equal(denied.status, 401);
    }
    assert.equal(limited, true, 'one source can no longer send unlimited password attempts');
    assert.equal(
      (
        await request('/auth/login', {
          email: 'author@example.test',
          password: 'test-only-password-123',
        })
      ).status,
      429,
    );
    // Exercise the actual password/session path against PostgreSQL: a
    // blocked source must not prevent this account logging in elsewhere.
    const sessions = app.get(Sessions);
    const distinctSource = {
      headers: { origin },
      is: () => true,
      socket: { remoteAddress: '192.0.2.20' },
    };
    assert.deepEqual(
      await sessions.login(
        distinctSource,
        { cookie: () => {} },
        { email: 'author@example.test', password: 'test-only-password-123' },
      ),
      { ok: true },
    );
    // This test owns an isolated schema; clear its source budget before the
    // remaining moderator role assertions use the same loopback connection.
    await db.pool.query('DELETE FROM rate_limits');
    const modLogin = await request('/auth/login', {
      email: 'mod@example.test',
      password: 'test-only-password-123',
    });
    const modCookie = modLogin.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('/moderation/revisions', undefined, modCookie)).status, 200);
    await db.pool.query('INSERT INTO packages(sha256,size) VALUES ($1,1)', ['f'.repeat(64)]);
    await db.pool.query(
      "INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed) SELECT '999','202','Other','module','1.0.'||n::text,n::text,n::text,'v1.0.'||n::text,$1,$2,'{\"name\":\"Module\"}','[]',false FROM generate_series(1,101) n",
      ['a'.repeat(40), 'f'.repeat(64)],
    );
    const first = await (await request('/moderation/revisions', undefined, modCookie)).json();
    assert.equal(first.items.length, 100);
    assert.ok(first.nextCursor);
    const second = await (
      await request(`/moderation/revisions?cursor=${first.nextCursor}`, undefined, modCookie)
    ).json();
    assert.equal(second.items.length, 1);
    assert.equal(second.nextCursor, null);
    await db.pool.query("UPDATE revisions SET status='rejected' WHERE id=ANY($1::uuid[])", [
      first.items.map((row) => row.id),
    ]);
    assert.equal(
      (await (await request('/moderation/revisions', undefined, modCookie)).json()).items.length,
      1,
    );
    await db.pool.query(
      "INSERT INTO rate_limits(key,count,expires_at) VALUES ('expired-test',1,now()-interval '1 minute')",
    );
    await db.cleanup();
    assert.equal(
      (await db.pool.query("SELECT 1 FROM rate_limits WHERE key='expired-test'")).rowCount,
      0,
    );
    assert.equal((await request('/moderation/revisions', undefined, modCookie)).status, 200);
    await db.pool.query("UPDATE users SET role='author' WHERE id=$1", [moderator.id]);
    assert.equal((await request('/moderation/revisions', undefined, modCookie)).status, 403);
  } finally {
    if (app) await app.close();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
  }
});
