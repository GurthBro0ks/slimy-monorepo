# BUGLOG: Settings+Memory v0 — Access Control Hardening

Date: 2025-12-26

## Context
- Repo: `/opt/slimy/slimy-monorepo`
- Branch: `nuc2/verify-role-b33e616`
- Start HEAD: `21273c2`
- End HEAD: `4678a40`
- Change type: security hardening + guardrails (non-trivial, logged)

## Symptom / Risk
- New Settings/Memory v0 endpoints could become an ID-guessing data leak if authz checks are incomplete or inconsistent with existing admin-api patterns.
- Memory writes also need a kind-level allowlist to prevent unintended writes (ex: `project_state`) by non-privileged callers.

## Plan
- Audit `apps/admin-api/src/routes/settings-v0.js` and `apps/admin-api/src/routes/memory-v0.js` for authz correctness.
- Align guild-scoped access with existing admin-api guild settings authorization behavior.
- Add/extend regression coverage so cross-user access is rejected.
- Verify via existing verify script(s).

## Commands run (start)
- `git rev-parse --short HEAD` → `21273c2`
- `git rev-parse --abbrev-ref HEAD` → `nuc2/verify-role-b33e616`

## Files changed
- `apps/admin-api/src/services/guild-settings-authz.js`
- `apps/admin-api/src/routes/settings-v0.js`
- `apps/admin-api/src/routes/memory-v0.js`
- `apps/admin-api/src/routes/guilds.js`
- `apps/admin-api/tests/settings-memory-v0.test.js`
- `docs/arch/SETTINGS_AND_MEMORY.md`

## Verification evidence
- `bash scripts/verify/settings-memory-bridge-v0.sh`:
  - `PASS tests/settings-memory-v0.test.js` (6 tests)
  - Includes new negative coverage:
    - cross-user settings read forbidden
    - cross-user memory read forbidden
    - `scopeType=user` + `kind=project_state` forbidden for non-admins

## Commands run (end)
- `bash scripts/verify/settings-memory-bridge-v0.sh` → `[PASS] settings+memory v0 regression test passed`
- `git commit -m "fix(admin-api): harden settings/memory v0 access"` → `4678a40`
