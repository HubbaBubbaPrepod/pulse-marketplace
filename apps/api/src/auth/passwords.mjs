import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
let active = 0;
const queue = [];
async function work(password, salt) {
  if (active >= 2) {
    if (queue.length >= 16) throw new Error('Password service busy');
    await new Promise((resolve) => queue.push(resolve));
  } else active++;
  try {
    return await derive(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  } finally {
    const next = queue.shift();
    if (next) next();
    else active--;
  }
}
export const DUMMY_HASH = `scrypt$131072$8$1$${'0'.repeat(32)}$${'0'.repeat(128)}`;
export async function derivePassword(password) {
  if (
    typeof password !== 'string' ||
    Buffer.byteLength(password) < 10 ||
    Buffer.byteLength(password) > 1024
  )
    throw new Error('Invalid password length');
  const salt = randomBytes(16).toString('hex');
  const derived = await work(password, salt);
  return `scrypt$131072$8$1$${salt}$${derived.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  if (
    typeof password !== 'string' ||
    !password.length ||
    Buffer.byteLength(password) > 1024 ||
    typeof encoded !== 'string'
  )
    return false;
  const match = /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(encoded);
  if (!match) return false;
  const actual = await work(password, match[1]);
  return timingSafeEqual(actual, Buffer.from(match[2], 'hex'));
}
