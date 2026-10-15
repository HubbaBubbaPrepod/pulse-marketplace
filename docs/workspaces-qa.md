# Workspace frontend verification

Date: 2026-10-15.

## Delivered

- Development-only author and moderation routes, linked from the header and sign-in preview.
- RU/EN, both existing themes, native keyboard controls, inline validation, live feedback, loading skeletons and reduced-motion-aware entrance animations.
- Local author repository drafts, canonical GitHub links, duplicate detection and storage validation. Storage key: `pulse-market.repository-drafts.v1`. No GitHub request or ownership claim is made.
- Example revision details: platforms, package-check results, required access and author feedback.
- Moderation preview: module search, status filtering, mandatory comments, approval/rejection/withdrawal and revision-specific history. Failed checks block approval. Decisions reset when the page reloads and never publish anything.

## Evidence

- Six workspace logic tests were added against empty implementations: five failed and the reject-all URL guard initially passed. All six then passed against the implementation; full suite: 25 tests.
- Browser: malformed URL validation; actual Docker repository saved locally and recovered after reload and locale change; empty comment rejected with focus returned to the field; preview approval and withdrawal; failed Redis approval disabled; no-results queue and clearing search.
- Responsive: author and moderation at 375 px without horizontal overflow; English author at 900 px without overflow. Dark and light screenshots inspected. A heading-alignment issue in the form was found and corrected by excluding `h2` from the metadata auto-margin rule.
- Screenshots under ignored local `artifacts/screenshots/`: `author-mobile.jpg`, `author-light-en.jpg`, `moderation-mobile.jpg`, `moderation-desktop.jpg`. The first author captures precede the small heading-alignment correction; final author capture: `author-final.jpg`.
- Production smoke test covers both locales and both private-preview routes. Each uses the Next.js not-found boundary; no revision fixture or interactive private form is rendered. This is a preview gate, not authentication.
- UI accessibility review used the current Vercel Web Interface Guidelines: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md. No certification is implied.

## Remaining work

Nest.js authentication, roles, persistent server-side moderation/audit, real GitHub discovery, package checks and downloads are not implemented. The browser preview's checks and decisions must never serve as authority for those operations. Filters and selection in the example moderation queue are local UI state; queue history does not survive reload. No screen-reader certification, low-end-device benchmark or live package security review was performed.
