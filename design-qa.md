# Frontend visual QA

Date: 2026-10-15. Final result: passed

## Evidence and normalization

- Source visual truth: `docs/assets/approved-marketplace.png`, 1850 × 850 px, two approximately 896 px wide concept panels with surrounding board padding.
- Local implementation: http://127.0.0.1:3100/ru/ and `/ru/modules/docker/`.
- Catalog: `artifacts/screenshots/catalog-dark-900.jpg`, 890 × 1146 px full content at a 900 px browser viewport (scrollbar excluded), density 1.
- Detail: `artifacts/screenshots/docker-light-final.jpg`, 890 × 890 px visible content at a 900 × 900 viewport, density 1.
- Final preview: `artifacts/screenshots/catalog-final.jpg`, 1072 × 995 px at the default browser size.
- Revised cursor mask: `artifacts/screenshots/hero-motion-fixed.jpg`, same default viewport, dark theme, pointer inside hero.

The source board and catalog/detail captures were opened together in one comparison input. Board padding and browser scrollbars were excluded conceptually; this is a visual comparison, not a pixel-difference claim. The implementation includes an explicit development ribbon and real footer absent from the source, so full-page heights intentionally differ. Readable detail captures were used to inspect the title/artwork, tabs, table and installation panel.

## Comparison history

1. P2: hero wrapping and toolbar stacking at 900 px displaced the catalog. Removed the forced title break and extra decorative copy; preserved the single-row toolbar at this width. Compact card artwork retains the three-column composition. Post-fix evidence: `catalog-dark-900.jpg`.
2. P2: detail header stacked unnecessarily and a generic compact artwork rule shrank detail artwork. Scoped that rule to module cards, retained the horizontal detail header and corrected its height. Post-fix evidence: `docker-light-final.jpg`.
3. P2, user feedback: fast pointer movement caused spinning and jerking. Ordinary interpolation across −180/180 degrees and separately restarted stretch tweens caused unstable motion. Replaced animated angles with a symmetric deformation matrix, frame-rate-adjusted smoothing and a 25% stretch limit. Opposite directions now produce the same ellipse. Two regression tests failed before this fix and passed afterward. Browser rapid reversals produced finite 48-point polygons, bounded dimensions and no console warnings/errors. Evidence: `hero-motion-fixed.jpg`.

## Fidelity surfaces

- Typography: Geist Latin with system Cyrillic fallback, strong single-line desktop heading, restrained monospace metadata and readable body hierarchy. The source does not identify a font, so exact family equivalence is not claimed.
- Layout rhythm: category rail, three-column desktop cards, horizontal search/filter bar and two-column detail layout match the concept. Tablet/mobile collapse into two/one columns without horizontal overflow. Extra honest-state copy adds vertical space intentionally.
- Colors: near-black and near-white themes with semantic neutral surfaces, muted copy, fine borders and visible focus. Monochrome status treatments remain consistent.
- Images: six generated transparent chrome illustrations follow the source subjects and material direction; original Pulse vector mark is reused. Assets remain sharp with intact transparency. Illustrative product artwork is not official branding or endorsement.
- Copy: RU/EN dictionaries cover the visible interface. Example labels, pending review, unavailable hashes and disabled downloads intentionally replace the source's unverified approval/download claims. Alphabetical ordering replaces invented popularity.

## Interaction and engineering checks

- Search, combined platform/category filters, alphabetical sorting, URL reload/back state and header reset.
- Theme persistence, cross-tab updates, RU/EN navigation, mobile menu, detail tabs and keyboard tab selection, installation disclosure and developer copy confirmation.
- Actual pending-navigation skeleton observed; no artificial loading delay.
- Widths 375, 768, 1440 and 1920 px checked without horizontal overflow. Temporary viewport and reduced-motion overrides restored.
- Reduced motion hides the cursor mask. Offscreen/hidden-tab suspension and cleanup are retained.
- Fresh browser console check: no warnings/errors during the checked routes and revised mask interaction.
- 19 Node tests, ESLint, Prettier, production build and production smoke checks passed. Production examples are absent in both languages; unpublished modules use the not-found boundary without Docker metadata or install UI. Streamed Next.js not-found responses can retain HTTP 200; the check verifies the framework's 404 boundary rather than assuming a non-streamed response.

## Remaining scope and limitations

No actionable P0/P1/P2 visual findings remain in this frontend milestone. Authentication, moderation, GitHub discovery and real downloads await the Nest.js API. The unsupported locale returns 404; a development-only diagnostic from parallel child rendering remains a minor follow-up. Clipboard confirmation was observed, but browser-tool clipboard readback did not expose its contents. No accessibility certification or low-end-device performance benchmark is claimed.

Screenshots are local ignored artifacts. Requirements and backend architecture remain under `docs/`.
