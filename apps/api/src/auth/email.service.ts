import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Request } from 'express';
import { createHmac, randomUUID } from 'node:crypto';
import { Database } from '../database/database.service.js';
import { CONFIG, type Config } from '../config.js';
import { Sessions, digest } from './session.service.js';
import { derivePassword } from './passwords.mjs';
@Injectable()
export class Mailer {
  private transport?: ReturnType<typeof nodemailer.createTransport>;
  constructor(@Inject(CONFIG) config: Config) {
    if (!process.env.SMTP_URL || !process.env.MAIL_FROM) return;
    const url = new URL(process.env.SMTP_URL);
    if (!['smtp:', 'smtps:'].includes(url.protocol) || /[\r\n]/.test(process.env.MAIL_FROM))
      throw new Error('Invalid SMTP configuration');
    this.transport = nodemailer.createTransport({
      host: url.hostname,
      port: Number(url.port || (url.protocol === 'smtps:' ? 465 : 587)),
      secure: url.protocol === 'smtps:',
      requireTLS: config.production,
      auth: url.username
        ? { user: decodeURIComponent(url.username), pass: decodeURIComponent(url.password) }
        : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  available() {
    return Boolean(this.transport);
  }
  async send(to: string, url: string, purpose: string, lang: string = 'en') {
    if (!this.transport) throw new Error('SMTP unavailable');
    if (
      typeof to !== 'string' ||
      to.length > 254 ||
      !/^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]+$/.test(to)
    )
      throw new Error('Invalid mail recipient');
    const ru = lang === 'ru';
    await this.transport.sendMail({
      from: process.env.MAIL_FROM,
      to: { address: to, name: '' },
      subject:
        purpose === 'verify'
          ? ru
            ? 'Подтвердите email в Pulse Marketplace'
            : 'Confirm your Pulse Marketplace email'
          : ru
            ? 'Сброс пароля Pulse Marketplace'
            : 'Reset your Pulse Marketplace password',
      text: `${purpose === 'verify' ? (ru ? 'Подтвердите email и задайте пароль' : 'Confirm your email and choose a password') : ru ? 'Задайте новый пароль' : 'Choose a new password'}:\n\n${url}\n\n${ru ? 'Если вы не запрашивали это письмо, проигнорируйте его.' : 'If you did not request this, ignore this email.'}`,
    });
  }
}
@Injectable()
export class EmailAccounts implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  constructor(
    private readonly db: Database,
    private readonly sessions: Sessions,
    private readonly mailer: Mailer,
    @Inject(CONFIG) private readonly config: Config,
  ) {}
  available() {
    return this.mailer.available() && /^[a-f0-9]{64}$/.test(this.config.mailTokenKey || '');
  }
  onModuleInit() {
    if (this.available()) {
      this.timer = setInterval(() => {
        void this.flush().catch(() => console.error('Email worker unavailable'));
      }, 5000);
      this.timer.unref();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private token(id: string, userId: string, purpose: string) {
    return createHmac('sha256', Buffer.from(this.config.mailTokenKey!, 'hex'))
      .update(`${id}:${userId}:${purpose}`)
      .digest('base64url');
  }
  async request(request: Request, body: any, purpose: 'verify' | 'reset') {
    this.sessions.assertOrigin(request);
    if (!this.available())
      throw new ServiceUnavailableException('Email delivery is not configured');
    if (
      typeof body?.email !== 'string' ||
      body.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
    )
      throw new BadRequestException('Invalid email address');
    const email = body.email.trim().toLowerCase(),
      lang = body.lang === 'en' ? 'en' : 'ru';
    await this.sessions.rateLimit(request, `email-${purpose}`, 15, email);
    const name =
      typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 32) : 'Pulse user';
    await this.db.transaction(async (client) => {
      if (purpose === 'verify')
        await client.query(
          'INSERT INTO users(email,display_name) VALUES ($1,$2) ON CONFLICT(email) DO NOTHING',
          [email, name || 'Pulse user'],
        );
      const user = (
        await client.query(
          'SELECT id,email_verified,password_hash FROM users WHERE email=$1 FOR UPDATE',
          [email],
        )
      ).rows[0];
      if (
        !user ||
        (purpose === 'verify' && user.email_verified) ||
        (purpose === 'reset' && (!user.email_verified || !user.password_hash))
      )
        return;
      const id = randomUUID(),
        token = this.token(id, user.id, purpose),
        expires = new Date(Date.now() + (purpose === 'verify' ? 86400000 : 900000));
      await client.query(
        'INSERT INTO email_tokens(token_hash,user_id,purpose,expires_at) VALUES ($1,$2,$3,$4)',
        [digest(token), user.id, purpose, expires],
      );
      await client.query(
        'INSERT INTO email_outbox(id,user_id,recipient,purpose,lang,expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [id, user.id, email, purpose, lang, expires],
      );
    });
    return { accepted: true };
  }
  async consume(request: Request, body: any, purpose: 'verify' | 'reset') {
    this.sessions.assertOrigin(request);
    await this.sessions.rateLimit(
      request,
      'email-consume',
      20,
      typeof body?.token === 'string' ? body.token.slice(0, 43) : 'invalid',
    );
    if (!this.available())
      throw new ServiceUnavailableException('Email delivery is not configured');
    if (
      typeof body?.token !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(body.token) ||
      typeof body.password !== 'string'
    )
      throw new BadRequestException('Invalid or expired token');
    const tokenHash = digest(body.token);
    if (
      !(
        await this.db.pool.query(
          'SELECT 1 FROM email_tokens WHERE token_hash=$1 AND purpose=$2 AND expires_at>now()',
          [tokenHash, purpose],
        )
      ).rowCount
    )
      throw new BadRequestException('Invalid or expired token');
    let passwordHash: string;
    try {
      passwordHash = await derivePassword(body.password);
    } catch {
      throw new BadRequestException('Password must contain 10–1024 UTF-8 bytes');
    }
    await this.db.transaction(async (client) => {
      const row = (
        await client.query(
          'DELETE FROM email_tokens WHERE token_hash=$1 AND purpose=$2 AND expires_at>now() RETURNING user_id',
          [tokenHash, purpose],
        )
      ).rows[0];
      if (!row) throw new BadRequestException('Invalid or expired token');
      await client.query('UPDATE users SET password_hash=$2,email_verified=true WHERE id=$1', [
        row.user_id,
        passwordHash,
      ]);
      await client.query('DELETE FROM sessions WHERE user_id=$1', [row.user_id]);
      await client.query('DELETE FROM email_tokens WHERE user_id=$1', [row.user_id]);
    });
    return { ok: true };
  }
  async flush() {
    if (!this.available()) return;
    await this.db.transaction(async (client) => {
      const rows = await client.query(
        'SELECT * FROM email_outbox WHERE sent_at IS NULL AND attempts<5 AND next_attempt_at<=now() AND expires_at>now() ORDER BY next_attempt_at LIMIT 5 FOR UPDATE SKIP LOCKED',
      );
      for (const row of rows.rows) {
        const token = this.token(row.id, row.user_id, row.purpose),
          path = row.purpose === 'verify' ? 'verify-email' : 'reset-password';
        if (
          !(
            await client.query(
              'SELECT 1 FROM email_tokens WHERE token_hash=$1 AND expires_at>now()',
              [digest(token)],
            )
          ).rowCount
        ) {
          await client.query('UPDATE email_outbox SET sent_at=now() WHERE id=$1', [row.id]);
          continue;
        }
        try {
          await this.mailer.send(
            row.recipient,
            `${this.config.origin}/${row.lang}/${path}/?token=${token}`,
            row.purpose,
            row.lang,
          );
          await client.query('UPDATE email_outbox SET sent_at=now() WHERE id=$1', [row.id]);
        } catch {
          await client.query(
            "UPDATE email_outbox SET attempts=attempts+1,next_attempt_at=now()+interval '5 minutes' WHERE id=$1",
            [row.id],
          );
        }
      }
    });
  }
}
