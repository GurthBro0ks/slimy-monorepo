# BUG: auth-me-500-when-logged-in (2025-12-13)

## Context
- Detected repo path: `/home/mint/Desktop/slimy-monorepo` (LOCAL fallback; `/opt/slimy/slimy-monorepo` not present here)
- `git rev-parse --short HEAD`: `b302887`
- Architecture rules: `docs/AI_RULES.md`
- Security note: Discord credentials were shared in chat; they are treated as compromised and should be rotated. They are not recorded in this repo/log.

## Symptom (as reported)
- Browser shows Auth: **Logged in** (`/api/diag` → `authenticated: true`)
- But:
  - `GET http://localhost:3001/api/admin-api/api/auth/me` → **500**
  - Dashboard and `/status` console show the failing request.

## Repro Steps (Clean Session)
1. Clear cookies for `http://localhost:3001`.
2. Start stack with debug:
   - `ADMIN_AUTH_DEBUG=1 pnpm smoke:docker` (or `ADMIN_AUTH_DEBUG=1 docker compose up -d`)
3. Open `http://localhost:3001/status` → click **Login** → complete Discord OAuth.
4. Open `http://localhost:3001/dashboard`.
5. Observe `/api/admin-api/api/auth/me` → **500** (Internal Server Error).

## Evidence (Non-auth baseline)
### 1) `pnpm smoke:docker`
- PASS (baseline, logged-out) on this workstation.

### 2) Logged-out `/auth/me` is correctly `401`
- `curl -i http://localhost:3001/api/admin-api/api/auth/me`:
  - HTTP `401`
  - Body: `{"error":"unauthorized"}`

## Findings (Captured from Docker logs)
### 1) Root cause of the 500: missing Prisma tables (MySQL schema not migrated)
When calling `/api/auth/me` with an authenticated cookie, `admin-api` emitted Prisma errors:
- `The table \`users\` does not exist in the current database.`
- `The table \`user_guilds\` does not exist in the current database.`

This matches the behavior where login can “succeed” (DB sync is best-effort in `/api/auth/callback`), but `/api/auth/me` crashes when it tries to hydrate from DB.

Log excerpt (redacted, from `docker compose logs --tail 120 admin-api`):
```
Invalid `prisma.user.findUnique()` invocation:
The table `users` does not exist in the current database.
```

## Analysis (Most likely cause)
- `/api/auth/me` only executes DB reads when `req.user` is present (i.e. logged in).
- The handler currently does **DB access via Prisma** and returns **HTTP 500** on *any* exception.
- If Prisma DB is not initialized (or schema/tables are missing), login can still “succeed” because `/api/auth/callback` treats DB sync as best-effort, but `/api/auth/me` then throws and returns 500.

### Key code paths to inspect
- `/auth/me` handler:
  - `apps/admin-api/src/routes/auth.js` (look at the `router.get("/me", ...)` section)
- Prisma init / availability:
  - `apps/admin-api/src/lib/database.js` (`getClient()` throws if not initialized)
  - `apps/admin-api/server.js` (Prisma init is “optional”; app continues if init fails)
- Admin UI proxy (for cookie/header forwarding):
  - `apps/admin-ui/pages/api/admin-api/[...path].js`

## Plan (Evidence-driven)
1. **Identify the exact exception** thrown during `/api/auth/me` when logged in:
   - Reproduce in browser, then capture:
     - `docker compose logs --tail 200 admin-api` (must include stack / error message)
     - `docker compose logs --tail 200 admin-ui`
2. **Fix the root cause where possible** (DB init/config issues), but also:
3. **Make `/api/auth/me` degrade gracefully** (required):
   - If authenticated but DB reads fail, return HTTP `200` with partial session info and `warnings[]` instead of 500.
   - Only return HTTP `401` when unauthenticated.

## Expected behavior after fix
- Logged out:
  - `GET /api/auth/me` → `401 {"error":"unauthorized"}`
- Logged in:
  - `GET /api/auth/me` → `200` JSON (never 500), e.g.:
    - `{ id, username, role, sessionGuilds: [...], warnings: [] }`
  - If DB is unavailable:
    - `warnings` includes something like `db_unavailable` / `db_query_failed`

## Code Changes (Minimum)
### Admin API: make `/api/auth/me` resilient (no 500 for authenticated sessions)
- File: `apps/admin-api/src/routes/auth.js:373`
- Change summary:
  - Wrap Prisma access in nested try/catch and return HTTP `200` with `warnings[]` when DB reads fail.
  - Keep `401` for unauthenticated requests (`!req.user`).
  - Preserve existing response fields (`id`, `username`, `guilds`, `sessionGuilds`) for admin-ui compatibility.

## Verification (Pending)
### Required success metrics
- `/api/admin-api/api/auth/me` returns **200** in a browser session after login (no 500).
- `pnpm smoke:docker` PASS.
- `docker compose logs --tail 120 admin-api` shows **no unhandled exception** during `/auth/me`.

### Non-interactive verification (this workstation)
Because this environment cannot complete a real Discord OAuth round-trip, verification used a **synthetic JWT cookie** (generated inside the `admin-api` container using its `JWT_SECRET`) to force the authenticated code path:
- `GET http://localhost:3001/api/admin-api/api/auth/me`:
  - logged-out: HTTP `401` (expected)
  - with `Cookie: slimy_admin_token=<synthetic jwt>`: HTTP `200` and JSON includes `warnings` instead of crashing

Concrete results:
- `pnpm smoke:docker`: PASS (2025-12-13)
- Synthetic-auth `GET /api/admin-api/api/auth/me`: HTTP `200`
  - Example body (no secrets): includes `warnings: ["db_user_lookup_failed"]` when the DB schema is missing.

### To be filled after running a real login attempt
- Paste the admin-api stacktrace/error lines for the 500 (redact secrets).
- Record the before/after HTTP status for `/api/admin-api/api/auth/me` in the same browser session.
