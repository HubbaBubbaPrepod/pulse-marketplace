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
import { Discovery, GITHUB_CLIENT } from '../dist/discovery/discovery.service.js';
test('discovery is durable, idempotent, pinned and creates pending revisions after source changes', async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }),
    schema = `discovery_test_${Date.now()}`;
  const directory = await mkdtemp(join(tmpdir(), 'pulse-discovery-test-'));
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  const binary = Buffer.alloc(64);
  binary.set([127, 69, 76, 70, 2, 1, 1]);
  binary.writeUInt16LE(62, 18);
  binary.writeUInt32LE(1, 20);
  const manifest = {
    schemaVersion: 1,
    protocol: 1,
    id: 'docker',
    version: '1.0.2',
    name: 'Docker',
    author: 'Author',
    description: '',
    permissions: [],
    fields: [],
    views: [],
    binaries: {
      'linux-amd64': {
        sha256: createHash('sha256').update(binary).digest('hex'),
        content: binary.toString('base64'),
      },
    },
  };
  let bytes = Buffer.from(JSON.stringify(manifest)),
    ownerId = '101',
    listed = true,
    ownerType = 'User',
    reads = [];
  const fake = {
    async repository(id) {
      return { id, ownerId, ownerType, fullName: 'Owner/module', defaultBranch: 'main' };
    },
    async *repositories() {
      if (listed)
        yield { id: '1', ownerId, ownerType, fullName: 'Owner/module', defaultBranch: 'main' };
    },
    async marker(_repo, commit) {
      reads.push(commit);
      if (commit === 'b'.repeat(40))
        throw Object.assign(new Error('Marker did not exist in this historical release'), {
          status: 404,
        });
      return { schemaVersion: 1, moduleId: 'docker', packageAsset: 'module.json' };
    },
    async *releases() {
      yield {
        id: 'legacy',
        tag_name: 'v0.9.0',
        assets: [{ id: 'legacy-asset', name: 'module.json', size: bytes.length }],
      };
      yield {
        id: '2',
        tag_name: `v${manifest.version}`,
        prerelease: manifest.version.includes('-'),
        assets: [{ id: '3', name: 'module.json', size: bytes.length }],
      };
    },
    async commit(_repo, tag) {
      return (tag === 'v0.9.0' ? 'b' : 'a').repeat(40);
    },
    async asset() {
      return bytes;
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
        packageDirectory: directory,
        discoveryEnabled: false,
      })
      .overrideProvider(GITHUB_CLIENT)
      .useValue(fake)
      .compile();
    app = module.createNestApplication({ logger: false });
    await app.init();
    const db = app.get(Database),
      discovery = app.get(Discovery);
    assert.equal((await discovery.runOnce()).staged, 1);
    assert.ok(reads.includes('a'.repeat(40)));
    await db.pool.query('UPDATE discovery_jobs SET next_check_at=now()');
    assert.equal((await discovery.runOnce()).staged, 0);
    assert.equal((await db.pool.query('SELECT count(*)::int n FROM revisions')).rows[0].n, 1);
    manifest.description = 'Changed source';
    bytes = Buffer.from(JSON.stringify(manifest));
    await db.pool.query('UPDATE discovery_jobs SET next_check_at=now()');
    await discovery.runOnce();
    assert.equal((await db.pool.query('SELECT count(*)::int n FROM revisions')).rows[0].n, 2);
    listed = false;
    ownerId = '102';
    await db.pool.query('UPDATE discovery_jobs SET next_check_at=now()');
    await discovery.runOnce();
    assert.equal((await db.pool.query('SELECT count(*)::int n FROM revisions')).rows[0].n, 3);
    assert.equal(
      (await db.pool.query("SELECT count(*)::int n FROM revisions WHERE source_owner_id='102'"))
        .rows[0].n,
      1,
    );
    ownerId = '103';
    ownerType = 'Organization';
    await db.pool.query('UPDATE discovery_jobs SET next_check_at=now()');
    await discovery.runOnce();
    const org = (
      await db.pool.query(
        "SELECT validation_passed,validation_issues FROM revisions WHERE source_owner_id='103'",
      )
    ).rows[0];
    assert.equal(org.validation_passed, false);
    assert.ok(
      org.validation_issues.some((issue) => issue.code === 'organization_review_not_supported'),
    );
    assert.equal(
      (await db.pool.query("SELECT count(*)::int n FROM revisions WHERE status<>'pending'")).rows[0]
        .n,
      0,
    );
    ownerType = 'User';
    ownerId = '101';
    manifest.version = '2.0.0-alpha1';
    bytes = Buffer.from(JSON.stringify(manifest));
    await db.pool.query('UPDATE discovery_jobs SET next_check_at=now()');
    assert.equal((await discovery.runOnce()).staged, 1);
    const preview = (
      await db.pool.query(
        "SELECT status,validation_passed FROM revisions WHERE version='2.0.0-alpha1'",
      )
    ).rows[0];
    assert.equal(preview.status, 'pending');
    assert.equal(preview.validation_passed, true);
    const lock = await db.pool.connect();
    try {
      await lock.query('SELECT pg_advisory_lock(831974002)');
      assert.equal((await discovery.runOnce()).skipped, true);
    } finally {
      await lock.query('SELECT pg_advisory_unlock(831974002)');
      lock.release();
    }
  } finally {
    if (app) await app.close();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
    await rm(directory, { recursive: true });
  }
});
