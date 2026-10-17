import {
  Controller,
  Get,
  Inject,
  Module,
  NotFoundException,
  Param,
  Query,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Response } from 'express';
import { createHash } from 'node:crypto';
import { Database } from '../database/database.service.js';
import { CONFIG, type Config } from '../config.js';
import { SnapshotStore } from '../packages/snapshot-store.mjs';
import type { CatalogModule as PublishedModule } from '@pulse-marketplace/contracts';

// Versions use the package grammar: major.minor.patch with one optional suffix.
const releaseOrder = `split_part(version,'.',1)::numeric DESC,
  split_part(version,'.',2)::numeric DESC,
  split_part(split_part(version,'.',3),'-',1)::numeric DESC,
  (position('-' in version)=0) DESC,
  (split_part(version,'-',2) ~ '^[0-9]+$') ASC,
  CASE WHEN split_part(version,'-',2) ~ '^[0-9]+$' THEN split_part(version,'-',2)::numeric END DESC,
  split_part(version,'-',2) COLLATE "C" DESC`;

@Controller()
export class CatalogController {
  private readonly snapshots: SnapshotStore;
  constructor(
    private readonly db: Database,
    @Inject(CONFIG) config: Config,
  ) {
    this.snapshots = new SnapshotStore(config.packageDirectory);
  }
  @Get('catalog')
  async list(
    @Query('query') query: string = '',
    @Query('platform') platform: string = '',
    @Query('cursor') cursor: string = '',
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.db.pool.query(
      `WITH latest AS (SELECT DISTINCT ON (lower(owner),module_id) * FROM revisions WHERE status='approved' ORDER BY lower(owner),module_id,${releaseOrder},reviewed_at DESC,id DESC) SELECT r.*,p.size,repo.name AS repository_name FROM latest r JOIN packages p ON p.sha256=r.sha256 JOIN repositories repo ON repo.id=r.repository_id WHERE ($1='' OR r.manifest->>'name' ILIKE $2 OR r.manifest->>'description' ILIKE $2) AND ($3='' OR r.platforms ? $3) AND ($4='' OR r.id::text>$4) ORDER BY r.id LIMIT 31`,
      [
        String(query).slice(0, 128),
        `%${String(query).slice(0, 128)}%`,
        ['linux-amd64', 'linux-arm64', 'windows-amd64'].includes(platform) ? platform : '',
        /^[a-f0-9-]{36}$/i.test(cursor) ? cursor : '',
      ],
    );
    const rows = result.rows.slice(0, 30),
      revision = createHash('sha256')
        .update(JSON.stringify(rows.map((row) => [row.id, row.sha256, row.reviewed_at])))
        .digest('hex');
    response.setHeader('ETag', `"${revision}"`);
    response.setHeader('Cache-Control', 'no-cache');
    return {
      items: rows.map((row) => this.publicRow(row)),
      nextCursor: result.rows.length > 30 ? rows.at(-1)!.id : null,
      revision,
    };
  }
  private publicRow(row: Record<string, any>): PublishedModule {
    return {
      schemaVersion: row.manifest.schemaVersion === 2 ? 2 : 1,
      ...(row.manifest.schemaVersion === 2
        ? {
            runtimes: [...new Set(row.manifest.components.map((c: any) => c.location))] as Array<
              'agent' | 'monitor'
            >,
            capabilities: [
              ...new Set(
                row.manifest.components.flatMap((c: any) => [
                  ...(c.requires || []),
                  ...(c.triggers.some((t: any) => t.mutating) ? ['actions.execute'] : []),
                ]),
              ),
            ] as string[],
            triggers: [
              ...new Set(
                row.manifest.components.flatMap((c: any) => c.triggers.map((t: any) => t.type)),
              ),
            ] as Array<'manual' | 'interval' | 'event'>,
          }
        : {}),
      owner: row.owner,
      id: row.module_id,
      name: row.manifest.name,
      description: row.manifest.description || '',
      version: row.version,
      sha256: row.sha256,
      size: Number(row.size),
      platforms: row.platforms,
      permissions: row.manifest.permissions || [],
      sourceUrl:
        row.source_url ||
        `https://github.com/${encodeURIComponent(row.owner)}/${encodeURIComponent(row.repository_name || '')}`,
      reviewedAt: row.reviewed_at,
    };
  }
  @Get('modules/:owner/:id')
  async module(@Param('owner') owner: string, @Param('id') id: string) {
    const result = await this.db.pool.query(
      `SELECT r.*,p.size,repo.name AS repository_name FROM revisions r JOIN packages p ON p.sha256=r.sha256 JOIN repositories repo ON repo.id=r.repository_id WHERE r.status='approved' AND lower(r.owner)=lower($1) AND r.module_id=$2 ORDER BY ${releaseOrder},r.reviewed_at DESC LIMIT 100`,
      [owner, id],
    );
    if (!result.rowCount) throw new NotFoundException();
    return {
      module: this.publicRow(result.rows[0]),
      versions: result.rows.map((row) => this.publicRow(row)),
    };
  }
  @Get('modules/:owner/:id/versions/:version')
  async version(
    @Param('owner') owner: string,
    @Param('id') id: string,
    @Param('version') version: string,
  ) {
    const result = await this.db.pool.query(
      "SELECT r.*,p.size,repo.name AS repository_name FROM revisions r JOIN packages p ON p.sha256=r.sha256 JOIN repositories repo ON repo.id=r.repository_id WHERE r.status='approved' AND lower(r.owner)=lower($1) AND r.module_id=$2 AND r.version=$3 LIMIT 1",
      [owner, id, version],
    );
    if (!result.rowCount) throw new NotFoundException();
    return this.publicRow(result.rows[0]);
  }
  @Get('packages/:hash')
  async download(@Param('hash') hash: string, @Res() response: Response) {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new NotFoundException();
    const allowed = await this.db.pool.query(
      "SELECT 1 FROM revisions WHERE sha256=$1 AND status='approved' LIMIT 1",
      [hash],
    );
    if (!allowed.rowCount) throw new NotFoundException();
    let bytes: Buffer;
    try {
      bytes = await this.snapshots.verify(hash);
    } catch {
      throw new ServiceUnavailableException('Package snapshot unavailable');
    }
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Disposition', `attachment; filename="${hash}.json"`);
    response.end(bytes);
  }
}
@Module({ controllers: [CatalogController] })
export class CatalogModule {}
