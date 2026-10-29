import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Database } from '../database/database.service.js';
import { Sessions, digest, type AuthRequest } from './session.service.js';
import { DUMMY_HASH, verifyPassword } from './passwords.mjs';

@Injectable()
export class Accounts {
  constructor(
    private readonly db: Database,
    private readonly sessions: Sessions,
  ) {}
  async current(request: AuthRequest) {
    const user = (
      await this.db.pool.query(
        'SELECT email,password_hash IS NOT NULL AND email_verified AS password FROM users WHERE id=$1',
        [request.actor!.id],
      )
    ).rows[0];
    const identities = await this.db.pool.query(
      'SELECT provider FROM identities WHERE user_id=$1 ORDER BY provider',
      [request.actor!.id],
    );
    const fresh = await this.db.pool.query(
      "SELECT 1 FROM sessions WHERE token_hash=$1 AND user_id=$2 AND expires_at>now() AND created_at>now()-interval '10 minutes'",
      [digest(request.sessionToken!), request.actor!.id],
    );
    const pending = await this.db.pool.query(
      'SELECT u.display_name FROM account_merges m JOIN users u ON u.id=m.source_user_id WHERE m.session_hash=$1 AND m.target_user_id=$2 AND m.expires_at>now()',
      [digest(request.sessionToken!), request.actor!.id],
    );
    return {
      email: user.email,
      password: user.password,
      providers: identities.rows.map((row) => row.provider),
      fresh: Boolean(fresh.rowCount),
      merge: pending.rowCount ? { displayName: pending.rows[0].display_name } : null,
    };
  }
  async confirm(request: AuthRequest, body: any) {
    if (typeof body?.password !== 'string' || Buffer.byteLength(body.password) > 1024)
      throw new BadRequestException();
    await this.sessions.rateLimit(request, 'account-confirm', 10, request.actor!.id);
    const user = (
      await this.db.pool.query('SELECT password_hash,email_verified FROM users WHERE id=$1', [
        request.actor!.id,
      ])
    ).rows[0];
    if (
      !(await verifyPassword(body.password, user?.password_hash || DUMMY_HASH)) ||
      !user?.email_verified
    )
      throw new UnauthorizedException();
    await this.db.pool.query(
      'UPDATE sessions SET created_at=now() WHERE token_hash=$1 AND user_id=$2',
      [digest(request.sessionToken!), request.actor!.id],
    );
    return { ok: true };
  }
  async requireFresh(request: AuthRequest) {
    if (!(await this.current(request)).fresh)
      throw new ConflictException('Confirm your sign-in again');
  }
  async prepareMerge(client: any, target: string, source: string, token: string) {
    if (target === source) throw new ConflictException('Choose another account');
    const users = await client.query(
      'SELECT id,role FROM users WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',
      [[target, source]],
    );
    if (users.rowCount !== 2 || users.rows.some((row: any) => row.role !== 'author'))
      throw new ConflictException('Service accounts cannot be merged');
    const fresh = await client.query(
      "SELECT 1 FROM sessions WHERE token_hash=$1 AND user_id=$2 AND expires_at>now() AND created_at>now()-interval '10 minutes'",
      [digest(token), target],
    );
    if (!fresh.rowCount) throw new ConflictException('Confirm the current account first');
    await client.query(
      "INSERT INTO account_merges(session_hash,target_user_id,source_user_id,expires_at) VALUES ($1,$2,$3,now()+interval '10 minutes') ON CONFLICT(session_hash) DO UPDATE SET source_user_id=EXCLUDED.source_user_id,expires_at=EXCLUDED.expires_at",
      [digest(token), target, source],
    );
  }
  async merge(request: AuthRequest, body: any) {
    if (body?.confirmation !== 'MERGE') throw new BadRequestException();
    await this.sessions.rateLimit(request, 'account-change', 10, request.actor!.id);
    return this.db.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(831974010)');
      const proof = (
        await client.query(
          'SELECT * FROM account_merges WHERE session_hash=$1 AND target_user_id=$2 AND expires_at>now() FOR UPDATE',
          [digest(request.sessionToken!), request.actor!.id],
        )
      ).rows[0];
      if (!proof) throw new ConflictException('Verify the other account first');
      const rows = (
        await client.query('SELECT * FROM users WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
          [proof.target_user_id, proof.source_user_id],
        ])
      ).rows;
      const target = rows.find((row) => row.id === proof.target_user_id),
        source = rows.find((row) => row.id === proof.source_user_id);
      if (!source || !target || source.role !== 'author' || target.role !== 'author')
        throw new ConflictException('Service accounts cannot be merged');
      const fresh = await client.query(
        "SELECT 1 FROM sessions WHERE token_hash=$1 AND user_id=$2 AND expires_at>now() AND created_at>now()-interval '10 minutes' FOR UPDATE",
        [digest(request.sessionToken!), target.id],
      );
      if (!fresh.rowCount) throw new ConflictException('Confirm the current account first');
      const conflicts = await client.query(
        'SELECT 1 FROM identities a JOIN identities b ON a.provider=b.provider WHERE a.user_id=$1 AND b.user_id=$2',
        [target.id, source.id],
      );
      if (conflicts.rowCount || (target.email && source.email))
        throw new ConflictException('Resolve conflicting sign-in methods first');
      await client.query('UPDATE identities SET user_id=$1 WHERE user_id=$2', [
        target.id,
        source.id,
      ]);
      await client.query(
        "UPDATE users SET email=NULL,password_hash=NULL,email_verified=false,display_name='Deleted user',role='author' WHERE id=$1",
        [source.id],
      );
      if (!target.email && source.email)
        await client.query(
          'UPDATE users SET email=$2,password_hash=$3,email_verified=$4 WHERE id=$1',
          [target.id, source.email, source.password_hash, source.email_verified],
        );
      for (const table of ['sessions', 'email_tokens', 'email_outbox'])
        await client.query(`DELETE FROM ${table} WHERE user_id=ANY($1::uuid[])`, [
          [target.id, source.id],
        ]);
      await client.query('DELETE FROM oauth_states WHERE link_user_id=ANY($1::uuid[])', [
        [target.id, source.id],
      ]);
      await client.query(
        'DELETE FROM account_merges WHERE target_user_id=ANY($1::uuid[]) OR source_user_id=ANY($1::uuid[])',
        [[target.id, source.id]],
      );
      return { ok: true };
    });
  }
  async change(request: AuthRequest, body: any, remove = false) {
    if (
      body?.confirmation !== (remove ? 'DELETE' : 'UNLINK') ||
      (!remove && !['github', 'google'].includes(body?.provider))
    )
      throw new BadRequestException();
    await this.sessions.rateLimit(request, 'account-change', 10, request.actor!.id);
    return this.db.transaction(async (client) => {
      // Serialize account removal and last-administrator checks.
      await client.query('SELECT pg_advisory_xact_lock(831974010)');
      const user = (
        await client.query('SELECT * FROM users WHERE id=$1 FOR UPDATE', [request.actor!.id])
      ).rows[0];
      const session = await client.query(
        "SELECT 1 FROM sessions WHERE token_hash=$1 AND user_id=$2 AND expires_at>now() AND created_at>now()-interval '10 minutes' FOR UPDATE",
        [digest(request.sessionToken!), user.id],
      );
      if (!session.rowCount) throw new ConflictException('Confirm your sign-in again');
      await client.query(
        'DELETE FROM account_merges WHERE target_user_id=$1 OR source_user_id=$1',
        [user.id],
      );
      if (remove) {
        if (
          user.role === 'administrator' &&
          Number(
            (await client.query("SELECT count(*) FROM users WHERE role='administrator'")).rows[0]
              .count,
          ) <= 1
        )
          throw new ConflictException('Another administrator is required');
        await client.query('DELETE FROM identities WHERE user_id=$1', [user.id]);
        await client.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
        await client.query('DELETE FROM oauth_states WHERE link_user_id=$1', [user.id]);
        await client.query('DELETE FROM email_tokens WHERE user_id=$1', [user.id]);
        await client.query('DELETE FROM email_outbox WHERE user_id=$1', [user.id]);
        await client.query(
          "UPDATE users SET email=NULL,password_hash=NULL,email_verified=false,display_name='Deleted user',role='author' WHERE id=$1",
          [user.id],
        );
      } else {
        const others = await client.query(
          'SELECT 1 FROM identities WHERE user_id=$1 AND provider<>$2',
          [user.id, body.provider],
        );
        if (!others.rowCount && !(user.password_hash && user.email_verified))
          throw new ConflictException('Keep at least one sign-in method');
        await client.query('DELETE FROM identities WHERE user_id=$1 AND provider=$2', [
          user.id,
          body.provider,
        ]);
        await client.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2', [
          user.id,
          digest(request.sessionToken!),
        ]);
        await client.query('DELETE FROM oauth_states WHERE link_user_id=$1', [user.id]);
      }
      return { ok: true };
    });
  }
}
