# BUG_2025-12-18_active-guild-cookie-missing

## Symptom
- Browser does not show `slimy_admin_active_guild_id`, so admin-ui proxy cannot inject `x-slimy-active-guild-id`, and server-side role/guild gating stays unstable.

## Evidence (code pointers)
### rg -n "ACTIVE_GUILD_COOKIE_NAME|slimy_admin_active_guild_id|active-guild|x-slimy-active-guild-id" apps/admin-api/src/routes/auth.js apps/admin-ui/pages/api/admin-api/[...path].js apps/admin-ui/lib/active-guild.js apps/admin-ui/components/Layout.js apps/admin-ui/pages/guilds/index.js
```
apps/admin-ui/pages/guilds/index.js
9:import { writeActiveGuildId } from "../../lib/active-guild";
49:    const response = await fetch("/api/admin-api/api/auth/active-guild", {
78:    // 1. Call POST /api/admin-api/api/auth/active-guild to set active guild server-side

apps/admin-ui/lib/active-guild.js
5:export const ACTIVE_GUILD_ID_KEY = "slimy_admin_active_guild_id";
101:    const response = await fetch("/api/admin-api/api/auth/active-guild", {

apps/admin-ui/pages/api/admin-api/[...path].js
100:    .find((c) => c.startsWith("slimy_admin_active_guild_id="));
113:    ...(activeGuildId ? { "x-slimy-active-guild-id": activeGuildId } : null),

apps/admin-api/src/routes/auth.js
20:const ACTIVE_GUILD_COOKIE_NAME = "slimy_admin_active_guild_id";
565:      const headerActiveGuild = req.headers["x-slimy-active-guild-id"];
571:      if (!activeGuildId && req.cookies?.[ACTIVE_GUILD_COOKIE_NAME]) {
572:        activeGuildId = String(req.cookies[ACTIVE_GUILD_COOKIE_NAME]);
745: * POST /api/auth/active-guild
751:router.post("/active-guild", async (req, res) => {
781:        console.warn("[auth/active-guild] Failed to fetch shared guilds:", err?.message || err);
830:        console.warn("[auth/active-guild] Failed to update lastActiveGuildId:", err?.message || err);
837:    res.cookie(ACTIVE_GUILD_COOKIE_NAME, normalizedGuildId, {
852:    console.error("[auth/active-guild] Error:", err);
865:  res.clearCookie(ACTIVE_GUILD_COOKIE_NAME, {

apps/admin-ui/components/Layout.js
9:import { ensureActiveGuildCookie, readActiveGuildSyncInfo, useActiveGuild } from "../lib/active-guild";
```

## Evidence (runtime)
- Not yet collected in this report. Use the probe script below to capture POST/Set-Cookie behavior without logging secrets.

### Probe command
```bash
/opt/slimy/slimy-monorepo/scripts/smoke/active-guild-cookie-probe.sh
```

### Probe output (paste redacted results here)
```
# pending
```

## Changes
- Added a client-side active-guild cookie sync helper and a Layout hook that re-syncs on deep links and refreshes the session.
- Added debug readout entries for last sync attempt and session-reported active guild state.
- Added a CLI probe script to validate POST/Set-Cookie behavior without logging secrets.

## Notes
- No cookie option changes were made because runtime evidence of cookie blocking has not been captured yet.

## Verification
```bash
cd /opt/slimy/slimy-monorepo
scripts/smoke/active-guild-cookie-probe.sh

cd apps/admin-api
npm test -- active-guild
```

### Test output: npm test -- active-guild
```
> @slimy/admin-api@1.0.0 test
> jest active-guild

PASS tests/auth/active-guild.cookie.test.js
  POST /api/auth/active-guild cookie
    ✓ sets slimy_admin_active_guild_id on success (55 ms)

PASS tests/auth/active-guild.test.js
  POST /api/auth/active-guild
    ✓ rejects guilds that are not shared/connectable (11 ms)
    ✓ returns role for primary guild based on policy logic (5 ms)

Test Suites: 2 passed, 2 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        0.937 s, estimated 1 s
Ran all test suites matching /active-guild/i.
```

## Final verification notes
- Unit tests for active-guild passed.
- Manual browser deep-link + cookie probe still required to confirm Set-Cookie behavior in Chrome.
