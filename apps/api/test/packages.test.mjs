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
function fixtureV2() {
  const legacy = fixture();
  return {
    ...Object.fromEntries(
      Object.entries(legacy).filter(([k]) => !['fields', 'views', 'binaries'].includes(k)),
    ),
    schemaVersion: 2,
    protocol: 2,
    components: [
      {
        id: 'engine',
        location: 'agent',
        protocol: 2,
        requires: [],
        fields: [],
        triggers: [
          { type: 'interval', seconds: 5 },
          {
            type: 'manual',
            action: 'logs',
            inputKey: 'containerId',
            inputFields: [{ key: 'containerId', type: 'text', required: true }],
            resultView: 'logs',
          },
        ],
        views: [
          {
            kind: 'table',
            key: 'containers',
            rowKey: 'id',
            actions: ['logs'],
            columns: [{ key: 'id' }],
          },
        ],
        binaries: legacy.binaries,
      },
    ],
  };
}
test('v2 packages expose component metadata without executable content', () => {
  const result = validatePackage(bytes(fixtureV2()), { moduleId: 'docker', tag: 'v1.0.2' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.platforms, ['linux-amd64']);
  assert.equal(result.manifest.components[0].location, 'agent');
  assert.equal(Object.hasOwn(result.manifest.components[0], 'binaries'), false);
});
test('v2 rejects invalid grants, triggers, selectors, defaults and binary identity', () => {
  for (const edit of [
    (p) => (p.components[0].requires = ['state.*']),
    (p) => (p.components[0].triggers = [{ type: 'event', events: ['server.offline'] }]),
    (p) => (p.components[0].triggers[0].seconds = 1),
    (p) => (p.components[0].views[0].actions = ['undeclared']),
    (p) => (p.components[0].fields = [{ key: 'token', type: 'password', default: 'secret' }]),
    (p) => (p.components[0].binaries['linux-amd64'].sha256 = '0'.repeat(64)),
    (p) => p.components.push({ ...p.components[0] }),
    (p) => (p.components[0].triggers[1].when = { key: 'state', values: [] }),
    (p) => (p.components[0].triggers[1].inputKey = 'missing'),
  ]) {
    const p = fixtureV2();
    edit(p);
    assert.equal(validatePackage(bytes(p)).ok, false);
  }
});
test('v2 rejects duplicate and null members before package interpretation', () => {
  const raw = bytes(fixtureV2()).toString();
  assert.equal(
    validatePackage(
      Buffer.from(raw.replace('"schemaVersion":2', '"schemaVersion":2,"schemaVersion":2')),
    ).ok,
    false,
  );
  assert.equal(
    validatePackage(Buffer.from(raw.replace('"requires":[]', '"requires":null'))).ok,
    false,
  );
});
test('v2 component identities are unique across case-insensitive filesystems', () => {
  const p = fixtureV2();
  p.components.push({ ...p.components[0], id: p.components[0].id.toUpperCase() });
  assert.equal(validatePackage(bytes(p)).ok, false);
});
test('v2 stripped metadata stays within the Monitor private reader bound', () => {
  const p = fixtureV2();
  const component = p.components[0];
  component.fields = Array.from({ length: 32 }, (_, i) => ({
    key: `field${i}`,
    type: 'text',
    default: 'x'.repeat(4096),
  }));
  p.components = Array.from({ length: 16 }, (_, i) => ({ ...component, id: `component${i}` }));
  const result = validatePackage(bytes(p));
  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'metadata_too_large');
});

function fixtureWASI() {
  const p = fixtureV2(),
    artifact = Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]);
  p.components[0].runtime = 'wasip1';
  p.components[0].requires = ['docker.read'];
  p.components[0].optionalCapabilities = ['docker.logs', 'actions.execute', 'docker.control'];
  p.components[0].triggers[1].requires = ['docker.logs'];
  p.components[0].binaries = {
    'wasip1-wasm': {
      sha256: createHash('sha256').update(artifact).digest('hex'),
      content: artifact.toString('base64'),
    },
  };
  return p;
}
test('WASI metadata and optional grants survive stripping while artifacts remain private', () => {
  const result = validatePackage(bytes(fixtureWASI()));
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.equal(result.manifest.components[0].runtime, 'wasip1');
  assert.deepEqual(result.manifest.components[0].optionalCapabilities, [
    'docker.logs',
    'actions.execute',
    'docker.control',
  ]);
  assert.deepEqual(result.manifest.components[0].triggers[1].requires, ['docker.logs']);
  assert.equal(Object.hasOwn(result.manifest.components[0], 'binaries'), false);
  assert.deepEqual(result.platforms, ['linux-amd64', 'linux-arm64', 'windows-amd64']);
});
test('organization delegation markers accept bounded numeric GitHub IDs only', () => {
  const marker = {
    schemaVersion: 1,
    moduleId: 'docker',
    packageAsset: 'module.json',
    publishers: ['777'],
  };
  assert.equal(validateMarker(marker).ok, true);
  for (const publishers of [
    ['777', '777'],
    ['username'],
    [777],
    Array.from({ length: 21 }, (_, i) => String(i + 1)),
  ])
    assert.equal(validateMarker({ ...marker, publishers }).ok, false);
});
test('WASI refuses mislabeled executables, raw network, undeclared actions and host defaults', () => {
  for (const edit of [
    (p) => (p.components[0].runtime = 'unknown'),
    (p) => (p.components[0].runtime = 'native'),
    (p) => (p.components[0].binaries = fixtureV2().components[0].binaries),
    (p) =>
      (p.components[0].binaries = {
        'wasip1-wasm': fixtureV2().components[0].binaries['linux-amd64'],
      }),
    (p) => p.components[0].optionalCapabilities.push('network.outbound'),
    (p) => (p.components[0].triggers[1].requires = ['notifications.telegram']),
    (p) => (p.components[0].fields = [{ key: 'socket', type: 'text' }]),
    (p) => {
      p.components[0].location = 'monitor';
      p.components[0].requires = [];
      p.components[0].optionalCapabilities = [];
      p.components[0].triggers = [{ type: 'interval', seconds: 5 }];
      p.components[0].views = [];
      p.components[0].fields = [{ key: 'telegramToken', type: 'password', default: 'private' }];
    },
  ]) {
    const p = fixtureWASI();
    edit(p);
    assert.equal(validatePackage(bytes(p)).ok, false);
  }
  const p = fixtureWASI();
  p.components[0].binaries['wasip1-wasm'].sha256 = '0'.repeat(64);
  assert.equal(validatePackage(bytes(p)).ok, false);
});
