# BUGLOG — web-settings-ui-v032-ux-polish (2025-12-26)

## Symptom / Context
- Target: `apps/web` settings pages only:
  - `/settings`
  - `/club/[guildId]/settings`
- Current UX is functional but “debuggy”:
  - Save is a simple button + `saving` boolean (no real state machine / last-saved UI).
  - No diff preview before save.
  - No reset/discard-local-edits confirm flow.
  - Change events are manual (“Check changes”), not integrated as a stale-save warning.
- Non-negotiables:
  - No `localhost`/`127.0.0.1` leaks in client-visible output.
  - Do **not** modify `apps/web` `/chat` module.
  - Keep debug/status strip present on pages.

## Plan
1) Discovery: locate current settings pages and change-event cursor usage.
2) Extract shared component for settings editing workflow.
3) Add save state machine + last-saved timestamp.
4) Add diff preview modal before saving.
5) Add reset (discard local edits) with confirm and re-fetch.
6) Add stale-change warning via `settings change events` cursor.
7) Add deterministic verify script for v0.32 and run existing guardrails.

## Discovery (commands + outputs)

```bash
rg -n "app/settings/page|club/\\[guildId\\]/settings|central-settings-client" apps/web -S
```
Output (snippet):
```text
apps/web/app/settings/page.tsx
8:import { createWebCentralSettingsClient } from "@/lib/api/central-settings-client";

apps/web/app/club/[guildId]/settings/page.tsx
9:import { createWebCentralSettingsClient } from "@/lib/api/central-settings-client";
```

```bash
rg -n "SettingsChangeEvent|settings-changes-v0|sinceId|cursor" packages apps/web -S
```
Output (snippet):
```text
packages/contracts/src/settings.ts
88:export const SettingsChangeEventSchema = z.object({

packages/admin-api-client/src/index.ts
277:      sinceId?: number | null;

apps/web/app/settings/page.tsx
147:      sinceId: eventsSinceId ?? undefined,

apps/web/app/club/[guildId]/settings/page.tsx
159:      sinceId: eventsSinceId ?? undefined,
```

## Files changed
- `docs/buglog/BUG_2025-12-26_web-settings-ui-v032-ux-polish.md`
- `apps/web/components/settings/SettingsEditor.tsx`
- `apps/web/app/settings/page.tsx`
- `apps/web/app/club/[guildId]/settings/page.tsx`
- `scripts/verify/web-settings-ui-v032.sh`
- `.github/workflows/ci.yml`

## Commands run (verification)
```bash
bash scripts/verify/agents-md-present.sh
```
Output:
```text
[PASS] required AGENTS.md + CONTINUITY.md files present (9)
```

```bash
bash scripts/verify/continuity-ledger-present.sh
```
Output (snippet):
```text
[PASS] CONTINUITY.md present + headings OK
```

```bash
bash scripts/verify/no-localhost-in-client-sources.sh
```
Output:
```text
[PASS] no loopback/localhost found in scanned sources
```

```bash
pnpm --filter @slimy/web build
```
Output (snippet):
```text
✓ Compiled successfully in 14.7s
✓ Generating static pages (45/45)
✓ Finalizing page optimization
```
Notes:
- Warnings observed during build (not addressed here): invalid `next.config.js` `eslint` key, middleware convention deprecation, and a prisma externals warning.
- `Failed to load doc: undefined ... undefined.mdx` messages appeared during static generation but the build still exited `0`.

```bash
bash scripts/verify/web-settings-ui-v032.sh
```
Output:
```text
[PASS] web settings UI v0.32 checks passed
```

## Verification evidence
- `scripts/verify/web-settings-ui-v032.sh` scans settings UI sources + `apps/web/.next/static` for loopback/internal hostnames and passed.
- `pnpm --filter @slimy/web build` succeeded locally after refactor.

## Implementation notes
- Extracted a shared `SettingsEditor` used by both settings pages:
  - Save state machine: `idle` → `saving` → `saved` (timestamp) / `error`.
  - Diff preview modal (changed paths + “current vs pending” JSON, excluding `updatedAt`).
  - Reset flow (“discard local edits” by reloading server state) with confirm.
  - Stale-save warning: checks `settings change events` cursor before saving and prompts reload/continue.
- Kept debug/status strip present and avoided any `/chat` changes.

## Commit
- Implementation commit: `374a719` feat(web): polish settings UI v0.32 (save/diff/reset/changes)
