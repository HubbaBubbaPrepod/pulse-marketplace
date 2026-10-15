import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { validatePackage, validateMarker } from '../src/packages/validate-package.mjs';
function fixture() {
  const binary = Buffer.alloc(64);
  binary.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1]);
  binary.writeUInt16LE(2, 16);
  binary.writeUInt16LE(62, 18);
  binary.writeUInt32LE(1, 20);
  binary.writeUInt16LE(64, 52);
  return {
    schemaVersion: 1,
    protocol: 1,
    id: 'docker',
    version: '1.0.2',
    name: 'Docker',
    author: 'Contributors',
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
}
const bytes = (value) => Buffer.from(JSON.stringify(value));
test('a realistic large binary is validated without regex stack overflow', () => {
  const value = fixture();
  const binary = Buffer.alloc(16 * 1024 * 1024);
  Buffer.from(value.binaries['linux-amd64'].content, 'base64').copy(binary);
  value.binaries['linux-amd64'] = {
    sha256: createHash('sha256').update(binary).digest('hex'),
    content: binary.toString('base64'),
  };
  assert.equal(validatePackage(bytes(value)).ok, true);
});
test('validator accepts a matching schema-1 package and reports its exact byte digest', () => {
  const raw = bytes(fixture());
  const result = validatePackage(raw, { moduleId: 'docker', tag: 'v1.0.2' });
  assert.equal(result.ok, true);
  assert.equal(result.sha256, createHash('sha256').update(raw).digest('hex'));
  assert.deepEqual(result.platforms, ['linux-amd64']);
  assert.equal(Object.hasOwn(result.manifest, 'binaries'), false);
});
test('UTF-8 byte limits match the Go installer instead of JavaScript string length', () => {
  const manifest = fixture();
  manifest.name = 'я'.repeat(33);
  assert.equal(validatePackage(bytes(manifest)).ok, false);
  manifest.name = 'я'.repeat(32);
  assert.equal(validatePackage(bytes(manifest)).ok, true);
});
test('unknown schema fields, duplicate config keys and extra JSON objects are rejected', () => {
  const value = fixture();
  value.remoteScript = 'https://example.test/code.js';
  assert.equal(validatePackage(bytes(value)).ok, false);
  delete value.remoteScript;
  value.fields = [
    { key: 'port', label: '', type: 'number' },
    { key: 'port', label: '', type: 'number' },
  ];
  assert.equal(validatePackage(bytes(value)).ok, false);
  assert.equal(validatePackage(Buffer.concat([bytes(fixture()), Buffer.from('{}')])).ok, false);
});
test('platform, content and declared binary digest must agree', () => {
  const value = fixture();
  value.binaries['linux-arm64'] = value.binaries['linux-amd64'];
  delete value.binaries['linux-amd64'];
  assert.equal(validatePackage(bytes(value)).ok, false);
  const broken = fixture();
  broken.binaries['linux-amd64'].sha256 = 'a'.repeat(64);
  assert.equal(validatePackage(bytes(broken)).ok, false);
  const base64 = fixture();
  base64.binaries['linux-amd64'].content = '!invalid!';
  assert.equal(validatePackage(bytes(base64)).ok, false);
});
test('release identity cannot override the package ID or version', () => {
  assert.equal(validatePackage(bytes(fixture()), { moduleId: 'other', tag: 'v1.0.2' }).ok, false);
  assert.equal(validatePackage(bytes(fixture()), { moduleId: 'docker', tag: 'v1.0.3' }).ok, false);
});
test('discovery marker accepts only a simple asset name, never a URL or path', () => {
  assert.equal(
    validateMarker({ schemaVersion: 1, moduleId: 'docker', packageAsset: 'docker-module.json' }).ok,
    true,
  );
  for (const packageAsset of [
    '../module.json',
    'https://example.test/module.json',
    'a/b.json',
    'a\\b.json',
    '.',
    '',
  ]) {
    assert.equal(validateMarker({ schemaVersion: 1, moduleId: 'docker', packageAsset }).ok, false);
  }
});
