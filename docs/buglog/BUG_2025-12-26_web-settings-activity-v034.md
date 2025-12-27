# BUGLOG — web-settings-activity-v034 (2025-12-26)

## Symptom / Context
- Web has settings change events (`settings-changes-v0`) but no compact “recent activity” widget with deep links.
- Non-negotiables:
  - No `localhost`/`127.0.0.1`/internal DNS leaks in client-visible output.
  - Do **not** modify `apps/web` `/chat`.
  - Keep debug/status strip present on pages we touch.
  - Deterministic verify scripts only; CI-safe.

## Plan
A) Create `SettingsActivityWidget` component (user/guild scopes) using same-origin `/api` via `@slimy/admin-api-client`.
B) Add widget to a stable always-visible page (`/status`) and optionally club page when `guildId` is present.
C) Add “since last visit” marker (localStorage) + audit detail drawer.
D) Add deterministic verify script + wire into CI.
E) Run guardrail scripts and commit.

## Discovery (commands + outputs)

```bash
rg -n "status/page|dashboard|home|retro-shell" apps/web/app apps/web/components -S
```
Output (snippet):
```text
apps/web/app/status/page.tsx
apps/web/app/dashboard/page.tsx
apps/web/components/layout/retro-shell.tsx
```

```bash
rg -n "settings-changes-v0|SettingsChangeEvent|getSettingsChanges" apps/web packages -S
```
Output (snippet):
```text
packages/admin-api-client/src/index.ts
packages/contracts/src/settings.ts
```

```bash
ls -la apps/web/app/status
```
Output:
```text
page.tsx
```

Decision:
- Use `apps/web/app/status/page.tsx` as the stable host for the widget.

## Implementation notes
- Widget:
  - Fetches via `createWebCentralSettingsClient` (same-origin `/api`) and calls `listSettingsChangesV0`.
  - Renders compact timeline rows with: timestamp, kind/source, actorUserId (+ admin badge), and changedKeys summary.
  - Deep links: user -> `/settings`, guild -> `/club/[guildId]/settings`.
  - “Since last visit”: stores `lastSeenEventId` in `localStorage` per scope and highlights newer events.
  - “Audit detail”: click “Details” to expand a raw JSON panel (copyable).
  - Includes an always-visible debug strip (scope + last fetch status).
- Placement:
  - `/status` shows user-scoped activity (prompts sign-in when unauthenticated).
  - `/club` shows guild-scoped activity when `guildId` query param is present.

## Files changed
- `apps/web/components/settings/SettingsActivityWidget.tsx`
- `apps/web/app/status/page.tsx`
- `apps/web/app/club/page.tsx`
- `scripts/verify/web-settings-activity-v034.sh`
- `.github/workflows/ci.yml`
- `docs/buglog/BUG_2025-12-26_web-settings-activity-v034.md`
- `CONTINUITY.md`

## Commands run + outputs

```bash
bash scripts/verify/agents-md-present.sh
bash scripts/verify/continuity-ledger-present.sh
bash scripts/verify/no-localhost-in-client-sources.sh
bash scripts/verify/web-settings-ui-v033.sh
bash scripts/verify/web-settings-activity-v034.sh
```
Output (tail):
```text
[PASS] no loopback/localhost found in scanned sources
[PASS] web settings UI v0.33 checks passed
[PASS] web settings activity widget v0.34 checks passed
```
Notes:
- Web build continues to emit existing warnings (`next.config.js` invalid `eslint` key, middleware convention, prisma externals warning) and `Failed to load doc: undefined ... undefined.mdx` messages, but exits `0`.

```bash
git commit -m "feat(web): settings activity widget v0.34"
```
Output (snippet):
```text
[nuc2/verify-role-b33e616 79c81f5] feat(web): settings activity widget v0.34
```

## Verification evidence
- `scripts/verify/web-settings-ui-v033.sh` passed (baseline).
- `scripts/verify/web-settings-activity-v034.sh` passed (includes a web build + client artifact scan for loopback/internal hosts).

## Commit
- `79c81f5` feat(web): settings activity widget v0.34
