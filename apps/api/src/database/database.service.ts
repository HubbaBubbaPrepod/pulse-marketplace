import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import pg, { PoolClient } from 'pg';
import { CONFIG, type Config } from '../config.js';
import { runMigrations } from './migrations.mjs';
@Injectable()
export class Database implements OnModuleInit, OnModuleDestroy {
  readonly pool: pg.Pool;
  private cleanupTimer?: ReturnType<typeof setInterval>;
  constructor(@Inject(CONFIG) config: Config) {
    this.pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    this.pool.on('error', () => console.error('Database connection interrupted'));
  }
  async onModuleInit() {
    await this.pool.query('SELECT 1');
    await runMigrations(this.pool);
    this.cleanupTimer = setInterval(() => {
      void this.cleanup().catch(() =>
        console.error('Expired authentication record cleanup failed'),
      );
    }, 60000);
    this.cleanupTimer.unref();
  }
  async onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    await this.pool.end();
  }
  async cleanup() {
    for (const table of [
      'sessions',
      'email_tokens',
      'oauth_states',
      'rate_limits',
      'email_outbox',
    ]) {
      await this.pool.query(
        `DELETE FROM ${table} WHERE ctid IN (SELECT ctid FROM ${table} WHERE expires_at<now() LIMIT 1000)`,
      );
    }
  }
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const value = await work(client);
      await client.query('COMMIT');
      return value;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
