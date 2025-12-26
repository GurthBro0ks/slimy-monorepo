# BUGLOG: Port Collision Guardrail (Docker Compose)

Date: 2025-12-26

## Context
- Repo: `/opt/slimy/slimy-monorepo`
- Branch: `nuc2/verify-role-b33e616`
- Start HEAD: `21273c2`
- End HEAD: `57f6abb`
- Change type: verify script + optional CI hook (non-trivial, logged)

## Symptom / Motivation
- `docker compose up` can fail late with bind errors (ex: `Bind for 0.0.0.0:3080 failed`) when host ports are already in use.

## Plan
- Add `scripts/verify/compose-ports-available.sh`:
  - Parse `docker-compose.yml` for published host ports (support `${VAR:-default}`).
  - Check current listeners via `ss -ltnp` (fallback: `lsof`).
  - Fail fast with a clear report of conflicting ports + owning process (when available).
- Decide whether to wire into CI (only if it’s safe and won’t flake).

## Commands run (start)
- `git rev-parse --short HEAD` → `21273c2`
- `git rev-parse --abbrev-ref HEAD` → `nuc2/verify-role-b33e616`

## Files changed
- `scripts/verify/compose-ports-available.sh`
- `scripts/verify/compose-config-valid.sh`
- `.github/workflows/ci.yml`

## Verification evidence
- `bash scripts/verify/compose-ports-available.sh` (example failure output):
  - `FAIL: port 3000 is already in use (unknown)`
  - `FAIL: port 3001 is already in use (unknown)`
  - `FAIL: port 3080 is already in use (unknown)`
  - Note: process ownership may show as `unknown` in restricted environments; the script still detects collisions and prints `ss` output.

## Notes
- Not wired into `.github/workflows/ci.yml` because host port occupancy on CI runners is not a stable invariant and could cause flaky failures.
- Wired `docker compose config` validation into CI (safe/deterministic; no host port assumptions).

## Commands run (end)
- `bash scripts/verify/compose-ports-available.sh` → `FAIL (expected when ports are already bound)`
- `bash scripts/verify/compose-config-valid.sh` → `PASS: docker compose config is valid (services: db, admin-api, web, admin-ui, bot)`
- `git commit -m "chore(verify): fail fast on compose port collisions"` → `7e7caa6`
- `git commit -m "chore(verify): validate docker compose config in CI"` → `57f6abb`
