import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { CONFIG, type Config } from './config.js';
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.setGlobalPrefix('api/v1');
app.enableShutdownHooks();
const config = app.get<Config>(CONFIG);
await app.listen(config.port, '127.0.0.1');
