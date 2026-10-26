# Theme catalog

## Scope

Fix landing catalog links; add RU/EN theme catalog with monitor-shaped previews, search, dark/light filtering and downloadable Monitor-compatible JSON. Preserve existing module catalog and installation behavior.

## Contract addition (approved by the owner on 2026-10-26)

A GitHub repository uses topic `pulse-theme` and `pulse-marketplace.json` with `schemaVersion:1`, `kind:"theme"`, `moduleId:"theme-id"`, `packageAsset:"theme.json"`. Existing markers without kind remain modules. Theme release package: `{schemaVersion:1,kind:"theme",id,name,version,description,theme:<existing Monitor ThemeDefinition>}`. Theme ID must match the marker; tag must match version. Strict size limit64KiB, exact allowlists, colors #RRGGBB, bounded font/radius/options; no CSS/HTML/JS, binaries, URLs or remote assets. Download returns the embedded ThemeDefinition accepted by Monitor import; source package hash remains visible for provenance.

Reuse discovery, immutable snapshot storage, revisions and per-version human moderation. Store kind in validated manifest, exclude themes from every existing module route. Add separate `/api/v1/themes`, `/api/v1/themes/:owner/:id`, and `/api/v1/themes/:owner/:id/versions/:version/download` routes. Keep legacy module catalog/API native compatibility intact. No new dependencies, environment variables, services or automatic Monitor connections.

## UI

Keep current Geist/Geist Mono and monochrome shell. Add Modules/Themes navigation with dedicated localized theme URL. Cards show a mini Monitor using validated palette tokens, theme name, author, mode, version and source. A detail preview shows overview/process/log layout, palette, download and import instructions. Previews are scoped to their card; never replace marketplace global styles. Server-render catalog metadata for SEO. Unapproved packages never appear publicly; no invented authors, approvals or download counts. Initially empty until real themes are published and approved. Existing built-in Monitor presets are not community publications.

## Checks and rollout

Fail-first contract/validation/isolation tests; discovery and catalog tests with real PostgreSQL; UI helper/render tests; lint/types/format/build. Verify existing module paths, safe preview rendering, download->Monitor validator compatibility, keyboard/mobile/both themes. Deploy Marketplace with DB/config backup; landing via existing Pages workflow. New theme approvals remain separate human decisions.
