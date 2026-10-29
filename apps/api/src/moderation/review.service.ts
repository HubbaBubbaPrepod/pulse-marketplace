import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Database } from '../database/database.service.js';
import { CONFIG, type Config } from '../config.js';
import { SnapshotStore } from '../packages/snapshot-store.mjs';
@Injectable()
export class ReviewService {
  private readonly snapshots: SnapshotStore;
  constructor(
    private readonly db: Database,
    @Inject(CONFIG) config: Config,
  ) {
    this.snapshots = new SnapshotStore(config.packageDirectory);
  }
  async decide(
    actorId: string,
    revisionId: string,
    expectedHash: string,
    decision: string,
    comment: string,
  ) {
    if (
      typeof comment !== 'string' ||
      !comment.trim() ||
      comment.length > 2000 ||
      Buffer.byteLength(comment) > 8000 ||
      !/^[a-f0-9]{64}$/.test(expectedHash || '') ||
      !/^[a-f0-9-]{36}$/i.test(revisionId || '') ||
      !['approve', 'reject', 'withdraw'].includes(decision)
    )
      throw new BadRequestException('Invalid review decision');
    return this.db.transaction(async (client) => {
      const actor = (await client.query('SELECT role FROM users WHERE id=$1 FOR UPDATE', [actorId]))
        .rows[0];
      if (!actor || !['moderator', 'administrator'].includes(actor.role))
        throw new ForbiddenException();
      const revision = (
        await client.query('SELECT * FROM revisions WHERE id=$1 FOR UPDATE', [revisionId])
      ).rows[0];
      if (!revision) throw new NotFoundException();
      if (revision.sha256 !== expectedHash) throw new ConflictException('Revision digest changed');
      const allowed =
        revision.status === 'pending'
          ? ['approve', 'reject']
          : revision.status === 'approved'
            ? ['withdraw']
            : [];
      if (!allowed.includes(decision))
        throw new ConflictException('Revision is no longer in the expected state');
      if (decision === 'approve') {
        if (actor.role !== 'administrator') {
          const github = (
            await client.query(
              "SELECT provider_id FROM identities WHERE user_id=$1 AND provider='github'",
              [actorId],
            )
          ).rows[0];
          const publishers =
            (
              await client.query('SELECT publisher_ids FROM repositories WHERE id=$1', [
                revision.repository_id,
              ])
            ).rows[0]?.publisher_ids || [];
          if (
            !github ||
            github.provider_id === revision.source_owner_id ||
            publishers.includes(github.provider_id) ||
            (revision.source_publishers || []).includes(github.provider_id)
          )
            throw new ForbiddenException('A linked non-author GitHub identity is required');
        }
        if (!revision.validation_passed) throw new ConflictException('Automatic validation failed');
        try {
          await this.snapshots.verify(revision.sha256);
        } catch {
          throw new ConflictException('Package snapshot unavailable');
        }
        await client.query(
          'INSERT INTO published_versions(owner,module_id,version,sha256,revision_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(owner,module_id,version) DO NOTHING',
          [
            revision.owner.toLowerCase(),
            revision.module_id,
            revision.version,
            revision.sha256,
            revision.id,
          ],
        );
        const published = (
          await client.query(
            'SELECT sha256,revision_id FROM published_versions WHERE owner=$1 AND module_id=$2 AND version=$3 FOR UPDATE',
            [revision.owner.toLowerCase(), revision.module_id, revision.version],
          )
        ).rows[0];
        if (published.sha256 !== revision.sha256 || published.revision_id !== revision.id)
          throw new ConflictException(
            'This version already has a published revision; release a new version',
          );
      }
      const status = { approve: 'approved', reject: 'rejected', withdraw: 'withdrawn' }[decision];
      await client.query('UPDATE revisions SET status=$2,reviewed_at=now() WHERE id=$1', [
        revisionId,
        status,
      ]);
      await client.query(
        'INSERT INTO audit_events(actor_id,revision_id,action,comment) VALUES ($1,$2,$3,$4)',
        [actorId, revisionId, decision, comment.trim()],
      );
      return { id: revisionId, status };
    });
  }
}
