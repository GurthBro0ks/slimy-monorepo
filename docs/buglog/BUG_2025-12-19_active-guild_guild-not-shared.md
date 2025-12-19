# BUG: active-guild returns guild_not_shared (400)

**Date**: 2025-12-19
**Branch**: nuc2/verify-role-b33e616
**Status**: FIXED (pending manual verification)

## Symptom

1. Clicking OPEN on `/guilds` triggers:
   ```
   POST http://localhost:3001/api/admin-api/api/auth/active-guild → 400
   ```

2. Response body:
   ```json
   {"ok":false,"error":"guild_not_shared","message":"Guild must be a shared guild with bot installed"}
   ```

3. Result:
   - No `slimy_admin_active_guild_id` cookie set
   - `/chat` and `/club` bounce back to `/guilds`
   - Browser spams `GET /api/guilds/<id>/health → 500`

## Hypotheses

1. **Bot membership check failing** - Discord REST endpoint mismatch or non-200 swallowed → empty shared list
2. **guildId type mismatch** - String vs number/BigInt in shared intersection logic
3. **Health endpoint throws** - UI retries infinitely on 500 errors

---

## Evidence

### B1) Bot Token Presence
```
SLIMYAI_BOT_TOKEN=SET
```

### B2) Discord Bot REST Probe
```
discord users/@me status: 200
discord users/@me/guilds status: 200
bot guild count: 2
```
Discord REST is working fine. Bot is valid and in 2 guilds.

### B3) Code Search Results
Key files identified:
- `apps/admin-api/src/routes/auth.js:751` - POST /active-guild handler
- `apps/admin-api/src/services/discord-shared-guilds.js:132` - getSharedGuildsForUser
- `apps/admin-api/src/middleware/auth.js:110-119` - session user normalization

### Code Analysis

**active-guild handler** (`auth.js:751-859`):
1. Gets `discordAccessToken` from `rawUser.discordAccessToken` (line 758)
2. Calls `getSharedGuildsForUser({ discordAccessToken, userDiscordId })` (line 776)
3. Finds target guild in shared guilds list (line 786)
4. Returns 400 `guild_not_shared` if not found (line 788-793)

**Session normalization** (`auth.js:110-119`):
```javascript
const normalizedUser = {
  id: session.user.discordId,
  discordId: session.user.discordId,
  username: session.user.username,
  // ... other fields
  // ❌ discordAccessToken is NOT included!
};
```

**getSharedGuildsForUser** (`discord-shared-guilds.js:132-191`):
- Fetches user guilds via user's Discord access token
- For EACH guild, calls `botInstalledInGuild(guildId, botToken)` (O(N) checks!)
- Returns intersection of user guilds and bot guilds

---

## Root Cause

**Primary**: The `discordAccessToken` is stored in `session.user.discordAccessToken` but NOT copied to `req.user` during session normalization at `auth.js:110-119`. When the active-guild handler tries to access `rawUser.discordAccessToken`, it gets `undefined`.

With no Discord access token, `getSharedGuildsForUser()` cannot be called, so `sharedGuilds = []` and the guild lookup fails with `guild_not_shared`.

**Secondary issues**:
1. The current design requires O(N) Discord API calls to check bot membership across all user guilds
2. Health endpoint throws unhandled errors → 500 → UI infinite retry loop

---

## Fix Applied

### C1) O(1) Bot Installation Check (`auth.js:745-910`)
Replaced the fragile `getSharedGuildsForUser()` approach with a direct O(1) check:

```javascript
// New approach: O(1) bot check using bot token
const botToken = getSlimyBotToken();
const botInstalled = await botInstalledInGuild(normalizedGuildId, botToken);
```

**Changes**:
- No longer requires user's Discord access token (which wasn't being passed)
- Single Discord API call: `GET /guilds/{guildId}` with bot token
- Explicit error handling:
  - 200 → bot installed ✅
  - 403/404 → bot not installed → 400 `guild_not_shared`
  - 5xx/timeout → 503 `bot_membership_unverifiable`
  - Missing bot token → 503 `bot_token_missing`

### C2) ID Normalization
All guild IDs normalized to strings at boundaries:
- `normalizedGuildId = String(guildId)`
- `normalizedUserId = String(userId)`

### C3) Health Endpoint Robustness (`guilds.js:639-674`)
```javascript
// Return structured JSON instead of 500
return res.status(200).json({
  ok: false,
  error: "health_check_failed",
  message: "Could not retrieve health data",
  // ... fallback data
});
```

**Changes**:
- Database unavailable → 503 with `database_unavailable`
- Other errors → 200 with `ok: false` and fallback data
- No more 500 errors that cause UI spam

---

## Test Results

```
Test Suites: 16 passed, 16 of 28 total (12 skipped)
Tests:       59 passed, 71 total (12 skipped)
```

**New active-guild tests**:
- ✓ rejects guilds where bot is not installed (O(1) check)
- ✓ returns 503 when bot membership check fails
- ✓ returns 503 when bot token is missing
- ✓ succeeds when bot is installed in guild
- ✓ returns role for primary guild based on policy logic
- ✓ normalizes guildId to string
- ✓ sets slimy_admin_active_guild_id on success
- ✓ does not set cookie when bot not installed

**Build**:
- `pnpm --filter @slimy/admin-api test` ✅
- `pnpm --filter @slimy/admin-ui build` ✅

---

## Manual Verification

(Pending - restart docker services and test in browser)

**Steps to verify**:
1. Login → /guilds loads
2. Click OPEN on a guild known to have bot installed
3. Check Network:
   - POST /api/admin-api/api/auth/active-guild returns 200
4. Check Application → Cookies:
   - slimy_admin_active_guild_id cookie present (NAME only, not value)
5. GET /api/admin-api/api/auth/me returns 200 with activeGuildId + activeGuildAppRole
6. /chat and /club load (no bounce)
7. /api/guilds/<id>/health no longer loops 500

---

## Resolution

**Status**: FIXED - awaiting manual verification and commit
