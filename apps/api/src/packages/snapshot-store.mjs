import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, link, unlink } from 'node:fs/promises';
import { join } from 'node:path';
export class SnapshotStore {
  constructor(directory) {
    this.directory = directory;
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
    if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 68 * 1024 * 1024)
      throw new Error('Invalid package size');
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (hash !== expectedHash) throw new Error('Package digest mismatch');
    const destination = this.path(hash);
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
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
