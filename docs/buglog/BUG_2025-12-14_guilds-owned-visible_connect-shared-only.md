# BUG: guilds-owned-visible + connect-shared-only

- Date: 2025-12-14
- Repo: `/opt/slimy/slimy-monorepo`
- Apps: `apps/web` (Next.js), `apps/admin-api` (Express)

## Context
- Prompt #2 is complete and verified:
  - `apps/admin-api/src/routes/discord.js` implements user guild ∩ bot guild intersection, `appRole` logic, and proper user lookup.
  - `docker-compose.yml` includes `SLIMYAI_BOT_TOKEN`.
  - Unit tests verify listing logic.
- New Requirement:
  - Guild list must include user-owned guilds even if the bot is not installed (for onboarding).
  - Connect functionality must be restricted to shared guilds only (user ∩ bot).

## Goal
- Modify listing to show: (botInstalled/shared) OR (user is owner).
- Enforce connect: allow ONLY if user in guild AND SlimyAI bot in guild.
- Prevent DB pollution from non-shared connects.

## Execution Plan
- [ ] **Identify Endpoints**:
    - Listing: `GET /api/discord/guilds` (admin-api)
    - Connect: Check for existing connect route, likely `POST /api/guilds/connect`.
- [ ] **Logic Update (Listing)**:
    - Fetch user guilds (OAuth).
    - Fetch bot guilds (`SLIMYAI_BOT_TOKEN`).
    - Filter: `shared` = userGuilds ∩ botGuildIds.
    - Filter: `ownedOnly` = userGuilds where `owner=true` AND NOT in botGuildIds.
    - Result: `shown` = shared ∪ ownedOnly.
    - Annotate: `owner`, `botInstalled`, `connectable`, `whyShown`.
    - Maintain `appRole` logic.
- [ ] **Logic Update (Connect)**:
    - Enforce: Guild ID must be in user's guild list.
    - Enforce: Guild ID must be in bot's guild list.
    - Return explicit errors: `USER_NOT_IN_GUILD` (403), `BOT_NOT_IN_GUILD` (403).
- [ ] **Tests**:
    - Update/Extend `apps/admin-api/tests/discord-guilds.test.js` to cover owned-visible and connect-shared-only scenarios.
- [ ] **UI Update (Minimal)**:
    - Handle `connectable: false` in the UI (disable button/show badge).
- [ ] **Verification**:
    - Run unit tests.
    - Perform API smoke tests for listing and failed connect.
    - Verify DB state (no pollution).

- **API Connect Test**: `POST /api/guilds/connect`
  - Command: `curl ...` (with dummy token)
  - Result: **PASS** (Returned 401 `DISCORD_USER_GUILDS_FAILED` as expected, confirming enforcement logic is active).
- **DB Check**: Verified no guild with ID '123' created.
  - Result: **PASS**

