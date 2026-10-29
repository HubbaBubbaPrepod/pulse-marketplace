import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Module,
  Param,
  Query,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SessionGuard } from '../auth/session.guard.js';
import type { AuthRequest } from '../auth/session.service.js';
import { Database } from '../database/database.service.js';
import { ReviewService } from './review.service.js';
@Controller('moderation')
@UseGuards(SessionGuard)
export class ModerationController {
  constructor(
    private readonly db: Database,
    private readonly review: ReviewService,
  ) {}
  @Get('revisions')
  async list(
    @Req() request: AuthRequest,
    @Query('status') status: string = 'pending',
    @Query('cursor') cursor: string = '',
  ) {
    if (!['moderator', 'administrator'].includes(request.actor!.role))
      throw new ForbiddenException();
    const state = ['pending', 'approved', 'rejected', 'withdrawn'].includes(status)
      ? status
      : 'pending';
    const rows = (
      await this.db.pool.query(
        "SELECT id,owner,module_id,version,status,validation_passed,created_at,COALESCE(manifest->>'kind','module') AS kind FROM revisions WHERE status=$1 AND ($2='' OR id::text>$2) ORDER BY id LIMIT 101",
        [state, /^[a-f0-9-]{36}$/i.test(cursor) ? cursor : ''],
      )
    ).rows;
    return { items: rows.slice(0, 100), nextCursor: rows.length > 100 ? rows[99].id : null };
  }
  @Get('revisions/:id')
  async revision(@Req() request: AuthRequest, @Param('id') id: string) {
    if (!['moderator', 'administrator'].includes(request.actor!.role))
      throw new ForbiddenException();
    const result = await this.db.pool.query(
      'SELECT r.*,r.source_publishers||repo.publisher_ids AS publisher_ids FROM revisions r JOIN repositories repo ON repo.id=r.repository_id WHERE r.id::text=$1',
      [id],
    );
    if (!result.rowCount) throw new NotFoundException();
    return {
      revision: result.rows[0] || null,
      history: (
        await this.db.pool.query(
          'SELECT action,comment,created_at FROM audit_events WHERE revision_id::text=$1 ORDER BY id',
          [id],
        )
      ).rows,
    };
  }
  @Post('revisions/:id/decision')
  decide(
    @Req() request: AuthRequest,
    @Param('id') id: string,
    @Body() body: { expectedSha256: string; action: string; comment: string },
  ) {
    return this.review.decide(
      request.actor!.id,
      id,
      body?.expectedSha256,
      body?.action,
      body?.comment,
    );
  }
}
@Module({
  imports: [AuthModule],
  controllers: [ModerationController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ModerationModule {}
