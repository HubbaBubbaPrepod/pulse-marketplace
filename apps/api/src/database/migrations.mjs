import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function runMigrations(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(831974001)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const directory = new URL('../../migrations/', import.meta.url);
    const files = (await readdir(directory))
      .filter((name) => /^\d+_[a-z_]+\.sql$/.test(name))
      .sort();
    for (const name of files) {
      const sql = await readFile(new URL(name, directory), 'utf8');
      const digest = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT sha256 FROM schema_migrations WHERE name=$1', [
        name,
      ]);
      if (existing.rowCount) {
        if (existing.rows[0].sha256 !== digest)
          throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name,sha256) VALUES ($1,$2)', [
        name,
        digest,
      ]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
