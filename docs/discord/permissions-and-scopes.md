# Discord Permissions and Scopes

This document outlines the Discord OAuth2 scopes, bot permissions, and intents required by Slimy.ai, along with their purposes and security considerations.

## Table of Contents

- [Overview](#overview)
- [OAuth2 Scopes](#oauth2-scopes)
- [Bot Permissions](#bot-permissions)
- [Discord API Endpoints Used](#discord-api-endpoints-used)
- [Security Considerations](#security-considerations)
- [Least Privilege Plan](#least-privilege-plan)

## Overview

Slimy.ai uses Discord's REST API (v10) for authentication and data retrieval. The application does not use a Discord.js client with Gateway connections, but instead uses direct REST API calls with bot token authentication.

**Architecture:**
- **OAuth2 Flow**: User authentication via Discord OAuth2
- **Bot Token**: REST API calls for guild and member verification
- **No Gateway Connection**: No real-time events or intents

## OAuth2 Scopes

OAuth2 scopes are requested during the user login flow to access user information.

### `identify`

**Purpose:**
- Retrieve basic user profile information (ID, username, avatar, global name)
- Create authenticated sessions for users
- Display user identity in the admin interface

**Usage in Code:**
- `apps/admin-api/src/routes/auth.js:158` - Fetches user data via `GET /users/@me`
- `apps/admin-api/src/routes/auth.js:330-337` - Stores user profile in session

**Security Considerations:**
- **Minimal Risk**: Only provides basic public profile information
- **No Sensitive Data**: Does not expose email, phone, or private information
- **User Control**: Users authorize this during OAuth flow
- **Revocable**: Users can revoke access at any time via Discord settings

**Necessity:** ✅ **Required** - Essential for user authentication and session management

---

### `guilds`

**Purpose:**
- Retrieve list of Discord servers (guilds) the user is a member of
- Determine user's role/permissions in each guild
- Enable guild-based access control for the admin panel

**Usage in Code:**
- `apps/admin-api/src/routes/auth.js:159-161` - Fetches user's guilds via `GET /users/@me/guilds`
- `apps/admin-api/src/routes/auth.js:167-168` - Checks ADMINISTRATOR and MANAGE_GUILD permissions
- `apps/admin-api/src/routes/auth.js:174-318` - Enriches guild data with bot membership status

**Security Considerations:**
- **Low Risk**: Only shows guild names, IDs, and icons
- **Permission Check**: Used to verify if user has admin rights (ADMINISTRATOR or MANAGE_GUILD)
- **Access Control**: Critical for determining which guilds users can manage
- **No Guild Content**: Does not expose messages, channels, or member data

**Necessity:** ✅ **Required** - Essential for role-based access control and guild management

---

## Bot Permissions

The bot uses a Bot Token for authenticated REST API requests. No Discord Gateway intents are used since there is no real-time connection.

### Read Messages / View Channel

**Permission Bit:** Implied by channel access in REST API

**Purpose:**
- Fetch messages from the official Super Snail Discord channel
- Extract game redemption codes from Discord messages
- Monitor announcements for new codes

**Usage in Code:**
- `apps/web/lib/adapters/discord.ts:90-98` - Fetches messages via `GET /channels/{CHANNEL_ID}/messages?limit=100`
- `apps/web/lib/adapters/discord.ts:21-62` - Extracts codes using regex pattern matching

**Security Considerations:**
- **Channel-Specific**: Only accesses specific channel ID `1118010099974287370`
- **Read-Only**: No message creation or modification capabilities
- **Public Channel**: Appears to be a public announcement channel
- **Rate Limited**: Implements rate limit handling (429 status)
- **Cached**: 10-minute cache to reduce API calls

**Necessity:** ✅ **Required** - Core functionality for code aggregation feature

---

### View Guild Information

**Permission Bit:** Implied by bot membership

**Purpose:**
- Verify bot is installed in user's guilds
- Retrieve guild metadata (name, icon)
- Confirm guild configuration is correct

**Usage in Code:**
- `apps/admin-api/src/routes/auth.js:212-218` - Fetches guild details via `GET /guilds/{id}`
- Used for guild intersection check (line 200-237)

**Security Considerations:**
- **Basic Metadata Only**: Guild name, ID, icon
- **No Sensitive Data**: Does not access channels, messages, or member lists
- **Verification Purpose**: Ensures bot has proper access
- **Timeout Protected**: 2-second timeout per guild check

**Necessity:** ✅ **Required** - Needed to verify bot installation and guild status

---

### View Guild Members

**Permission Bit:** Implied by member API access

**Purpose:**
- Verify user membership in guilds
- Retrieve user's roles in each guild
- Determine admin/club/member status for access control

**Usage in Code:**
- `apps/admin-api/src/routes/auth.js:220-233` - Fetches member info via `GET /guilds/{id}/members/{user_id}`
- `apps/admin-api/src/routes/auth.js:242` - Resolves role level from role IDs
- Used for authorization checks

**Security Considerations:**
- **Single User Only**: Only fetches authenticated user's member data
- **Role-Based Access**: Critical for determining user permissions
- **No Bulk Access**: Does not enumerate all guild members
- **Graceful Fallback**: Falls back to OAuth permissions if bot token unavailable

**Necessity:** ✅ **Required** - Essential for role-based authorization

---

## Bot Permissions Checked (OAuth Guild Permissions)

These permissions are checked on the user's OAuth token to determine their role.

### ADMINISTRATOR (`0x0000000000080000`)

**Purpose:**
- Identify users with full server administration rights
- Grant "admin" role in Slimy.ai admin panel
- Allow full access to guild management features

**Usage in Code:**
- `apps/admin-api/src/routes/auth.js:168` - Permission constant definition
- `apps/admin-api/src/routes/auth.js:178,247,297` - Permission check logic

**Security Considerations:**
- **High Trust Level**: Indicates user is a server administrator
- **Discord-Verified**: Permission verified by Discord OAuth API
- **Full Access**: Users with this permission get full admin panel access
- **Guild Owner**: Guild owners automatically have this permission

**Necessity:** ✅ **Required** - Primary admin role identification

---

### MANAGE_GUILD (`0x0000000000000020`)

**Purpose:**
- Identify users with guild management permissions
- Grant "admin" role in Slimy.ai (equivalent to ADMINISTRATOR)
- Allow guild configuration management

**Usage in Code:**
- `apps/admin-api/src/routes/auth.js:167` - Permission constant definition
- `apps/admin-api/src/routes/auth.js:180,249,299` - Secondary admin check

**Security Considerations:**
- **Moderate Trust Level**: Less powerful than ADMINISTRATOR but still trusted
- **Guild Management**: Sufficient for managing guild integrations
- **Elevated Access**: Treated as admin-level in Slimy.ai
- **Discord Standard**: Common permission for server managers

**Necessity:** ✅ **Required** - Secondary admin role identification for users without full admin

---

## Discord API Endpoints Used

### OAuth2 Endpoints

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/oauth2/authorize` | GET | Initiate OAuth flow | None (public) |
| `/oauth2/token` | POST | Exchange code for token | Client credentials |

**Files:**
- `apps/admin-api/src/routes/auth.js:108-119` - Login redirect
- `apps/admin-api/src/routes/auth.js:139-155` - Token exchange

---

### User Endpoints

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/users/@me` | GET | Get authenticated user info | Bearer token (OAuth) |
| `/users/@me/guilds` | GET | Get user's guild list | Bearer token (OAuth) |

**Files:**
- `apps/admin-api/src/routes/auth.js:158` - User info
- `apps/admin-api/src/routes/auth.js:159` - User guilds

---

### Guild Endpoints

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/guilds/{id}` | GET | Get guild details | Bot token |
| `/guilds/{id}/members/{user_id}` | GET | Get member info and roles | Bot token |

**Files:**
- `apps/admin-api/src/routes/auth.js:212` - Guild details
- `apps/admin-api/src/routes/auth.js:220` - Member roles

---

### Channel Endpoints

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/channels/{id}/messages` | GET | Fetch channel messages | Bot token |

**Files:**
- `apps/web/lib/adapters/discord.ts:90-98` - Message fetching

---

## Security Considerations

### Overall Security Posture

**Strengths:**
1. ✅ **Minimal Scope Request**: Only requests `identify` and `guilds` scopes
2. ✅ **No Gateway Connection**: Reduces attack surface (no WebSocket vulnerabilities)
3. ✅ **No Message Sending**: Bot cannot send messages or modify server content
4. ✅ **Rate Limit Handling**: Proper 429 status handling with retry logic
5. ✅ **Timeout Protection**: 2-second timeout on guild checks prevents hanging
6. ✅ **CSRF Protection**: OAuth state parameter with nonce verification
7. ✅ **Secure Cookies**: httpOnly, secure, sameSite cookies for session management
8. ✅ **No Token Storage**: Access tokens stored server-side, not exposed to client

**Areas of Concern:**
1. ⚠️ **Bot Token in Environment**: Bot token stored in environment variables (standard practice, but sensitive)
2. ⚠️ **No Token Refresh Logic**: Access tokens may expire; no visible refresh implementation
3. ⚠️ **Hardcoded Channel ID**: Channel ID hardcoded in source code (low risk, but inflexible)
4. ⚠️ **No Scope Validation**: No verification that received scopes match requested scopes
5. ⚠️ **Parallel Guild Checks**: Multiple concurrent API calls could trigger rate limits

---

### Permission Risks if Misused

#### OAuth2 Scopes

**`identify` Misuse Scenarios:**
- **Impersonation**: If access token is stolen, attacker could impersonate user
- **Privacy Leak**: User ID and username could be exposed if sessions are compromised
- **Mitigation**: Secure session storage, JWT signing, httpOnly cookies

**`guilds` Misuse Scenarios:**
- **Guild Enumeration**: Attacker could discover which servers a user is in
- **Permission Escalation**: If permission checks are bypassed, unauthorized access to guilds
- **Mitigation**: Server-side permission validation, secure session management

---

#### Bot Token

**Bot Token Misuse Scenarios:**
- **Full Bot Control**: If bot token is leaked, attacker has full bot API access
- **Data Exfiltration**: Could read all messages in accessible channels
- **Guild Information Leak**: Could enumerate all guilds bot is in
- **API Abuse**: Could trigger rate limits affecting legitimate users
- **Mitigation**:
  - Rotate bot token if compromised
  - Restrict bot permissions to minimum required
  - Monitor for unusual API usage patterns
  - Use environment variables (never commit to git)

---

### Current Security Best Practices

1. **Environment Variables**: All secrets stored in `.env` files (gitignored)
2. **No Hardcoded Secrets**: Client ID/secret loaded from config
3. **State Parameter**: CSRF protection in OAuth flow
4. **Secure Cookies**: httpOnly, secure (in production), sameSite
5. **Timeout Protection**: Prevents hanging on slow Discord API responses
6. **Error Handling**: Graceful degradation when bot token unavailable
7. **Rate Limit Handling**: Proper 429 status code handling

---

## Least Privilege Plan

### Current State

The application requests minimal scopes and operates with a reasonable security posture. However, there are opportunities to further reduce required permissions and improve security.

---

### Short-Term Improvements (0-3 months)

#### 1. Implement Token Refresh
**Status:** ❌ Not Implemented

**Current Issue:**
- OAuth access tokens expire after ~7 days
- No refresh token implementation visible
- Users must re-authenticate when token expires

**Improvement:**
```javascript
// apps/admin-api/src/services/oauth.js
async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: config.discord.clientId,
    client_secret: config.discord.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(`${config.discord.tokenUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  return response.json();
}
```

**Benefit:** Reduces re-authentication friction, improves user experience

---

#### 2. Add Scope Validation
**Status:** ❌ Not Implemented

**Current Issue:**
- No verification that Discord returned the requested scopes
- Could lead to unexpected behavior if scopes are denied

**Improvement:**
```javascript
// apps/admin-api/src/routes/auth.js - After token exchange
const expectedScopes = SCOPES.split(' ');
const receivedScopes = tokens.scope.split(' ');

if (!expectedScopes.every(scope => receivedScopes.includes(scope))) {
  return res.redirect('/?error=insufficient_scopes');
}
```

**Benefit:** Ensures application has required permissions before proceeding

---

#### 3. Implement Permission Scoping for Bot Token
**Status:** ⚠️ Partial

**Current Issue:**
- Bot token has full bot permissions
- No fine-grained control over what bot can access

**Improvement:**
- Create separate bot account for read-only operations
- Use application-specific tokens when Discord supports them
- Document minimum bot permissions required in Discord Developer Portal

**Minimum Bot Permissions Required:**
- ✅ View Channels
- ✅ Read Message History
- ❌ Send Messages (not needed)
- ❌ Manage Messages (not needed)
- ❌ Manage Roles (not needed)

**Benefit:** Reduces blast radius if bot token is compromised

---

### Medium-Term Improvements (3-6 months)

#### 4. Remove Guild Enumeration Capability
**Status:** 🔄 Consideration

**Current State:**
- `guilds` scope provides full list of user's servers
- Used primarily for permission checking

**Alternative Approach:**
- Use Discord's "Install Link" with pre-selected guild
- Only request `identify` scope
- Verify guild membership via bot token check only
- Reduces OAuth scope to absolute minimum

**Implementation:**
```javascript
// Instead of: const userGuilds = await fetchJson(`${DISCORD.API}/users/@me/guilds`)
// Use: Bot token to check if user is member of specific guild when they attempt access

async function verifyGuildMembership(guildId, userId) {
  const response = await fetch(
    `${DISCORD.API}/guilds/${guildId}/members/${userId}`,
    { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
  );
  return response.ok;
}
```

**Trade-offs:**
- ➕ Reduced OAuth scope (better privacy)
- ➕ Less data stored in session
- ➖ Requires guild context to be provided (e.g., URL parameter)
- ➖ Cannot show "select a guild" interface

**Benefit:** Significant privacy improvement, reduces OAuth attack surface

---

#### 5. Implement Channel-Specific Bot Permissions
**Status:** ❌ Not Implemented

**Current State:**
- Bot has blanket channel read access
- Hardcoded channel ID in source code

**Improvement:**
- Use Discord's "Thread Channels" for code announcements
- Bot only gets access to specific thread/channel via Discord permissions
- Store channel ID in environment variable, not source code
- Implement multi-channel support for different games

**Configuration:**
```bash
# .env.example
DISCORD_CODE_CHANNELS=1118010099974287370,1234567890123456789
```

**Benefit:** Better separation of concerns, easier to revoke specific access

---

### Long-Term Improvements (6-12 months)

#### 6. Migrate to Interactions-Only Bot
**Status:** 🔮 Future Consideration

**Current State:**
- REST API polling for messages
- No slash commands or interactions

**Alternative Architecture:**
- Use Discord Slash Commands for admin operations
- Implement webhook-based code submissions
- Eliminate need for message reading permissions

**Example Slash Commands:**
```
/submit-code [code] [description] - Submit a new redemption code
/verify-code [code] - Verify a code's validity
/admin-scan - Trigger manual code scan (admin only)
```

**Benefits:**
- ➕ No need to read message history
- ➕ Better user experience (native Discord UI)
- ➕ Reduced API calls (webhooks instead of polling)
- ➕ More granular permission model

**Trade-offs:**
- ➖ Requires significant refactoring
- ➖ Changes user workflow
- ➖ May not fit current announcement-based model

---

#### 7. Implement Audit Logging
**Status:** ❌ Not Implemented

**Current State:**
- No visibility into OAuth token usage
- No tracking of permission escalation attempts

**Improvement:**
- Log all OAuth authentications
- Track permission checks and failures
- Monitor for unusual bot token usage patterns
- Alert on suspicious activity

**Implementation:**
```javascript
// apps/admin-api/src/lib/audit-log.js
function logAuthEvent(event, userId, metadata) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event, // 'oauth_login', 'permission_check', 'bot_api_call'
    userId,
    metadata,
  }));
}
```

**Benefit:** Security monitoring, compliance, debugging

---

#### 8. Role-Based Bot Token Isolation
**Status:** 🔮 Future Consideration

**Current State:**
- Single bot token used for all operations
- Same token for admin checks and code fetching

**Alternative Architecture:**
- Separate bot account for code fetching (read-only)
- Separate bot account for admin verification (guild member read)
- Principle of least privilege at bot level

**Benefits:**
- ➕ Token compromise has limited scope
- ➕ Easier to audit which bot did what
- ➕ Can revoke specific functionality without breaking everything

**Trade-offs:**
- ➖ More complex configuration
- ➖ Multiple bot accounts to manage
- ➖ Increased Discord API rate limit consumption

---

## Implementation Priority

### High Priority (Implement Soon)
1. ✅ **Token Refresh** - Improves user experience significantly
2. ✅ **Scope Validation** - Security hardening with minimal effort
3. ✅ **Bot Permission Documentation** - Clarity for deployment

### Medium Priority (Next Quarter)
4. 🔄 **Guild Enumeration Reduction** - Privacy improvement, requires UX changes
5. 🔄 **Channel-Specific Permissions** - Security and flexibility improvement
6. 🔄 **Audit Logging** - Security monitoring and compliance

### Low Priority (Long-Term Vision)
7. 🔮 **Interactions-Only Bot** - Major architectural change, evaluate ROI
8. 🔮 **Role-Based Bot Token Isolation** - Complex, evaluate if needed based on growth

---

## Configuration Reference

### Environment Variables

```bash
# Required for OAuth
DISCORD_CLIENT_ID=your_application_client_id
DISCORD_CLIENT_SECRET=your_application_client_secret
DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback
DISCORD_OAUTH_SCOPES=identify guilds

# Required for bot operations
DISCORD_BOT_TOKEN=your_bot_token_here

# Optional (defaults shown)
# DISCORD_API_BASE_URL=https://discord.com/api/v10
```

### Bot Invite URL

To add the bot to a server, use the following permissions:

**Minimum Required Permissions Integer:** `66560` (View Channels + Read Message History)

**Invite URL Template:**
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=66560
```

**Scopes Required for Bot:**
- `bot` - Add bot to server

---

## Related Documentation

- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Discord Permissions Documentation](https://discord.com/developers/docs/topics/permissions)
- [Discord REST API v10](https://discord.com/developers/docs/reference)
- [Discord Rate Limits](https://discord.com/developers/docs/topics/rate-limits)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-11-19 | Initial documentation | Claude Code |

---

## Questions & Support

For questions about Discord permissions or to report security concerns:

1. Check Discord Developer Documentation
2. Review this document's security considerations
3. Consult with security team before adding new scopes/permissions
4. Test permission changes in development environment first

**Remember:** Always follow the principle of least privilege. Only request permissions you actively use.
