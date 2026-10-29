import { validateThemePackage } from './validate-theme.mjs';
import { validateV2Package } from './validate-v2.mjs';
import { createHash } from 'node:crypto';
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const versionPattern = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9-]+)?$/;
const platforms = ['linux-amd64', 'linux-arm64', 'windows-amd64'];
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, limit, required = false) =>
  typeof value === 'string' && (!required || value.length > 0) && Buffer.byteLength(value) <= limit;
const keys = (value, allowed) =>
  object(value) && Object.keys(value).every((key) => allowed.includes(key));
const failure = (path, code) => ({ ok: false, issues: [{ path, code }] });
export function validateMarker(value) {
  if (
    !keys(value, ['schemaVersion', 'kind', 'moduleId', 'packageAsset', 'publishers']) ||
    (value.publishers !== undefined &&
      (!Array.isArray(value.publishers) ||
        value.publishers.length > 20 ||
        value.publishers.some((id) => typeof id !== 'string' || !/^[1-9][0-9]{0,19}$/.test(id)) ||
        new Set(value.publishers).size !== value.publishers.length)) ||
    value.schemaVersion !== 1 ||
    (value.kind !== undefined && !['module', 'theme'].includes(value.kind)) ||
    !text(value.moduleId, 64, true) ||
    !idPattern.test(value.moduleId) ||
    !text(value.packageAsset, 128, true) ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(value.packageAsset)
  )
    return failure('marker', 'invalid_marker');
  return {
    ok: true,
    marker: {
      ...(value.kind ? { kind: value.kind } : {}),
      schemaVersion: 1,
      moduleId: value.moduleId,
      packageAsset: value.packageAsset,
      ...(value.publishers ? { publishers: value.publishers } : {}),
    },
  };
}
function executableMatches(target, binary) {
  if (target === 'windows-amd64') {
    if (binary.length < 64 || binary.toString('ascii', 0, 2) !== 'MZ') return false;
    const offset = binary.readUInt32LE(60);
    if (
      offset > binary.length - 24 ||
      binary.readUInt32LE(offset) !== 0x4550 ||
      binary.readUInt16LE(offset + 4) !== 0x8664
    )
      return false;
    const sections = binary.readUInt16LE(offset + 6),
      optionalSize = binary.readUInt16LE(offset + 20),
      table = offset + 24 + optionalSize;
    if (table + sections * 40 > binary.length) return false;
    for (let index = 0; index < sections; index++) {
      const section = table + index * 40;
      if (binary.readUInt32LE(section + 16) + binary.readUInt32LE(section + 20) > binary.length)
        return false;
    }
    return true;
  }
  if (
    binary.length < 64 ||
    binary.readUInt32BE(0) !== 0x7f454c46 ||
    binary[4] !== 2 ||
    binary[5] !== 1 ||
    binary[6] !== 1 ||
    binary.readUInt32LE(20) !== 1 ||
    binary.readUInt16LE(18) !== (target === 'linux-amd64' ? 62 : 183)
  )
    return false;
  const programOffset = binary.readBigUInt64LE(32),
    sectionOffset = binary.readBigUInt64LE(40),
    length = BigInt(binary.length);
  const programSize = binary.readUInt16LE(54),
    programCount = binary.readUInt16LE(56),
    sectionSize = binary.readUInt16LE(58),
    sectionCount = binary.readUInt16LE(60);
  if ((programCount && programSize < 56) || (sectionCount && sectionSize < 64)) return false;
  return (
    programOffset + BigInt(programSize * programCount) <= length &&
    sectionOffset + BigInt(sectionSize * sectionCount) <= length
  );
}
export function validatePackage(raw, expected = {}) {
  if (!Buffer.isBuffer(raw) || raw.length > 68 * 1024 * 1024)
    return failure('package', 'size_limit');
  let value;
  try {
    value = JSON.parse(raw.toString('utf8'));
  } catch {
    return failure('package', 'invalid_json');
  }
  if (value?.kind === 'theme') {
    const result = validateThemePackage(raw, value, expected);
    return result.ok
      ? { ...result, sha256: createHash('sha256').update(raw).digest('hex'), size: raw.length }
      : result;
  }
  if (expected.kind === 'theme') return failure('package', 'kind_mismatch');
  if (value?.schemaVersion === 2) {
    const result = validateV2Package(raw, value, expected, validateMetadata, validateBinaries);
    return result.ok
      ? { ...result, sha256: createHash('sha256').update(raw).digest('hex'), size: raw.length }
      : result;
  }
  const metadataResult = validateMetadata(value, expected);
  if (!metadataResult.ok) return metadataResult;
  const artifacts = validateBinaries(value.binaries);
  if (!artifacts.ok) return artifacts;
  const { permissions, fields, views } = metadataResult.manifest;
  const { binaries, ...manifest } = value;
  return {
    ok: true,
    manifest: { ...manifest, permissions, fields, views },
    platforms: Object.keys(binaries),
    sha256: createHash('sha256').update(raw).digest('hex'),
    size: raw.length,
    issues: [],
  };
}

