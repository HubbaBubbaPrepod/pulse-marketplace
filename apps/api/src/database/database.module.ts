import { Global, Module } from '@nestjs/common';
import { CONFIG, loadConfig } from '../config.js';
import { Database } from './database.service.js';
@Global()
@Module({
  providers: [{ provide: CONFIG, useFactory: loadConfig }, Database],
  exports: [CONFIG, Database],
})
export class DatabaseModule {}
