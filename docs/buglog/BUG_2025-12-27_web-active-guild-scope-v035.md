# BUGLOG — web-active-guild-scope-v035 (2025-12-27)

## Symptom / Context
- Web UI lacks a persistent “Selected Guild / Active Club” concept that is shared across pages.
- Existing UI patterns (dashboard `/club?guildId=...`, settings, activity widget) can benefit from a single persisted choice.
- Non-negotiables:
  - No `localhost`/`127.0.0.1`/internal DNS leaks in client-visible output.
  - Do **not** modify `apps/web` `/chat`.
  - Keep debug/status strip on pages we touch.
  - Deterministic verify scripts only; CI-safe.

## Plan
A) Reuse central `UserSettings` storage to persist an `activeGuildId` value (avoid new endpoints if possible).
B) Add a small “Active Club” picker on `/settings` to update `activeGuildId` in central `UserSettings`.
C) Update `SettingsActivityWidget` to optionally switch between User scope and Active Club scope (deep links follow scope).
D) Add deterministic verify script + wire into CI.
E) Run guardrail scripts and commit.

## Discovery (commands + outputs)

```bash
rg -n "UserSettings|selected|active|guildId|club" apps/web packages apps/admin-api -S
```
Output (snippet):
```text
apps/web/components/providers/active-guild-provider.tsx
apps/web/lib/auth/types.ts
apps/web/app/dashboard/page.tsx
packages/contracts/src/settings.ts
packages/admin-api-client/src/index.ts
```

```bash
rg -n "lastActiveGuild" apps/web -S
```
Output (snippet):
```text
apps/web/components/providers/active-guild-provider.tsx
apps/web/lib/auth/types.ts
apps/web/app/api/auth/me/route.ts
```

Decision:
- Persist `activeGuildId` inside central `UserSettings` using existing `GET/PUT /api/settings/user/:userId` flow (no new endpoints).

## Implementation notes
- Storage:
  - Uses a top-level `activeGuildId` field on `UserSettings` (allowed by `UserSettingsSchema.passthrough()`), avoiding contract/API changes.
- UI:
  - `/settings` includes an “Active Club” picker that persists to central UserSettings via same-origin `/api`.
  - `SettingsActivityWidget` gains a scope switcher: User ↔ Active Club (when set), and deep links follow the selected scope.
- Guardrails:
  - No new `NEXT_PUBLIC_*` or baked hostnames; all calls go through same-origin `/api` using `createWebCentralSettingsClient`.
  - Debug/status strip remains present (widget debug + picker debug + existing settings debug).

## Files changed
- `apps/web/app/settings/page.tsx`
- `apps/web/components/settings/ActiveClubPickerCard.tsx`
- `apps/web/components/settings/SettingsActivityWidget.tsx`
- `scripts/verify/web-active-guild-scope-v035.sh`
- `.github/workflows/ci.yml`
- `docs/buglog/BUG_2025-12-27_web-active-guild-scope-v035.md`
- `CONTINUITY.md`

## Commands run + outputs

```bash
bash scripts/verify/agents-md-present.sh
bash scripts/verify/continuity-ledger-present.sh
bash scripts/verify/no-localhost-in-client-sources.sh
bash scripts/verify/web-settings-activity-v034.sh
bash scripts/verify/web-active-guild-scope-v035.sh
```
Output (tail):
```text
[PASS] no loopback/localhost found in scanned sources
[PASS] web settings activity widget v0.34 checks passed
[PASS] web active guild scope v0.35 checks passed
```
Notes:
- Web build continues to emit existing warnings (`next.config.js` invalid `eslint` key, middleware convention, prisma externals warning) and `Failed to load doc: undefined ... undefined.mdx` messages, but exits `0`.

```bash
git commit -m "feat(web): persistent active guild scope v0.35"
```
Output (snippet):
```text
[nuc2/verify-role-b33e616 ab9a1ea] feat(web): persistent active guild scope v0.35
```

## Verification evidence
- `scripts/verify/web-settings-activity-v034.sh` passed (baseline).
- `scripts/verify/web-active-guild-scope-v035.sh` passed (includes a web build + client artifact scan for loopback/internal hosts).

## Commit
- `ab9a1ea` feat(web): persistent active guild scope v0.35
