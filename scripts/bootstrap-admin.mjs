import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import pg from 'pg';
import { derivePassword } from '../apps/api/src/auth/passwords.mjs';
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error('Usage: node --env-file=.env scripts/bootstrap-admin.mjs <email>');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  if ((await pool.query('SELECT 1 FROM users WHERE email=$1', [email])).rowCount)
    throw new Error('Account exists; credentials and roles were not changed');
  const password = randomBytes(24).toString('base64url'),
    hash = await derivePassword(password);
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../artifacts/admin-access.txt', import.meta.url),
    `Local Pulse Marketplace administrator\nURL: ${process.env.PUBLIC_ORIGIN}/ru/login/\nEmail: ${email}\nPassword: ${password}\n\nKeep this file private. Do not commit it.\n`,
    { flag: 'wx', mode: 0o600 },
  );
  await pool.query(
    "INSERT INTO users(email,display_name,password_hash,email_verified,role) VALUES ($1,'Administrator',$2,true,'administrator')",
    [email, hash],
  );
  console.log(
    'Administrator created. Credentials saved to ignored artifacts/admin-access.txt; no credentials printed.',
  );
} finally {
  await pool.end();
}