function validateMetadata(value, expected) {
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
      'fields',
      'views',
      'binaries',
    ]) ||
    value.schemaVersion !== 1 ||
    value.protocol !== 1 ||
    !text(value.id, 64, true) ||
    !idPattern.test(value.id) ||
    !text(value.version, 48, true) ||
    !versionPattern.test(value.version) ||
    !text(value.name, 64, true) ||
    !text(value.author ?? '', 128) ||
    !text(value.description ?? '', 2048)
  )
    return failure('manifest', 'invalid_manifest');
  if (
    (expected.moduleId && expected.moduleId !== value.id) ||
    (expected.tag && expected.tag.replace(/^v/, '') !== value.version)
  )
    return failure('manifest', 'release_mismatch');
  const permissions = value.permissions ?? [],
    fields = value.fields ?? [],
    views = value.views ?? [];
  if (
    !Array.isArray(permissions) ||
    permissions.length > 16 ||
    permissions.some((item) => !text(item, 512)) ||
    !Array.isArray(fields) ||
    fields.length > 32 ||
    !Array.isArray(views) ||
    views.length > 16
  )
    return failure('manifest', 'invalid_collections');
  const fieldKeys = new Set();
  for (const field of fields) {
    if (
      !keys(field, ['key', 'label', 'type', 'required', 'default']) ||
      !text(field.key, 64, true) ||
      !idPattern.test(field.key) ||
      fieldKeys.has(field.key) ||
      !text(field.label ?? '', 128) ||
      !['text', 'password', 'number', 'boolean'].includes(field.type) ||
      (field.required != null && typeof field.required !== 'boolean')
    )
      return failure('fields', 'invalid_field');
    fieldKeys.add(field.key);
  }
  for (const view of views) {
    if (
      !keys(view, ['kind', 'title', 'key', 'columns']) ||
      !['table', 'cards', 'chart', 'logs'].includes(view.kind) ||
      !text(view.key, 64, true) ||
      !idPattern.test(view.key) ||
      !text(view.title ?? '', 128) ||
      !Array.isArray(view.columns ?? []) ||
      (view.columns ?? []).length > 32
    )
      return failure('views', 'invalid_view');
    for (const column of view.columns ?? []) {
      if (
        !keys(column, ['key', 'label', 'unit']) ||
        !text(column.key, 64, true) ||
        !idPattern.test(column.key) ||
        !text(column.label ?? '', 128) ||
        !text(column.unit ?? '', 32)
      )
        return failure('views.columns', 'invalid_column');
    }
  }
  return { ok: true, manifest: { ...value, permissions, fields, views }, issues: [] };
}

function validateBinaries(binaries, runtime = 'native') {
  if (
    !object(binaries) ||
    Object.keys(binaries).length < 1 ||
    Object.keys(binaries).length > (runtime === 'wasip1' ? 1 : 3)
  )
    return failure('binaries', 'invalid_binaries');
  let total = 0;
  for (const [platform, binary] of Object.entries(binaries)) {
    if (
      !(runtime === 'wasip1' ? platform === 'wasip1-wasm' : platforms.includes(platform)) ||
      !keys(binary, ['sha256', 'content']) ||
      !text(binary.sha256, 64, true) ||
      !/^[a-f0-9]{64}$/i.test(binary.sha256) ||
      typeof binary.content !== 'string'
    )
      return failure('binaries', 'invalid_binary');
    const encoded = binary.content.replace(/[\r\n]/g, '');
    if (
      encoded.length > Math.ceil((16 * 1024 * 1024) / 3) * 4 ||
      encoded.length % 4 !== 0 ||
      /[^A-Za-z0-9+/=]/.test(encoded) ||
      !/^[^=]*={0,2}$/.test(encoded)
    )
      return failure('binaries.content', 'invalid_base64');
    const decoded = Buffer.from(encoded, 'base64');
    total += decoded.length;
    if (!decoded.length || decoded.length > 16 * 1024 * 1024 || total > 48 * 1024 * 1024)
      return failure('binaries.content', 'size_limit');
    if (createHash('sha256').update(decoded).digest('hex') !== binary.sha256.toLowerCase())
      return failure('binaries.sha256', 'digest_mismatch');
    if (
      runtime === 'wasip1'
        ? decoded.length < 8 ||
          !decoded.subarray(0, 8).equals(Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]))
        : !executableMatches(platform, decoded)
    )
      return failure('binaries.content', 'platform_mismatch');
  }
  return { ok: true, issues: [] };
}
