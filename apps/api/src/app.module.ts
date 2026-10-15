import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthorModule } from './author/author.controller.js';
import { ModerationModule } from './moderation/moderation.controller.js';
import { HealthController } from './health.controller.js';
import { CatalogModule } from './catalog/catalog.controller.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorModule,
    ModerationModule,
    CatalogModule,
    DiscoveryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
