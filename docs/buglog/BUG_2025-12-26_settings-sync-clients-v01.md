# BUGLOG — Settings Sync Clients v0.1 (Bot + Admin UI)

## Context / Goal
- Protocol: “Settings Sync Clients v0.1 (Bot + Admin UI)”
- Repo: `/opt/slimy/slimy-monorepo`
- Start HEAD: `51132fb`
- Goal:
  - Wire **one** user toggle (`prefs.chat.markdown`) + **one** guild toggle (`prefs.widget.enabled`) via:
    - Discord bot slash commands
    - Admin UI settings surface
  - Add bot-only memory write path for `kind="profile_summary"` (user scope only).
  - Centralize memory kind policy in `@slimy/contracts` (no drift).

## Plan
1) Centralize memory kind policy in `packages/contracts`.
2) Update admin-api to enforce policy from contracts.
3) Extend `@slimy/admin-api-client` helpers (patch settings + write memory).
4) Add Discord bot `/settings` + `/memory` commands using admin-api-client.
5) Add Admin UI settings page/panel using admin-api-client.
6) Add deterministic verify scripts (settings sync + no-localhost scan) and wire into CI.
7) Run required verification commands, update `CONTINUITY.md`, commit.

## Changes (summary)
- Centralized memory kind/scope policy in `@slimy/contracts` and enforced it in admin-api.
- Added internal bot auth path for settings/memory routes (token + actor headers) to allow bot -> admin-api calls without cookies.
- Wired Discord bot slash commands to read/write:
  - User setting: `prefs.chat.markdown`
  - Guild setting: `prefs.widget.enabled`
  - Memory write: `kind="profile_summary"` (user scope)
- Wired Admin UI pages to call the same admin-api endpoints via `@slimy/admin-api-client` (through `/api/admin-api` proxy).
- Added verify scripts + CI steps:
  - `scripts/verify/no-localhost-in-client-sources.sh`
  - `scripts/verify/settings-sync-clients-v01.sh`

## Files changed
- `.github/workflows/ci.yml`
- `apps/admin-api/src/middleware/internal-bot-auth.js`
- `apps/admin-api/src/routes/memory-v0.js`
- `apps/admin-api/src/routes/settings-v0.js`
- `apps/admin-api/src/services/guild-settings-authz.js`
- `apps/admin-api/tests/settings-memory-v0.test.js`
- `apps/admin-ui/pages/settings.js`
- `apps/admin-ui/pages/club/[guildId]/settings.js`
- `apps/bot/package.json`
- `apps/bot/src/index.ts`
- `apps/bot/src/lib/adminApi.ts`
- `apps/bot/src/commands/settings.ts`
- `apps/bot/src/commands/memory.ts`
- `docs/arch/SETTINGS_AND_MEMORY.md`
- `packages/contracts/src/memory.ts`
- `packages/contracts/dist/memory.js`
- `packages/contracts/dist/memory.d.ts`
- `packages/admin-api-client/src/index.ts`
- `packages/admin-api-client/dist/index.js`
- `packages/admin-api-client/dist/index.d.ts`
- `scripts/verify/settings-sync-clients-v01.sh`
- `scripts/verify/no-localhost-in-client-sources.sh`
- `pnpm-lock.yaml`

## Commands run (with outputs)
### Discovery / context
```bash
git rev-parse --short HEAD
```
Output:
```
51132fb
```

### Install
```bash
pnpm install
```
Output (snippet):
```
Done in 6.7s using pnpm v10.21.0
```

### Verification (required)
```bash
bash scripts/verify/agents-md-present.sh
```
Output:
```
[PASS] required AGENTS.md + CONTINUITY.md files present (9)
```

```bash
bash scripts/verify/continuity-ledger-present.sh
```
Output (snippet):
```
[PASS] CONTINUITY.md present + headings OK
```

```bash
bash scripts/verify/settings-memory-bridge-v0.sh
```
Output (snippet):
```
[info] running admin-api regression: settings+memory v0
...
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
[PASS] settings+memory v0 regression test passed
```

```bash
bash scripts/verify/settings-sync-clients-v01.sh
```
Output (snippet):
```
[PASS] settings sync clients v0.1 checks passed
```

```bash
bash scripts/verify/no-localhost-in-client-sources.sh
```
Output:
```
[PASS] no loopback/localhost found in scanned sources
```

```bash
git status --porcelain=v1
```
Output (snippet):
```
M .github/workflows/ci.yml
...
?? docs/buglog/BUG_2025-12-26_settings-sync-clients-v01.md
```

## Verification evidence
- Jest regression: `apps/admin-api/tests/settings-memory-v0.test.js` passes (8 tests), includes:
  - policy check (`profile_summary` forbidden for guild scope)
  - internal bot auth positive case (token + csrf)
- `scripts/verify/no-localhost-in-client-sources.sh` passes.
