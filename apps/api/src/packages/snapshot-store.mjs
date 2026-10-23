import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, link, unlink, readdir, lstat, statfs } from 'node:fs/promises';
import { join, resolve } from 'node:path';
const writers = new Map();
export class SnapshotStore {
  constructor(directory, limits = {}) {
    this.directory = resolve(directory);
    this.limits = {
      maxBytes: 5 * 1024 ** 3,
      maxFiles: 1000,
      minFreeBytes: 128 * 1024 ** 2,
      ...limits,
    };
  }
  path(hash) {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid package digest');
    return join(this.directory, `${hash}.json`);
  }
  async verify(hash) {
    const bytes = await readFile(this.path(hash));
    if (
      bytes.length > 68 * 1024 * 1024 ||
      createHash('sha256').update(bytes).digest('hex') !== hash
    )
      throw new Error('Package snapshot integrity failure');
    return bytes;
  }
  async put(bytes, expectedHash) {
    const previous = writers.get(this.directory) || Promise.resolve();
    let release;
    const owned = new Promise((done) => {
      release = done;
    });
    writers.set(this.directory, owned);
    await previous;
    try {
      return await this.publish(bytes, expectedHash);
    } finally {
      release();
      if (writers.get(this.directory) === owned) writers.delete(this.directory);
    }
  }
  async publish(bytes, expectedHash) {
    if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 68 * 1024 * 1024)
      throw new Error('Invalid package size');
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (hash !== expectedHash) throw new Error('Package digest mismatch');
    const destination = this.path(hash);
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      await this.verify(hash);
      return { sha256: hash, size: bytes.length };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    let used = 0,
      count = 0;
    for (const file of await readdir(this.directory)) {
      const info = await lstat(join(this.directory, file));
      if (!info.isFile()) throw new Error('Unexpected snapshot storage entry');
      used += info.size;
      count++;
    }
    const disk = await statfs(this.directory);
    if (
      used + bytes.length > this.limits.maxBytes ||
      count >= this.limits.maxFiles ||
      disk.bavail * disk.bsize - bytes.length < this.limits.minFreeBytes
    )
      throw new Error('Package storage quota exceeded; existing snapshots retained');
    const temporary = join(this.directory, `.partial-${randomUUID()}`);
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(bytes);
      await handle.sync();
      await handle.close();
      try {
        await link(temporary, destination);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        await this.verify(hash);
      }
    } finally {
      await handle.close().catch(() => {});
      await unlink(temporary).catch(() => {});
    }
    return { sha256: hash, size: bytes.length };
  }
}
