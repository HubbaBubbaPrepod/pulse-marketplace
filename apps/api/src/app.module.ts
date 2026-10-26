import { ThemesModule } from './catalog/themes.controller.js';
import { Module, Inject, type NestModule, type MiddlewareConsumer } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { CONFIG, type Config } from './config.js';
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
    ThemesModule,
    DiscoveryModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  constructor(@Inject(CONFIG) private readonly config: Config) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((_request: Request, response: Response, next: NextFunction) => {
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader(
          'Content-Security-Policy',
          "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
        );
        response.setHeader('Referrer-Policy', 'no-referrer');
        if (this.config.production)
          response.setHeader('Strict-Transport-Security', 'max-age=31536000');
        next();
      })
      .forRoutes('*');
  }
}
