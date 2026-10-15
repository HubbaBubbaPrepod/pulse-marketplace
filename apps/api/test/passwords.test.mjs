import assert from 'node:assert/strict';
import test from 'node:test';
import { derivePassword, verifyPassword } from '../src/auth/passwords.mjs';
test('passwords use salted scrypt and reject a wrong password', async () => {
  const first = await derivePassword('test-only-strong-password');
  const second = await derivePassword('test-only-strong-password');
  assert.notEqual(first, second);
  assert.ok(first.startsWith('scrypt$131072$8$1$'));
  assert.equal(await verifyPassword('test-only-strong-password', first), true);
  assert.equal(await verifyPassword('different-password', first), false);
  assert.equal(await verifyPassword('anything', 'not-a-password-hash'), false);
});
test('empty and excessively large passwords cannot trigger expensive derivation', async () => {
  await assert.rejects(() => derivePassword(''), /password/i);
  await assert.rejects(() => derivePassword('x'.repeat(1025)), /password/i);
});
