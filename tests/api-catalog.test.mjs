import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogModule, transitionName } from '../apps/web/lib/api-catalog.mjs';
import { accountCopy } from '../apps/web/lib/account-copy.mjs';
test('catalog distinguishes namespaces and keeps published provenance without preview flags', () => {
  const value = catalogModule({
    owner: 'Alice',
    id: 'docker',
    name: 'Docker',
    description: 'Container metrics',
    version: '1.0.0',
    sha256: 'a'.repeat(64),
    platforms: ['linux-amd64'],
    permissions: ['docker'],
    sourceUrl: 'https://github.com/Alice/module/tree/commit',
  });
  assert.equal(value.id, 'Alice/docker');
  assert.equal(value.moduleId, 'docker');
  assert.equal(value.example, false);
  assert.equal(value.description.ru, 'Container metrics');
  assert.match(transitionName(value.id), /^[A-Za-z_][A-Za-z0-9_-]*$/);
  assert.notEqual(transitionName(value.id), transitionName('Bob/docker'));
});
test('account copy has matching RU and EN keys', () =>
  assert.deepEqual(Object.keys(accountCopy.ru).sort(), Object.keys(accountCopy.en).sort()));
