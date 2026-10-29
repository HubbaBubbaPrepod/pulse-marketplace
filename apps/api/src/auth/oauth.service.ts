import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { Database } from '../database/database.service.js';
import { CONFIG, type Config } from '../config.js';
import { Sessions, digest, type AuthRequest } from './session.service.js';
import { Providers } from './providers.js';
@Injectable()
export class OAuth {
  constructor(
    private readonly db: Database,
    private readonly sessions: Sessions,
    private readonly providers: Providers,
    @Inject(CONFIG) private readonly config: Config,
  ) {}
  private cookieName(provider: string) {
    return `pulse-oauth-${provider}`;
  }
  async start(
    provider: string,
    request: AuthRequest,
    response: Response,
    next: unknown,
    link = false,
  ) {
    if (!this.providers.available(provider))
      throw new ServiceUnavailableException('Provider unavailable');
    await this.sessions.rateLimit(request, 'oauth-start', 60);
    const flow = {
        state: randomBytes(32).toString('base64url'),
        verifier: randomBytes(48).toString('base64url'),
        nonce: randomBytes(32).toString('base64url'),
      },
      binding = randomBytes(32).toString('base64url');
    const nextPath =
      typeof next === 'string' && /^\/(ru|en)\/(author|moderation)\/$/.test(next)
        ? next
        : '/ru/author/';
    const destination = await this.providers.authorization(provider, flow);
    await this.db.pool.query(
      "INSERT INTO oauth_states(state_hash,binding_hash,provider,verifier,nonce,next_path,expires_at,link_user_id) VALUES ($1,$2,$3,$4,$5,$6,now()+interval '10 minutes',$7)",
      [
        digest(flow.state),
        digest(binding),
        provider,
        flow.verifier,
        flow.nonce,
        nextPath,
        link ? request.actor!.id : null,
      ],
    );
    response.cookie(this.cookieName(provider), binding, {
      httpOnly: true,
      secure: this.config.origin.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
      maxAge: 600000,
    });
    return destination;
  }
  async callback(provider: string, request: Request, response: Response) {
    const url = new URL(request.originalUrl, this.config.origin),
      state = url.searchParams.get('state');
    if (!['github', 'google'].includes(provider) || !state || !/^[A-Za-z0-9_-]{43}$/.test(state))
      throw new BadRequestException('Invalid authentication state');
    const cookies = (request.headers.cookie || '')
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.startsWith(`${this.cookieName(provider)}=`));
    if (cookies.length !== 1) throw new BadRequestException('Invalid authentication state');
    const binding = cookies[0]!.slice(this.cookieName(provider).length + 1);
    const stored = (
      await this.db.pool.query(
        'DELETE FROM oauth_states WHERE state_hash=$1 AND binding_hash=$2 AND provider=$3 AND expires_at>now() RETURNING *',
        [digest(state), digest(binding), provider],
      )
    ).rows[0];
    if (!stored) throw new BadRequestException('Invalid authentication state');
    url.pathname = `/api/v1/auth/${provider}/callback/`;
    response.clearCookie(this.cookieName(provider), {
      httpOnly: true,
      secure: this.config.origin.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
    });
    try {
      const identity = await this.providers.identity(provider, url, {
        state,
        verifier: stored.verifier,
        nonce: stored.nonce,
      });
      if (typeof identity.id !== 'string' || !identity.id || identity.id.length > 255)
        throw new BadRequestException('Invalid provider identity');
      const sessionToken = this.sessions.token(request);
      const userId = await this.db.transaction(async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
          `${provider}:${identity.id}`,
        ]);
        if (stored.link_user_id) {
          const session = (
            await client.query(
              'SELECT user_id FROM sessions WHERE token_hash=$1 AND expires_at>now() FOR SHARE',
              [digest(sessionToken || '')],
            )
          ).rows[0];
          if (session?.user_id !== stored.link_user_id)
            throw new BadRequestException('Sign in before linking an identity');
        }
        const existing = (
          await client.query(
            'SELECT user_id FROM identities WHERE provider=$1 AND provider_id=$2',
            [provider, identity.id],
          )
        ).rows[0];
        if (existing) {
          if (stored.link_user_id && existing.user_id !== stored.link_user_id)
            throw new ConflictException('Identity already linked');
          return existing.user_id;
        }
        const id =
          stored.link_user_id ||
          (
            await client.query('INSERT INTO users(display_name) VALUES ($1) RETURNING id', [
              String(identity.displayName || 'Pulse user').slice(0, 32),
            ])
          ).rows[0].id;
        await client.query(
          'INSERT INTO identities(provider,provider_id,user_id) VALUES ($1,$2,$3)',
          [provider, identity.id, id],
        );
        return id;
      });
      await this.sessions.create(userId, response, sessionToken);
      return stored.link_user_id ? `${stored.next_path}?link=connected` : stored.next_path;
    } catch (error) {
      // Only a consumed, browser-bound flow may report a link result. Preserve
      // the signed-in account and never transfer an identity owned by another.
      if (stored.link_user_id)
        return `${stored.next_path}?link=${error instanceof ConflictException ? 'conflict' : 'failed'}`;
      throw error;
    }
  }
}
