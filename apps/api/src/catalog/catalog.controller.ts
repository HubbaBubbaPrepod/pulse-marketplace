import {
  BadRequestException,
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

// Omitted negotiation preserves native-only clients; apply before latest-version selection.
const compatibleRuntime = `( $RUNTIME = 'all' OR NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(COALESCE(manifest->'components','[]'::jsonb)) component
  WHERE component->>'runtime'='wasip1'))`;
function catalogRuntime(value: string) {
  if (!['native', 'all'].includes(value))
    throw new BadRequestException('Unsupported runtime filter');
  return value;
}

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
    @Query('runtime') runtime: string = 'native',
    @Query('browse') browse = '',
    @Query('page') page = '0',
    @Query('sort') sort = 'name',
    @Query('category') category = 'all',
    @Res({ passthrough: true }) response: Response,
  ) {
    if (browse === '1') {
      if (
        !/^[0-9]{1,5}$/.test(page) ||
        !['name', 'name-desc'].includes(sort) ||
        !['all', 'containers', 'databases', 'web', 'system', 'storage', 'other'].includes(
          category,
        ) ||
        !['', 'all', 'linux', 'windows'].includes(platform)
      )
        throw new BadRequestException('Invalid catalog page');
      const order = sort === 'name-desc' ? 'DESC' : 'ASC';
      const result = await this.db.pool.query(
        `WITH latest AS (SELECT DISTINCT ON(lower(owner),module_id) * FROM revisions WHERE status='approved' AND COALESCE(manifest->>'kind','module')='module' AND ${compatibleRuntime.replace('$RUNTIME', '$1')} ORDER BY lower(owner),module_id,${releaseOrder},reviewed_at DESC,id DESC)
         SELECT r.*,p.size,repo.name AS repository_name,count(*) OVER() AS total FROM latest r JOIN packages p ON p.sha256=r.sha256 JOIN repositories repo ON repo.id=r.repository_id WHERE ($2='' OR r.manifest->>'name' ILIKE $3 OR r.manifest->>'description' ILIKE $3) AND ($4 IN ('','all') OR ($4='linux' AND r.platforms ?| ARRAY['linux-amd64','linux-arm64']) OR ($4='windows' AND r.platforms ? 'windows-amd64')) AND ($5='all' OR CASE lower(r.module_id) WHEN 'docker' THEN 'containers' WHEN 'postgresql' THEN 'databases' WHEN 'redis' THEN 'databases' WHEN 'nginx' THEN 'web' WHEN 'systemd' THEN 'system' WHEN 'backup' THEN 'storage' ELSE 'other' END=$5) ORDER BY lower(r.manifest->>'name') COLLATE "C" ${order},r.id LIMIT 31 OFFSET $6`,
        [
          catalogRuntime(runtime),
          String(query).trim().slice(0, 200),
          `%${String(query).trim().slice(0, 200)}%`,
          platform,
          category,
          Number(page) * 30,
        ],
      );
      response.setHeader('Cache-Control', 'no-cache');
      return {
        items: result.rows.slice(0, 30).map((row) => this.publicRow(row)),
        total: Number(result.rows[0]?.total ?? 0),
        nextPage: result.rows.length > 30 ? Number(page) + 1 : null,
      };
    }
    const result = await this.db.pool.query(
      `WITH latest AS (SELECT DISTINCT ON (lower(owner),module_id) * FROM revisions WHERE status='approved' AND COALESCE(manifest->>'kind','module')='module' AND ${compatibleRuntime.replace('$RUNTIME', '$5')} ORDER BY lower(owner),module_id,${releaseOrder},reviewed_at DESC,id DESC) SELECT r.*,p.size,repo.name AS repository_name FROM latest r JOIN packages p ON p.sha256=r.sha256 JOIN repositories repo ON repo.id=r.repository_id WHERE ($1='' OR r.manifest->>'name' ILIKE $2 OR r.manifest->>'description' ILIKE $2) AND ($3='' OR r.platforms ? $3) AND ($4='' OR r.id::text>$4) ORDER BY r.id LIMIT 31`,
      [
        String(query).slice(0, 128),
        `%${String(query).slice(0, 128)}%`,
        ['linux-amd64', 'linux-arm64', 'windows-amd64'].includes(platform) ? platform : '',
        /^[a-f0-9-]{36}$/i.test(cursor) ? cursor : '',
        catalogRuntime(runtime),
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
            executionRuntimes: [
              ...new Set(row.manifest.components.map((c: any) => c.runtime ?? 'native')),
            ] as Array<'native' | 'wasip1'>,
            runtimes: [...new Set(row.manifest.components.map((c: any) => c.location))] as Array<
              'agent' | 'monitor'
            >,
            capabilities: [
              ...new Set(
                row.manifest.components.flatMap((c: any) => [
                  ...(c.requires || []),
                  ...(c.optionalCapabilities || []),
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
  async module(
    @Param('owner') owner: string,
    @Param('id') id: string,
    @Query('runtime') runtime: string = 'native',
  ) {
    const result = await this.db.pool.query(
      `SELECT r.*,p.size,repo.name AS repository_name FROM revisions r JOIN packages p ON p.sha256=r.sha256 JOIN repositories repo ON repo.id=r.repository_id WHERE r.status='approved' AND COALESCE(r.manifest->>'kind','module')='module' AND lower(r.owner)=lower($1) AND r.module_id=$2 AND ${compatibleRuntime.replace('$RUNTIME', '$3')} ORDER BY ${releaseOrder},r.reviewed_at DESC LIMIT 100`,
      [owner, id, catalogRuntime(runtime)],
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
    @Query('runtime') runtime: string = 'native',
  ) {
    const result = await this.db.pool.query(
      `SELECT r.*,p.size,repo.name AS repository_name FROM revisions r JOIN packages p ON p.sha256=r.sha256 JOIN repositories repo ON repo.id=r.repository_id WHERE r.status='approved' AND COALESCE(r.manifest->>'kind','module')='module' AND lower(r.owner)=lower($1) AND r.module_id=$2 AND r.version=$3 AND ${compatibleRuntime.replace('$RUNTIME', '$4')} LIMIT 1`,
      [owner, id, version, catalogRuntime(runtime)],
    );
    if (!result.rowCount) throw new NotFoundException();
    return this.publicRow(result.rows[0]);
  }
  @Get('packages/:hash')
  async download(@Param('hash') hash: string, @Res() response: Response) {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new NotFoundException();
    const allowed = await this.db.pool.query(
      "SELECT 1 FROM revisions WHERE sha256=$1 AND status='approved' AND COALESCE(manifest->>'kind','module')='module' LIMIT 1",
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
