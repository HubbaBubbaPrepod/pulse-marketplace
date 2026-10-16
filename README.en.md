# Pulse Marketplace

[![CI](https://github.com/HubbaBubbaPrepod/pulse-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/HubbaBubbaPrepod/pulse-marketplace/actions/workflows/ci.yml)

[Русский](README.md) · MIT

An extension catalog for self-hosted Pulse: GitHub → release discovery → exact package validation → moderator decision → JSON download. Modules run in the user's agent; the marketplace never executes them.

Next.js 16.4 / React 19.3 + Nest.js 12 + PostgreSQL 18 in a Turborepo. Russian/English interface, light/dark themes, GSAP motion and reduced-motion support.

## Implemented

- Email/password sign-in, PostgreSQL sessions, logout, author/moderator/administrator roles, protected APIs and CSRF checks.
- GitHub OAuth with PKCE and Google OIDC. Linking GitHub to an existing account is an explicit authenticated action. Matching email addresses never merge identities.
- Email confirmation and password reset with one-use links, a durable email queue and revocation of previous sessions. Provider buttons and email delivery remain unavailable until configured.
- Public GitHub discovery using the `pulse-module` topic, a durable job queue, GitHub backoff and current owner verification by immutable numeric repository ID.
- Marker/package validation, size limits, platform checks, SHA-256 and ELF/PE header checks. Packages are snapshotted before moderation; downloads return those exact saved bytes.
- Only approved revisions appear publicly. Decisions and audit entries commit together. Moderators cannot approve their own modules; administrators may approve using ordinary sign-in, including their own modules, with mandatory validation and audit; changed sources create new pending revisions. Withdrawn bytes cannot be downloaded unless another approved revision publishes the same bytes.
- API-backed workspaces, moderation status filters and pagination. Development examples never become publications or substitute for unavailable API data.

## Local development

Requires Node.js 24 LTS, npm and a running Docker engine.

```sh
npm ci
node scripts/setup-local-env.mjs
docker compose --env-file .env -f deployment/compose.yml up -d --wait
npm run migrate --workspace @pulse-marketplace/api
node --env-file=.env scripts/bootstrap-admin.mjs admin@example.com
npm run dev
```

Open [http://127.0.0.1:3100/en/](http://127.0.0.1:3100/en/) or `/ru/`. Development redirects `localhost` to `127.0.0.1` so origins and cookies agree. Nest binds only to `127.0.0.1:3101`; Next proxies `/api/v1/`. PostgreSQL binds only to `127.0.0.1:54329`.

Bootstrap creates a **new** administrator and writes its generated password to ignored `artifacts/admin-access.txt`. Existing accounts/files are never overwritten. Credentials are not printed. Keep this file and `.env` out of Git.

Accounts, sessions, audit and discovery jobs persist in Docker volume `pulse-marketplace_marketplace_database`. Restarting processes/containers preserves them. Package snapshots live separately in `data/packages/` and must also be backed up. Removing the volume (`down -v`) destroys the database.

Configuration and boundaries: [docs/backend.md](docs/backend.md). Secret-free template: [.env.example](.env.example).

## Verification

```sh
npm test
npm run lint
npm run format:check
npm run build
npm run verify:production
```

API tests require PostgreSQL and `.env`. They create and remove isolated temporary schemas without clearing the main database. Database tests bypass Turbo caching. Lint runs ESLint for web and TypeScript for API/contracts. Production verification starts its own temporary Next process on a free loopback port, checks public routes and private workspace redirects, then stops only that process. Start the API separately first.

## Current boundaries

GitHub OAuth has been verified locally; configure your own provider application for your installation. Google OAuth and SMTP require separate credentials and their live flows remain unverified. Email may remain disabled. Publication currently supports personal GitHub repositories. Organization-owned revisions fail validation until organizational authorship/self-review checks are implemented. Approval does not guarantee native code safety.

Pulse Monitor includes an opt-in catalog with search, published version selection and verified JSON installation. Manual import remains available. Docker v1.0.3 installation was verified against the local marketplace; existing module IDs require manual updates.

The public installation uses Nginx and HTTPS, systemd services, request limits and daily backups. See [production operations and recovery](docs/production.md). Monitor, agent, Docker module and landing page remain separate repositories. Agents never contact the marketplace; no server metrics or logs are uploaded here.

## Repository layout

- `apps/web/` — Next.js, RU/EN, catalog and protected workspaces.
- `apps/api/` — Nest.js, SQL migrations and integration tests.
- `packages/contracts/` — shared API types.
- `deployment/compose.yml` — persistent local PostgreSQL.
- `docs/marketplace-design.md` — approved trust architecture.
- `docs/backend-bootstrap.md` — implementation ledger and verification limits.
- `docs/frontend-requirements.md` — interface and motion requirements.

Module artwork illustrates the interface; it is not an official logo or an endorsement by the depicted projects.

## Search indexing

The public catalog, published modules, developer documentation and legal pages provide RU/EN canonicals, hreflang, Open Graph and server-rendered JSON-LD. Authentication, recovery, author workspaces and moderation retain `noindex`. Search/filter variants do not create independently indexable catalog copies.

Sitemap: <https://marketplace.hubba-cloud.ru/sitemap.xml>. It uses the current published catalog, excluding pending and withdrawn versions. `lastmod` reflects the version review date or legal revision date, never the time of each request. An unavailable API does not become a successful empty sitemap.

After deployment, submit the sitemap in Search Console and Yandex Webmaster for this domain. Markup guarantees neither rich results nor rankings; ratings and reviews are never invented. Field Core Web Vitals require separate measurement once visitor data is available.
