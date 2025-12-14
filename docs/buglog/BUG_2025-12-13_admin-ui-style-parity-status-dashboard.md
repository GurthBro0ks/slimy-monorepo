# BUGLOG: admin-ui-style-parity-status-dashboard (2025-12-13)

## Context
- Repo path: `/home/mint/Desktop/slimy-monorepo`
- Git HEAD: `b302887`
- Architecture rules: `docs/AI_RULES.md`
- Goal: make `apps/admin-ui/pages/status.jsx` and `apps/admin-ui/pages/dashboard.jsx` visually match existing Admin UI pages by reusing the established layout/components/styles (no new styling system).

## Symptom / Why this exists
- `/status` and `/dashboard` functionally work, but parts of their UI look “placeholder” compared to the rest of Admin UI.
- Some pages use ad-hoc `<style jsx>` blocks (scoped) that redefine `.btn`/layout spacing, making those pages diverge from the global design language.
- (Optional) logged-in user sometimes shows as “Unknown” when a better fallback exists.

## Repro (visual)
1. Start stack.
2. Open:
   - `http://localhost:3001/guilds` (example “good” page)
   - `http://localhost:3001/chat` (example “good” page; includes chat UI patterns)
   - `http://localhost:3001/status`
   - `http://localhost:3001/dashboard`
3. Compare: sidebar spacing, card/panel styling, button styling, typography.

## Inventory (canonical “look” sources)
- Layout wrapper:
  - `apps/admin-ui/components/Layout.js`
  - Used across “good pages” like `apps/admin-ui/pages/guilds/index.js` and `apps/admin-ui/pages/chat/index.js`
- Global styling:
  - `apps/admin-ui/pages/_app.js` imports `apps/admin-ui/styles/globals.css`
  - Common primitives in `apps/admin-ui/styles/globals.css`: `.panel`, `.card`, `.card-grid`, `.btn`, `.btn.outline`, `.table`, `.input`, `.select`

## Chat widget (must not break)
- Component: `apps/admin-ui/components/SlimeChatWidget.tsx`
- Mounted from: `apps/admin-ui/components/Layout.js` (always) + `SlimeChatBar` (when `user` is present)
- Requirement: keep `Layout` usage so widget behavior remains identical to established pages.

## Plan
1. Refactor `apps/admin-ui/pages/status.jsx`:
   - Remove page-specific `<style jsx>` that redefines `.btn` and custom layout scaffolding.
   - Use `Layout title="Status"` and global primitives (`card`, `card-grid`, `btn`, `btn outline`).
2. Refactor `apps/admin-ui/pages/dashboard.jsx`:
   - Keep existing `Layout` wrapper.
   - Replace any “Unknown” display fallbacks with `displayName = globalName || username || discordId`.
   - Prefer existing global primitives over bespoke markup where feasible (no redesign).
3. Verify:
   - `pnpm smoke:docker` PASS
   - Manual: `/status` + `/dashboard` match other pages’ look; chat widget still appears; no console errors.

## Changes Applied
- `apps/admin-ui/pages/status.jsx`
  - Removed scoped `<style jsx>` and replaced the page structure with existing global primitives (`.card`, `.card-grid`, `.btn`, `.btn.outline`) while keeping the same API checks and login/logout wiring.
- `apps/admin-ui/pages/dashboard.jsx`
  - Kept the existing `Layout` wrapper (so nav + chat widget mounting stays identical).
  - Fixed logged-in display fallback: `globalName || username || discordId || id`.
  - Wrapped dashboard content in a max-width container and reused existing `.panel-header` + `.card` patterns (no new CSS).

## Verification
- `pnpm smoke:docker`: PASS (2025-12-13)
- Smoke confirms:
  - `/dashboard` returns `307` when logged out
  - `/dashboard` returns `200` with synthetic auth cookie
  - `/api/admin-api/api/health` and `/api/admin-api/api/diag` still OK through proxies
  - `/api/admin-api/api/auth/me` returns `401` when logged out
- Manual (TODO / required for visual parity):
  - Login, open `http://localhost:3001/dashboard` and `http://localhost:3001/status`, confirm:
    - same sidebar/topnav spacing and fonts as `/guilds` and `/chat`
    - chat widget still appears and behaves normally
    - no console errors
