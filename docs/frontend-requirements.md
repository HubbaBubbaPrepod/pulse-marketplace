# Pulse Marketplace — frontend requirements

Approved: 2026-10-14. Stack: Next.js 16.4 / React 19.3 / GSAP, managed by Turborepo 2.11.8 with npm workspaces. Separate repository from the monitor, agent, Docker module and static landing. Future API: Nest.js with PostgreSQL; API implementation is outside this frontend milestone. Structure: apps/web, future apps/api and packages/contracts.

## Visual target and tokens

The approved reference shows a dark catalog and a light Docker detail page. Preserve its restrained monochrome composition, large sans-serif headings, brushed-metal module illustrations, thin borders, category sidebar, search toolbar and installation sidebar. Both pages must support both themes. The MiMo cursor-mask effect is an explicit addition to this reference.

- Dark: background `#080808`, surface `#111111`, border `#303030`, foreground `#f5f5f5`, secondary `#a5a5a5`.
- Light: background `#fafafa`, surface `#ffffff`, border `#d9d9d9`, foreground `#111111`, secondary `#606060`.
- Display/body: Geist Sans with system sans-serif fallback. Data/captions: Geist Mono with system monospace fallback. Self-host fonts; no runtime font requests to third parties.
- Desktop: maximum content width 1440px, three-column card grid beside a category rail. Tablet: two columns. Phone: one column, horizontal category controls and stacked detail sections.
- Signature: contrasting, inertial cursor mask revealing the opposite theme in hero. Header/search remain operable; no global custom cursor.

## Selected skills

All requested skills remain in the project toolkit. Libraries are not installed merely because their skill is selected; new dependency families require agreement.

| Skill                          | Application                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| modern-web-design              | Responsive layout, meaningful interactions, loading and accessibility                     |
| gsap-core                      | Core animation, media queries and easing                                                  |
| gsap-react                     | Scoped useGSAP and lifecycle cleanup                                                      |
| gsap-timeline                  | Coordinated entrance sequences                                                            |
| gsap-performance               | Reused tweens, batched DOM work and offscreen suspension                                  |
| test-driven-development        | Fail-first tests for actual behavior, not CSS or prose snapshots                          |
| frontend-design                | Visual identity, typography, composition and critique                                     |
| ui-ux-pro-max                  | Palette/spacing/UX recommendations; native-mobile-only guidance does not override Next.js |
| web-design-guidelines          | Keyboard, semantics, focus, forms and accessibility review                                |
| vercel-react-best-practices    | React/Next performance, serialization and bundle size                                     |
| vercel-composition-patterns    | Reusable component composition                                                            |
| vercel-react-view-transitions  | Shared module artwork, list identity and tab/route transitions                            |
| locomotive-scroll              | Candidate for necessary scroll effects; retain native scrolling                           |
| scroll-reveal-libraries        | Candidate for simple reveal effects; avoid duplicating GSAP                               |
| barba-js                       | Reference for transitions; do not install a competing Next.js router                      |
| lottie-animations              | Candidate for authored animated illustrations/icons                                       |
| react-spring-physics           | Candidate for distinct spring interactions; one engine per property                       |
| lightweight-3d-effects         | Restrained depth/tilt with touch and reduced-motion fallbacks                             |
| image-to-code                  | Faithful recreation and screenshot-based design QA                                        |
| verification-before-completion | Fresh test/build/browser evidence before completion claims                                |
| codebase-memory                | Structural exploration with index coverage and source fallback                            |

Use the more specific skill for overlaps. User-approved Next.js and visual target override generic Vite starters, unrelated palette recommendations and mobile-native architecture.

## Interaction requirements

- RU/EN routes and localized interface text. Theme choice persists across reloads without a first-paint flash.
- Search, category, platform and alphabetical sort work together. Filters serialize to the URL and survive reload. No invented popularity, ratings or install counts.
- Functional catalog/detail navigation, overview/version/review tabs, source links, install instructions and developer guidance.
- Skeletons cover actual pending navigation/data. No artificial loading delay in production. Empty and error states explain what to do next.
- Hero cursor mask follows with inertia and bounded stretch along movement, settles to a circle, and adapts to both themes. Only fine-pointer hover devices with no reduced-motion preference animate it. Pause outside the viewport and on hidden tabs; clean up listeners/tweens on unmount. Decorative layers are aria-hidden and never intercept interaction.
- Animated card entrances and understated hover depth; View Transitions where they convey continuity. Preserve browser scrolling, back/forward behavior and visible keyboard focus.
- Responsive checks at 375, 768, 1440 and 1920px; both themes, keyboard and reduced motion. No horizontal page overflow or tiny essential controls.

## Data and trust boundaries

This milestone is frontend layout. Six illustrative modules are development-only and clearly labeled as examples, including Docker: it has not been moderated by this marketplace. Production has an honest empty catalog until the real API is connected. No invented approvals, digests, published versions, successful authentication or downloads.

GitHub/Google/email authentication and actual package installation belong to the following backend milestone. Source links are real; preview downloads remain disabled with a reason. Future catalog discovery/moderation/download boundaries are specified in marketplace-design.md.

## Execution and verification

1. Record requirements, scaffold the separate Next.js workspace and establish meaningful failing tests for filtering/URL state and mask geometry.
2. Implement catalog/detail/developer/auth-explanation pages, RU/EN, themes and motion against the approved visual target.
3. Run tests, ESLint, Prettier and production build; inspect the browser at desktop/mobile sizes and fix regressions.
4. Save visual QA evidence and document what works and what awaits the API. Keep a single local preview on port 3100; do not publish or alter the live monitor.

## Progress

- Requirements and skill selection recorded.
- Filter and mask tests: 9 tests failed against empty implementations before feature implementation.
- Existing full-stack plan is reordered for this milestone at the user's request to start frontend first. Backend tasks are not marked complete.
- Turborepo was explicitly requested during implementation and added; Next.js remains the frontend framework. No additional animation engines installed.
- Final review: URL navigation now reconciles filter state; controlled search updates synchronously and defers result rendering. Storage events apply theme changes before subscriber notification. Regression tests failed before the fixes; full suite now contains 17 tests.
- Browser QA found a root-layout script warning on client-side locale changes, including with Next Script beforeInteractive. Locale links therefore load the new document normally, preserving the URL filters and stored theme. Navigation within a locale remains client-side with View Transitions. The small inline head script applies the theme before first paint.
- Fast-pointer feedback: replace angle interpolation with a symmetric deformation matrix, smoothed per frame and limited to 25% elongation. Opposite directions describe the same ellipse; movement settles naturally as position catches up, without completion callbacks restarting stretch tweens. Add reversal and axis-crossing regressions.
- Workspace follow-up: development-only `/[lang]/author/` and `/[lang]/moderation/` extend the monochrome visual system. Author repository drafts use versioned browser storage and do not request GitHub access or submit repositories. Example revisions expose checks, required access and feedback. Moderation examples support search/status filters, mandatory comments, approval/rejection/withdrawal and a local decision history. Approval is unavailable when example checks fail. These operations never change the public catalog; review state resets on reload. Production rejects both preview routes until authentication and the Nest.js API are connected.
