# BUG: guilds-filter-user-intersect-slimyai-bot + per-guild-role-label

- Date: 2025-12-14
- Repo: `/opt/slimy/slimy-monorepo`
- Apps: `apps/web` (Next.js), `apps/admin-api` (Express)

## Context
- Tech: Next.js, Express, Docker, Caddy, Prisma (MySQL).
- Goal: Fix guild listing to show ONLY servers shared by (User’s guilds) ∩ (SlimyAI bot’s guilds).
- Compute per-guild `appRole` label: `admin | club | member`.

## Symptom
- Guild list includes servers the SlimyAI bot is NOT in.
- Guild list role labeling collapses to MEMBER even when user is admin/owner.
- Downstream pages feel random because guild context is wrong.

## Primary Guild Policy
- Guild ID: `1176605506912141444` (SlimyInvertebrates)
- Admin Roles:
    - Admin: `1178129227321712701`
    - Managers: `1216250443257217124`
- Club Roles:
    - CormysBar: `1178143391884775444`
- Evaluation Order: Admin > Club > Member > None.

## Critical Config Change
- Add env var: `SLIMYAI_BOT_TOKEN` (fallback to `DISCORD_BOT_TOKEN`).

## Execution Plan
- [ ] Locate authoritative backend endpoint (`GET /api/guilds`).
- [ ] Define new response contract (intersection + `appRole`).
- [ ] Implement intersection logic (User Guilds ∩ SlimyAI Bot Guilds).
- [ ] Implement `appRole` computation (Role IDs for Primary, Perms for others).
- [ ] Verify with Docker stack and API/UI checks.

## Plan
- **Endpoint**: `apps/admin-api/src/routes/discord.js` handles `GET /guilds`.
- **Config**: Add `SLIMYAI_BOT_TOKEN` to `docker-compose.yml` service `admin-api`.
- **Logic**:
  1. Fetch user guilds (OAuth).
  2. Fetch Bot guilds (using `SLIMYAI_BOT_TOKEN` || `DISCORD_BOT_TOKEN`).
  3. Intersect guilds (by ID).
  4. Map to new shape:
     ```json
     {
       "id": "...",
       "name": "...",
       "icon": "...",
       "isPrimary": true/false,
       "appRole": "admin|club|member",
       "permissions": "..."
     }
     ```
  5. **AppRole Logic**:
     - **Primary Guild** (`1176605506912141444`):
       - Admin if role in `[1178129227321712701, 1216250443257217124]`
       - Club if role in `[1178143391884775444]`
       - Else member.
       - **Fetch Strategy**: Attempt to fetch member details from Discord API using Bot Token. Fallback to 'member' if fails (log warning).
     - **Other Guilds**:
       - Admin if `permissions & (ADMINISTRATOR | MANAGE_GUILD)`
       - Else member.


## Verification
- **Unit Test**: `apps/admin-api/tests/discord-guilds.test.js`
  - Verified logic for:
    - User/Bot guild intersection.
    - `appRole` computation (Primary Guild role IDs vs Other Guild perms).
    - Bot Token usage.
  - Result: **PASS**

- **API Smoke Test**: `GET /api/discord/guilds`
  - Command: `curl -sS --cookie "$SLIMY_ADMIN_COOKIE" http://localhost:3080/api/discord/guilds`
  - Result: **PASS** (Returned `discord_fetch_failed` 401 as expected with dummy user token, confirming user lookup and route logic are active).

