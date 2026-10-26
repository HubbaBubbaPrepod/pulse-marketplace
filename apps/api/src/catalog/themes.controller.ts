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
import { validatePackage } from '../packages/validate-package.mjs';
const order = `split_part(version,'.',1)::numeric DESC,split_part(version,'.',2)::numeric DESC,split_part(split_part(version,'.',3),'-',1)::numeric DESC,(position('-' in version)=0) DESC,split_part(version,'-',2) COLLATE "C" DESC`;
const canonical = (value: any): any =>
  value && typeof value === 'object'
    ? Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((k) => [k, canonical(value[k])]),
      )
    : value;
const approved = "status='approved' AND manifest->>'kind'='theme'";
@Controller('themes')
export class ThemesController {
  private readonly snapshots: SnapshotStore;
  constructor(
    private readonly db: Database,
    @Inject(CONFIG) config: Config,
  ) {
    this.snapshots = new SnapshotStore(config.packageDirectory);
  }
  private publicRow(row: Record<string, any>) {
    const theme = row.manifest.theme;
    return {
      kind: 'theme',
      owner: row.owner,
      id: row.module_id,
      name: row.manifest.name,
      description: row.manifest.description,
      version: row.version,
      mode: theme.mode,
      theme,
      sha256: row.sha256,
      themeSha256: createHash('sha256')
        .update(JSON.stringify(canonical(theme)))
        .digest('hex'),
      size: Number(row.size),
      sourceUrl: row.source_url,
      reviewedAt: row.reviewed_at,
      downloadUrl: `/api/v1/themes/${encodeURIComponent(row.owner)}/${encodeURIComponent(row.module_id)}/versions/${encodeURIComponent(row.version)}/download`,
    };
  }
  @Get()
  async list(
    @Query('query') query = '',
    @Query('mode') mode = '',
    @Query('cursor') cursor = '',
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!['', 'dark', 'light'].includes(mode)) throw new BadRequestException('Invalid theme mode');
    const result = await this.db.pool.query(
      `WITH latest AS (SELECT DISTINCT ON(lower(owner),module_id) * FROM revisions WHERE ${approved} ORDER BY lower(owner),module_id,${order},reviewed_at DESC,id DESC) SELECT r.*,p.size FROM latest r JOIN packages p ON p.sha256=r.sha256 WHERE ($1='' OR r.manifest->>'name' ILIKE $2 OR r.manifest->>'description' ILIKE $2) AND ($3='' OR r.manifest->'theme'->>'mode'=$3) AND ($4='' OR r.id::text>$4) ORDER BY r.id LIMIT 31`,
      [
        String(query).slice(0, 128),
        `%${String(query).slice(0, 128)}%`,
        mode,
        /^[a-f0-9-]{36}$/i.test(cursor) ? cursor : '',
      ],
    );
    const rows = result.rows.slice(0, 30),
      revision = createHash('sha256')
        .update(JSON.stringify(rows.map((r) => [r.id, r.sha256, r.reviewed_at])))
        .digest('hex');
    response.setHeader('ETag', `"${revision}"`);
    response.setHeader('Cache-Control', 'no-cache');
    return {
      items: rows.map((r) => this.publicRow(r)),
      nextCursor: result.rows.length > 30 ? rows.at(-1)!.id : null,
      revision,
    };
  }
  @Get(':owner/:id')
  async theme(@Param('owner') owner: string, @Param('id') id: string) {
    const rows = await this.db.pool.query(
      `SELECT r.*,p.size FROM revisions r JOIN packages p ON p.sha256=r.sha256 WHERE r.${approved} AND lower(owner)=lower($1) AND module_id=$2 ORDER BY ${order},reviewed_at DESC LIMIT 100`,
      [owner, id],
    );
    if (!rows.rowCount) throw new NotFoundException();
    return {
      theme: this.publicRow(rows.rows[0]),
      versions: rows.rows.map((r) => this.publicRow(r)),
    };
  }
  @Get(':owner/:id/versions/:version/download')
  async download(
    @Param('owner') owner: string,
    @Param('id') id: string,
    @Param('version') version: string,
    @Res() response: Response,
  ) {
    const rows = await this.db.pool.query(
      `SELECT * FROM revisions WHERE ${approved} AND lower(owner)=lower($1) AND module_id=$2 AND version=$3 LIMIT 1`,
      [owner, id, version],
    );
    if (!rows.rowCount) throw new NotFoundException();
    const row = rows.rows[0];
    let theme;
    try {
      const raw = await this.snapshots.verify(row.sha256);
      const checked = validatePackage(raw, { kind: 'theme', moduleId: id, tag: version });
      if (!checked.ok || !('manifest' in checked)) throw Error('Invalid theme snapshot');
      theme = checked.manifest.theme;
    } catch {
      throw new ServiceUnavailableException('Theme snapshot unavailable');
    }
    const body = JSON.stringify(canonical(theme)),
      hash = createHash('sha256').update(body).digest('hex');
    response.setHeader('Content-Type', 'application/json');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="pulse-theme-${hash.slice(0, 16)}.json"`,
    );
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-SHA256', hash);
    response.end(body);
  }
}
@Module({ controllers: [ThemesController] })
export class ThemesModule {}
