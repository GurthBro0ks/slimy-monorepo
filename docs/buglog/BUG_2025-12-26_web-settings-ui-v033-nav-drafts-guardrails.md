# BUGLOG — web-settings-ui-v033-nav-drafts-guardrails (2025-12-26)

## Symptom / Context
- Settings editor UX exists (`v0.32`) but is still easy to miss and easy to lose work:
  - No obvious nav entry point to `/settings`.
  - No per-scope draft persistence (refresh/back loses pending edits).
  - No unsaved-changes guard on navigation.
  - Diff UX can be clearer (grouped paths + compact view).
  - Memory panel is currently “debug only” and not very usable.
- Non-negotiables:
  - No `localhost`/`127.0.0.1`/internal DNS leaks in client-visible output.
  - Do **not** modify `apps/web` `/chat`.
  - Keep debug/status strip on pages we touch.
  - Keep changes deterministic + CI-safe checks only.

## Plan
A) Add Settings entry points in the primary web nav and on club pages.
B) Add per-scope draft autosave + restore/discard banner.
C) Add unsaved-changes guard (beforeunload + internal link click guard).
D) Improve diff UX (grouped paths + compact view).
E) Optional: make Memory panel useful (filter + create record), no raw chat logs.
F) Extend deterministic verify scripts (v0.33) and run all guardrails.

## Discovery (commands + outputs)

```bash
rg -n "header|nav|layout|menu|sidebar" apps/web/app apps/web/components -S
```
Output (snippet):
```text
apps/web/components/layout/retro-shell.tsx
apps/web/components/layout/header.tsx
apps/web/components/CommandShell.tsx
```

```bash
rg -n "SettingsEditor" apps/web -S
```
Output (snippet):
```text
apps/web/components/settings/SettingsEditor.tsx
apps/web/app/settings/page.tsx
apps/web/app/club/[guildId]/settings/page.tsx
```

```bash
rg -n "MemoryRecord|memory-v0|memory" apps/web packages apps/admin-api -S
```
Output (snippet):
```text
apps/admin-api/src/routes/memory-v0.js
packages/contracts/src/memory.ts
packages/admin-api-client/src/index.ts
apps/web/components/settings/SettingsEditor.tsx
```

## Files changed
- `docs/buglog/BUG_2025-12-26_web-settings-ui-v033-nav-drafts-guardrails.md`
- `CONTINUITY.md`
- `apps/web/components/layout/retro-shell.tsx`
- `apps/web/app/club/page.tsx`
- `apps/web/components/settings/SettingsEditor.tsx`
- `scripts/verify/web-settings-ui-v033.sh`
- `.github/workflows/ci.yml`

## Commands run + outputs
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
bash scripts/verify/web-settings-ui-v032.sh
```
Output:
```text
[PASS] web settings UI v0.32 checks passed
```

```bash
bash scripts/verify/web-settings-ui-v033.sh
```
Output (tail):
```text
[info] building apps/web
✓ Compiled successfully
[info] scanning .next/static for loopback/internal hosts (client artifacts)
[PASS] web settings UI v0.33 checks passed
```
Notes:
- Web build continues to emit existing warnings (`next.config.js` invalid `eslint` key, middleware convention, prisma externals warning) and `Failed to load doc: undefined ... undefined.mdx` messages, but exits `0`.

```bash
git commit -m "feat(web): settings UX v0.33 (nav + drafts + unsaved guard)"
```
Output (snippet):
```text
[nuc2/verify-role-b33e616 1d3359f] feat(web): settings UX v0.33 (nav + drafts + unsaved guard)
```

## Verification evidence
- `scripts/verify/web-settings-ui-v032.sh` passed (baseline).
- `scripts/verify/web-settings-ui-v033.sh` passed (includes a web build + client artifact scan for loopback/internal hosts).

## Commit
- `1d3359f` feat(web): settings UX v0.33 (nav + drafts + unsaved guard)

## Implementation notes
- Nav:
  - Added `/settings` link in the primary header nav (`RetroShell`).
  - Added “Open Club Settings” link on `/club` when `guildId` query param is present.
- SettingsEditor:
  - Draft autosave to `localStorage` per scope (`slimy:settings-draft:v1:<scopeType>:<scopeId>`), debounce ~800ms.
  - Draft restore/discard banner shown when stored draft differs from server state (invalid JSON drafts still restorable).
  - Unsaved changes guard:
    - `beforeunload` prompt
    - capture-phase click guard for `<a>` navigations
  - Diff UX: grouped Added/Removed/Changed paths + compact mode toggle for side-by-side JSON.
  - Memory panel: filter by kind + create structured record (validated by `@slimy/contracts`).
