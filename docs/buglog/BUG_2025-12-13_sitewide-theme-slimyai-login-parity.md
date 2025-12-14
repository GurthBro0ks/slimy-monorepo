# BUGLOG: sitewide-theme-slimyai-login-parity (2025-12-13)

## Context
- System: LOCAL laptop
- Repo path: `/home/mint/Desktop/slimy-monorepo`
- Git HEAD: `b302887`
- Architecture rules: `docs/AI_RULES.md`

## Symptom
- Admin UI pages render with mixed styling patterns: global `globals.css` for base UI, but several pages still ship page-scoped `<style jsx>` blocks and/or ad-hoc inline styling that diverges.
- The login/landing experience should match the slimyai.xyz theme vibe consistently across pages.

## Key design requirements (from prompt)
- Fonts:
  - **Press Start 2P** for headers/logo
  - **VT323** for body
- Background:
  - `#050010` neon grid background + neon panels
- Header:
  - web-header + marquee pattern (or minimal variant suitable for admin pages)
- Buttons:
  - 3D button style with pressed/active behavior
- Optional:
  - slime drip overlay (must be non-blocking)

## Current style entry points
- Next entry:
  - `apps/admin-ui/pages/_app.js` imports `apps/admin-ui/styles/globals.css`
  - `apps/admin-ui/pages/_document.tsx` sets `body.__compact` and `data-density="ultra"`
- Layout wrapper:
  - `apps/admin-ui/components/Layout.js` (nav + shell + chat widget mount point)

## Known page-scoped overrides (to eliminate or align)
- `<style jsx>` present in:
  - `apps/admin-ui/pages/index.js`
  - `apps/admin-ui/pages/admin-api-usage.jsx`
  - `apps/admin-ui/pages/auth-me.jsx`
  - `apps/admin-ui/pages/guilds/[guildId]/settings.js`

## Plan
1. Implement the theme in one place:
   - Update `apps/admin-ui/styles/globals.css` to:
     - import Press Start 2P + VT323
     - define CSS variables for theme colors + fonts
     - apply neon grid background sitewide
     - restyle `.panel`, `.card`, `.btn` (3D press behavior)
     - add marquee + slime drip overlay styles
2. Update Layout header safely:
   - Keep existing structure and chat widget mounting.
   - Add a marquee bar that matches the theme (CSS-driven).
3. Remove/avoid per-page `<style jsx>`:
   - Move landing “hero” styles into globals and remove from `apps/admin-ui/pages/index.js`.
   - Avoid re-defining `.btn`/layout primitives in page scope.
4. Verify:
   - `pnpm -w lint`
   - `pnpm smoke:docker`
   - Manual parity: `/status`, `/dashboard`, `/guilds`, `/snail/*`, `/chat` share background + typography + button style; chat widget not broken.

## Expected visual signals after fix
- Page background has a subtle neon grid on `#050010` across all routes.
- Headers use Press Start 2P; body text uses VT323.
- Buttons use the same 3D style everywhere (`.btn` pressed state).
- Marquee appears consistently (via Layout) without affecting routing or auth.

## Changes Applied
- Global theme + primitives:
  - `apps/admin-ui/styles/globals.css`
    - Fonts: switched to `Press Start 2P` + `VT323` (body uses VT323, headers use Press Start 2P).
    - Background: sitewide neon grid on `#050010`.
    - Buttons: unified 3D press effect for `.btn` + `.btn.outline`.
    - Panels/cards: restyled `.panel` and `.card` to neon/glass parity.
    - Added global helpers to replace removed page-scoped CSS (`.wrap`, `.row`, `.muted`, `.box`, `.callout`, `.table-grid`, `.grid.cols-2`, `.form-row label`, etc).
    - Added marquee + slime-drip overlay styles (`.top-marquee`, `.slime-drips`).
- Layout header parity (no chat widget changes):
  - `apps/admin-ui/components/Layout.js`
    - Added the marquee bar + non-blocking slime drip overlay.
    - Kept the existing nav/sidebar structure and chat widget mount point.
- Removed per-page `<style jsx>` so pages stop diverging:
  - `apps/admin-ui/pages/index.js` (landing hero now uses global classes)
  - `apps/admin-ui/pages/admin-api-usage.jsx`
  - `apps/admin-ui/pages/auth-me.jsx` (also renamed the div “table” to `.table-grid` to avoid clashing with real `<table class="table">`)
  - `apps/admin-ui/pages/guilds/[guildId]/settings.js` (moved to global grid/form helpers; inputs now use `.input`/`.select`/`.textarea`)

## Verification
- `pnpm -w lint`: PASS (warnings only; unchanged from baseline)
- `pnpm smoke:docker`: PASS
- Page-scoped styling removed:
  - `rg -n \"<style jsx\" apps/admin-ui/pages` returns no results

## Manual parity check (required)
1. Open these pages and confirm consistent theme (grid bg, typography, buttons, panels) and no layout regression:
   - `http://localhost:3001/` (landing)
   - `http://localhost:3001/status`
   - `http://localhost:3001/dashboard`
   - `http://localhost:3001/guilds`
   - `http://localhost:3001/snail`
   - `http://localhost:3001/chat`
2. Confirm chat widget still mounts and works (toggle + dock + send).
