# BUG: role-resolution-member-everywhere

- Date: 2025-12-14
- Repo: `/opt/slimy/slimy-monorepo` (workspace mirror: `/home/mint/Desktop/slimy-monorepo`)
- Apps: `apps/web` (Next.js), `apps/admin-api` (Express)

## Symptom (Reported)
- After Discord login, UI shows the user as `MEMBER` in servers where they are actually `ADMIN`/`OWNER`.
- Protected admin area `/guilds` behaves like the user is not admin (admin-only access denied / treated as member-only).

## Environment Facts (Provided)
- Target guild: `SlimyInvertebrates` (`1176605506912141444`)
- Discord role IDs:
  - Club role: `CormysBar` (`1178143391884775444`)
  - Admin roles:
    - `Managers` (`1216250443257217124`)
    - `Admin` (`1178129227321712701`)

## Current Behavior Snapshot (Pre-fix)
- `/guilds` (Protected admin): user is treated as non-admin, access denied or redirected away.
- `/club`: role-based behavior appears to treat user as `MEMBER`-only.
- `/snail`: role-based behavior appears to treat user as `MEMBER`-only.

## Findings (Root Cause)
- **Admin API session/JWT role never elevated:** `apps/admin-api/src/middleware/auth.js` was effectively leaving users as `member` because the session-token path read `session.user.role` (not a real DB field) and the JWT path often lacked guild-role hydration.
- **OAuth DB sync stored incomplete membership roles:** `apps/admin-api/src/routes/auth.js` only stored `["owner"]` for owners and `[]` for everyone else, ignoring Discord permission bitfields; this made admins look like members in DB-driven checks.
- **Web role guard shape mismatch:** the web auth context was storing the *entire* `/api/auth/me` response (often `{ user, role, ... }`) as `state.user`, so `ProtectedRoute` read `user.role` as `undefined` and treated the user as lowest role.
- **Server-side cookie mismatch:** server-side `requireAuth` didn’t recognize `slimy_admin_token`, causing Next.js API routes to behave unauthenticated in some flows.
- **Docker env mismatch for web→admin-api:** `ADMIN_API_INTERNAL_URL` was not set for the `web` service, causing `/api/auth/me` to fail server-side with DNS errors.

## Plan
Trace role derivation end-to-end and look for normalization / shape mismatches:
1) **Admin API auth middleware + session user payload**
   - Identify the canonical user id field (`id` vs `sub`) and how guild roles are derived.
   - Verify Discord guild membership roles (owner/admin/member) are computed correctly.
2) **`GET /api/auth/me` payload**
   - Confirm response includes correct user id + derived role flags + guild role map/list.
   - Check for shape mismatch bugs (`req.user.sub` vs `req.user.id`, `userId` vs `id`, etc.).
3) **Web `useAuth()` consumption**
   - Confirm `useAuth()` reads the `/api/auth/me` payload correctly.
   - Audit client/server role checks and route guards for `/guilds`, `/club`, `/snail`.

### Acceptance Tests
- Logged-in admin can access `/guilds` without being treated as member-only.
- Role-based routing lands on the correct dashboard:
  - admin → `/guilds`
  - club → `/club`
  - regular → `/snail`

## Fix Summary (Implemented)
- Admin API: derive and persist membership roles from Discord `permissions` bitfield during OAuth callback (`member`/`editor`/`admin`/`owner`) and optionally enrich the configured role guild via bot-token member-role IDs.
- Admin API: compute a global `req.user.role` from guild roles (supports markers + Discord role IDs) for both session-token and JWT auth paths; `/api/auth/me` now includes `lastActiveGuild`.
- Web: `/api/auth/me` now returns a flat user object with computed `role` (`admin|club|user`) and attached `guilds/sessionGuilds`; auth context and `ProtectedRoute` unwrap nested shapes safely.
- Web: `/api/discord/guilds` proxies to admin-api and returns `{ guilds: ... }` (correct shape for `GuildList`).
- Docker: `web` service now sets `ADMIN_API_INTERNAL_URL` so server-side proxies can reach `admin-api` on the compose network.

## Verification (Commands + Output)
### API: `/api/auth/me` (Admin API)
Unauthenticated baseline:
```bash
curl -i http://localhost:3080/api/auth/me
```
Output (trimmed):
```
HTTP/1.1 401 Unauthorized
{"error":"unauthorized"}
```

Authenticated check (synthetic JWT cookie, plus DB fixture user+guild+membership):
```bash
# Insert a fixture user + guild + membership with admin markers and the configured Discord role IDs
docker compose exec -T db mysql -u slimyai -pslimypassword -D slimyai -e \
  "INSERT INTO users (id, discord_id, username, global_name, avatar, last_active_guild_id, updated_at) VALUES \
  ('user_test_1','999999999999999999','RoleAdmin','Role Admin',NULL,'1176605506912141444', NOW(3)) \
  ON DUPLICATE KEY UPDATE username=VALUES(username), global_name=VALUES(global_name), last_active_guild_id=VALUES(last_active_guild_id), updated_at=NOW(3);"

docker compose exec -T db mysql -u slimyai -pslimypassword -D slimyai -e \
  "INSERT INTO guilds (id, discord_id, name, icon, owner_id, settings, updated_at) VALUES \
  ('1176605506912141444','1176605506912141444','SlimyInvertebrates',NULL,'user_test_1','{}', NOW(3)) \
  ON DUPLICATE KEY UPDATE name=VALUES(name), owner_id=VALUES(owner_id), settings=VALUES(settings), updated_at=NOW(3);"

docker compose exec -T db mysql -u slimyai -pslimypassword -D slimyai -e \
  "INSERT INTO user_guilds (id, user_id, guild_id, roles) VALUES \
  ('ug_test_1','user_test_1','1176605506912141444', JSON_ARRAY('member','admin','1216250443257217124','1178129227321712701','1178143391884775444')) \
  ON DUPLICATE KEY UPDATE roles=VALUES(roles);"

# Mint a JWT for the fixture user (uses the admin-api container's configured JWT secret)
TOKEN=$(docker compose exec -T admin-api node -e "const { signSession } = require('./lib/jwt'); console.log(signSession({ user: { id: '999999999999999999', username: 'RoleAdmin' } }))" | tail -n 1)

curl -i --cookie "slimy_admin_token=$TOKEN" http://localhost:3080/api/auth/me
```
Output (trimmed):
```
HTTP/1.1 200 OK
{"id":"999999999999999999",...,"role":"admin","lastActiveGuild":{"id":"1176605506912141444","name":"SlimyInvertebrates",...},"guilds":[{"id":"1176605506912141444",...,"roles":["member","admin","1216250443257217124","1178129227321712701","1178143391884775444"]}],...}
```

### Web: `/api/auth/me` (Next.js proxy)
```bash
curl -i --cookie "slimy_admin_token=$TOKEN" http://localhost:3000/api/auth/me
```
Output (trimmed):
```
HTTP/1.1 200 OK
{"id":"999999999999999999",...,"role":"admin","lastActiveGuildId":"1176605506912141444",...}
```

### Tests
```bash
pnpm --filter @slimy/admin-api test
pnpm --filter @slimy/web test
```
Output (trimmed):
```
@slimy/admin-api: PASS
@slimy/web: 25 passed (267 tests)
```
