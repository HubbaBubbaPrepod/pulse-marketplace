import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Discovery } from '../dist/discovery/discovery.service.js';

test('invalid public release assets never reach persistent snapshot storage', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pulse-reject-invalid-'));
  const repo = {
    id: '1',
    ownerId: '1',
    ownerType: 'User',
    fullName: 'Owner/module',
    defaultBranch: 'main',
  };
  let transactions = 0;
  const discovery = new Discovery(
    {
      transaction: async () => {
        transactions++;
        throw new Error('must not persist invalid release');
      },
    },
    { packageDirectory: directory },
    {
      marker: async () => ({ schemaVersion: 1, moduleId: 'invalid', packageAsset: 'module.json' }),
      repository: async () => repo,
      commit: async () => 'a'.repeat(40),
      async *releases() {
        yield { id: '1', tag_name: 'v1.0.0', assets: [{ id: '1', name: 'module.json' }] };
      },
      asset: async () => Buffer.from('{"invalid":true}'),
    },
  );
  try {
    await discovery.repository(repo).catch(() => {});
    assert.deepEqual(await readdir(directory), [], 'invalid source bytes were persisted');
    assert.equal(transactions, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
