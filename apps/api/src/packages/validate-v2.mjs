const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v, list) => object(v) && Object.keys(v).every((k) => list.includes(k));
const id = (v) => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(v);
const names = (v) =>
  Array.isArray(v) &&
  v.length <= 32 &&
  new Set(v).size === v.length &&
  v.every(
    (x) =>
      typeof x === 'string' &&
      Buffer.byteLength(x) <= 128 &&
      /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)*$/.test(x),
  );
const text = (v, n) => typeof v === 'string' && Buffer.byteLength(v) <= n;
const invalid = (path, code = 'invalid_v2_component') => ({ ok: false, issues: [{ path, code }] });
// JSON.parse keeps the last duplicate key. Scan the already syntactically valid
// document first so a reviewer and an installer cannot interpret different data.
function unambiguousJSON(raw) {
  const source = raw.toString('utf8');
  let i = 0;
  const ws = () => {
    while (/\s/.test(source[i] ?? '') && i < source.length) i++;
  };
  const string = () => {
    const start = i++;
    while (i < source.length) {
      if (source[i] === '\\') {
        i += 2;
        continue;
      }
      if (source[i++] === '"') return JSON.parse(source.slice(start, i));
    }
    throw Error('string');
  };
  const value = (depth, member = '') => {
    if (depth > 64) throw Error('depth');
    ws();
    if (source[i] === 'n' && member !== 'default') throw Error('null');
    if (source[i] === '"') {
      string();
      return;
    }
    if (source[i] === '{') {
      i++;
      ws();
      const seen = new Set();
      while (source[i] !== '}') {
        ws();
        const key = string();
        if (seen.has(key)) throw Error('duplicate');
        seen.add(key);
        ws();
        i++;
        value(depth + 1, key);
        ws();
        if (source[i] !== ',') break;
        i++;
      }
      i++;
      return;
    }
    if (source[i] === '[') {
      i++;
      ws();
      while (source[i] !== ']') {
        value(depth + 1);
        ws();
        if (source[i] !== ',') break;
        i++;
      }
      i++;
      return;
    }
    while (i < source.length && !/[\s,}\]]/.test(source[i])) i++;
  };
  try {
    value(0);
    return true;
  } catch {
    return false;
  }
}
export function validateV2Package(raw, value, expected, validateLegacy) {
  if (!unambiguousJSON(raw)) return invalid('package', 'ambiguous_json');
  if (
    !keys(value, [
      'schemaVersion',
      'protocol',
      'id',
      'version',
      'name',
      'author',
      'description',
      'permissions',
      'components',
    ]) ||
    value.protocol !== 2 ||
    !Array.isArray(value.components) ||
    !value.components.length ||
    value.components.length > 16
  )
    return invalid('components');
  const components = [];
  const seen = new Set();
  const targets = new Set();
  let total = 0;
  for (const [index, c] of value.components.entries()) {
    const path = `components.${index}`;
    if (
      !keys(c, [
        'id',
        'location',
        'protocol',
        'requires',
        'fields',
        'triggers',
        'binaries',
        'views',
      ]) ||
      !id(c.id) ||
      seen.has(c.id.toLowerCase()) ||
      !['agent', 'monitor'].includes(c.location) ||
      c.protocol !== 2 ||
      !names(c.requires ?? []) ||
      !Array.isArray(c.triggers) ||
      !c.triggers.length ||
      c.triggers.length > 16
    )
      return invalid(path);
    seen.add(c.id.toLowerCase());
    if (!Array.isArray(c.fields ?? [])) return invalid(path + '.fields');
    for (const field of c.fields ?? []) {
      if (!object(field)) return invalid(path + '.fields');
      if (Object.hasOwn(field, 'default') && field.default !== null) {
        const expectedType = {
          text: 'string',
          password: 'string',
          number: 'number',
          boolean: 'boolean',
        }[field.type];
        if (
          typeof field.default !== expectedType ||
          (field.type === 'password' && field.default !== '') ||
          (typeof field.default === 'string' && !text(field.default, 4096))
        )
          return invalid(path + '.fields');
      }
    }
    const actions = new Set();
    for (const t of c.triggers) {
      if (
        !keys(t, [
          'type',
          'seconds',
          'events',
          'action',
          'label',
          'mutating',
          'inputFields',
          'inputKey',
          'resultView',
          'when',
        ]) ||
        !text(t.label ?? '', 128)
      )
        return invalid(path + '.triggers');
      if (t.type === 'interval') {
        if (
          !Number.isInteger(t.seconds) ||
          t.seconds < 5 ||
          t.seconds > 86400 ||
          Object.keys(t).some((k) => !['type', 'seconds', 'label'].includes(k))
        )
          return invalid(path + '.triggers');
      } else if (t.type === 'event') {
        if (
          c.location !== 'monitor' ||
          !names(t.events) ||
          !t.events.length ||
          Object.keys(t).some((k) => !['type', 'events', 'label'].includes(k))
        )
          return invalid(path + '.triggers');
      } else if (t.type === 'manual') {
        if (
          !id(t.action) ||
          actions.has(t.action) ||
          'seconds' in t ||
          'events' in t ||
          (t.mutating !== undefined && typeof t.mutating !== 'boolean') ||
          !['', 'logs', 'cards', 'table'].includes(t.resultView ?? '') ||
          !Array.isArray(t.inputFields ?? []) ||
          (t.inputFields ?? []).length > 32
        )
          return invalid(path + '.triggers');
        actions.add(t.action);
        const input = new Set();
        for (const f of t.inputFields ?? []) {
          if (
            !keys(f, ['key', 'type', 'label', 'required']) ||
            !id(f.key) ||
            input.has(f.key) ||
            !text(f.label ?? '', 128) ||
            !['text', 'password', 'number', 'boolean'].includes(f.type) ||
            (f.required !== undefined && typeof f.required !== 'boolean')
          )
            return invalid(path + '.triggers');
          input.add(f.key);
        }
        if (t.inputKey !== undefined && t.inputKey !== '' && !input.has(t.inputKey))
          return invalid(path + '.triggers');
        if (
          t.when !== undefined &&
          (!keys(t.when, ['key', 'values']) ||
            !id(t.when.key) ||
            !Array.isArray(t.when.values) ||
            !t.when.values.length ||
            t.when.values.length > 16 ||
            t.when.values.some((v) => !text(v, 128) || !v.length))
        )
          return invalid(path + '.triggers');
      } else return invalid(path + '.triggers');
    }
    if (!Array.isArray(c.views ?? [])) return invalid(path + '.views');
    for (const v of c.views ?? []) {
      if (
        !keys(v, ['kind', 'title', 'key', 'columns', 'rowKey', 'actions']) ||
        (v.rowKey !== undefined && !id(v.rowKey)) ||
        !Array.isArray(v.actions ?? []) ||
        (v.actions ?? []).length > 16 ||
        (v.actions ?? []).some((a) => !actions.has(a))
      )
        return invalid(path + '.views');
    }
    const legacy = {
      ...value,
      schemaVersion: 1,
      protocol: 1,
      fields: c.fields ?? [],
      views: (c.views ?? []).map(({ rowKey, actions, ...view }) => view),
      binaries: c.binaries,
    };
    delete legacy.components;
    const result = validateLegacy(Buffer.from(JSON.stringify(legacy)), expected);
    if (!result.ok) return invalid(path + '.' + result.issues[0].path, result.issues[0].code);
    for (const [target, binary] of Object.entries(c.binaries)) {
      targets.add(target);
      total += Buffer.from(binary.content, 'base64').length;
    }
    if (total > 48 * 1024 * 1024) return invalid('components', 'size_limit');
    const { binaries, ...metadata } = c;
    components.push(metadata);
  }
  // Account for the Monitor's JSON encoding, including HTML-safe escapes and
  // retained artifact digests. Executable content is not persisted in metadata.
  const persisted = {
    ...value,
    components: value.components.map((c) => ({
      ...c,
      binaries: Object.fromEntries(
        Object.entries(c.binaries).map(([target, b]) => [target, { sha256: b.sha256 }]),
      ),
    })),
  };
  const encoded = JSON.stringify(persisted).replace(
    /[<>&\u2028\u2029]/g,
    (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
  );
  if (Buffer.byteLength(encoded) > 2 * 1024 * 1024) return invalid('package', 'metadata_too_large');
  const { components: ignored, ...metadata } = value;
  return {
    ok: true,
    manifest: { ...metadata, permissions: value.permissions ?? [], components },
    platforms: [...targets],
    issues: [],
  };
}
