# Backend configuration / Настройка бэкенда

## Configuration

The ignored root `.env` is loaded by API scripts. `scripts/setup-local-env.mjs` generates database and mail-token secrets once and preserves an existing file. The web process uses loopback port 3101 by default; for a different API address, set the server-only `API_ORIGIN` in the **web process environment**. Never expose these settings with `NEXT_PUBLIC_`.

| Setting                                    | Purpose                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`                             | PostgreSQL connection; runtime and migrations                                       |
| `PG_PASSWORD`, `PG_PORT`                   | Local Compose credentials and loopback port                                         |
| `API_PORT`                                 | Nest loopback port; default 3101                                                    |
| `PUBLIC_ORIGIN`                            | Exact browser origin, without path; production requires HTTPS                       |
| `PACKAGE_DIRECTORY`                        | Private snapshot directory, resolved from `apps/api`; default `../../data/packages` |
| `MAIL_TOKEN_KEY`                           | Stable 32-byte key as 64 lowercase hex characters; generated locally                |
| `GITHUB_READ_TOKEN`                        | Optional server-side GitHub API token for public discovery; no write access needed  |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth application                                                            |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OIDC application                                                             |
| `SMTP_URL`, `MAIL_FROM`                    | SMTP delivery; both required; production requires STARTTLS or SMTPS                 |
| `DISCOVERY_ENABLED`                        | Set `false` to disable automatic discovery                                          |

Register these exact OAuth callbacks, including the trailing slash:

```text
PUBLIC_ORIGIN/api/v1/auth/github/callback/
PUBLIC_ORIGIN/api/v1/auth/google/callback/
```

For example: `http://127.0.0.1:3100/api/v1/auth/github/callback/`. GitHub uses only `read:user`, Google uses `openid profile`. No provider access/refresh token is retained. An email/password account can explicitly link GitHub from its author dashboard; matching provider email never links accounts automatically. Organization publishing is held back until organizational authorship can be verified.

SMTP examples: `smtps://user:URL_ENCODED_PASSWORD@mail.example.com:465` or `smtp://user:URL_ENCODED_PASSWORD@mail.example.com:587`. Email registration/recovery require SMTP, sender and `MAIL_TOKEN_KEY`. Links expire after 24 hours for confirmation or 15 minutes for reset. Outbox retries up to five attempts, five minutes apart. SMTP acceptance is not proof of inbox delivery. Rotating the key invalidates pending links; back it up securely.

For the project's VK WorkSpace sender, create `noreply@hubba-cloud.ru` and a dedicated mail-client app password. Save only that password to ignored `artifacts/vk-smtp-password.txt`, then run `node scripts/configure-vk-smtp.mjs`. The helper authenticates to `smtp.mail.ru:465` with TLS and updates the existing `SMTP_URL`/`MAIL_FROM` only after verification. It never prints the credential or sends a test message. Restart the API afterwards. The ordinary mailbox password is not used. Account messages follow the language selected in the registration/reset request.

## Trust and storage

The discovery job starts shortly after API startup, then every 30 minutes. It searches public, non-archived repositories tagged `pulse-module`, partitions GitHub search by creation date, and checks up to 100 due repositories per cycle. Due jobs remain in PostgreSQL after restart. GitHub rate-limit backoff is persisted. Known repositories are reloaded by numeric ID before scanning, even if their topic disappears.

Authors place `pulse-marketplace.json` in the root of the default branch and release commit:

```json
{ "schemaVersion": 1, "moduleId": "docker", "packageAsset": "docker-module.json" }
```

The release asset is a **Pulse schema-1 install JSON with embedded native binaries**, not the small discovery marker. Marker ID, tag version, package ID and binary platform/digest must agree. Native binaries are never executed by this service. Limits: 68 MiB JSON, 16 MiB per binary, 48 MiB decoded total, up to three supported targets (`linux-amd64`, `linux-arm64`, `windows-amd64`). Header validation is not malware analysis or a proof that a binary runs correctly.

Snapshots are published atomically to a private directory under their complete JSON SHA-256. Release ID, asset ID, tag, commit, source owner and bytes identify a revision. Changing any of them requires a new decision. Approval binds an immutable owner/module/version to one revision; replacing the same version is rejected, including after withdrawal. Release a new version instead. The catalog card shows the most recently approved remaining version; its detail page lists approved versions.

