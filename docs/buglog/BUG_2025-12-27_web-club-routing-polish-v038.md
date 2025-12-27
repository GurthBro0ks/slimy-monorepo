# BUGLOG — web-club-routing-polish-v038 (2025-12-27)

## Context
- Goal: make `/club` + `/settings` flow “bulletproof” (clear UX states, deep links always work, recovery paths when guild list is unavailable).
- Non-negotiables:
  - No `localhost`/`127.0.0.1`/internal DNS leaks in client-visible output.
  - Do **not** modify `apps/web` `/chat`.
  - Keep debug/status strip on pages we touch.
  - Deterministic verify scripts only; CI-safe.

## Plan
A) Discovery: locate relevant state wiring (`lastActiveGuildId`, `activeGuildId`, `guildIdentity`) + existing error strings.
B) Implement `/club` explicit UX states + URL override banner with “Set as Active Club”.
C) Harden `/settings` ActiveClubPicker recovery: retry + manual Guild ID input (validated snowflake).
D) Polish SettingsActivityWidget fallbacks when identity is missing + add a small “Open Settings” link.
E) Add CI-safe verify script + wire into CI.
F) Run verify scripts + commit.

## Discovery (commands + outputs)

```bash
rg -n "lastActiveGuildId|activeGuildId|guildId=" apps/web/app apps/web/components -S
```
Output (snippet):
```text
apps/web/app/club/page.tsx
apps/web/components/settings/ActiveClubPickerCard.tsx
apps/web/components/settings/SettingsActivityWidget.tsx
```

```bash
rg -n "guilds_fetch_failed|guild list unavailable|NO_GUILD_ID" apps/web -S
```
Output (snippet):
```text
apps/web/lib/guildIdentity.ts
apps/web/components/settings/ActiveClubPickerCard.tsx
```

```bash
rg -n "ActiveClubPickerCard|SettingsActivityWidget|guildIdentity" apps/web -S
```
Output (snippet):
```text
apps/web/app/settings/page.tsx
apps/web/app/club/page.tsx
apps/web/components/settings/ActiveClubPickerCard.tsx
apps/web/components/settings/SettingsActivityWidget.tsx
```

## Files changed
- `apps/web/app/club/page.tsx`
- `apps/web/components/settings/ActiveClubPickerCard.tsx`
- `apps/web/components/settings/SettingsActivityWidget.tsx`
- `scripts/verify/web-club-routing-polish-v038.sh`
- `.github/workflows/ci.yml`
- `docs/buglog/BUG_2025-12-27_web-club-routing-polish-v038.md`

## Commands run + outputs (snippets)

```bash
bash scripts/verify/agents-md-present.sh
bash scripts/verify/continuity-ledger-present.sh
bash scripts/verify/no-localhost-in-client-sources.sh
bash scripts/verify/web-runtime-env-required-v037.sh
bash scripts/verify/web-club-routing-polish-v038.sh
```
Output (tail):
```text
[PASS] no loopback/localhost found in scanned sources
[PASS] web runtime env required v0.37 checks passed
[PASS] web club routing polish v0.38 checks passed
```

## Verification evidence
- `scripts/verify/web-club-routing-polish-v038.sh` passed (includes a web build + client artifact scan for loopback/internal hosts + rg checks for the new UX recovery paths).
