import assert from 'node:assert/strict';
import test from 'node:test';
import { applyThemeStorageEvent } from '../apps/web/lib/theme-store.mjs';
test('a theme update from another tab is applied before subscriber notification', () => {
  const root = { dataset: { theme: 'dark' } };
  assert.equal(
    applyThemeStorageEvent({ key: 'pulse-market.theme.v1', newValue: 'light' }, root),
    true,
  );
  assert.equal(root.dataset.theme, 'light');
});
test('unrelated storage events do not change the current theme', () => {
  const root = { dataset: { theme: 'light' } };
  assert.equal(applyThemeStorageEvent({ key: 'unrelated', newValue: 'dark' }, root), false);
  assert.equal(root.dataset.theme, 'light');
});
test('removing the stored theme restores the documented default', () => {
  const root = { dataset: { theme: 'light' } };
  assert.equal(
    applyThemeStorageEvent({ key: 'pulse-market.theme.v1', newValue: null }, root),
    true,
  );
  assert.equal(root.dataset.theme, 'dark');
});
