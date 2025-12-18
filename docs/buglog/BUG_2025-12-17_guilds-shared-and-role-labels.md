# BUG 2025-12-17 — guilds shared and role labels

Task: Step 1 — /api/guilds = (user ∩ SlimyAI bot) + roleLabel

## Symptom
- User shows as member everywhere
- Guild list wrong because intersection is against admin bot (shares none) instead of SlimyAI bot

## Safety
- No secrets/tokens/cookies printed

## Implementation
- Shared guild filtering now uses SlimyAI bot membership (SLIMYAI_BOT_TOKEN) per-guild via Discord REST: GET /guilds/{guildId}
- /api/guilds and /api/discord/guilds now return only shared guilds (user ∩ SlimyAI bot)
- Primary guild roleLabel computed via member roles (GET /guilds/{primary}/members/{userId}); fallback to permissions for admin labeling when role fetch fails
- Response includes roleLabel + roleSource, plus compatibility fields (role/installed/botInGuild)

## Files Changed
- apps/admin-api/src/services/discord-shared-guilds.js (new)
- apps/admin-api/src/routes/discord.js
- apps/admin-api/src/routes/guilds.js
- apps/admin-api/tests/discord-guilds.test.js
- apps/admin-api/tests/guild-connect.test.js
- apps/admin-api/tests/guilds-connect.test.js
- apps/admin-ui/pages/guilds/index.js
- apps/web/components/dashboard/guild-list.tsx

## Verification
Commands run (no secrets):
- pnpm --filter @slimy/admin-api test
  - Result: PASS
- pnpm smoke:docker
  - First run: FAIL (port 3080 collision due to legacy container slimy-admin-api)
  - Remediation: docker rm -f slimy-admin-api
  - Second run: PASS (Docker baseline smoke test)

Evidence excerpts:
- admin-api tests: "Test Suites: ... 12 passed"
- smoke:docker: "PASS: Docker baseline smoke test"
