import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Database } from '../database/database.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { Module } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';
import type { AuthRequest } from '../auth/session.service.js';
import { DiscoveryModule } from '../discovery/discovery.module.js';
import { GITHUB_CLIENT } from '../discovery/discovery.service.js';
import { validateMarker } from '../packages/validate-package.mjs';
@Controller('author')
@UseGuards(SessionGuard)
export class AuthorController {
  constructor(
    private readonly db: Database,
    @Inject(GITHUB_CLIENT) private readonly github: any,
  ) {}
  @Get('revisions')
  async revisions(@Req() request: AuthRequest, @Query('cursor') cursor = '') {
    if (cursor && !/^[a-f0-9-]{36}$/i.test(cursor)) throw new BadRequestException();
    const result = await this.db.pool.query(
      `SELECT r.id,r.owner,r.module_id,r.version,r.status,r.sha256,r.validation_passed,r.validation_issues,r.created_at,COALESCE(r.manifest->>'kind','module') AS kind FROM revisions r JOIN repositories repo ON repo.id=r.repository_id WHERE (repo.owner_id=$1 OR (repo.owner_type='Organization' AND repo.publisher_ids ? $1 AND repo.updated_at>now()-interval '35 minutes')) AND r.source_owner_id=repo.owner_id AND ($2='' OR (r.created_at,r.id)<(SELECT created_at,id FROM revisions WHERE id=NULLIF($2,'')::uuid)) ORDER BY r.created_at DESC,r.id DESC LIMIT 101`,
      [request.actor!.githubId, cursor],
    );
    return {
      items: result.rows.slice(0, 100),
      nextCursor: result.rows.length > 100 ? result.rows[99].id : null,
    };
  }
  @Get('revisions/:id')
  async feedback(@Req() request: AuthRequest, @Param('id') id: string) {
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new NotFoundException();
    const result = await this.db.pool.query(
      `SELECT r.id,r.owner,r.module_id,r.version,r.status,r.validation_issues,r.validation_passed,r.sha256 FROM revisions r JOIN repositories repo ON repo.id=r.repository_id WHERE r.id=$1 AND (repo.owner_id=$2 OR (repo.owner_type='Organization' AND repo.publisher_ids ? $2 AND repo.updated_at>now()-interval '35 minutes')) AND r.source_owner_id=repo.owner_id`,
      [id, request.actor!.githubId],
    );
    if (!result.rowCount) throw new NotFoundException();
    const history = await this.db.pool.query(
      'SELECT action,comment,created_at FROM audit_events WHERE revision_id=$1 ORDER BY id DESC LIMIT 100',
      [id],
    );
    return { revision: result.rows[0], history: history.rows };
  }
  @Post('repositories')
  @HttpCode(202)
  async submit(@Req() request: AuthRequest, @Body() body: { repository?: unknown }) {
    if (!request.actor!.githubId) throw new ForbiddenException('Link GitHub first');
    const input = typeof body?.repository === 'string' ? body.repository.trim() : '';
    const fullName = input.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
    if (!/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(fullName))
      throw new BadRequestException();
    const count = await this.db.pool.query(
      "INSERT INTO rate_limits(key,count,expires_at) VALUES ($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<=now() THEN 1 ELSE rate_limits.count+1 END,expires_at=CASE WHEN rate_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE rate_limits.expires_at END RETURNING count",
      ['repository:' + request.actor!.id],
    );
    if (count.rows[0].count > 10) throw new ForbiddenException('Repository request limit reached');
    const value = await this.github.json(
      `/repos/${fullName.split('/').map(encodeURIComponent).join('/')}`,
    );
    if (
      value.private ||
      value.archived ||
      !['User', 'Organization'].includes(value.owner?.type) ||
      !/^\d+$/.test(String(value.id))
    )
      throw new NotFoundException();
    const repository = {
      id: String(value.id),
      ownerId: String(value.owner.id),
      ownerType: value.owner.type,
      fullName: value.full_name,
      defaultBranch: value.default_branch,
    };
    const marker = validateMarker(await this.github.marker(repository, repository.defaultBranch));
    if (!marker.ok || !('marker' in marker))
      throw new BadRequestException('Invalid discovery marker');
    if (!(
      (repository.ownerType === 'User' && repository.ownerId === request.actor!.githubId) ||
      (repository.ownerType === 'Organization' &&
        marker.marker.publishers?.includes(request.actor!.githubId))
    ))
      throw new NotFoundException();
    await this.db.pool.query(
      'INSERT INTO discovery_jobs(repository_id,payload) VALUES ($1,$2) ON CONFLICT(repository_id) DO UPDATE SET payload=EXCLUDED.payload,next_check_at=now()',
      [repository.id, JSON.stringify(repository)],
    );
    return { queued: true };
  }
  @Get('repositories')
  async list(@Req() request: AuthRequest, @Query('cursor') cursor = '') {
    const githubId = request.actor!.githubId;
    if (!githubId) return { items: [], nextCursor: null };
    if (cursor && !/^[0-9]{1,30}$/.test(cursor)) throw new BadRequestException();
    const result = await this.db.pool.query(
      `SELECT id,owner,name,module_id AS "moduleId" FROM repositories WHERE (owner_id=$1 OR (owner_type='Organization' AND publisher_ids ? $1 AND updated_at>now()-interval '35 minutes')) AND ($2='' OR id::numeric>NULLIF($2,'')::numeric) ORDER BY id::numeric LIMIT 101`,
      [githubId, cursor],
    );
    return {
      items: result.rows.slice(0, 100),
      nextCursor: result.rows.length > 100 ? result.rows[99].id : null,
    };
  }
  @Get('repositories/:id')
  async repository(@Req() request: AuthRequest, @Param('id') id: string) {
    const result = await this.db.pool.query(
      `SELECT id,owner,name,module_id AS "moduleId" FROM repositories WHERE id=$1 AND (owner_id=$2 OR (owner_type='Organization' AND publisher_ids ? $2 AND updated_at>now()-interval '35 minutes'))`,
      [id, request.actor!.githubId],
    );
    if (!result.rowCount) throw new NotFoundException();
    return result.rows[0];
  }
}
@Module({ imports: [AuthModule, DiscoveryModule], controllers: [AuthorController] })
export class AuthorModule {}
