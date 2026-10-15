import 'reflect-metadata';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve, join, relative, isAbsolute, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import pg from 'pg';
import { Test } from '@nestjs/testing';
import { AppModule } from '../apps/api/dist/app.module.js';
import { CONFIG } from '../apps/api/dist/config.js';
import { Database } from '../apps/api/dist/database/database.service.js';
import { ReviewService } from '../apps/api/dist/moderation/review.service.js';
import { SnapshotStore } from '../apps/api/src/packages/snapshot-store.mjs';
import { validatePackage } from '../apps/api/src/packages/validate-package.mjs';
const [file, expectedHash, version, backend] = process.argv.slice(2);
if (!file || !/^[a-f0-9]{64}$/.test(expectedHash || '') || !version || !backend)
  throw new Error(
    'Usage: node --env-file=.env scripts/verify-release-package.mjs <JSON> <SHA256> <version> <Monitor backend directory>',
  );
const bytes = await readFile(resolve(file));
assert.equal(
  createHash('sha256').update(bytes).digest('hex'),
  expectedHash,
  'Release bytes differ from the independently supplied digest',
);
const validated = validatePackage(bytes, { moduleId: 'docker', tag: `v${version}` });
assert.equal(validated.ok, true, JSON.stringify(validated.issues));
const schema = `acceptance_${randomUUID().replaceAll('-', '')}`,
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const directory = await mkdtemp(join(tmpdir(), 'pulse-package-acceptance-'));
const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.set('options', `-c search_path=${schema}`);
let application;
try {
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const fixture = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CONFIG)
    .useValue({
      databaseUrl: databaseUrl.href,
      origin: 'http://127.0.0.1:3100',
      production: false,
      port: 0,
      packageDirectory: directory,
      discoveryEnabled: false,
    })
    .compile();
  application = fixture.createNestApplication({ logger: false });
  application.setGlobalPrefix('api/v1');
  await application.listen(0, '127.0.0.1');
  const db = application.get(Database),
    review = application.get(ReviewService),
    base = (await application.getUrl()) + '/api/v1';
  // Identities exist only inside this temporary schema. They are not real moderator accounts.
  const owner = (
    await db.pool.query(
      "INSERT INTO users(display_name,role) VALUES ('Synthetic acceptance owner','moderator') RETURNING id",
    )
  ).rows[0].id;
  const reviewer = (
    await db.pool.query(
      "INSERT INTO users(display_name,role) VALUES ('Synthetic acceptance reviewer','moderator') RETURNING id",
    )
  ).rows[0].id;
  await db.pool.query(
    "INSERT INTO identities(provider,provider_id,user_id) VALUES ('github','101',$1),('github','102',$2)",
    [owner, reviewer],
  );
  await db.pool.query(
    "INSERT INTO repositories(id,owner_id,owner,name,module_id,asset_name) VALUES ('1','101','AcceptanceFixture','docker','docker','docker-module.json')",
  );
  await new SnapshotStore(directory).put(bytes, expectedHash);
  await db.pool.query('INSERT INTO packages(sha256,size) VALUES ($1,$2)', [
    expectedHash,
    bytes.length,
  ]);
  const revision = (
    await db.pool.query(
      "INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed,source_url) VALUES ('1','101','AcceptanceFixture','docker',$1,'1','1',$2,$3,$4,$5,$6,true,'https://example.test/isolated-acceptance') RETURNING id",
      [
        version,
        `v${version}`,
        'a'.repeat(40),
        expectedHash,
        JSON.stringify(validated.manifest),
        JSON.stringify(validated.platforms),
      ],
    )
  ).rows[0].id;
  assert.equal(
    (await fetch(`${base}/packages/${expectedHash}`)).status,
    404,
    'Pending package was exposed',
  );
  await assert.rejects(
    () => review.decide(owner, revision, expectedHash, 'approve', 'Self review is prohibited'),
    (error) => error.status === 403,
  );
  await review.decide(
    reviewer,
    revision,
    expectedHash,
    'approve',
    'Isolated acceptance test; not a production review',
  );
  const catalog = await (await fetch(`${base}/catalog`)).json();
  assert.equal(catalog.items.length, 1);
  assert.equal(catalog.items[0].sha256, expectedHash);
  const download = await fetch(`${base}/packages/${expectedHash}`);
  assert.equal(download.status, 200);
  const downloaded = Buffer.from(await download.arrayBuffer());
  assert.ok(downloaded.equals(bytes), 'Download changed the approved snapshot bytes');
  const outputDirectory = resolve('artifacts/module-acceptance');
  await mkdir(outputDirectory, { recursive: true });
  const downloadedPath = join(outputDirectory, `${expectedHash}.json`);
  await writeFile(downloadedPath, downloaded, { mode: 0o600 });
  const childEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !/GITHUB|GOOGLE|SMTP|MAIL_|DATABASE|PG_PASSWORD/.test(key),
    ),
  );
  childEnv.GOTOOLCHAIN = 'go1.27.2';
  await new Promise((resolveChild, reject) => {
    const child = spawn(
      'go',
      [
        'test',
        '-tags=integration',
        '-run=^TestInstallReleasedDockerModule$',
        '-count=1',
        '-v',
        '-args',
        '-module-package',
        downloadedPath,
        '-module-sha256',
        expectedHash,
        '-module-version',
        version,
      ],
      { cwd: resolve(backend), env: childEnv, windowsHide: true, stdio: 'inherit' },
    );
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0
        ? resolveChild()
        : reject(new Error(`Go installation acceptance failed with exit ${code}`)),
    );
  });
  await review.decide(reviewer, revision, expectedHash, 'withdraw', 'Isolated withdrawal check');
  assert.equal((await fetch(`${base}/packages/${expectedHash}`)).status, 404);
  console.log(
    JSON.stringify({
      isolatedSchema: true,
      productionPublication: false,
      module: 'docker',
      version,
      sha256: expectedHash,
      downloadBytes: downloaded.length,
      goInstallationPassed: true,
    }),
  );
} finally {
  if (application) await application.close();
  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await pool.end();
  }
  const scope = relative(tmpdir(), directory);
  if (
    isAbsolute(scope) ||
    scope.startsWith('..') ||
    !basename(directory).startsWith('pulse-package-acceptance-')
  )
    throw new Error('Refusing unsafe temporary directory cleanup');
  await rm(directory, { recursive: true });
}
