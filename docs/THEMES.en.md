# Pulse Marketplace themes

[Русский](THEMES.md)

Browse https://marketplace.hubba-cloud.ru/en/themes/ without signing in. Previews use illustrative telemetry and never connect to user servers. The built-in presets above the community catalog are existing Monitor examples, not community publications.

## Import

Open a theme, select a published version and download it. In Monitor choose Settings → Appearance → Import theme. The downloaded JSON is the existing schemaVersion1 ThemeDefinition; Agent changes are unnecessary. Import creates a local copy; later author releases are not applied automatically.

## Publish

1. Create a public GitHub repository with topic `pulse-theme`.
2. Copy the [discovery marker](../examples/theme/pulse-marketplace.json) to its root and use the [theme package](../examples/theme/theme.json) as a template. Set `kind:theme`; `moduleId` is the shared discovery field and contains the theme ID.
3. Export a theme from Monitor and place that object in the package `theme` field. Outer and nested IDs must match. Set your own name, description and version.
4. Tag the release, for example `v1.0.0`, matching `version`; attach `theme.json` as a GitHub Release asset. The marker must exist at the tagged commit. Preview releases also require review.
5. Discovery runs every30minutes subject to GitHub limits. Authors can request repository discovery from their workspace. Each validated revision waits for a separate human moderation decision. Pending themes cannot appear publicly or be downloaded.

Every new version or changed source artifact needs review. Published owner/ID/version hashes are immutable; release a new version instead of replacing bytes. Theme and module IDs share a publication namespace, so use a distinct theme ID. Removing a repository does not automatically delete retained published versions.

## Format and safety

Package fields: `schemaVersion`, `kind`, `id`, `name`, `version`, `description`, `theme`. The example is documentation, not an approved publication. Maximum size64KiB. A theme contains all12 Monitor palette values as `#RRGGBB`, `dark` or `light` mode, radius0–24, optional accent and bounded font settings with built-in font families. Unknown fields, duplicate JSON keys, CSS/HTML/JavaScript, binaries and remote asset URLs are rejected. Colors apply only inside the preview, not the Marketplace document.

The immutable source package has its own SHA-256. Downloads return the embedded ThemeDefinition with canonical key ordering, without the release wrapper. The download hash is separately exposed as `themeSha256` and `X-Content-SHA256`; source package hash remains available for provenance. Download verifies approval, stored snapshot integrity and format again. Withdrawal disables downloads.

## API

- `GET /api/v1/themes?query=&mode=dark|light&cursor=`: latest approved versions,30items and `nextCursor`; omitted mode includes both modes.
- `GET /api/v1/themes/:owner/:id`: theme metadata and up to100 published versions.
- `GET /api/v1/themes/:owner/:id/versions/:version/download`: Monitor-compatible JSON.

Existing `/catalog`, `/modules/...` and `/packages/:hash` remain module-only. Agents never download themes. Existing markers without `kind` remain modules. No additional services, environment variables or DB migration are required; validated revision manifests contain the type.
