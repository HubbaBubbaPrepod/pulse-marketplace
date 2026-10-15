import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Sessions, type AuthRequest } from './session.service.js';
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: Sessions) {}
  async canActivate(context: ExecutionContext) {
    context.switchToHttp().getResponse().setHeader('Cache-Control', 'no-store');
    await this.sessions.require(context.switchToHttp().getRequest<AuthRequest>());
    return true;
  }
}
