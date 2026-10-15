import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterModules,
  parseFilters,
  filterQuery,
  publicModules,
} from '../apps/web/lib/catalog.mjs';

const modules = [
  {
    id: 'docker',
    name: 'Docker',
    category: 'containers',
    platforms: ['linux-amd64', 'windows-amd64'],
    description: { ru: 'Контейнеры и ресурсы', en: 'Containers and resources' },
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'databases',
    platforms: ['linux-arm64'],
    description: { ru: 'Репликация базы данных', en: 'Database replication' },
  },
  {
    id: 'systemd',
    name: 'Systemd',
    category: 'system',
    platforms: ['linux-amd64'],
    description: { ru: 'Системные службы', en: 'System services' },
  },
];
test('search ignores case and surrounding whitespace', () => {
  assert.deepEqual(
    filterModules(modules, {
      query: '  DOCKER  ',
      platform: 'all',
      category: 'all',
      sort: 'name',
    }).map((m) => m.id),
    ['docker'],
  );
});
test('search matches localized descriptions', () => {
  assert.deepEqual(
    filterModules(modules, {
      query: 'репликация',
      platform: 'all',
      category: 'all',
      sort: 'name',
    }).map((m) => m.id),
    ['postgresql'],
  );
});
test('category and platform narrow the same result set', () => {
  assert.deepEqual(
    filterModules(modules, { query: '', platform: 'windows', category: 'system', sort: 'name' }),
    [],
  );
  assert.deepEqual(
    filterModules(modules, {
      query: '',
      platform: 'linux',
      category: 'databases',
      sort: 'name',
    }).map((m) => m.id),
    ['postgresql'],
  );
});
test('filter state survives URL serialization without corrupting Unicode', () => {
  const filters = { query: 'база & cpu', platform: 'linux', category: 'databases', sort: 'name' };
  assert.deepEqual(parseFilters(new URLSearchParams(filterQuery(filters))), filters);
});
test('invalid URL filters become supported defaults', () => {
  assert.deepEqual(parseFilters(new URLSearchParams('platform=mac&category=evil&sort=rating')), {
    query: '',
    platform: 'all',
    category: 'all',
    sort: 'name',
  });
});
test('preview modules cannot leak into production catalog', () => {
  assert.deepEqual(publicModules(modules, 'production'), []);
  assert.deepEqual(publicModules(modules, 'development'), modules);
});
