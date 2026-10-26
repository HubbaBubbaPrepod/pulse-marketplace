import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePackage, validateMarker } from '../src/packages/validate-package.mjs';
import { GitHubClient } from '../src/discovery/github-client.mjs';
const colors = Object.fromEntries(
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
);
export const themePackage = () => ({
  schemaVersion: 1,
  kind: 'theme',
  id: 'night',
  name: 'Night',
  version: '1.0.0',
  description: 'A dark monitor theme',
  theme: {
    schemaVersion: 1,
    id: 'night',
    name: 'Night',
    mode: 'dark',
    radius: 10,
    colors: { ...colors },
  },
});
const check = (v, expected = { moduleId: 'night', tag: 'v1.0.0', kind: 'theme' }) =>
  validatePackage(Buffer.from(JSON.stringify(v)), expected);
test('theme discovery marker is distinct and legacy markers remain modules', () => {
  assert.equal(
    validateMarker({
      schemaVersion: 1,
      kind: 'theme',
      moduleId: 'night',
      packageAsset: 'theme.json',
    }).ok,
    true,
  );
  assert.equal(
    validateMarker({
      schemaVersion: 1,
      kind: 'script',
      moduleId: 'night',
      packageAsset: 'theme.json',
    }).ok,
    false,
  );
  assert.equal(
    validateMarker({ schemaVersion: 1, moduleId: 'docker', packageAsset: 'docker.json' }).ok,
    true,
  );
});
test('theme releases validate without binaries and retain the exact Monitor import document', () => {
  const value = themePackage(),
    r = check(value);
  assert.equal(r.ok, true);
  assert.deepEqual(r.manifest.theme, value.theme);
  assert.deepEqual(r.platforms, []);
  assert.equal(r.manifest.kind, 'theme');
});
test('theme packages cannot masquerade as modules or change release identity', () => {
  assert.equal(check(themePackage(), { kind: 'module' }).ok, false);
  assert.equal(check(themePackage(), { kind: 'theme', moduleId: 'other' }).ok, false);
  assert.equal(check(themePackage(), { kind: 'theme', tag: 'v2.0.0' }).ok, false);
  const v = themePackage();
  v.theme.id = 'other';
  assert.equal(check(v).ok, false);
});
test('themes reject executable content, remote assets and unsafe style values', () => {
  for (const mutate of [
    (v) => (v.binaries = {}),
    (v) => (v.theme.css = 'body{}'),
    (v) => (v.theme.colors.bg = 'url(https://example.com)'),
    (v) => (v.theme.colors.extra = '#ffffff'),
    (v) => (v.theme.options = { font: 'remote' }),
    (v) => (v.theme.options = { fontSize: 80 }),
    (v) => (v.theme.radius = 25),
    (v) => (v.theme.mode = 'system'),
    (v) => (v.theme.accent = 'red'),
    (v) => (v.theme.options = { pointer: 'yes' }),
    (v) => (v.theme.colors = null),
  ]) {
    const v = themePackage();
    mutate(v);
    assert.equal(check(v).ok, false);
  }
  const large = themePackage();
  large.description = 'x'.repeat(65536);
  assert.equal(check(large).ok, false);
});
test('GitHub discovery searches both module and theme topics without duplicate repositories', async () => {
  const client = new GitHubClient();
  const queries = [];
  client.json = async (path) => {
    queries.push(decodeURIComponent(path));
    return {
      total_count: 1,
      items: [
        {
          id: 1,
          private: false,
          archived: false,
          owner: { id: 2, type: 'User' },
          full_name: 'owner/theme',
          default_branch: 'main',
        },
      ],
    };
  };
  const rows = [];
  for await (const row of client.repositories()) rows.push(row);
  assert.equal(rows.length, 1);
  assert.ok(queries.some((q) => q.includes('topic:pulse-theme')));
  assert.ok(queries.some((q) => q.includes('topic:pulse-module')));
});

test('theme JSON rejects duplicate members before review and download normalization', () => {
  const raw = Buffer.from(
    JSON.stringify(themePackage()).replace('"radius":10', '"radius":20,"radius":10'),
  );
  assert.equal(validatePackage(raw, { kind: 'theme' }).ok, false);
});
