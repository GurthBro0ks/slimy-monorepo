# BUG_2026-01-12_monorepo_root_start_proof_gate

## Context
Phase 6 requires a stable, canonical proof gate at the monorepo root:
1. `pnpm -w build`
2. `pnpm -w start`

Previously, `pnpm -w start` was missing, forcing operators to fallback to `pnpm --filter @slimy/web exec next start`.

## Changes
- **Root `package.json`**: Added `start` script delegating to `pnpm -s start:web`. Added `start:web` and `build:web` helpers.
- **Web `apps/web/package.json`**: ensuring `start` runs `next start` (canonical production server). Previous standalone starter moved to `start:standalone`.

## Proofs
Proofs collected in `/tmp/proof_monorepo_root_start_gate_20260112T040922Z`.

### 1. Build
`pnpm -w build` succeeded, delegating to `@slimy/web` build.

### 2. Start
`pnpm -w start` successfully launches the `@slimy/web` production server on port 3000.

### 3. Fail-closed Verification
Unauthenticated access to sensitive endpoints is correctly denied:
- `GET /trader/artifacts` -> 307 Redirect (to login)
- `GET /api/trader/artifacts/summary` -> 401 Unauthorized
- `HEAD /artifacts/shadow/latest_summary.json` -> 404 Not Found (Static assets not leaked)

## Conclusion
The root `pnpm -w start` command is now the single source of truth for starting the production stack, aligned with the Phase 6 Proof Gate requirements.
