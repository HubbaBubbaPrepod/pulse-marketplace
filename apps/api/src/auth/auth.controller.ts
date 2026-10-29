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
import { Accounts } from './account.service.js';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly sessions: Sessions,
    private readonly providers: Providers,
    private readonly oauth: OAuth,
    private readonly email: EmailAccounts,
    private readonly accounts: Accounts,
  ) {}
  @Get('account')
  @UseGuards(SessionGuard)
  account(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return this.accounts.current(request);
  }
  @Post('account/confirm')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  confirmAccount(@Req() request: AuthRequest, @Body() body: unknown) {
    return this.accounts.confirm(request, body);
  }
  @Post('account/unlink')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  unlinkAccount(@Req() request: AuthRequest, @Body() body: unknown) {
    return this.accounts.change(request, body);
  }
  @Post('account/delete')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async deleteAccount(
    @Req() request: AuthRequest,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.accounts.change(request, body, true);
    await this.sessions.logout(request, response);
    return result;
  }
  @Post('account/merge/confirm')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async mergeAccounts(
    @Req() request: AuthRequest,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.accounts.merge(request, body);
    await this.sessions.create(request.actor!.id, response, request.sessionToken);
    return result;
  }
  @Post('account/merge/:provider')
  @UseGuards(SessionGuard)
  async startMerge(
    @Param('provider') provider: string,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return {
      url: await this.oauth.start(
        provider,
        request,
        response,
        request.body?.lang === 'en' ? '/en/author/' : '/ru/author/',
        true,
        true,
      ),
    };
  }
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
    if (!(await this.accounts.current(request)).providers.includes(provider))
      await this.accounts.requireFresh(request);
    return {
      url: await this.oauth.start(
        provider,
        request,
        response,
        request.body?.lang === 'en' ? '/en/author/' : '/ru/author/',
        true,
      ),
    };
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
