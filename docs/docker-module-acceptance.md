# Docker module acceptance — 2026-10-15

## Real GitHub source and discovery

- Repository: [HubbaBubbaPrepod/pulse-module-docker](https://github.com/HubbaBubbaPrepod/pulse-module-docker).
- Release: [v1.0.3](https://github.com/HubbaBubbaPrepod/pulse-module-docker/releases/tag/v1.0.3).
- Added `pulse-module` while preserving existing topics.
- Added schema-1 `pulse-marketplace.json` at the release commit and verified its inclusion in the published source archive.
- Installer asset: `docker-module.json`, **26,319,021 bytes**.
- Complete package SHA-256: `5da6254765a62801bf2fc51ed34499e564b5608222bd17f16b740e1bed070cfc`.
- A real discovery pass found one repository, staged one revision, and reported zero failures. The stored digest matched GitHub's asset digest. The published v1.0.1/v1.0.2 releases were not modified.

## Working marketplace state

The real revision passed automatic validation and is **approved** in the local working marketplace. Ordinary moderators cannot approve their own modules. Administrators, including the original password-only administrator, may approve after reviewing the exact snapshot. The existing admin@hubba-cloud.ru administrator approved the exact snapshot at the project owner's request through ReviewService. The audit comment explicitly records an administrator decision, not independent review. No synthetic moderator or direct publication-table write was used.

The public catalog and download were verified through the Next.js proxy: Docker v1.0.3 is listed, HTTP 200 returns 26,319,021 bytes, and SHA-256 matches the release snapshot. A second human moderator is not required for administrator decisions. Future pending revisions remain private until a new approval.

## Isolated end-to-end acceptance

The real downloaded release bytes were used in a temporary PostgreSQL schema and package directory. Synthetic test actors existed only in that schema. The check verified:

1. Pending downloads return 404; owner approval is rejected.
2. An independent test actor can approve the immutable revision; the catalog contains its expected SHA-256.
3. Downloaded bytes exactly match the GitHub snapshot.
4. The actual Go Monitor HTTP installer accepts the JSON, writes all three native platform files with matching digests, omits binary content from the response, and rejects reinstalling the same version.
5. Withdrawing the isolated revision makes its public download unavailable again.

The temporary schema and package directory were removed. A download copy remains under ignored `artifacts/module-acceptance/` for reproduction. No collector executable was run; this is installation acceptance, not verification against production Docker daemons.

Run from Marketplace root after building the API:

```sh
node --env-file=.env scripts/verify-release-package.mjs data/packages/5da6254765a62801bf2fc51ed34499e564b5608222bd17f16b740e1bed070cfc.json 5da6254765a62801bf2fc51ed34499e564b5608222bd17f16b740e1bed070cfc 1.0.3 ../Monitor/backend
```

This requires the sibling Monitor checkout with `backend/modules_integration_test.go`, the existing Go toolchain and local PostgreSQL. It neither approves the working revision nor modifies a running Monitor.

## Discovery correction

Historical releases may predate the marker. A 404 for the marker at a release commit is now skipped rather than aborting newer valid releases. Other failures, including rate limits, still propagate. The regression test failed before the correction and passed afterwards.

For a manual operator scan, preserving advisory locks and backoff:

```sh
npm run scan --workspace @pulse-marketplace/api
```

Do not confuse a GitHub release, successful automatic validation or this isolated acceptance with independent moderation of the real publication.
