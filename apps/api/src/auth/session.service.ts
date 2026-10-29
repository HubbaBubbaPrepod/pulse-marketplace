import {
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { Database } from '../database/database.service.js';
import { CONFIG, type Config } from '../config.js';
import { DUMMY_HASH, verifyPassword } from './passwords.mjs';
import { clientAddress } from './client-address.mjs';
import type { Actor } from '@pulse-marketplace/contracts';
export type { Actor } from '@pulse-marketplace/contracts';
export interface AuthRequest extends Request {
  actor?: Actor;
  sessionToken?: string;
}
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const csrfFor = (token: string) => digest(`pulse-csrf:${token}`);
const same = (a: string, b: string) =>
  timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b)));
@Injectable()
export class Sessions {
  constructor(
    private readonly db: Database,
    @Inject(CONFIG) private readonly config: Config,
  ) {}
  get cookieName() {
    return this.config.origin.startsWith('https:') ? '__Host-pulse-session' : 'pulse-session';
  }
  token(request: Request): string | null {
    const matches = (request.headers.cookie || '')
      .split(';')
      .map((value) => value.trim())
      .filter((value) => value.startsWith(`${this.cookieName}=`));
    if (matches.length !== 1) return null;
    const token = matches[0]!.slice(this.cookieName.length + 1);
    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  }
  assertOrigin(request: Request) {
    if (request.headers.origin !== this.config.origin || !request.is('application/json'))
      throw new ForbiddenException('Invalid request origin or content type');
  }
  async rateLimit(request: Request, action: string, limit = 30, subject?: string) {
    const source = clientAddress(request, this.config.production);
    await this.limitKey(digest(`source:${action}:${source}`), limit);
    if (subject)
      await this.limitKey(
        digest(`subject:${action}:${action === 'login' ? source + ':' : ''}${subject}`),
        limit,
      );
    await this.limitKey(digest(`global:${action}`), 3000);
  }
  private async limitKey(key: string, limit: number) {
    const result = await this.db.pool.query(
      "INSERT INTO rate_limits(key,count,expires_at) VALUES ($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END, expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.expires_at END RETURNING count",
      [key],
    );
    if (result.rows[0].count > limit) throw new HttpException('Too many attempts; try later', 429);
  }
  async current(token: string | null): Promise<Actor | null> {
    if (!token) return null;
    const result = await this.db.pool.query(
      "SELECT u.id,u.display_name,u.role,i.provider_id AS github_id FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN identities i ON i.user_id=u.id AND i.provider='github' WHERE s.token_hash=$1 AND s.expires_at>now()",
      [digest(token)],
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          displayName: row.display_name,
          role: row.role,
          githubId: row.github_id ?? null,
        }
      : null;
  }
  async create(userId: string, response: Response, oldToken?: string | null) {
    const token = randomBytes(32).toString('base64url');
    await this.db.transaction(async (client) => {
      const user = await client.query(
        'SELECT id FROM users u WHERE id=$1 AND (EXISTS (SELECT 1 FROM identities i WHERE i.user_id=u.id) OR (u.password_hash IS NOT NULL AND u.email_verified)) FOR SHARE',
        [userId],
      );
      if (!user.rowCount) throw new UnauthorizedException('Account no longer available');
      if (oldToken)
        await client.query('DELETE FROM sessions WHERE token_hash=$1', [digest(oldToken)]);
      await client.query(
        "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '7 days')",
        [digest(token), userId],
      );
    });
    response.cookie(this.cookieName, token, {
      httpOnly: true,
      secure: this.config.origin.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 86400 * 1000,
    });
  }
  async login(request: Request, response: Response, body: unknown) {
    this.assertOrigin(request);
    const input = body as { email?: unknown; password?: unknown };
    if (
      !input ||
      typeof input.email !== 'string' ||
      input.email.length > 254 ||
      typeof input.password !== 'string' ||
      Buffer.byteLength(input.password) > 1024
    )
      throw new UnauthorizedException('Invalid credentials');
    await this.rateLimit(request, 'login', 30, input.email.trim().toLowerCase());
    const row = (
      await this.db.pool.query('SELECT id,password_hash,email_verified FROM users WHERE email=$1', [
        input.email.trim().toLowerCase(),
      ])
    ).rows[0];
    let valid = false;
    try {
      valid = await verifyPassword(input.password, row?.password_hash || DUMMY_HASH);
    } catch {
      throw new ServiceUnavailableException('Authentication temporarily unavailable');
    }
    if (!valid || !row?.email_verified) throw new UnauthorizedException('Invalid credentials');
    await this.create(row.id, response, this.token(request));
    return { ok: true };
  }
  async require(request: AuthRequest): Promise<Actor> {
    const token = this.token(request),
      actor = await this.current(token);
    if (!actor || !token) throw new UnauthorizedException();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      this.assertOrigin(request);
      const csrf = request.headers['x-csrf-token'];
      if (typeof csrf !== 'string' || !same(csrf, csrfFor(token)))
        throw new ForbiddenException('Invalid CSRF token');
    }
    request.actor = actor;
    request.sessionToken = token;
    return actor;
  }
  async logout(request: AuthRequest, response: Response) {
    await this.db.pool.query('DELETE FROM sessions WHERE token_hash=$1', [
      digest(request.sessionToken!),
    ]);
    response.clearCookie(this.cookieName, {
      httpOnly: true,
      secure: this.config.origin.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
    });
  }
}
