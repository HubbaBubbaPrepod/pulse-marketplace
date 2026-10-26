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
import { ReviewService } from '../dist/moderation/review.service.js';

test('theme discovery, moderation, previews and downloads stay separate from executable module routes', async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const schema = `themes_test_${Date.now()}`;
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const directory = await mkdtemp(join(tmpdir(), 'pulse-themes-'));
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  const theme = {
    schemaVersion: 1,
    id: 'night',
    name: 'Night',
    mode: 'dark',
    radius: 10,
    colors: Object.fromEntries(
      [
        'bg',
        'surface',
        'surface-hover',
        'raised',
        'text',
        'muted',
        'subtle',
        'border',
        'track',
        'chart-primary',
        'chart-secondary',
        'chart-tertiary',
      ].map((k) => [k, k === 'text' ? '#eeeeee' : '#111111']),
    ),
  };
  const bytes = Buffer.from(
    JSON.stringify({
      schemaVersion: 1,
      kind: 'theme',
      id: 'night',
      name: 'Night',
      description: 'Safe preview',
      version: '1.0.0',
      theme,
    }),
  );
  const hash = createHash('sha256').update(bytes).digest('hex');
  const repo = {
    id: '900',
    ownerId: '901',
    ownerType: 'User',
    fullName: 'Owner/theme-night',
    defaultBranch: 'main',
  };
  const github = {
    async repository() {
      return repo;
    },
    async *repositories() {
      yield repo;
    },
    async marker() {
      return { schemaVersion: 1, kind: 'theme', moduleId: 'night', packageAsset: 'theme.json' };
    },
    async *releases() {
      yield {
        id: '902',
        tag_name: 'v1.0.0',
        assets: [{ id: '903', name: 'theme.json', size: bytes.length }],
      };
    },
    async commit() {
      return 'a'.repeat(40);
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
      .useValue(github)
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    const base = (await app.getUrl()) + '/api/v1',
      db = app.get(Database),
      review = app.get(ReviewService);
    assert.equal((await app.get(Discovery).runOnce()).staged, 1);
    assert.deepEqual((await (await fetch(base + '/themes')).json()).items, []);
    const rev = (await db.pool.query('SELECT id FROM revisions')).rows[0].id;
    const admin = (
      await db.pool.query(
        "INSERT INTO users(display_name,role) VALUES ('Admin','administrator') RETURNING id",
      )
    ).rows[0].id;
    const download = base + '/themes/Owner/night/versions/1.0.0/download';
    assert.equal((await fetch(download)).status, 404);
    await review.decide(admin, rev, hash, 'approve', 'Human approved this immutable theme');
    const list = await (await fetch(base + '/themes')).json();
    assert.equal(list.items.length, 1);
    assert.equal(list.items[0].kind, 'theme');
    assert.deepEqual(list.items[0].theme, theme);
    assert.equal(list.items[0].sha256, hash);
    assert.equal((await (await fetch(base + '/themes?mode=light')).json()).items.length, 0);
    assert.equal((await (await fetch(base + '/themes?query=absent')).json()).items.length, 0);
    assert.equal((await (await fetch(base + '/themes/Owner/night')).json()).versions.length, 1);
    for (const suffix of ['/catalog', '/catalog?runtime=all'])
      assert.equal((await (await fetch(base + suffix)).json()).items.length, 0);
    for (const suffix of [
      '/modules/Owner/night',
      '/modules/Owner/night?runtime=all',
      '/modules/Owner/night/versions/1.0.0',
      '/packages/' + hash,
    ])
      assert.equal((await fetch(base + suffix)).status, 404);
    const file = await fetch(download);
    assert.equal(file.status, 200);
    assert.match(file.headers.get('content-disposition'), /attachment/);
    const downloaded = Buffer.from(await file.arrayBuffer());
    assert.deepEqual(JSON.parse(downloaded), theme);
    assert.equal(createHash('sha256').update(downloaded).digest('hex'), list.items[0].themeSha256);
    assert.equal(file.headers.get('x-content-sha256'), list.items[0].themeSha256);
    await review.decide(admin, rev, hash, 'withdraw', 'Withdraw publication');
    assert.equal((await fetch(download)).status, 404);
    assert.equal((await (await fetch(base + '/themes')).json()).items.length, 0);
  } finally {
    if (app) await app.close();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
    await rm(directory, { recursive: true, force: true });
  }
});
