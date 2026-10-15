# Backend implementation ledger

## Approved scope

Implement the approved Nest.js API and connect the existing Next.js frontend in this separate Turborepo. The user approved Nest/pg/openid-client/nodemailer/TypeScript/testing dependencies, the local PostgreSQL Docker service, and initial administrator email `admin@hubba-cloud.ru`. The password is generated into ignored `artifacts/admin-access.txt`; it is never included in logs or Git.

## Implemented

1. Shared contract workspace; bounded schema-1 marker/package validation against inspected Go protocol constraints; native packages are never executed.
2. Nest.js workspace, checksummed SQL migrations, persistent PostgreSQL 18 volume, loopback binding and readiness API.
3. Atomic content-addressed package snapshots; constrained GitHub HTTPS/DNS transport; durable discovery jobs and rate-limit backoff; immutable release/commit/digest revision identity.
4. PostgreSQL sessions, scrypt passwords, role/ownership/Origin/CSRF checks, OAuth PKCE/OIDC, explicit identity linking, durable email links/outbox, transactional moderation and audit.
5. API-backed public catalog/details/downloads and protected author/moderation workspaces. Missing backend data is not replaced with examples. GitHub/Google/SMTP remain explicitly unavailable until configured.
6. RU/EN README, configuration/API/operations documentation, secret-free environment template, local admin bootstrap and tests.

## Rulings

- Opaque PostgreSQL sessions take precedence over the generic Nest skill JWT example: logout and role changes must take effect without waiting for token expiry.
- Use approved `pg` with versioned SQL, not an ORM/Redis/extra queue service.
- Marketplace is outside the codebase-memory graph; direct source inspection was used. Go protocol files in the Monitor graph required source fallback where coverage reported changed metadata.
- Initial organization-owned publications are blocked because comparing a moderator user ID with an organization ID cannot establish independent authorship. Personal repositories remain supported.
- Discovery refreshes persisted jobs by immutable numeric repository ID before reading source, and checks identity again before staging. Old namespace redirects are not accepted as ownership evidence.
- Authentication limits distinguish accounts/tokens behind the loopback Next proxy. Untrusted forwarded IP headers are not trusted. Production ingress limits remain required.
- Canonical local origin is 127.0.0.1:3100; development localhost requests redirect there. The user-reported sign-in error came from the localhost/127.0.0.1 Origin mismatch. An active administrator session was subsequently observed in PostgreSQL; this is not visual UI verification.
- OAuth callback URLs include a canonical trailing slash; the backend normalizes callback paths before provider exchange so proxy path normalization cannot change redirect_uri.

## Independent review

The executing-plans skill required one fresh read-only reviewer. Four findings were returned: large-binary regex stack overflow, shared login limiter, stale repository owner attribution, and moderation's fixed oldest-100 queue. All were addressed with tests for the 16 MiB limit, account-isolated limiter, unlisted transferred repository, and 101-revision queue pagination/status filtering. Concurrent approval is also tested: exactly one decision succeeds.

## Verification and boundaries

See `docs/backend.md` for exact operations and limits. API and frontend test commands, lint/typecheck, production build and HTTP verification are rerun after the final changes. The connected workspace visual pass could not run because the browser tool rejected the local URL; user login is being checked manually. Real provider apps/SMTP, organization support, public hosting, Monitor catalog integration, operational backups and perimeter limits are subsequent acceptance tasks, not claimed complete.

No public repositories/releases or production services were changed. The existing web preview remains on 3100; the local API is on 3101; PostgreSQL is on loopback 54329 with its own persistent volume. Development audit findings are documented instead of applying an incompatible forced dependency downgrade.

## Final verification — 2026-10-15

- `npm test`: 27 frontend/unit tests and 18 API/package/integration tests passed (45 total).
- `npm run lint`: web ESLint and API/contracts TypeScript passed.
- `npm run format:check`: passed; final CSS-only adjustment was formatted separately.
- `npm run build`: all three workspaces passed; web was rebuilt after the final CSS adjustment.
- `npm run verify:production`: RU/EN catalog and login forms, anonymous workspace redirects, same-origin API proxy, unpublished-module denial and unsupported locale passed.
- Local service check: PostgreSQL healthy, five migrations applied, API readiness HTTP 200. One active administrator session persisted across the API process replacement; zero approved revisions.
- Browser tool blocked URL access. No connected-workspace visual/browser pass is claimed.

## Scope update — SMTP deferred

The user explicitly deferred paid mail infrastructure. No SMTP connection was configured, no subscription purchased and no test message sent. Existing email/password sign-in and anonymous public catalog access remain available; email registration and password recovery stay disabled. The optional Nodemailer integration/configuration helper is prepared for later use; app-password collection is no longer a pending task.

Sign-in now uses a fresh document replacement after success, and the server redirects authenticated login-page visits to a validated local destination. Authenticated redirect, allowed next path, rejection of external next URLs and anonymous form availability passed the production HTTP regression. Localized placeholders were added. The suite passed 27 frontend tests and 20 API tests (47 total); lint, formatting and both builds passed. The five active Pulse repositories are indexed; graph identifiers and parse limitations are recorded in docs/codebase-indexes.md.
