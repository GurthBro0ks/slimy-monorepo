# Slimy Dev Sanity Checklist

## 1) Prerequisites
- **Node/pnpm**: Node 20+ and pnpm installed globally.
- **One-time setup (repo root)**:
  ```bash
  pnpm install
  pnpm prisma:generate   # generates Prisma clients for web + admin-api
  ```
- **Env files (sandbox first, then live-local)**:
  - **Web (apps/web/.env.local)**  
    - Sandbox: set only `NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes` and leave `NEXT_PUBLIC_ADMIN_API_BASE` unset/commented to stay on mock data.  
    - Live/local admin-api: add `NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080`.
  - **Admin API (apps/admin-api/.env.admin)** – copy from `.env.example` and fill:
    - `PORT=3080`, `HOST=127.0.0.1`
    - `CORS_ORIGIN=http://localhost:3000`
    - `JWT_SECRET` and `SESSION_SECRET` = any 32+ char dev strings
    - `DISCORD_CLIENT_ID/SECRET` = safe dummy strings for local only
    - `DISCORD_REDIRECT_URI=http://localhost:3080/api/auth/callback`
    - Optional: `DATABASE_URL` / `DB_URL` for MySQL/Postgres if you want real data; leave empty for read-only boot.

## 2) Quick Commands
- Terminal 1 (root): `pnpm dev:admin-api` (listens on http://localhost:3080)
- Terminal 2 (root): `pnpm dev:web` (Next.js on http://localhost:3000)
- Notes: stop any process already using ports 3000/3080. Admin-ui/bot aren’t needed for this pass.

## 3) Web App Click-Through
- **/** (Home) — Hero logo + “Panel of Power” heading, four feature cards, “Login with Discord” button.  
  - Sandbox: login button logs a console warning (no admin-api base).  
  - Live: button redirects to admin-api Discord OAuth.
- **/usage** — “Usage Dashboard” title, two summary cards (Current Usage + Service Status), progress bar, usage details list, footer text “refreshes every 30 seconds”. Data is mocked; errors show red callout.
- **/status** — “System Status” title, cards for “Admin API” and “Codes Aggregator” with badges.  
  - Sandbox: Admin API badge shows “Not configured”; codes call should still return counts from aggregator.  
  - Live: Admin API card should turn green after `/api/diag` succeeds; refresh button works.
- **/snail** — “Snail Dashboard” heading, timeline panel, “Quick Tools” cards (only “Secret Codes” enabled). Callout reminds you to connect admin-api.
- **/snail/codes** (Protected) — Tabs for Active/Past 7/All, search box, “Copy All” card, table with source badges and “Report dead” buttons. Requires login; without admin-api you’ll be redirected home. Live mode pulls from `/api/codes` (Snelp + Reddit).
- **/club** (Protected) — “Club Analytics” header, summary cards (members, power, avg change, top member), rankings table, refresh button. Sandbox banner appears only if admin-api base is missing; with admin-api + login it calls real data via `/api/club/latest`. Without auth you’ll bounce back home.
- **/analytics** — Renders analytics dashboard (charts, exports, SSE indicator) and calls `/api/stats` proxy; expect errors if admin-api is down/unconfigured.
- **/guilds** (Protected admin) — Admin Panel heading, info callout, placeholder card noting guild list appears when admin-api is connected; requires admin role.
- Not present: dedicated `/login`, `/dashboard`, `/tiers`, `/screenshots` routes (expect 404 if visited).
- Watch for: browser 500s, red error callouts, empty states that stay empty after refresh, protected pages redirecting unexpectedly when admin-api isn’t configured.

## 4) Admin API Sanity Checks (http://localhost:3080)
- Health: `curl http://localhost:3080/api/health` → `{ ok: true, service: "admin-api", env, timestamp }`.
- Diag: `curl -i http://localhost:3080/api/diag` (requires auth cookie) → 401 if not logged in; when authed returns `{ ok: true, admin: { uptimeSec, memory, node }, uploads: {...} }`.
- Usage summary: `curl -i --cookie "slimy_admin=..." "http://localhost:3080/api/guilds/<guildId>/usage"` → `{ ok: true, guildId, usage: {...} }` (needs DB + guild access).
- Snail codes: `curl -i --cookie "slimy_admin=..." "http://localhost:3080/api/guilds/<guildId>/snail/codes"` → `{ ok: true, codes: [...] }` (requires auth + guild).
- Club metrics: `curl -i --cookie "slimy_admin=..." "http://localhost:3080/api/guilds/<guildId>/club/latest"` → `{ ok: true, guildId, members: [...] }`.
- Note: there is no `/api/status`; use `/api/health` or `/api/diag` instead.

## 5) Troubleshooting Notes
- Server won’t start: ensure `CORS_ORIGIN` and `JWT_SECRET` are set in `apps/admin-api/.env.admin`; see docs/DEV_WORKFLOW.md.
- Prisma errors: rerun `pnpm prisma:generate`; verify DB_URL/DATABASE_URL format; see docs/CLUB_SCHEMA_MIGRATION.md for schema setup.
- Missing env vars: copy `.env.example` templates; web needs `NEXT_PUBLIC_SNELP_CODES_URL`; admin-api needs `CORS_ORIGIN` at minimum.
- CORS/auth issues: `CORS_ORIGIN` must match the web origin (http://localhost:3000); login redirects via `DISCORD_REDIRECT_URI`; see docs/WEB_BACKEND_INTEGRATION_SUMMARY.md and docs/ADMIN_API_OBSERVABILITY.md for error formats/logging tips.
