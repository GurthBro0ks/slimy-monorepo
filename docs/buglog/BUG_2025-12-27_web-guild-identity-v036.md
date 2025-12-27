# BUGLOG — web-guild-identity-v036 (2025-12-27)

## Symptom / Context
- Web settings/activity UIs show raw `guildId` values prominently.
- Goal: resolve `guildId -> { name, iconUrl }` and show human-friendly labels/icons in primary UI.
- Non-negotiables:
  - No `localhost`/`127.0.0.1`/internal DNS leaks in client-visible output.
  - Do **not** modify `apps/web` `/chat`.
  - Keep debug/status strip on pages we touch.
  - Deterministic verify scripts only; CI-safe.

## Plan
A) Add `guildIdentity` helper (web-only): same-origin `/api/discord/guilds`, in-memory + localStorage TTL cache.
B) Upgrade `ActiveClubPickerCard` and `SettingsActivityWidget` to display guild names/icons (IDs only in secondary/debug).
C) Add deterministic verify script + wire into CI.
D) Run guardrail scripts and commit.

## Discovery (commands + outputs)

```bash
rg -n "me/guilds|guilds\\b|getGuilds|fetchGuilds|discord guild" apps/web -S
```
Output (snippet):
```text
apps/web/app/api/discord/guilds/route.ts
apps/web/components/debug/DebugDock.tsx
apps/web/app/api/auth/me/route.ts
```

```bash
rg -n "ActiveClubPickerCard|SettingsActivityWidget|activeGuildId" apps/web -S
```
Output (snippet):
```text
apps/web/components/settings/ActiveClubPickerCard.tsx
apps/web/components/settings/SettingsActivityWidget.tsx
apps/web/app/settings/page.tsx
```

Decision:
- Use same-origin `GET /api/discord/guilds` as the guild identity data source (already used elsewhere), and cache results client-side with TTL.

## Implementation notes
- Identity helper:
  - `apps/web/lib/guildIdentity.ts` fetches `GET /api/discord/guilds` (same-origin), builds `guildId -> { name, iconUrl }`.
  - Cache: in-memory per session + `localStorage` TTL (10 minutes).
- UI:
  - `ActiveClubPickerCard` shows icon + friendly guild name for the active selection (IDs only in dropdown option text and debug).
  - `SettingsActivityWidget` shows “You” for user scope and icon + guild name for guild scope events (IDs only as secondary fallback + debug).
- Guardrails:
  - No internal hostnames added; no `/chat` files changed.

## Files changed
- `apps/web/lib/guildIdentity.ts`
- `apps/web/components/settings/ActiveClubPickerCard.tsx`
- `apps/web/components/settings/SettingsActivityWidget.tsx`
- `scripts/verify/web-guild-identity-v036.sh`
- `.github/workflows/ci.yml`
- `docs/buglog/BUG_2025-12-27_web-guild-identity-v036.md`
- `CONTINUITY.md`

## Commands run + outputs

```bash
bash scripts/verify/agents-md-present.sh
bash scripts/verify/continuity-ledger-present.sh
bash scripts/verify/no-localhost-in-client-sources.sh
bash scripts/verify/web-settings-activity-v034.sh
bash scripts/verify/web-active-guild-scope-v035.sh
bash scripts/verify/web-guild-identity-v036.sh
```
Output (tail):
```text
[PASS] web settings activity widget v0.34 checks passed
[PASS] web active guild scope v0.35 checks passed
[PASS] web guild identity v0.36 checks passed
```
Notes:
- Web build continues to emit existing warnings (`next.config.js` invalid `eslint` key, middleware convention, prisma externals warning) and `Failed to load doc: undefined ... undefined.mdx` messages, but exits `0`.

```bash
git commit -m "feat(web): guild identity labels/icons v0.36"
```
Output (snippet):
```text
[nuc2/verify-role-b33e616 dffb0ce] feat(web): guild identity labels/icons v0.36
```

## Verification evidence
- `scripts/verify/web-guild-identity-v036.sh` passed (includes a web build + client artifact scan for loopback/internal hosts).

## Commit
- `dffb0ce` feat(web): guild identity labels/icons v0.36
