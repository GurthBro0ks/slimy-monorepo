# Admin Authentication Flow Documentation

**Last Updated**: 2025-11-19
**Maintainer**: DevOps/Backend Team

## Table of Contents

1. [Overview](#overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Complete Flow Diagram](#complete-flow-diagram)
4. [Step-by-Step Authentication Process](#step-by-step-authentication-process)
5. [Session & Token Management](#session--token-management)
6. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
7. [CSRF Protection](#csrf-protection)
8. [Environment Variables Reference](#environment-variables-reference)
9. [Common Failure Modes](#common-failure-modes)
10. [Debugging Guide](#debugging-guide)

---

## Overview

The Slimy admin panel uses **Discord OAuth2** for authentication with **JWT-based sessions** stored in httpOnly cookies. The flow supports:

- Discord OAuth2 (authorization code flow)
- Stateless JWT tokens with database-backed session store
- CSRF protection via token-per-session
- Role-based access control (admin, club, member)
- Guild-scoped permissions

**Key Components**:
- **admin-api** (Port 3080): Express backend handling OAuth, sessions, and API endpoints
- **admin-ui** (Port 3081): Next.js frontend with React session context
- **Discord API**: OAuth provider and guild data source

---

## High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │         │              │         │             │
│  Admin UI   │◄────────┤  Admin API   │◄────────┤  Discord    │
│  (Next.js)  │  Cookie │  (Express)   │  OAuth  │  OAuth API  │
│  Port 3081  │  + JWT  │  Port 3080   │         │             │
│             │         │              │         │             │
└─────────────┘         └──────┬───────┘         └─────────────┘
                               │
                               │ Prisma ORM
                               ▼
                        ┌─────────────┐
                        │             │
                        │  PostgreSQL │
                        │  (Sessions) │
                        │             │
                        └─────────────┘
```

---

## Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. LOGIN INITIATION                                                      │
└──────────────────────────────────────────────────────────────────────────┘

   User clicks "Login with Discord" → Opens new tab

   GET /api/auth/login
      │
      ├─ Generate random OAuth state (crypto + timestamp)
      ├─ Set cookie: oauth_state (httpOnly, 5min expiry)
      └─ Redirect to Discord:
         https://discord.com/oauth2/authorize?
           client_id={DISCORD_CLIENT_ID}
           &redirect_uri={DISCORD_REDIRECT_URI}
           &response_type=code
           &scope=identify guilds
           &state={base64_state}
           &prompt=consent

┌──────────────────────────────────────────────────────────────────────────┐
│ 2. DISCORD AUTHORIZATION                                                 │
└──────────────────────────────────────────────────────────────────────────┘

   User authorizes app on Discord
      │
      └─ Discord redirects back with code & state

┌──────────────────────────────────────────────────────────────────────────┐
│ 3. OAUTH CALLBACK (Token Exchange)                                       │
└──────────────────────────────────────────────────────────────────────────┘

   GET /api/auth/callback?code={code}&state={state}
      │
      ├─ [STEP 1] Validate state matches oauth_state cookie
      │   └─ If mismatch → redirect /?error=state_mismatch
      │
      ├─ [STEP 2] Exchange code for tokens
      │   POST https://discord.com/api/oauth2/token
      │   Body: { grant_type, code, redirect_uri, client_id, client_secret }
      │   Response: { access_token, refresh_token, expires_in }
      │
      ├─ [STEP 3] Fetch user profile
      │   GET https://discord.com/api/users/@me
      │   Headers: { Authorization: "Bearer {access_token}" }
      │   Response: { id, username, global_name, avatar }
      │
      ├─ [STEP 4] Fetch user's guilds
      │   GET https://discord.com/api/users/@me/guilds
      │   Headers: { Authorization: "Bearer {access_token}" }
      │   Response: [{ id, name, icon, owner, permissions }]
      │
      ├─ [STEP 5] Enrich guild data (if DISCORD_BOT_TOKEN available)
      │   For each guild (parallel, 2s timeout):
      │      GET /guilds/{guildId}  (Bot token)
      │      GET /guilds/{guildId}/members/{userId}  (Bot token)
      │      └─ Extract member roles, check against ROLE_ADMIN_IDS/ROLE_CLUB_IDS
      │
      ├─ [STEP 6] Determine user role
      │   Priority order:
      │   1. Check if user has Discord role in ROLE_ADMIN_IDS → "admin"
      │   2. Check if user has Discord role in ROLE_CLUB_IDS → "club"
      │   3. Check guild permissions (ADMINISTRATOR or MANAGE_GUILD) → "admin"
      │   4. Default → "member"
      │
      ├─ [STEP 7] Create session
      │   Build user object:
      │      { id, username, globalName, avatar, role, guilds[] }
      │
      │   Generate CSRF token: nanoid(32)
      │
      │   Sign JWT (HS256):
      │      Payload: { sub, username, globalName, avatar, role, guilds, csrfToken }
      │      Secret: JWT_SECRET (or SESSION_SECRET)
      │      Expiry: 12 hours
      │
      │   Store in database:
      │      userId, token (Discord access_token), expiresAt, guilds
      │
      │   Set cookie:
      │      Name: slimy_admin_token
      │      Value: {signed_jwt}
      │      Options: httpOnly, secure (prod), sameSite=lax, 12h expiry
      │
      └─ [STEP 8] Redirect by role
         - admin → /guilds
         - club → /club
         - member → /snail

┌──────────────────────────────────────────────────────────────────────────┐
│ 4. SESSION VERIFICATION                                                  │
└──────────────────────────────────────────────────────────────────────────┘

   Every API request includes slimy_admin_token cookie
      │
      ├─ readAuth middleware (global):
      │   └─ Parse JWT, verify signature, populate req.user (or null)
      │
      ├─ requireAuth middleware (protected routes):
      │   └─ Reject if req.user is null → 401 Unauthorized
      │
      └─ requireRole middleware (admin-only routes):
          └─ Check role hierarchy → 403 Forbidden if insufficient

   GET /api/auth/me
      │
      ├─ requireAuth
      ├─ Extract user from JWT
      ├─ Fetch full guild data from session store
      └─ Return:
         {
           id, username, globalName, avatar, role,
           csrfToken,
           guilds: [...lightweight from JWT],
           sessionGuilds: [...full from database]
         }

┌──────────────────────────────────────────────────────────────────────────┐
│ 5. GUILD LOADING                                                         │
└──────────────────────────────────────────────────────────────────────────┘

   Frontend (admin-ui) loads user session:
      │
      ├─ GET /api/auth/me
      │   └─ Populates SessionContext with user + guilds
      │
      └─ Navigate to /guilds
         │
         └─ GET /api/guilds
            └─ Returns req.user.guilds (from JWT)

   User selects a guild:
      │
      ├─ Navigate to /guilds/{guildId}
      │
      ├─ requireGuildAccess middleware:
      │   └─ Check if guildId exists in req.user.guilds
      │   └─ Populate req.guild for downstream handlers
      │
      └─ Load guild-specific data:
         - GET /api/guilds/{guildId}/settings
         - GET /api/guilds/{guildId}/personality
         - GET /api/guilds/{guildId}/channels
         - GET /api/guilds/{guildId}/usage
         - GET /api/guilds/{guildId}/health

┌──────────────────────────────────────────────────────────────────────────┐
│ 6. CSRF-PROTECTED MUTATIONS                                              │
└──────────────────────────────────────────────────────────────────────────┘

   PUT /api/guilds/{guildId}/settings
      │
      ├─ readAuth → req.user populated
      ├─ requireAuth → user must exist
      ├─ requireRole("editor") → role hierarchy check
      ├─ requireGuildAccess → user must have access to guild
      ├─ requireCsrf → validate x-csrf-token header matches req.user.csrfToken
      └─ Execute mutation

   Frontend adds CSRF header:
      fetch("/api/guilds/123/settings", {
        method: "PUT",
        headers: {
          "x-csrf-token": sessionStorage.getItem("slimy_admin_csrf")
        },
        body: JSON.stringify(...)
      })

┌──────────────────────────────────────────────────────────────────────────┐
│ 7. LOGOUT                                                                │
└──────────────────────────────────────────────────────────────────────────┘

   POST /api/auth/logout
      │
      ├─ Delete session from database (by userId)
      ├─ Clear slimy_admin_token cookie
      └─ Return { ok: true }

   Frontend:
      │
      ├─ Clear sessionStorage (CSRF token)
      ├─ Clear React session context
      └─ Redirect to /login
```

---

## Step-by-Step Authentication Process

### Phase 1: Login Initiation

**Location**: `apps/admin-api/src/routes/auth.js:108-119`

```javascript
GET /api/auth/login
```

1. Generate OAuth state parameter:
   - Random crypto nonce (32 bytes)
   - Timestamp
   - Base64 encode: `{nonce}:{timestamp}`

2. Store state in cookie:
   - Name: `oauth_state`
   - httpOnly: true
   - maxAge: 5 minutes
   - sameSite: lax

3. Redirect to Discord OAuth:
   ```
   https://discord.com/oauth2/authorize?
     client_id={DISCORD_CLIENT_ID}
     &redirect_uri={DISCORD_REDIRECT_URI}
     &response_type=code
     &scope=identify guilds
     &state={base64_state}
     &prompt=consent
   ```

**Scopes Requested**:
- `identify`: Access to user ID, username, avatar
- `guilds`: Access to user's guild list (with permissions)

---

### Phase 2: OAuth Callback

**Location**: `apps/admin-api/src/routes/auth.js:121-374`

```javascript
GET /api/auth/callback?code={code}&state={state}
```

#### 2.1: State Validation (CSRF Protection)

```javascript
const stateFromQuery = req.query.state;
const stateFromCookie = req.cookies.oauth_state;

if (!stateFromQuery || stateFromQuery !== stateFromCookie) {
  return res.redirect("/?error=state_mismatch");
}
```

**Why**: Prevents CSRF attacks during OAuth flow.

---

#### 2.2: Token Exchange

```javascript
POST https://discord.com/api/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={authorization_code}
&redirect_uri={DISCORD_REDIRECT_URI}
&client_id={DISCORD_CLIENT_ID}
&client_secret={DISCORD_CLIENT_SECRET}
```

**Response**:
```json
{
  "access_token": "xyz...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "refresh_token": "abc...",
  "scope": "identify guilds"
}
```

---

#### 2.3: Fetch User Profile

```javascript
GET https://discord.com/api/users/@me
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "id": "123456789012345678",
  "username": "slimyuser",
  "global_name": "Slimy User",
  "avatar": "a1b2c3d4e5f6",
  "discriminator": "0",
  "public_flags": 0
}
```

---

#### 2.4: Fetch User's Guilds

```javascript
GET https://discord.com/api/users/@me/guilds
Authorization: Bearer {access_token}
```

**Response**:
```json
[
  {
    "id": "987654321098765432",
    "name": "My Cool Server",
    "icon": "xyz123",
    "owner": false,
    "permissions": "2147483647",
    "features": ["COMMUNITY"]
  }
]
```

**Permission Bits** (stored as string):
- `0x0000000000000020` (32): MANAGE_GUILD
- `0x0000000000080000` (524288): ADMINISTRATOR

---

#### 2.5: Guild Enrichment (Optional)

**Location**: `apps/admin-api/src/routes/auth.js:167-303`

If `DISCORD_BOT_TOKEN` is configured:

```javascript
// For each guild (parallel, with 2s timeout):
const guildDetails = await fetch(
  `https://discord.com/api/guilds/${guildId}`,
  { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
);

const memberDetails = await fetch(
  `https://discord.com/api/guilds/${guildId}/members/${userId}`,
  { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
);

// Extract member's role IDs
const memberRoleIds = memberDetails.roles; // ["role_id_1", "role_id_2"]
```

**Role Resolution**:
```javascript
// Check if user has admin role
if (ROLE_ADMIN_IDS.some(id => memberRoleIds.includes(id))) {
  roleLevel = "admin";
}
// Check if user has club role
else if (ROLE_CLUB_IDS.some(id => memberRoleIds.includes(id))) {
  roleLevel = "club";
}
// Fallback to permission-based role
else {
  roleLevel = resolveByPermissions(guild.permissions);
}
```

**Fallback (No Bot Token)**:
- Use guild `permissions` field from OAuth
- Check ADMINISTRATOR or MANAGE_GUILD bits → "admin"
- Otherwise → "member"

---

#### 2.6: Role Determination

**Location**: `apps/admin-api/src/lib/roles.js`

**Environment Variables**:
```bash
ROLE_ADMIN_IDS=role_id_1,role_id_2,role_id_3
ROLE_CLUB_IDS=role_id_4,role_id_5
```

**Resolution Logic**:
1. If user has any role in `ROLE_ADMIN_IDS` → **"admin"**
2. Else if user has any role in `ROLE_CLUB_IDS` → **"club"**
3. Else if user has ADMINISTRATOR permission → **"admin"**
4. Else if user has MANAGE_GUILD permission → **"admin"**
5. Else → **"member"**

**Global User Role** (highest across all guilds):
```javascript
const highestRole = guilds.reduce((max, guild) => {
  return roleRank(guild.role) > roleRank(max) ? guild.role : max;
}, "member");
```

**Role Hierarchy**: `viewer < editor < admin < owner`

---

#### 2.7: Session Creation

**JWT Signing** (`apps/admin-api/lib/jwt.js`):

```javascript
const csrfToken = nanoid(32); // 32-character random string

const payload = {
  sub: user.id,              // Discord user ID
  username: user.username,
  globalName: user.globalName,
  avatar: user.avatar,
  role: highestRole,         // Global role
  guilds: guilds.map(g => ({  // Lightweight guild list
    id: g.id,
    name: g.name,
    icon: g.icon,
    role: g.role,            // Per-guild role
    installed: g.installed,
    permissions: g.permissions
  })),
  csrfToken: csrfToken,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12 hours
};

const jwt = jsonwebtoken.sign(payload, JWT_SECRET, { algorithm: "HS256" });
```

**Database Session** (`apps/admin-api/lib/session-store.js`):

```javascript
await database.createSession({
  userId: user.id,
  token: discordAccessToken,
  refreshToken: discordRefreshToken,
  expiresAt: new Date(Date.now() + 7200000), // 2 hours
  guilds: fullGuildData // Stored separately in database
});
```

**Set Cookie**:
```javascript
res.cookie("slimy_admin_token", jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 12 * 60 * 60 * 1000, // 12 hours
  domain: process.env.COOKIE_DOMAIN || undefined
});
```

---

#### 2.8: Redirect by Role

```javascript
const redirectMap = {
  admin: "/guilds",
  club: "/club",
  member: "/snail"
};

res.redirect(redirectMap[user.role] || "/");
```

---

### Phase 3: Session Verification

**Global Middleware** (`apps/admin-api/src/middleware/auth.js`):

```javascript
app.use(readAuth); // Applied to all routes
```

**readAuth** (Non-blocking):
```javascript
function readAuth(req, res, next) {
  const token = req.cookies.slimy_admin_token;
  if (!token) return next();

  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);
    req.user = decoded; // Populate user
  } catch (err) {
    // Invalid/expired token - continue without user
  }

  return next();
}
```

**requireAuth** (Blocking):
```javascript
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ code: "UNAUTHORIZED" });
  }
  return next();
}
```

**requireRole** (Role-based):
```javascript
function requireRole(minRole = "admin") {
  return (req, res, next) => {
    if (!req.user || !hasRole(req.user.role, minRole)) {
      return res.status(403).json({ code: "FORBIDDEN" });
    }
    return next();
  };
}
```

---

### Phase 4: Guild Access Control

**Middleware** (`apps/admin-api/src/middleware/rbac.js`):

```javascript
function requireGuildAccess(req, res, next) {
  const guildId = req.params?.guildId || req.query?.guildId || req.body?.guildId;

  if (!guildId) {
    return res.status(400).json({ error: "guildId-required" });
  }

  const guild = req.user?.guilds?.find(g => g.id === guildId);
  if (!guild) {
    return res.status(403).json({ error: "guild-access-denied" });
  }

  req.guild = guild; // Populate for handlers
  return next();
}
```

**Usage**:
```javascript
router.get("/guilds/:guildId/settings", requireAuth, requireGuildAccess, (req, res) => {
  // req.guild is populated with user's access level
  // req.guild.role: "admin" | "club" | "member"
});
```

---

## Session & Token Management

### JWT Structure

**Payload**:
```json
{
  "sub": "123456789012345678",
  "username": "slimyuser",
  "globalName": "Slimy User",
  "avatar": "a1b2c3d4e5f6",
  "role": "admin",
  "guilds": [
    {
      "id": "987654321098765432",
      "name": "My Cool Server",
      "icon": "xyz123",
      "role": "admin",
      "installed": true,
      "permissions": "2147483647"
    }
  ],
  "csrfToken": "abcdef1234567890abcdef1234567890",
  "iat": 1700000000,
  "exp": 1700043200
}
```

**Signing**:
- Algorithm: HS256
- Secret: `JWT_SECRET` (falls back to `SESSION_SECRET`)
- Expiry: 12 hours (configurable via `JWT_EXPIRES_IN`)

**Storage**:
- Cookie name: `slimy_admin_token`
- httpOnly: `true` (not accessible via JavaScript)
- secure: `true` in production (HTTPS only)
- sameSite: `lax` (CSRF protection)
- domain: `COOKIE_DOMAIN` (e.g., `.slimyai.xyz` for subdomains)

---

### Database Session Store

**Location**: `apps/admin-api/lib/session-store.js`

**Schema** (Prisma):
```prisma
model Session {
  userId      String
  token       String   // Discord access token
  refreshToken String?
  expiresAt   DateTime
  guilds      Json?    // Full guild data
  createdAt   DateTime @default(now())
}
```

**Operations**:
```javascript
// Create session
await database.createSession(userId, token, expiresAt, guilds);

// Get session
const session = await database.getSession(userId);

// Delete session (logout)
await database.deleteSession(userId);

// Cleanup (runs hourly)
await database.cleanupSessions(); // Deletes expired sessions
```

**Session Expiry**:
- Discord access token: 2 hours (auto-refresh via database cleanup)
- JWT cookie: 12 hours (requires re-login after expiry)

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

**Location**: `apps/admin-api/src/services/rbac.js`

```
owner > admin > editor > viewer > (no role)
```

**hasRole Function**:
```javascript
function hasRole(userRole, requiredRole) {
  const roleRank = (role) => ROLE_ORDER.indexOf(role);
  return roleRank(userRole) >= roleRank(requiredRole);
}

// Examples:
hasRole("admin", "editor") // true
hasRole("editor", "admin") // false
hasRole("viewer", "admin") // false
```

---

### Permission Bitfields

**Location**: `apps/admin-api/src/services/rbac.js`

Discord permissions are stored as BigInt bitfields:

```javascript
const PERMISSIONS = {
  CREATE_INSTANT_INVITE: BigInt(0x0000000001),
  KICK_MEMBERS:          BigInt(0x0000000002),
  BAN_MEMBERS:           BigInt(0x0000000004),
  ADMINISTRATOR:         BigInt(0x0000000008),
  MANAGE_CHANNELS:       BigInt(0x0000000010),
  MANAGE_GUILD:          BigInt(0x0000000020),
  // ... more permissions
};

function hasPermission(permissionBitfield, requiredPermission) {
  const perms = BigInt(permissionBitfield);
  return (perms & requiredPermission) === requiredPermission;
}

// Example:
hasPermission("2147483647", PERMISSIONS.MANAGE_GUILD) // true
```

---

### Middleware Stack Examples

**Public Endpoint** (no auth):
```javascript
router.get("/api/health", (req, res) => {
  res.json({ ok: true });
});
```

**Authenticated Endpoint**:
```javascript
router.get("/api/auth/me", requireAuth, (req, res) => {
  res.json(req.user);
});
```

**Role-Protected Endpoint**:
```javascript
router.get("/api/admin/users", requireAuth, requireRole("admin"), (req, res) => {
  // Only admins can access
});
```

**Guild-Scoped Endpoint**:
```javascript
router.put(
  "/api/guilds/:guildId/settings",
  requireAuth,
  requireGuildAccess,
  requireRole("editor"),
  requireCsrf,
  (req, res) => {
    // User must:
    // 1. Be authenticated
    // 2. Have access to this guild
    // 3. Have at least "editor" role in this guild
    // 4. Provide valid CSRF token
  }
);
```

---

## CSRF Protection

### Token Generation

**Location**: `apps/admin-api/src/services/token.js:36`

```javascript
import { nanoid } from "nanoid";

const csrfToken = nanoid(32); // 32-character random string
```

**Embedded in JWT**:
```javascript
const jwtPayload = {
  // ... user data
  csrfToken: csrfToken
};
```

---

### Token Validation

**Location**: `apps/admin-api/src/middleware/csrf.js`

```javascript
function requireCsrf(req, res, next) {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Ensure user has CSRF token
  if (!req.user?.csrfToken) {
    return res.status(401).json({ error: "csrf-token-missing" });
  }

  // Validate header matches JWT token
  const headerValue = req.headers["x-csrf-token"];
  if (headerValue !== req.user.csrfToken) {
    return res.status(403).json({ error: "invalid-csrf-token" });
  }

  return next();
}
```

**Applied to mutations**:
```javascript
router.put("/guilds/:guildId/settings", requireAuth, requireCsrf, handler);
router.post("/guilds/:guildId/corrections", requireAuth, requireCsrf, handler);
router.delete("/admin/users/:userId", requireAuth, requireRole("admin"), requireCsrf, handler);
```

---

### Client-Side Implementation

**Location**: `apps/admin-ui/lib/session.js`

```javascript
// Store CSRF token in sessionStorage
const CSRF_STORAGE_KEY = "slimy_admin_csrf";

// Extract from /api/auth/me response
const { csrfToken } = await fetch("/api/auth/me").then(r => r.json());
sessionStorage.setItem(CSRF_STORAGE_KEY, csrfToken);

// Alternative: Extract from URL hash after OAuth callback
if (window.location.hash.startsWith("#csrf=")) {
  const token = decodeURIComponent(hash.slice(6));
  sessionStorage.setItem(CSRF_STORAGE_KEY, token);
}
```

**Location**: `apps/admin-ui/lib/api.js`

```javascript
async function apiFetch(url, options = {}) {
  const csrfToken = sessionStorage.getItem("slimy_admin_csrf");

  const headers = new Headers(options.headers);

  // Add CSRF token for mutations
  if (csrfToken && options.method !== "GET") {
    headers.set("x-csrf-token", csrfToken);
  }

  return fetch(url, { ...options, headers });
}
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example | Used By |
|----------|-------------|---------|---------|
| `DISCORD_CLIENT_ID` | OAuth application ID (numeric) | `1234567890` | admin-api |
| `DISCORD_CLIENT_SECRET` | OAuth application secret | `abc123xyz...` | admin-api |
| `DISCORD_REDIRECT_URI` | OAuth callback URL (must match Discord app config) | `https://admin.slimyai.xyz/api/auth/callback` | admin-api |
| `SESSION_SECRET` | Session signing key (min 32 chars) | `random_32_plus_chars...` | admin-api |
| `JWT_SECRET` | JWT signing key (falls back to SESSION_SECRET) | `random_32_plus_chars...` | admin-api |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | admin-api |

### Optional Variables

| Variable | Description | Default | Used By |
|----------|-------------|---------|---------|
| `DISCORD_BOT_TOKEN` | Bot token for guild member checks | (none) | admin-api |
| `ROLE_ADMIN_IDS` | Comma-separated Discord role IDs for admin | `""` | admin-api |
| `ROLE_CLUB_IDS` | Comma-separated Discord role IDs for club | `""` | admin-api |
| `ADMIN_USER_IDS` | Comma-separated Discord user IDs for admin | `""` | admin-api |
| `CLUB_USER_IDS` | Comma-separated Discord user IDs for club | `""` | admin-api |
| `COOKIE_DOMAIN` | Cookie domain (include leading dot for subdomains) | `.slimyai.xyz` | admin-api |
| `COOKIE_SECURE` | Force HTTPS cookies | Auto-detected (prod=true) | admin-api |
| `COOKIE_SAMESITE` | Cookie SameSite policy | `lax` | admin-api |
| `CORS_ORIGIN` | Single allowed CORS origin | `https://admin.slimyai.xyz` | admin-api |
| `PORT` | API server port | `3080` | admin-api |
| `HOST` | API server host | `127.0.0.1` | admin-api |
| `NODE_ENV` | Environment | `production` | Both |
| `NEXT_PUBLIC_ADMIN_API_BASE` | API base URL (empty for relative) | `""` | admin-ui |
| `NEXT_PUBLIC_BOT_CLIENT_ID` | Bot application ID for invite links | `1415387116564910161` | admin-ui |

---

### Configuration Files

**admin-api**: `apps/admin-api/src/config.js`

```javascript
module.exports = {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUri: process.env.DISCORD_REDIRECT_URI,
    botToken: process.env.DISCORD_BOT_TOKEN, // Optional
  },
  session: {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET,
    cookieDomain: process.env.COOKIE_DOMAIN,
    cookieSecure: process.env.COOKIE_SECURE !== "false",
    cookieSameSite: process.env.COOKIE_SAMESITE || "lax",
  },
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
  // ...
};
```

---

## Common Failure Modes

### 1. State Mismatch Error

**Symptom**: Redirect to `/?error=state_mismatch` after Discord authorization

**Cause**: OAuth state cookie doesn't match query parameter

**Possible Reasons**:
- Cookie not set during `/api/auth/login` (check browser console)
- State cookie expired (>5 minutes between login and callback)
- Cookie domain mismatch (check `COOKIE_DOMAIN` setting)
- Browser blocking third-party cookies

**Debugging**:
```bash
# Check if oauth_state cookie is set
# Browser DevTools → Application → Cookies

# Verify COOKIE_DOMAIN is correct
echo $COOKIE_DOMAIN
# Should be .slimyai.xyz (with leading dot) or omitted for same-domain
```

**Fix**:
- Ensure `COOKIE_DOMAIN` matches your domain
- Check browser privacy settings (disable "Block all cookies")
- Reduce time between clicking login and authorizing

---

### 2. Unauthorized (401) on /api/auth/me

**Symptom**: `{ code: "UNAUTHORIZED" }` response

**Cause**: JWT cookie missing or invalid

**Possible Reasons**:
- Cookie not set after OAuth callback
- JWT expired (>12 hours since login)
- JWT_SECRET mismatch (server restarted with different secret)
- Cookie cleared by user or browser

**Debugging**:
```bash
# Check if slimy_admin_token cookie exists
# Browser DevTools → Application → Cookies

# Decode JWT (without verifying signature)
# Paste cookie value into https://jwt.io
# Check exp (expiry timestamp) is in the future
```

**Fix**:
- Re-login if token expired
- Ensure `JWT_SECRET` is persistent across restarts (use .env file)
- Check cookie domain/path settings

---

### 3. Forbidden (403) on Guild Endpoints

**Symptom**: `{ error: "guild-access-denied" }` or `{ code: "FORBIDDEN" }`

**Cause**: User doesn't have access to the requested guild

**Possible Reasons**:
- User left the guild after login
- Guild ID in URL doesn't match user's guilds
- Insufficient role for the operation (viewer trying to edit)

**Debugging**:
```bash
# Get user's guilds from /api/auth/me
curl -b "slimy_admin_token=..." http://localhost:3080/api/auth/me | jq '.guilds'

# Verify guildId exists in the list
# Check user's role for that guild
```

**Fix**:
- Re-login to refresh guild list
- Verify guild ID is correct
- Check role requirements for the endpoint

---

### 4. CSRF Token Invalid

**Symptom**: `{ error: "invalid-csrf-token" }` on POST/PUT/DELETE requests

**Cause**: CSRF token in header doesn't match JWT payload

**Possible Reasons**:
- CSRF token not sent in `x-csrf-token` header
- Token from old session (user re-logged in)
- SessionStorage cleared

**Debugging**:
```javascript
// Check CSRF token in sessionStorage
sessionStorage.getItem("slimy_admin_csrf");

// Check CSRF token in JWT
fetch("/api/auth/me")
  .then(r => r.json())
  .then(user => console.log("CSRF from server:", user.csrfToken));
```

**Fix**:
- Re-fetch CSRF token from `/api/auth/me`
- Ensure frontend includes token in mutation headers
- Check middleware order (readAuth before requireCsrf)

---

### 5. Discord OAuth Error: redirect_uri_mismatch

**Symptom**: Discord shows "Invalid OAuth2 Redirect URI" error page

**Cause**: `DISCORD_REDIRECT_URI` doesn't match Discord app configuration

**Fix**:
1. Go to https://discord.com/developers/applications
2. Select your application
3. OAuth2 → Redirects
4. Add: `https://admin.slimyai.xyz/api/auth/callback` (exact match)
5. Ensure `DISCORD_REDIRECT_URI` env var matches exactly

---

### 6. Guild Data Not Loading

**Symptom**: User sees empty guild list or "No guilds found"

**Cause**: Discord OAuth didn't return guilds or enrichment failed

**Possible Reasons**:
- User has no guilds (new Discord account)
- `guilds` scope not requested in OAuth
- Discord API error during `/users/@me/guilds` fetch
- Bot token issues (guild enrichment failed, but fallback should work)

**Debugging**:
```bash
# Check OAuth scopes in Discord app config
# Should include: "identify guilds"

# Test Discord API directly
curl -H "Authorization: Bearer {access_token}" \
  https://discord.com/api/users/@me/guilds

# Check admin-api logs for errors during OAuth callback
```

**Fix**:
- Verify OAuth scopes include `guilds`
- Check Discord API rate limits
- Review admin-api logs for API errors

---

### 7. Role Not Recognized (Stuck as "member")

**Symptom**: Admin users see "member" role, can't access admin features

**Cause**: Role resolution failed

**Possible Reasons**:
- `ROLE_ADMIN_IDS` not configured
- Discord role IDs incorrect (copy error)
- `DISCORD_BOT_TOKEN` missing or invalid (can't fetch member roles)
- User doesn't have ADMINISTRATOR or MANAGE_GUILD permission

**Debugging**:
```bash
# Check configured role IDs
echo $ROLE_ADMIN_IDS
echo $ROLE_CLUB_IDS

# Get user's role IDs from Discord
# Requires bot token and guild ID
curl -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  "https://discord.com/api/guilds/{guildId}/members/{userId}"

# Check user's resolved role
curl -b "slimy_admin_token=..." http://localhost:3080/api/auth/me | jq '.role'
```

**Fix**:
- Configure `ROLE_ADMIN_IDS` with correct Discord role IDs
- Add `DISCORD_BOT_TOKEN` for accurate role resolution
- Grant ADMINISTRATOR or MANAGE_GUILD permission to admin users
- Re-login after configuration changes

---

### 8. Database Connection Errors

**Symptom**: Server crashes with "Cannot connect to database" or Prisma errors

**Cause**: `DATABASE_URL` invalid or database unreachable

**Debugging**:
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Prisma client
cd apps/admin-api
npx prisma db pull
npx prisma generate
```

**Fix**:
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/db`
- Ensure database is running and accessible
- Run migrations if schema changed: `npx prisma migrate deploy`

---

## Debugging Guide

### Debug Checklist for Auth Issues

Use this checklist to systematically debug authentication problems:

#### 1. Environment Variables
```bash
# admin-api/.env
✓ DISCORD_CLIENT_ID is set (numeric)
✓ DISCORD_CLIENT_SECRET is set
✓ DISCORD_REDIRECT_URI matches Discord app config
✓ SESSION_SECRET or JWT_SECRET is set (32+ chars)
✓ DATABASE_URL is valid
✓ COOKIE_DOMAIN is correct (or omitted for same-domain)
✓ CORS_ORIGIN matches admin-ui URL
```

#### 2. Discord App Configuration
```bash
# https://discord.com/developers/applications/{app_id}
✓ OAuth2 Redirects includes DISCORD_REDIRECT_URI (exact match)
✓ OAuth2 Scopes includes: identify, guilds
✓ Bot token is valid (if using role-based auth)
```

#### 3. Cookies
```bash
# Browser DevTools → Application → Cookies
✓ oauth_state cookie is set during /api/auth/login
✓ slimy_admin_token cookie is set after callback
✓ Cookie domain matches current domain
✓ Cookie is httpOnly and secure (in prod)
✓ Cookie expiry is in the future
```

#### 4. JWT Token
```bash
# Decode at https://jwt.io (paste cookie value)
✓ Payload includes: sub, username, role, guilds, csrfToken
✓ exp (expiry) is in the future
✓ Signature is valid (paste JWT_SECRET)
```

#### 5. API Responses
```bash
# GET /api/auth/me
✓ Returns 200 OK
✓ Response includes user data and guilds
✓ csrfToken is present

# GET /api/diag
✓ Returns 200 OK with admin stats
✓ No errors in logs
```

#### 6. Browser Console
```bash
# Check for errors:
✓ No CORS errors
✓ No cookie errors (SameSite, Secure)
✓ No 401/403 errors on protected routes
```

---

### Logging & Monitoring

**Enable Debug Logs**:
```bash
# admin-api
DEBUG=app:* npm start

# Or set in .env
LOG_LEVEL=debug
```

**Key Log Points**:
- `apps/admin-api/src/routes/auth.js` - OAuth flow steps
- `apps/admin-api/src/middleware/auth.js` - JWT verification
- `apps/admin-api/lib/session-store.js` - Session operations
- `apps/admin-api/src/services/rbac.js` - Role resolution

**Log Examples**:
```
[auth] OAuth state generated: abc123...
[auth] Token exchange successful for user 123456789012345678
[auth] Fetched 5 guilds for user
[auth] Role resolved: admin (from Discord role)
[auth] Session created, expires in 12h
[rbac] User 123456789012345678 has role "admin", required "editor" - GRANTED
```

---

### Testing Tools

**Manual Testing**:
```bash
# Test login flow
curl -v http://localhost:3080/api/auth/login
# Follow redirect to Discord, authorize, observe callback

# Test auth endpoint
curl -b "slimy_admin_token={jwt}" http://localhost:3080/api/auth/me

# Test CSRF protection
curl -X PUT \
  -H "x-csrf-token: invalid" \
  -b "slimy_admin_token={jwt}" \
  http://localhost:3080/api/guilds/123/settings
# Should return 403
```

**Automated Testing** (future):
- See `tools/admin-auth/inspect-auth-flow.ts` (diagnostic script)
- See `docs/admin-auth-diagnostics.md` (usage guide)

---

## Related Files

| Component | File Path | Purpose |
|-----------|-----------|---------|
| OAuth Routes | `apps/admin-api/src/routes/auth.js` | Login, callback, /me, logout |
| Auth Middleware | `apps/admin-api/src/middleware/auth.js` | readAuth, requireAuth, requireRole |
| RBAC Middleware | `apps/admin-api/src/middleware/rbac.js` | requireGuildAccess |
| CSRF Middleware | `apps/admin-api/src/middleware/csrf.js` | requireCsrf |
| JWT Utils | `apps/admin-api/lib/jwt.js` | sign, verify |
| Token Service | `apps/admin-api/src/services/token.js` | createSessionToken |
| Session Store | `apps/admin-api/lib/session-store.js` | Database session operations |
| Role Resolver | `apps/admin-api/src/lib/roles.js` | resolveRoleLevel |
| RBAC Service | `apps/admin-api/src/services/rbac.js` | hasRole, permissions |
| Frontend Session | `apps/admin-ui/lib/session.js` | SessionContext, useSession |
| Frontend API | `apps/admin-ui/lib/api.js` | apiFetch (with CSRF) |
| Guilds Page | `apps/admin-ui/pages/guilds/index.js` | Guild list UI |

---

## Security Considerations

1. **Secrets Rotation**: Rotate `SESSION_SECRET`, `JWT_SECRET`, and `DISCORD_CLIENT_SECRET` periodically
2. **HTTPS Only**: Always use HTTPS in production (`COOKIE_SECURE=true`)
3. **Token Expiry**: JWT expires in 12 hours (requires re-login)
4. **Session Cleanup**: Database sessions auto-expire after 2 hours (Discord token expiry)
5. **CORS**: Restrict to single origin (`CORS_ORIGIN`)
6. **httpOnly Cookies**: JWT not accessible via JavaScript (XSS protection)
7. **CSRF Tokens**: Required for all mutations
8. **Role Validation**: Always check both authentication AND authorization
9. **State Parameter**: OAuth state prevents CSRF during login flow
10. **Secure Headers**: Helmet.js adds security headers (XSS, clickjacking, etc.)

---

## Next Steps

- See `docs/admin-auth-diagnostics.md` for diagnostic tooling
- See `tools/admin-auth/inspect-auth-flow.ts` for automated health checks
- Review `apps/admin-api/src/routes/auth.js` for implementation details
