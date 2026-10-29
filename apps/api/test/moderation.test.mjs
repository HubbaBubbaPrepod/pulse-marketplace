import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { AppModule } from '../dist/app.module.js';
import { CONFIG } from '../dist/config.js';
import { Database } from '../dist/database/database.service.js';
import { ReviewService } from '../dist/moderation/review.service.js';
import { SnapshotStore } from '../src/packages/snapshot-store.mjs';
test('moderation binds approvals to digest, checks roles inside the transaction and gates public bytes', async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }),
    schema = `review_test_${Date.now()}`;
  const directory = await mkdtemp(join(tmpdir(), 'pulse-review-test-'));
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
        packageDirectory: directory,
      })
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    const base = (await app.getUrl()) + '/api/v1',
      db = app.get(Database),
      review = app.get(ReviewService);
    const owner = (
      await db.pool.query(
        "INSERT INTO users(display_name,role) VALUES ('Owner','moderator') RETURNING id",
      )
    ).rows[0].id;
    const mod = (
      await db.pool.query(
        "INSERT INTO users(display_name,role) VALUES ('Other','moderator') RETURNING id",
      )
    ).rows[0].id;
    await db.pool.query(
      "INSERT INTO identities(provider,provider_id,user_id) VALUES ('github','101',$1),('github','102',$2)",
      [owner, mod],
    );
    await db.pool.query(
      "INSERT INTO repositories(id,owner_id,owner,name,module_id,asset_name) VALUES ('1','101','Owner','module','docker','module.json')",
    );
    const bytes = Buffer.from('{"test":"snapshot"}'),
      hash = createHash('sha256').update(bytes).digest('hex');
    await new SnapshotStore(directory).put(bytes, hash);
    await db.pool.query('INSERT INTO packages(sha256,size) VALUES ($1,$2)', [hash, bytes.length]);
    const revision = (
      await db.pool.query(
        "INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed) VALUES ('1','101','Owner','docker','1.0.2','2','3','v1.0.2',$1,$2,$3,'[\"linux-amd64\"]',true) RETURNING id",
        [
          'a'.repeat(40),
          hash,
          JSON.stringify({ name: 'Docker', description: '', permissions: [] }),
        ],
      )
    ).rows[0].id;
    assert.equal((await fetch(`${base}/packages/${hash}`)).status, 404);
    await assert.rejects(
      () => review.decide(owner, revision, hash, 'approve', 'Self review'),
      (error) => error.status === 403,
    );
    await assert.rejects(
      () => review.decide(mod, revision, 'b'.repeat(64), 'approve', 'Stale bytes'),
      (error) => error.status === 409,
    );
    await db.pool.query("UPDATE users SET role='author' WHERE id=$1", [mod]);
    await assert.rejects(
      () => review.decide(mod, revision, hash, 'approve', 'Revoked'),
      (error) => error.status === 403,
    );
    await db.pool.query("UPDATE users SET role='moderator' WHERE id=$1", [mod]);
    await assert.rejects(
      () => review.decide(mod, revision, hash, 'approve', ''),
      (error) => error.status === 400,
    );
    await db.pool.query('UPDATE revisions SET source_publishers=\'["102"]\' WHERE id=$1', [
      revision,
    ]);
    await assert.rejects(
      () => review.decide(mod, revision, hash, 'approve', 'Delegated author self review'),
      (error) => error.status === 403,
    );
    await db.pool.query("UPDATE revisions SET source_publishers='[]' WHERE id=$1", [revision]);
    const decisions = await Promise.allSettled([
      review.decide(mod, revision, hash, 'approve', 'Reviewed immutable snapshot'),
      review.decide(mod, revision, hash, 'approve', 'Concurrent decision'),
    ]);
    assert.equal(decisions.filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal(decisions.find((item) => item.status === 'rejected').reason.status, 409);
    assert.equal((await db.pool.query('SELECT count(*)::int AS n FROM audit_events')).rows[0].n, 1);
    assert.equal(
      (await db.pool.query('SELECT status FROM revisions WHERE id=$1', [revision])).rows[0].status,
      'approved',
    );
    const download = await fetch(`${base}/packages/${hash}`);
    assert.equal(download.status, 200);
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
    const catalog = await (await fetch(`${base}/catalog`)).json();
    assert.equal(catalog.items.length, 1);
    assert.equal(catalog.items[0].sha256, hash);
    assert.equal(Object.hasOwn(catalog.items[0], 'manifest'), false);
    assert.equal(catalog.items[0].sourceUrl, 'https://github.com/Owner/module');
    await assert.rejects(
      () => review.decide(mod, revision, hash, 'approve', 'Replay'),
      (error) => error.status === 409,
    );
    await review.decide(mod, revision, hash, 'withdraw', 'Source under review');
    assert.equal((await fetch(`${base}/packages/${hash}`)).status, 404);
    assert.equal((await (await fetch(`${base}/catalog`)).json()).items.length, 0);
    for (const version of ['1.0.3', '1.0.4']) {
      const next = (
        await db.pool.query(
          'INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed) SELECT repository_id,source_owner_id,owner,module_id,$2,$2,$2,$2,commit_sha,sha256,manifest,platforms,true FROM revisions WHERE id=$1 RETURNING id',
          [revision, version],
        )
      ).rows[0].id;
      await review.decide(mod, next, hash, 'approve', 'Review next immutable version');
    }
    const updated = await (await fetch(`${base}/catalog`)).json();
    assert.equal(updated.items.length, 1);
    assert.equal(updated.items[0].version, '1.0.4');
    const versions = await (await fetch(`${base}/modules/Owner/docker`)).json();
    assert.equal(versions.versions.length, 2);
    const admin = (
      await db.pool.query(
        "INSERT INTO users(display_name,role) VALUES ('Password administrator','administrator') RETURNING id",
      )
    ).rows[0].id;
    for (const version of ['1.0.5', '1.0.6']) {
      const next = (
        await db.pool.query(
          'INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed) SELECT repository_id,source_owner_id,owner,module_id,$2,$2,$2,$2,commit_sha,sha256,manifest,platforms,true FROM revisions WHERE id=$1 RETURNING id',
          [revision, version],
        )
      ).rows[0].id;
      await db.pool.query("UPDATE users SET role='moderator' WHERE id=$1", [admin]);
      await assert.rejects(
        () => review.decide(admin, next, hash, 'approve', 'Moderator without independent identity'),
        (error) => error.status === 403,
      );
      await db.pool.query("UPDATE users SET role='administrator' WHERE id=$1", [admin]);
      await assert.rejects(
        () => review.decide(admin, next, 'b'.repeat(64), 'approve', 'Stale bytes'),
        (error) => error.status === 409,
      );
      await db.pool.query('UPDATE revisions SET validation_passed=false WHERE id=$1', [next]);
      await assert.rejects(
        () => review.decide(admin, next, hash, 'approve', 'Invalid package'),
        (error) => error.status === 409,
      );
      await db.pool.query('UPDATE revisions SET validation_passed=true WHERE id=$1', [next]);
      const decision = await review.decide(
        admin,
        next,
        hash,
        'approve',
        'Administrator reviewed snapshot',
      );
      assert.equal(decision.status, 'approved');
      const audit = (
        await db.pool.query(
          'SELECT actor_id,action,comment FROM audit_events WHERE revision_id=$1',
          [next],
        )
      ).rows;
      assert.equal(audit.length, 1);
      assert.equal(audit[0].actor_id, admin);
      assert.equal(audit[0].action, 'approve');
      assert.equal(audit[0].comment, 'Administrator reviewed snapshot');
      if (version === '1.0.5') {
        await db.pool.query('UPDATE identities SET user_id=$1 WHERE user_id=$2', [admin, owner]);
      }
    }
    for (const version of ['2.0.0-alpha1', '1.0.7']) {
      const next = (
        await db.pool.query(
          'INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed) SELECT repository_id,source_owner_id,owner,module_id,$2,$2,$2,$2,commit_sha,sha256,manifest,platforms,true FROM revisions WHERE id=$1 RETURNING id',
          [revision, version],
        )
      ).rows[0].id;
      if (version.includes('-'))
        assert.equal((await (await fetch(`${base}/catalog`)).json()).items[0].version, '1.0.6');
      await review.decide(admin, next, hash, 'approve', 'Review release channel');
    }
    assert.equal((await (await fetch(`${base}/catalog`)).json()).items[0].version, '2.0.0-alpha1');
    assert.equal(
      (await (await fetch(`${base}/modules/Owner/docker`)).json()).versions[0].version,
      '2.0.0-alpha1',
    );
    const isolated = (
      await db.pool.query(
        `INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed) SELECT repository_id,source_owner_id,owner,module_id,'3.0.0-alpha1','wasm-release','wasm-asset','v3.0.0-alpha1',commit_sha,sha256,$2,platforms,true FROM revisions WHERE id=$1 RETURNING id`,
        [
          revision,
          JSON.stringify({
            schemaVersion: 2,
            name: 'Docker',
            permissions: [],
            components: [
              {
                location: 'agent',
                runtime: 'wasip1',
                requires: ['docker.read'],
                optionalCapabilities: ['docker.control'],
                triggers: [{ type: 'interval', seconds: 5 }],
              },
            ],
          }),
        ],
      )
    ).rows[0].id;
    await review.decide(admin, isolated, hash, 'approve', 'Review isolated fixture');
    assert.equal((await (await fetch(`${base}/catalog`)).json()).items[0].version, '2.0.0-alpha1');
    const isolatedCatalog = await (await fetch(`${base}/catalog?runtime=all`)).json();
    assert.equal(isolatedCatalog.items[0].version, '3.0.0-alpha1');
    assert.deepEqual(isolatedCatalog.items[0].executionRuntimes, ['wasip1']);
    assert.deepEqual(isolatedCatalog.items[0].capabilities, ['docker.read', 'docker.control']);
    assert.equal(
      (await (await fetch(`${base}/modules/Owner/docker`)).json()).module.version,
      '2.0.0-alpha1',
    );
    assert.equal(
      (await (await fetch(`${base}/modules/Owner/docker?runtime=all`)).json()).module.version,
      '3.0.0-alpha1',
    );
    assert.equal((await fetch(`${base}/modules/Owner/docker/versions/3.0.0-alpha1`)).status, 404);
    assert.equal(
      (await fetch(`${base}/modules/Owner/docker/versions/3.0.0-alpha1?runtime=all`)).status,
      200,
    );
    assert.equal((await fetch(`${base}/catalog?runtime=unknown`)).status, 400);
    await db.pool.query(
      "INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed,status) SELECT '1','101','Owner','sample-'||n::text,'1.0.0','page-'||n::text,'page-'||n::text,'v1.0.0',$1,$2,jsonb_build_object('name','Sample '||lpad(n::text,3,'0'),'description','pagination fixture'),'[\"windows-amd64\"]',true,'approved' FROM generate_series(1,35) n",
      ['c'.repeat(40), hash],
    );
    const browse = await (
      await fetch(`${base}/catalog?runtime=all&browse=1&query=Sample&platform=windows&sort=name`)
    ).json();
    assert.equal(browse.items.length, 30);
    assert.equal(browse.items[0].name, 'Sample 001');
    assert.equal(browse.total, 35);
    assert.equal(
      browse.categoryCounts.other,
      35,
      'Category totals must describe all matches, not only the first page',
    );
    assert.equal(browse.nextPage, 1);
    const remaining = await (
      await fetch(
        `${base}/catalog?runtime=all&browse=1&query=Sample&platform=windows&sort=name&page=1`,
      )
    ).json();
    assert.equal(remaining.items.length, 5);
    assert.equal(remaining.items.at(-1).name, 'Sample 035');
    assert.equal(remaining.nextPage, null);
    assert.equal(
      (
        await (
          await fetch(`${base}/catalog?runtime=all&browse=1&query=Sample&platform=linux`)
        ).json()
      ).items.length,
      0,
    );
    assert.equal((await fetch(`${base}/catalog?browse=1&page=-1`)).status, 400);
  } finally {
    if (app) await app.close();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
    await rm(directory, { recursive: true });
  }
});
