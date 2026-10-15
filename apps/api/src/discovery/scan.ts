import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { Discovery } from './discovery.service.js';

// A one-shot operator command must not start a concurrent background scan.
process.env.DISCOVERY_ENABLED = 'false';
const application = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
try {
  const result = await application.get(Discovery).runOnce();
  console.log(JSON.stringify(result));
  if (result.failed > 0 || result.retryAt > Date.now()) process.exitCode = 1;
} finally {
  await application.close();
}
