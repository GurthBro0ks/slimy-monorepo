# BUG_2026-01-11_pr51_ci_triage.md

- **Date:** 2026-01-11
- **PR:** #51 (https://github.com/GurthBro0ks/slimy-monorepo/pull/51)
- **Branch:** `feat/trader-ui-private`

## Triage
- **Status:** Identified
- **Root Cause:** CI workflows are pinned to `pnpm@8`, but the lockfile is version `9.0` (which requires `pnpm@9` or `pnpm@10`). Local environment is using `pnpm@10.21.0`.
- **Failing Jobs:** `Quality Checks` and `test` are both failing at the `Install dependencies` step.

## Fix #1 - pnpm version
- **Commit:** `10ee19d`
- **Files:** `.github/workflows/ci.yml`, `.github/workflows/test.yml`
- **Change:** Updated pnpm version from `8` to `10`.
- **Result:** ✅ Dependencies install successfully. ❌ New linter error appeared.

## Fix #2 - ESLint missing dependency
- **Issue:** `@eslint/eslintrc` is imported in `apps/web/eslint.config.mjs` but not in `package.json`.
- **Fix:** Adding `@eslint/eslintrc` as a dev dependency to `apps/web`.
