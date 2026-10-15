import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublicAddress, validateGitHubUrl } from '../src/discovery/transport.mjs';
test('transport refuses private, local, mapped and reserved network addresses', () => {
  for (const address of [
    '127.0.0.1',
    '10.1.2.3',
    '172.16.1.1',
    '192.168.0.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    '::ffff:127.0.0.1',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
  ])
    assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress('140.82.112.4'), true);
  assert.equal(isPublicAddress('2606:50c0:8000::154'), true);
});
test('only exact GitHub HTTPS hosts without credentials or custom ports are accepted', () => {
  assert.equal(validateGitHubUrl('https://api.github.com/repos/a/b').hostname, 'api.github.com');
  for (const url of [
    'http://api.github.com/repos/a/b',
    'https://api.github.com.evil.test/',
    'https://127.0.0.1/',
    'https://user:password@api.github.com/',
    'https://api.github.com:444/',
  ])
    assert.throws(() => validateGitHubUrl(url));
});
