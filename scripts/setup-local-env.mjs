import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const password = randomBytes(32).toString('hex');
const content = [
  `PG_PASSWORD=${password}`,
  'PG_PORT=54329',
  `DATABASE_URL=postgresql://pulse_marketplace:${password}@127.0.0.1:54329/pulse_marketplace`,
  'API_PORT=3101',
  'PUBLIC_ORIGIN=http://127.0.0.1:3100',
  'PACKAGE_DIRECTORY=../../data/packages',
  'NODE_ENV=development',
  `MAIL_TOKEN_KEY=${randomBytes(32).toString('hex')}`,
  '',
].join('\n');
try {
  await writeFile(new URL('../.env', import.meta.url), content, { flag: 'wx', mode: 0o600 });
  console.log(
    'Created ignored .env with a generated database password. Existing files are never replaced.',
  );
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Existing .env preserved.');
}