Moderators need a linked GitHub identity different from the repository owner. Administrators may approve using password or provider sign-in, including their own modules; they remain subject to digest, automatic-validation, snapshot and revision-state checks. Review comments are required. Role and revision state are checked inside the decision transaction; audit is committed with the decision. Pending/rejected/withdrawn snapshots cannot be downloaded through the public endpoint. If another approved revision has identical bytes, that shared digest remains downloadable.

Opaque browser sessions expire after seven days and survive API restarts. Unsafe authenticated requests require an exact Origin, JSON content type and session CSRF token. Passwords use salted, bounded-concurrency scrypt. Authentication/email actions use per-account or per-token limits plus a shared capacity guard. The Next proxy does not supply a trustworthy client IP; untrusted X-Forwarded-For is ignored. **Before public exposure, configure request/concurrency limits at the trusted ingress proxy** as well. Expired authentication records are removed in bounded batches; audit/publication history is retained.

## API overview

All paths start with `/api/v1`.

| Method/path                                         | Access                                                 |
| --------------------------------------------------- | ------------------------------------------------------ |
| `GET /health`                                       | Database/migration readiness                           |
| `GET /catalog?query=&platform=&cursor=`             | Approved catalog; 30 items/page; ETag                  |
| `GET /modules/:owner/:id`                           | Approved versions                                      |
| `GET /modules/:owner/:id/versions/:version`         | Approved version                                       |
| `GET /packages/:sha256`                             | Exact approved JSON snapshot                           |
| `GET /auth/capabilities`                            | Configured sign-in/email capabilities                  |
| `GET /auth/session`                                 | Current actor and CSRF token, or null                  |
| `POST /auth/login`, `/auth/logout`                  | Password sign-in / authenticated logout                |
| `POST /auth/register`, `/auth/request-reset`        | Generic email responses; SMTP required                 |
| `POST /auth/verify-email`, `/auth/reset-password`   | One-use token plus chosen password                     |
| `GET /auth/:provider/start`, `/:provider/callback/` | Provider sign-in                                       |
| `POST /auth/link/:provider`                         | Authenticated explicit identity link                   |
| `GET /author/repositories`, `/author/revisions`     | Linked GitHub owner's records; up to 100               |
| `POST /author/repositories`                         | Queue own personal public repository with valid marker |
| `GET /moderation/revisions?status=&cursor=`         | Moderator/admin; 100 per page, defaults pending        |
| `GET /moderation/revisions/:id`                     | Revision and audit history                             |
| `POST /moderation/revisions/:id/decision`           | Moderator/admin; expectedSha256, action, comment       |

Private responses use `Cache-Control: no-store`. Catalog responses exclude embedded binaries, credentials and private audit data. Download failures do not silently fetch replacement bytes from GitHub.

## Operations

Back up **both** PostgreSQL and `data/packages/`, along with protected environment secrets. Take a consistent pair while discovery/moderation writes are stopped. `docker compose stop` preserves the volume; `docker compose down -v` destroys it. Migration files are checksummed and transactional; never edit an already applied migration.

Current local deployment is for development. Production needs a domain, HTTPS ingress, a supervised API/web process, stable package storage, database backups and trusted ingress request limits. API binds loopback; a remote database needs its own TLS/network policy. No production deployment or Monitor integration is implied by this bootstrap.

The initial operator command refuses an existing email or credential file. To change a role, an operator can use a controlled SQL change to `users.role` (`author`, `moderator`, `administrator`); the next request observes it. No browser endpoint grants administrator rights. There is no account-deletion or administrative password-reset UI in this milestone.

## Verification limits

Integration tests use real PostgreSQL with isolated temporary schemas and fake provider/GitHub/mail transports. They cover session revocation, role/ownership checks, CSRF, OAuth state binding/expiry/replay, email token replay/reset, snapshot integrity, concurrent moderation, pagination and changed source ownership. Real provider consent, inbox delivery, real organizational authorship and cross-language Go installer fixture execution remain unverified. Tests do not run uploaded native modules.

The current lockfile audit reports five high findings in the **development ESLint/fast-glob/micromatch/braces chain**. The suggested automatic fix downgrades Next ESLint configuration incompatibly; it has not been applied. This is not a clean-audit claim.

Browser automation was blocked by the browser tool URL policy during this task. HTTP/SSR checks and isolated API integration tests are separate evidence; they do not establish a completed visual/browser QA pass for the connected workspaces.
