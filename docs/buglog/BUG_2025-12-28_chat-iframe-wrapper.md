# BUGLOG: chat-iframe-wrapper (2025-12-28)

## Symptom / Context
- Goal: add a **safe** `/chat` route in `apps/web` that embeds a legacy HTML chat UI inside an iframe so it can’t affect the rest of the Next.js app.
- Constraint: UI changes must include a temporary debug/status area on the page.

## Plan
1) Add static legacy UI under `apps/web/public/slimechat/` (`index.html` + `snail-glitch.svg`).
2) Create `/chat` page as an iframe wrapper with strict-ish sandbox flags + fixed debug/status box.
3) Verify `apps/web` lint/build (if scripts exist) and record outputs.

## Files Changed
- Added `apps/web/public/slimechat/snail-glitch.svg`
- Added `apps/web/public/slimechat/index.html`
- Moved `apps/web/app/chat/page.tsx` → `apps/web/app/chat/page.backup-2025-12-28.tsx`
- Added `apps/web/app/chat/page.tsx` (iframe wrapper)
- Updated `apps/web/app/chat/page.tsx` (`use client`, cache-busting `?v=...`, iframe load heartbeat)
- Updated `CONTINUITY.md`

## Verification (commands)
- `pnpm -C apps/web lint` (if present)
- `pnpm -C apps/web build` (if present)
- Manual: visit `/chat` and verify menus + formatting controls work inside iframe.

## Commands Run (outputs)
- `mkdir -p apps/web/public/slimechat`
- `mv apps/web/app/chat/page.tsx apps/web/app/chat/page.backup-2025-12-28.tsx`
- `pnpm -C apps/web lint`
  - Exit: `0`
  - Notes: repo-wide existing warnings; no errors.
  - Tail:
    - `✖ 48 problems (0 errors, 48 warnings)`
- `pnpm -C apps/web build` (attempt 1)
  - Exit: `1`
  - Error: `Unable to acquire lock at .../apps/web/.next/lock, is another instance of next build running?`
- `pnpm -C apps/web build` (attempt 2)
  - Exit: `0`
  - Notes: build succeeded; existing warnings about Next config keys + docs loader “undefined.mdx” during SSG, but build completed.
  - Tail:
    - `✓ Compiled successfully`
    - `✅ All checks passed`
    - `✅ Bundle size checks passed!`
- Follow-up: cache-busting + load status patch
  - `pnpm -C apps/web lint`
    - Exit: `0`
    - Tail: `✖ 48 problems (0 errors, 48 warnings)`
  - `pnpm -C apps/web build`
    - Exit: `0`
    - Tail: `✓ Compiled successfully` + `✅ All checks passed`

## Verification Evidence
- Static files present:
  - `apps/web/public/slimechat/index.html`
  - `apps/web/public/slimechat/snail-glitch.svg`
- Route present:
  - `apps/web/app/chat/page.tsx` (iframe wrapper)
  - `apps/web/app/chat/page.backup-2025-12-28.tsx` (previous page backup)
- `next build` output includes `○ /chat` route.
- Manual test:
  - Visit `/chat`
  - Confirm dropdown menus render (not clipped) and formatter buttons preserve selection (B/I/U + colors) inside the iframe.
  - Confirm debug box shows `Status: loaded` once iframe finishes loading.
