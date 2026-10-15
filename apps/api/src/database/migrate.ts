import pg from 'pg';
import { loadConfig } from '../config.js';
import { runMigrations } from './migrations.mjs';
const pool = new pg.Pool({ connectionString: loadConfig().databaseUrl });
try {
  await runMigrations(pool);
  console.log('Migrations applied');
} finally {
  await pool.end();
}
