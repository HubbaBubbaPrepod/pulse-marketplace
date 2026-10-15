import assert from 'node:assert/strict';
import test from 'node:test';
import { maskGeometry } from '../apps/web/lib/hero-mask.mjs';
test('stationary cursor produces a circle at the pointer', () => {
  const result = maskGeometry({ x: 100, y: 80 }, { x: 100, y: 80 }, 120);
  assert.equal(result.radius, 120);
  assert.equal(result.stretch, 1);
  assert.equal(result.angle, 0);
  assert.equal(result.x, 100);
  assert.equal(result.y, 80);
});
test('rapid reversal preserves the ellipse instead of rotating it half a turn', () => {
  const forward = maskGeometry({ x: 900, y: 100 }, { x: 100, y: 100 }, 120);
  const reverse = maskGeometry({ x: 100, y: 100 }, { x: 900, y: 100 }, 120);
  assert.ok(Number.isFinite(forward.xx));
  assert.equal(forward.xx, reverse.xx);
  assert.ok(Math.abs(forward.xy - reverse.xy) < 0.0001);
  assert.equal(forward.yy, reverse.yy);
  assert.ok(forward.stretch <= 1.25);
});
test('crossing the negative x axis keeps deformation continuous', () => {
  const above = maskGeometry({ x: 0, y: 99.9 }, { x: 200, y: 100 }, 120);
  const below = maskGeometry({ x: 0, y: 100.1 }, { x: 200, y: 100 }, 120);
  assert.ok(Math.abs(above.xx - below.xx) < 0.001);
  assert.ok(Math.abs(above.xy - below.xy) < 0.001);
  assert.ok(Math.abs(above.yy - below.yy) < 0.001);
});
test('fast motion elongates along travel direction with bounded stretch', () => {
  const result = maskGeometry({ x: 1000, y: 80 }, { x: 100, y: 80 }, 120);
  assert.equal(result.angle, 0);
  assert.equal(result.stretch, 1.25);
  assert.equal(result.radius, 120);
});
test('vertical motion points the mask down rather than sideways', () => {
  const result = maskGeometry({ x: 50, y: 200 }, { x: 50, y: 100 }, 120);
  assert.equal(result.angle, 90);
  assert.ok(result.stretch > 1);
});
