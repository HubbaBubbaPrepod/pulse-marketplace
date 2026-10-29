## 2026-10-29 — OAuth linking feedback / Результат привязки OAuth

- Return linking conflicts and failures to the author dashboard with visible RU/EN feedback; keep existing identities and sessions unchanged on conflict. / Конфликты и ошибки привязки показаны в кабинете на RU/EN; существующие привязки и сессия при конфликте сохраняются.
- Preserve OAuth errors across the signed-in login redirect; show pending and successful linking states. / Ошибка OAuth сохраняется при возврате в кабинет; показаны ожидание и успешная привязка.

## 2026-10-26 — Theme catalog / Каталог тем

- Add separately moderated GitHub theme releases, safe palette previews and Monitor-compatible JSON downloads. / Добавлены отдельные публикации тем, безопасный предпросмотр и скачивание JSON для Monitor.
- Preserve module-only legacy API routes; no additional service or DB schema migration. / Старые API-маршруты остаются только для модулей; новый сервис и миграция БД не требуются.
- Add RU/EN theme pages, search, mode filters, version selection, SEO and author documentation. / Добавлены RU/EN страницы тем, поиск, фильтры, выбор версии, SEO и документация.
- Match administrator approval controls to existing server authorization. / Кнопки одобрения администратора приведены в соответствие с действующими серверными правами.

## Unreleased — dependency security patches / Исправления зависимостей

- Pin patched multer 2.5.0 through the approved override; update body-parser to 2.4.0 and Nodemailer to 10.1.4. / Зафиксированы исправленные multer 2.5.0, body-parser 2.4.0 и Nodemailer 10.1.4.

## Unreleased — isolated modules / Изолированные модули

- Validate explicit WASI artifacts and broker grants; preserve runtime metadata for moderation and public trust details. / Проверяются WASI-артефакты и разрешения посредника; runtime виден в модерации и карточках.
- Default catalog queries to native-compatible versions; updated clients opt in with `runtime=all`. / Каталог сохраняет совместимость со старыми клиентами; новые явно запрашивают `runtime=all`.

## Unreleased — security hardening / Усиление защиты

- Reject invalid GitHub packages before persistence, bound release scans and snapshot disk usage. / Невалидные пакеты отклоняются до записи; ограничены обход релизов и хранилище.
- Scope login limits by trusted source without locking other sources for the same account; blocked sources cannot exhaust the global budget. / Лимиты входа разделены по доверенному адресу; заблокированный источник не расходует общий бюджет.
- Add HTML/API security headers and upgrade Next.js to 16.4.2. / Добавлены защитные заголовки HTML/API, Next.js обновлён до 16.4.2.

## Unreleased / Не выпущено

- Discover non-draft preview releases and queue them for the same immutable-package moderation as stable releases. / Предварительные релизы поступают на модерацию наравне со стабильными; черновики пропускаются.
- Select the newest published version by its version number, not the date of approval. / Последняя опубликованная версия определяется номером, а не датой одобрения.

# Changelog

## 2026-10-17 — Google user data disclosure

- Add the explicit Google API Services User Data Policy and Limited Use undertaking in RU/EN privacy policies.
- Clarify the Google user data fields, human access limits and visible policy revision date.
- Scope interface loading boundaries so legal content is visible in the initial HTML without JavaScript; retain skeletons in application sections.

## 2026-10-16 — Public marketplace SEO

- Enable indexing for the catalog, developer documentation and published modules while retaining private-page noindex.
- Add localized canonical/hreflang metadata, Open Graph/Twitter previews and server-rendered JSON-LD.
- Add robots.txt and a live sitemap sourced exclusively from published modules; exclude query variants and account routes.
- Deduplicate module metadata/body lookups per request and prioritize detail artwork.
- Permanently redirect the root to the existing Russian homepage.

## 2026-10-16 — Legal navigation and public policy

- Link privacy and publishing references directly within document paragraphs.
- Formalize operator contact wording and preserve published particulars.
- Explicitly identify Pulse Marketplace and Google-data retention/safeguards; permit indexing of public legal pages.

## 0.1.0 — Frontend milestone

- Add the separate Next.js frontend with Turborepo task orchestration.
- Add monochrome catalog/detail layouts, development-only examples and honest unavailable states.
- Add RU/EN, persistent themes, URL filters, GSAP motion, shared artwork transitions and cursor-mask hero.
- Record approved requirements and the selected project skill toolkit.
- Keep the hero mask stable during rapid pointer reversals with bounded, smoothed deformation.
- Add development-only author and moderation workspaces, local repository drafts, revision checks and preview decision history in RU/EN.
- No backend API or module protocol changes in this milestone.

## Unreleased

- Validate v2 multi-component packages without execution; retain v1 snapshots, expose runtime/capability metadata and reject ambiguous JSON, case aliases and unreadable manifest sizes. — API integration

- Formalize the RU/EN privacy policies with definitions, legal grounds, numbered clauses and approved operator details while retaining Google disclosures.

- Detail Google data access, usage, recipients, safeguards and deletion in both privacy policy languages; explain sign-in on the homepage and provide a branded OAuth logo.

- Add public RU/EN privacy, terms, contact and security pages with document navigation; publish Marketplace moderation rules and sign-in policy links.

- Document the Linux production deployment, isolated services, HTTPS renewal, request limits and verified database/package recovery.

- Add GitHub Actions checks using ephemeral PostgreSQL settings, pinned actions and read-only repository permissions.

- Skip historical GitHub release commits that predate the discovery marker without aborting newer valid releases.
- Add a one-shot discovery operator command that retains advisory locking and rate-limit backoff.

- Ensure successful sign-in performs a fresh document navigation and authenticated visitors leave the login page through a validated local redirect.
- Add localized field placeholders and RU/EN account emails with recipient-header validation.
- Add a VK SMTP configuration helper that verifies app-password authentication before updating ignored settings.

- Add the Nest.js API and shared TypeScript contracts in the existing Turborepo.
- Add PostgreSQL migrations, durable sessions/jobs/audit, content-addressed snapshots and a local persistent database service.
- Add scrypt password sign-in, GitHub/Google provider flows, explicit identity linking, email verification/reset and a persistent mail outbox. Unconfigured providers remain unavailable.
- Add GitHub discovery with constrained transport, numeric repository identity refresh, pinned release sources and schema-1 package validation.
- Add transactional moderation, self-review prevention, immutable publication versions, approval-gated downloads, status filters and cursor pagination.
- Connect catalog, namespaced module details, author and moderation workspaces to real APIs; remove preview publications from connected routes.
- Add Origin/CSRF checks, account/token-specific throttling, bounded authentication-record cleanup and canonical local-origin redirects.
- Add integration/security tests and RU/EN operator documentation. External provider configuration, organizational publishing, production deployment and Monitor integration remain pending.
