import { Module } from '@nestjs/common';
import { Sessions } from './session.service.js';
import { SessionGuard } from './session.guard.js';
import { AuthController } from './auth.controller.js';
import { Providers } from './providers.js';
import { OAuth } from './oauth.service.js';
import { Mailer, EmailAccounts } from './email.service.js';
import { Accounts } from './account.service.js';
@Module({
  controllers: [AuthController],
  providers: [Sessions, SessionGuard, Providers, OAuth, Mailer, EmailAccounts, Accounts],
  exports: [Sessions, SessionGuard],
})
export class AuthModule {}
