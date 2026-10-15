import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { SnapshotStore } from '../src/packages/snapshot-store.mjs';
test('snapshots publish atomically by digest and detect corrupt existing files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pulse-package-test-'));
  const store = new SnapshotStore(directory),
    bytes = Buffer.from('{"package":"test"}');
  const hash = createHash('sha256').update(bytes).digest('hex');
  try {
    await Promise.all([store.put(bytes, hash), store.put(bytes, hash)]);
    assert.deepEqual(await store.verify(hash), bytes);
    assert.deepEqual(await readdir(directory), [`${hash}.json`]);
    await assert.rejects(() => store.put(Buffer.from('different'), hash), /digest/);
    assert.throws(() => store.path('../anything'), /digest/);
    await writeFile(join(directory, `${hash}.json`), 'corrupted');
    await assert.rejects(() => store.verify(hash), /integrity/);
    await assert.rejects(() => store.put(bytes, hash), /integrity/);
  } finally {
    await rm(directory, { recursive: true });
  }
});
