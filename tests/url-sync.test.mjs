import assert from 'node:assert/strict';
import test from 'node:test';
import { syncFilterState } from '../apps/web/lib/catalog.mjs';
test('catalog navigation clears the previously entered search and category', () => {
  const state = {
    url: 'q=Docker&category=containers',
    filters: { query: 'Docker', platform: 'all', category: 'containers', sort: 'name' },
  };
  assert.deepEqual(syncFilterState(state, ''), {
    url: '',
    filters: { query: '', platform: 'all', category: 'all', sort: 'name' },
  });
});
test('back navigation restores the query and platform from the URL', () => {
  const state = { url: '', filters: { query: '', platform: 'all', category: 'all', sort: 'name' } };
  assert.deepEqual(syncFilterState(state, 'q=Redis&platform=linux'), {
    url: 'q=Redis&platform=linux',
    filters: { query: 'Redis', platform: 'linux', category: 'all', sort: 'name' },
  });
});
test('an unchanged URL does not discard a synchronous input update', () => {
  const state = {
    url: 'q=R',
    filters: { query: 'Re', platform: 'all', category: 'all', sort: 'name' },
  };
  assert.equal(syncFilterState(state, 'q=R'), state);
});
