import assert from 'node:assert/strict';
import test from 'node:test';
import { moduleCount } from '../apps/web/lib/copy.mjs';
test('Russian module count uses singular, paucal and plural endings', () => {
  assert.equal(moduleCount(1, 'ru'), '1 модуль');
  assert.equal(moduleCount(4, 'ru'), '4 модуля');
  assert.equal(moduleCount(6, 'ru'), '6 модулей');
  assert.equal(moduleCount(11, 'ru'), '11 модулей');
  assert.equal(moduleCount(21, 'ru'), '21 модуль');
});
test('English module count uses a singular only for one module', () => {
  assert.equal(moduleCount(1, 'en'), '1 module');
  assert.equal(moduleCount(0, 'en'), '0 modules');
});
