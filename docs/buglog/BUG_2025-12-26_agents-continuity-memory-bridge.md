# BUG_2025-12-26_agents-continuity-memory-bridge

## Symptom / Context
- Repo continuity rules were not codified in `AGENTS.md` (root + per-folder overrides).
- No root `CONTINUITY.md` existed to act as a compaction-safe “current state” ledger.
- Upcoming cross-service requirement: Discord bot and Web UI must share a single Settings + Memory source of truth via `admin-api`.

## Plan
1) Add `CONTINUITY.md` (facts only; stable headings).
2) Add root `AGENTS.md` + per-folder overrides for apps/packages/scripts/docs.
3) Add a verify script to enforce continuity ledger presence/headings.
4) Wire the verify script into CI (minimal diff).
5) Record commands + evidence; commit.

## Files changed
- Added: `CONTINUITY.md`
- Added: `AGENTS.md`
- Added: `apps/bot/AGENTS.md`
- Added: `apps/admin-api/AGENTS.md`
- Added: `apps/admin-ui/AGENTS.md`
- Added: `apps/web/AGENTS.md`
- Added: `packages/AGENTS.md`
- Added: `scripts/AGENTS.md`
- Added: `docs/AGENTS.md`
- Added: `scripts/verify/continuity-ledger-present.sh`
- Updated: `.github/workflows/ci.yml` (run continuity verify)

## Commands run (with outputs)

### Verify ledger script
```bash
chmod +x scripts/verify/continuity-ledger-present.sh
bash scripts/verify/continuity-ledger-present.sh
```

Output:
```text
[PASS] CONTINUITY.md present + headings OK

[info] snapshot (Goal / Now / Next / Open questions)

Goal:
- Maintain compaction-safe continuity for the Slimy monorepo (Codex/agents can resume work correctly).
- Keep prod builds clean (no `localhost`/loopback in public-facing configs).
- Prepare shared Settings + Memory so Discord (/commands) and Web UI stay in sync.

Now:
- Add/standardize `AGENTS.md` (root + per-folder).
- Establish explicit cross-service rules for Settings + Memory (Discord + Web).
- Reduce “tribal knowledge” by pinning working commands and invariants here.

Next:
- Define Settings contract (types/schemas) shared by bot + web + admin-api (single source of truth).
- Add `/commands` + Web UI settings screens that both call the same admin-api endpoints.
- Add initial “Memory Store” (structured summaries/state + pointers) behind admin-api.

Open questions:
- UNCONFIRMED: Exact current location of shared settings schema/types in `packages/` (or if it needs to be created).
- UNCONFIRMED: Whether “memory” should live in the primary DB first, or as a dedicated service container (later).
```

### Working tree status
```bash
git status --porcelain=v1
```

Output:
```text
 M .github/workflows/ci.yml
?? AGENTS.md
?? CONTINUITY.md
?? apps/admin-api/AGENTS.md
?? apps/admin-ui/AGENTS.md
?? apps/bot/AGENTS.md
?? apps/web/AGENTS.md
?? docs/AGENTS.md
?? packages/AGENTS.md
?? scripts/AGENTS.md
?? scripts/verify/continuity-ledger-present.sh
```

## Verification evidence
- `scripts/verify/continuity-ledger-present.sh` passes and prints a compact snapshot (Goal / Now / Next / Open questions).
- CI now runs `bash scripts/verify/continuity-ledger-present.sh` (alongside existing “no localhost” verification).

