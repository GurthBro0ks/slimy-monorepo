# BUG_2026-01-12_monorepo_root_start_proof_gate

## Context
Phase 6 requires a stable, canonical proof gate at the monorepo root:

1) `pnpm -w build`  
2) `pnpm -w start`

Previously, root `pnpm -w start` was missing/unreliable, forcing operators to use the fallback:
`pnpm --filter @slimy/web exec next start`.

## Changes
- **Root `package.json`**
  - Added `start` delegating to `pnpm -s start:web`
  - Added helpers:
    - `start:web` (delegates to `@slimy/web` production start)
    - `build:web` (delegates to `@slimy/web` build)
  - Preserved any previous root start behavior as `start:legacy` (if applicable)

- **Web `apps/web/package.json`**
  - Ensured `start` runs `next start` (canonical production server)
  - Moved prior standalone starter to `start:standalone` (if applicable)

## Scope / Safety
- No behavior change to auth/allowlist logic; this change only standardizes the operator entrypoint.
- No secrets added or logged.

## Proof
**PROOF_DIR:** `/tmp/proof_monorepo_root_start_gate_20260112T040922Z`  
**Commit:** `735dc4f71accb1e056153df06ef6b70c5de96e48`  
**PR:** `https://github.com/GurthBro0ks/slimy-monorepo/pull/56`
- **WEB_FILTER:** `@slimy/web`

### 1) Build gate
Command:
```bash
pnpm -w build
```
Expected: succeeds; `@slimy/web` build runs (no fallback commands required).

### 2) Start gate
Command:
```bash
pnpm -w start
```
Expected: starts `@slimy/web` production server on port 3000 (or configured port).

### 3) Fail-closed verification (unauth)
Commands:
```bash
curl -i http://localhost:3000/trader/artifacts | head -n 20
curl -i http://localhost:3000/api/trader/artifacts/summary | head -n 20
curl -I http://localhost:3000/artifacts/shadow/latest_summary.json | head -n 20
```

Expected:

/trader/artifacts -> 302/307 redirect to login

/api/trader/artifacts/summary -> 401/403

/artifacts/shadow/latest_summary.json -> 404 (static artifacts not exposed)

## Conclusion
Root `pnpm -w start` is now the single source of truth for starting the production web app, aligned with the Phase 6 proof gate. Operators no longer need filter-based fallback start commands.
