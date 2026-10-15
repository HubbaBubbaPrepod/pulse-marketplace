# Pulse codebase-memory indexes

All five active repositories were indexed on 2026-10-15 using full mode.

| Repository        | Graph project                           |
| ----------------- | --------------------------------------- |
| Monitor           | `D-Documents-ChatGPT-Monitor`           |
| PulseAgent        | `D-Documents-ChatGPT-PulseAgent`        |
| PulseModuleDocker | `D-Documents-ChatGPT-PulseModuleDocker` |
| PulseWebsite      | `D-Documents-ChatGPT-PulseWebsite`      |
| PulseMarketplace  | `D-Documents-ChatGPT-PulseMarketplace`  |

Roots are sibling folders under `D:/Documents/ChatGPT/`. The abandoned website prototype is not an active Pulse repository and was excluded.

Use graph search, trace and snippets for structural discovery, then `check_index_coverage` for every cited source path. The service may report Windows files as metadata-changed even immediately after indexing; read those files directly before relying on graph results. Marketplace JSX/SQL and the website's `scripts/github.ps1` have recorded partial parse ranges. Inspect the exact ranges reported by current coverage rather than treating a ready index as exhaustive.

Ignored secrets, data, builds, dependencies and binary artwork stay excluded. No graph export was written into Git repositories. Cross-repository discovery ran for Marketplace against the other four repositories and inferred zero service edges; this does not establish the absence of runtime connections. Do not fabricate cross-repository call edges.
