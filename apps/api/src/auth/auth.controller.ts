import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Sessions, csrfFor, type AuthRequest } from './session.service.js';
import { SessionGuard } from './session.guard.js';
import { Providers } from './providers.js';
import { OAuth } from './oauth.service.js';
import { EmailAccounts } from './email.service.js';
import type { AuthCapabilities } from '@pulse-marketplace/contracts';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly sessions: Sessions,
    private readonly providers: Providers,
    private readonly oauth: OAuth,
    private readonly email: EmailAccounts,
  ) {}
  @Get('session')
  async current(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    const token = this.sessions.token(request),
      user = await this.sessions.current(token);
    return { user, csrfToken: user && token ? csrfFor(token) : null };
  }
  @Get('capabilities') capabilities(): AuthCapabilities {
    return {
      github: this.providers.available('github'),
      google: this.providers.available('google'),
      email: true,
      emailRegistration: this.email.available(),
      passwordReset: this.email.available(),
    };
  }
  @Post('register') @HttpCode(202) register(@Req() request: Request, @Body() body: unknown) {
    return this.email.request(request, body, 'verify');
  }
  @Post('request-reset') @HttpCode(202) resetRequest(
    @Req() request: Request,
    @Body() body: unknown,
  ) {
    return this.email.request(request, body, 'reset');
  }
  @Post('verify-email') @HttpCode(200) verifyEmail(@Req() request: Request, @Body() body: unknown) {
    return this.email.consume(request, body, 'verify');
  }
  @Post('reset-password') @HttpCode(200) resetPassword(
    @Req() request: Request,
    @Body() body: unknown,
  ) {
    return this.email.consume(request, body, 'reset');
  }
  @Get(':provider/start')
  async oauthStart(
    @Param('provider') provider: string,
    @Req() request: Request,
    @Res() response: Response,
    @Query('next') next: string,
  ) {
    response.redirect(await this.oauth.start(provider, request, response, next));
  }
  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cache-Control', 'no-store');
    try {
      response.redirect(await this.oauth.callback(provider, request, response));
    } catch {
      response.redirect('/ru/login/?error=oauth');
    }
  }
  @Post('link/:provider')
  @UseGuards(SessionGuard)
  async link(
    @Param('provider') provider: string,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return { url: await this.oauth.start(provider, request, response, '/ru/author/', true) };
  }
  @Post('login')
  @HttpCode(200)
  login(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
  ) {
    return this.sessions.login(request, response, body);
  }
  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    return this.sessions.logout(request, response);
  }
}
