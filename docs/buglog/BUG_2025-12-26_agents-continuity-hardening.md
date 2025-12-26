# BUGLOG: Agents.md + Continuity Hardening

- Date: 2025-12-26
- Slug: agents-continuity-hardening
- HEAD (start): f5159c2

## Symptom / Context
- Protocol activation: enforce presence/consistency of `AGENTS.md` + `CONTINUITY.md` and per-folder overrides.
- Add fast-fail guardrails in CI for missing rule files (and keep changes minimal + verifiable).

## Plan
- Run repo reality scan commands (HEAD, `find` for `AGENTS.md`, verify scripts, CI grep).
- Ensure required `AGENTS.md` and `CONTINUITY.md` files exist (idempotent).
- Add `scripts/verify/agents-md-present.sh` (required file presence check).
- Wire `continuity-ledger-present` + `agents-md-present` into `.github/workflows/ci.yml`.
- Verify locally, then commit.

## Files Changed
- `CONTINUITY.md`
- `.github/workflows/ci.yml`
- `docs/buglog/BUG_2025-12-26_agents-continuity-hardening.md`
- `scripts/verify/agents-md-present.sh`

## Commands Run (with outputs)
- `git rev-parse --short HEAD`
  - `f5159c2`
- `ls -la`
  - Root `AGENTS.md` + `CONTINUITY.md` already present.
- `find apps packages scripts docs -maxdepth 2 -name AGENTS.md -print | sort`
  - `apps/admin-api/AGENTS.md`
  - `apps/admin-ui/AGENTS.md`
  - `apps/bot/AGENTS.md`
  - `apps/web/AGENTS.md`
  - `docs/AGENTS.md`
  - `packages/AGENTS.md`
  - `scripts/AGENTS.md`
- `bash scripts/verify/continuity-ledger-present.sh`
  - `[PASS] CONTINUITY.md present + headings OK`
- `rg -n "AGENTS\\.md|CONTINUITY\\.md" .github/workflows -S || true`
  - (no matches)
- `for f in ...; do test -f ...; done`
  - All required files present (`[ok]` for all 9).
- `ls -la scripts/verify`
  - `continuity-ledger-present.sh` already exists; added `agents-md-present.sh`.
- `bash scripts/verify/agents-md-present.sh`
  - `[PASS] required AGENTS.md + CONTINUITY.md files present (9)`
- `git status --porcelain=v1`
  - `M .github/workflows/ci.yml`
  - `M CONTINUITY.md`
  - `A  scripts/verify/agents-md-present.sh`
  - `?? docs/buglog/BUG_2025-12-26_agents-continuity-hardening.md`
- `git add -A && git commit -m "chore(agents): enforce AGENTS.md + continuity checks in CI"`
  - (amended later to include buglog updates)
- `git add -A && git commit --amend --no-edit`
  - (see final commit hash in task output)
- `git status --porcelain=v1`
  - (clean)

## Verification Evidence
- Local verify scripts pass:
  - `bash scripts/verify/continuity-ledger-present.sh` => PASS
  - `bash scripts/verify/agents-md-present.sh` => PASS
- CI wiring:
  - `.github/workflows/ci.yml` runs both verify scripts.
