import { unambiguousJSON } from './validate-v2.mjs';
const colorKeys = [
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
];
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v, list) => object(v) && Object.keys(v).every((k) => list.includes(k));
const text = (v, max) =>
  typeof v === 'string' && v.trim().length > 0 && Buffer.byteLength(v) <= max;
const hex = (v) => typeof v === 'string' && /^#[a-f0-9]{6}$/i.test(v);
export function validateThemePackage(raw, v, expected) {
  const fail = () => ({ ok: false, issues: [{ path: 'theme', code: 'invalid_theme' }] });
  if (
    raw.length > 65536 ||
    !unambiguousJSON(raw) ||
    !keys(v, ['schemaVersion', 'kind', 'id', 'name', 'version', 'description', 'theme']) ||
    v.schemaVersion !== 1 ||
    v.kind !== 'theme' ||
    !text(v.id, 64) ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(v.id) ||
    !text(v.name, 64) ||
    !text(v.version, 48) ||
    !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9-]+)?$/.test(v.version) ||
    typeof v.description !== 'string' ||
    Buffer.byteLength(v.description) > 2048
  )
    return fail();
  if (
    (expected.kind && expected.kind !== 'theme') ||
    (expected.moduleId && expected.moduleId !== v.id) ||
    (expected.tag && expected.tag.replace(/^v/, '') !== v.version)
  )
    return fail();
  const t = v.theme;
  if (
    !keys(t, ['schemaVersion', 'id', 'name', 'mode', 'radius', 'colors', 'accent', 'options']) ||
    t.schemaVersion !== 1 ||
    t.id !== v.id ||
    !text(t.name, 64) ||
    !['dark', 'light'].includes(t.mode) ||
    !Number.isFinite(t.radius) ||
    t.radius < 0 ||
    t.radius > 24 ||
    !keys(t.colors, colorKeys) ||
    Object.keys(t.colors).length !== colorKeys.length ||
    !colorKeys.every((k) => hex(t.colors[k])) ||
    (t.accent !== undefined && !hex(t.accent))
  )
    return fail();
  const rules = {
    font: (v) => ['system', 'arial', 'segoe'].includes(v),
    contentFont: (v) => ['inherit', 'system', 'arial', 'segoe'].includes(v),
    codeFont: (v) => ['system', 'consolas', 'courier'].includes(v),
    fontSize: (v) => Number.isInteger(v) && v >= 12 && v <= 20,
    codeSize: (v) => Number.isInteger(v) && v >= 10 && v <= 20,
    contrast: (v) => Number.isFinite(v) && v >= 0 && v <= 100,
    italic: (v) => typeof v === 'boolean',
    transparent: (v) => typeof v === 'boolean',
    pointer: (v) => typeof v === 'boolean',
  };
  if (
    t.options !== undefined &&
    (!keys(t.options, Object.keys(rules)) ||
      Object.entries(t.options).some(([k, v]) => !rules[k](v)))
  )
    return fail();
  return { ok: true, issues: [], manifest: v, platforms: [] };
}
