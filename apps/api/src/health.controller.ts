import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Database } from './database/database.service.js';
@Controller('health')
export class HealthController {
  constructor(private readonly db: Database) {}
  @Get() async ready() {
    try {
      await this.db.pool.query('SELECT 1 FROM schema_migrations LIMIT 1');
      return { ready: true };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
