# BUG_2026-01-11_pr51_ci_triage.md

- **Date:** 2026-01-11
- **PR:** #51 (https://github.com/GurthBro0ks/slimy-monorepo/pull/51)
- **Branch:** `feat/trader-ui-private`

## Triage
- **Status:** Identified
- **Root Cause:** CI workflows are pinned to `pnpm@8`, but the lockfile is version `9.0` (which requires `pnpm@9` or `pnpm@10`). Local environment is using `pnpm@10.21.0`.
- **Failing Jobs:** `Quality Checks` and `test` are both failing at the `Install dependencies` step.
