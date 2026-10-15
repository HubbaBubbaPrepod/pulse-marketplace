import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { runMigrations } from '../src/database/migrations.mjs';
test('migrations create durable tables once and preserve existing records', async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const schema = `test_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  try {
    await pool.query(`CREATE SCHEMA "${schema}"`);
    await pool.query(`SET search_path TO "${schema}"`);
    await runMigrations(pool);
    const count = (await pool.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n;
    const inserted = await pool.query(
      "INSERT INTO users(display_name, email) VALUES ('Migration test','migration@example.test') RETURNING id",
    );
    await runMigrations(pool);
    assert.equal((await pool.query('SELECT id FROM users')).rows[0].id, inserted.rows[0].id);
    assert.equal(
      (await pool.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n,
      count,
    );
  } finally {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.end();
  }
});
