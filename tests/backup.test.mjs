import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('backup receiver rejects traversal, symlinks, duplicate entries and bad hashes', () => {
  const run = spawnSync(
    process.platform === 'win32' ? 'python' : 'python3',
    [fileURLToPath(new URL('./backup-receiver.test.py', import.meta.url))],
    { encoding: 'utf8' },
  );
  assert.equal(run.status, 0, run.stdout + run.stderr);
});
