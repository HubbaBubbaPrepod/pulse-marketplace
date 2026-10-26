import assert from 'node:assert/strict';
import test from 'node:test';
import { filterThemes, previewTokens } from '../apps/web/lib/theme-catalog.mjs';
const rows = [
  { id: 'b', name: 'Night', owner: 'A', description: 'Blue', mode: 'dark' },
  { id: 'a', name: 'Day', owner: 'B', description: 'Paper', mode: 'light' },
];
test('theme filters combine mode, text and author without changing the source order', () => {
  assert.deepEqual(
    filterThemes(rows, { mode: 'dark', query: 'blue' }).map((x) => x.id),
    ['b'],
  );
  assert.deepEqual(
    filterThemes(rows, { mode: 'all', query: '' }).map((x) => x.id),
    ['a', 'b'],
  );
  assert.deepEqual(filterThemes(rows, { mode: 'light', query: 'Night' }), []);
  assert.deepEqual(
    rows.map((x) => x.id),
    ['b', 'a'],
  );
});
test('preview only maps validated palette values into scoped CSS properties', () => {
  const t = {
    radius: 12,
    colors: { bg: '#101010', text: '#eeeeee', 'chart-primary': '#ffffff' },
    accent: '#abcdef',
  };
  const v = previewTokens(t);
  assert.equal(v['--preview-bg'], '#101010');
  assert.equal(v['--preview-radius'], '12px');
  assert.equal(v['--preview-accent'], '#abcdef');
  assert.throws(() => previewTokens({ ...t, colors: { bg: 'url(https://example.com)' } }));
});

test('theme dictionaries have matching language keys', async () => {
  const { themeCopy } = await import('../apps/web/lib/theme-catalog.mjs');
  assert.deepEqual(Object.keys(themeCopy.ru).sort(), Object.keys(themeCopy.en).sort());
});
