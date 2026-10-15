import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Database } from '../database/database.service.js';
import { CONFIG, type Config } from '../config.js';
import { validateMarker, validatePackage } from '../packages/validate-package.mjs';
import { SnapshotStore } from '../packages/snapshot-store.mjs';
import { GitHubRateLimit } from './transport.mjs';
export const GITHUB_CLIENT = Symbol('GITHUB_CLIENT');
@Injectable()
export class Discovery implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private initial?: ReturnType<typeof setTimeout>;
  constructor(
    private readonly db: Database,
    @Inject(CONFIG) private readonly config: Config,
    @Inject(GITHUB_CLIENT) private readonly github: any,
  ) {}
  onModuleInit() {
    if (!this.config.discoveryEnabled) return;
    const run = () => {
      void this.runOnce().catch(() =>
        console.error('Discovery cycle failed; retained previous catalog'),
      );
    };
    this.initial = setTimeout(run, 1000);
    this.initial.unref();
    this.timer = setInterval(run, 30 * 60 * 1000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.initial) clearTimeout(this.initial);
    this.github.close?.();
  }
  async runOnce() {
    const lock = await this.db.pool.connect();
    const summary = { skipped: false, staged: 0, failed: 0, checked: 0, retryAt: 0 };
    let acquired = false,
      runId: string | undefined;
    try {
      acquired = (await lock.query('SELECT pg_try_advisory_lock(831974002) AS acquired')).rows[0]
        .acquired;
      if (!acquired) return { ...summary, skipped: true };
      const previous = (
        await lock.query('SELECT summary FROM discovery_runs ORDER BY id DESC LIMIT 1')
      ).rows[0];
      if (Number(previous?.summary?.retryAt) > Date.now())
        return { ...summary, skipped: true, retryAt: Number(previous.summary.retryAt) };
      await lock.query(
        "UPDATE discovery_runs SET status='interrupted',finished_at=now() WHERE status='running'",
      );
      runId = (await lock.query('INSERT INTO discovery_runs DEFAULT VALUES RETURNING id')).rows[0]
        .id;
      for await (const repository of this.github.repositories()) {
        await lock.query(
          'INSERT INTO discovery_jobs(repository_id,payload) VALUES ($1,$2) ON CONFLICT(repository_id) DO UPDATE SET payload=EXCLUDED.payload',
          [repository.id, JSON.stringify(repository)],
        );
      }
      const jobs = await lock.query(
        'SELECT repository_id,payload FROM discovery_jobs WHERE next_check_at<=now() ORDER BY next_check_at,repository_id LIMIT 100',
      );
      for (const job of jobs.rows) {
        try {
          const current = await this.github.repository(job.repository_id);
          await lock.query('UPDATE discovery_jobs SET payload=$2 WHERE repository_id=$1', [
            job.repository_id,
            JSON.stringify(current),
          ]);
          summary.staged += await this.repository(current);
          summary.checked++;
          await lock.query(
            "UPDATE discovery_jobs SET next_check_at=now()+interval '30 minutes',last_error=NULL WHERE repository_id=$1",
            [job.repository_id],
          );
        } catch (error) {
          if (error instanceof GitHubRateLimit) throw error;
          summary.failed++;
          await lock.query(
            "UPDATE discovery_jobs SET next_check_at=now()+interval '30 minutes',last_error='Repository check failed' WHERE repository_id=$1",
            [job.repository_id],
          );
        }
      }
      return summary;
    } catch (error) {
      if (error instanceof GitHubRateLimit) summary.retryAt = error.retryAt;
      else summary.failed++;
      return summary;
    } finally {
      try {
        if (runId)
          await lock.query(
            'UPDATE discovery_runs SET finished_at=now(),status=$2,summary=$3 WHERE id=$1',
            [
              runId,
              summary.retryAt ? 'rate_limited' : summary.failed ? 'partial' : 'complete',
              JSON.stringify(summary),
            ],
          );
      } finally {
        try {
          if (acquired) await lock.query('SELECT pg_advisory_unlock(831974002)');
        } finally {
          lock.release();
        }
      }
    }
  }
  private async repository(repository: any) {
    const branch = validateMarker(await this.github.marker(repository, repository.defaultBranch));
    if (!branch.ok) throw new Error('Invalid discovery marker');
    let staged = 0;
    for await (const release of this.github.releases(repository)) {
      if (
        release.draft ||
        release.prerelease ||
        !/^v?[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9-]+)?$/.test(release.tag_name) ||
        !Array.isArray(release.assets)
      )
        continue;
      const commit = await this.github.commit(repository, release.tag_name);
      let marker;
      try {
        marker = validateMarker(await this.github.marker(repository, commit));
      } catch (error) {
        if (error && typeof error === 'object' && 'status' in error && error.status === 404)
          continue;
        throw error;
      }
      if (!marker.ok || !('marker' in marker)) continue;
      const markerData = marker.marker;
      const asset = release.assets.find((item: any) => item.name === markerData.packageAsset);
      if (!asset) continue;
      const bytes: Buffer = await this.github.asset(repository, asset);
      const latest = await this.github.repository(repository.id);
      if (latest.ownerId !== repository.ownerId || latest.fullName !== repository.fullName)
        throw new Error('Repository identity changed during discovery');
      const result = validatePackage(bytes, {
        moduleId: markerData.moduleId,
        tag: release.tag_name,
      });
      const hash = createHash('sha256').update(bytes).digest('hex');
      const declaredDigestMatches = !asset.digest || asset.digest === `sha256:${hash}`;
      const individualOwner = repository.ownerType === 'User';
      await new SnapshotStore(this.config.packageDirectory).put(bytes, hash);
      const [owner, name] = String(repository.fullName).split('/');
      const manifest =
        'manifest' in result
          ? result.manifest
          : { name: markerData.moduleId, description: '', permissions: [] };
      const sourceUrl = `https://github.com/${encodeURIComponent(owner!)}/${encodeURIComponent(name!)}/tree/${commit}`;
      staged += await this.db.transaction(async (client) => {
        await client.query(
          'INSERT INTO repositories(id,owner_id,owner,name,module_id,asset_name) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET owner_id=EXCLUDED.owner_id,owner=EXCLUDED.owner,name=EXCLUDED.name,module_id=EXCLUDED.module_id,asset_name=EXCLUDED.asset_name,updated_at=now()',
          [
            repository.id,
            repository.ownerId,
            owner,
            name,
            markerData.moduleId,
            markerData.packageAsset,
          ],
        );
        await client.query(
          'INSERT INTO packages(sha256,size) VALUES ($1,$2) ON CONFLICT(sha256) DO NOTHING',
          [hash, bytes.length],
        );
        const inserted = await client.query(
          'INSERT INTO revisions(repository_id,source_owner_id,owner,module_id,version,release_id,asset_id,tag,commit_sha,sha256,manifest,platforms,validation_passed,validation_issues,source_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT(repository_id,source_owner_id,release_id,asset_id,tag,commit_sha,sha256) DO NOTHING RETURNING id',
          [
            repository.id,
            repository.ownerId,
            owner,
            markerData.moduleId,
            release.tag_name.replace(/^v/, ''),
            String(release.id),
            String(asset.id),
            release.tag_name,
            commit,
            hash,
            JSON.stringify(manifest),
            JSON.stringify('platforms' in result ? result.platforms : []),
            result.ok && declaredDigestMatches && individualOwner,
            JSON.stringify([
              ...result.issues,
              ...(declaredDigestMatches ? [] : [{ path: 'asset.digest', code: 'digest_mismatch' }]),
              ...(individualOwner
                ? []
                : [{ path: 'repository.owner', code: 'organization_review_not_supported' }]),
            ]),
            sourceUrl,
          ],
        );
        return inserted.rowCount || 0;
      });
    }
    return staged;
  }
}
