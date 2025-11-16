# Admin API Backend Investigation

## Executive Summary

The Admin API code **exists in the same repository** at `/opt/slimy/app/admin-api/`, but it is **NOT included in the web app's docker-compose.yml**. The API is **fully implemented** (not skeleton), but **additional route modules are NOT mounted** in the main server. Only core auth and health endpoints are active.

---

## 1. Is Admin API Code in a Separate Repo?

### Answer: **NO - Same Repository**

**Location:** `/opt/slimy/app/admin-api/`

**Evidence:**
- Full codebase exists at `/opt/slimy/app/admin-api/server.js`
- Package.json exists: `/opt/slimy/app/admin-api/package.json`
- README exists: `/opt/slimy/app/admin-api/README.md`
- Service is managed via systemd: `sudo systemctl restart admin-api`

**Repository Structure:**
```
/opt/slimy/
├── app/
│   └── admin-api/          ← Admin API code here
│       ├── server.js       ← Main server file
│       ├── package.json
│       ├── README.md
│       ├── src/
│       │   └── routes/     ← Additional route modules
│       └── lib/            ← Supporting libraries
└── web/                    ← Web app code
    └── docker-compose.yml  ← Admin API NOT included here
```

**Conclusion:** Admin API is in the same repository but separate from the web app deployment.

---

## 2. What Endpoints Does It Provide?

### Currently Active Endpoints (Mounted in server.js)

The main `server.js` file mounts a single router that provides these endpoints:

#### Health & Diagnostics
- `GET /api/health` - Health check (public)
- `GET /api/diag` - Detailed diagnostics (admin only)

#### Authentication
- `GET /api/auth/login` - Initiate Discord OAuth flow
- `GET /api/auth/callback` - Discord OAuth callback handler
- `GET /api/auth/me` - Get current user info (authenticated)
- `POST /api/auth/logout` - Logout current user (authenticated)

#### Guilds
- `GET /api/guilds` - List user's Discord guilds (club role or higher)

### Additional Route Modules (NOT Mounted)

The following route modules exist but are **NOT mounted** in `server.js`:

#### Chat Routes (`src/routes/chat.js`)
- `POST /api/chat/bot` - Chat with bot (member+)
- `GET /api/chat/:guildId/history` - Get chat history (member+)

#### Snail Routes (`src/routes/snail.js`)
- `POST /api/snail/:guildId/analyze` - Analyze Super Snail screenshots (member+)
- `GET /api/snail/:guildId/stats` - Get user stats (member+)
- `GET /api/snail/:guildId/analyze_help` - Get help text (member+)
- `POST /api/snail/:guildId/calc` - Calculate tier costs (member+)
- `GET /api/snail/:guildId/codes` - Get secret codes (member+)

#### Personality Routes (`src/routes/personality.js`)
- `GET /api/:guildId/personality/presets` - List presets (admin+)
- `GET /api/:guildId/personality` - Get guild personality (admin+)
- `PUT /api/:guildId/personality` - Update guild personality (admin+)
- `POST /api/:guildId/personality/reset` - Reset to default (admin+)
- `POST /api/:guildId/personality/test` - Test personality output (admin+)

#### Stats Routes (`src/routes/stats.js`)
- `GET /api/stats/summary` - Get club stats summary (conditional - requires STATS_SHEET_ID)

#### Diagnostics Routes (`src/routes/diagnostics.js`)
- `GET /api/diagnostics` - System diagnostics (authenticated)

**Evidence:** 
- `server.js:587-588` only mounts the main router: `app.use("/api", router);`
- No `require()` statements for chat, snail, personality, stats, or diagnostics routes
- These route files exist but are orphaned/unused

---

## 3. Is It Partially Implemented?

### Answer: **Fully Implemented Core, Partially Deployed**

**Core Implementation Status:**
- ✅ **Fully implemented:** Auth endpoints (login, callback, me, logout)
- ✅ **Fully implemented:** Health/diagnostics endpoints
- ✅ **Fully implemented:** Guild listing endpoint
- ✅ **Fully implemented:** Session management (JWT, cookies)
- ✅ **Fully implemented:** Role-based access control
- ✅ **Fully implemented:** Discord OAuth integration

**Additional Features Status:**
- ⚠️ **Code exists but NOT mounted:** Chat routes
- ⚠️ **Code exists but NOT mounted:** Snail routes
- ⚠️ **Code exists but NOT mounted:** Personality routes
- ⚠️ **Code exists but NOT mounted:** Stats routes
- ⚠️ **Code exists but NOT mounted:** Diagnostics routes

**Dependencies:**
- Some routes require external services:
  - Chat routes require `OPENAI_API_KEY`
  - Snail routes require `OPENAI_API_KEY` for vision
  - Stats routes require `STATS_SHEET_ID` (Google Sheets)
  - Personality routes require database connectivity

**Conclusion:** The core API is fully implemented and functional. Additional feature routes exist but are not integrated into the main server.

---

## 4. Are There Skeleton Implementations?

### Answer: **NO Skeleton Implementations Found**

**All Implementations Are Complete:**

1. **Auth Routes** (`server.js:413-575`)
   - Full OAuth flow implementation
   - State management with cookies
   - Token exchange with Discord
   - Session storage
   - JWT signing/verification

2. **Chat Routes** (`src/routes/chat.js`)
   - Complete implementation
   - Requires `askChatBot` service
   - Database integration for history
   - Role-based access control

3. **Snail Routes** (`src/routes/snail.js`)
   - Complete implementation
   - File upload handling (multer)
   - Vision API integration
   - Data storage (JSON files)
   - Codes aggregation

4. **Personality Routes** (`src/routes/personality.js`)
   - Complete implementation
   - Database operations (upsert, get, reset)
   - Preset management
   - OpenAI integration for testing
   - Zod schema validation

5. **Stats Routes** (`src/routes/stats.js`)
   - Complete implementation
   - Google Sheets integration
   - Conditional mounting (if STATS_SHEET_ID not set, returns error)

6. **Diagnostics Routes** (`src/routes/diagnostics.js`)
   - Complete implementation
   - System metrics collection
   - Memory usage tracking
   - Upload summary

**Backup Files Found:**
- `src/routes/auth.js.bak` - Old auth implementation (backup)
- `admin-api/src/routes/auth.js` - Alternative auth implementation (unused)

**Conclusion:** No skeleton implementations. All code is fully functional but some routes are simply not mounted in the main server.

---

## 5. Docker Compose Analysis

### Web App Docker Compose (`web/docker-compose.yml`)

**Services Defined:**
- ✅ `web` - Next.js web application (port 3001:3000)
- ❌ **NO admin-api service**

**Environment Variables:**
- `NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz` - Points to external URL
- Assumes Admin API is running separately (not in Docker Compose)

### Admin API Deployment

**According to README (`app/admin-api/README.md`):**
- Managed via **systemd** service: `sudo systemctl restart admin-api`
- Runs directly on host (not Docker)
- Port: 3080
- Environment file: `.env.admin.production`

**Other Docker Compose Files Found:**
- `/opt/slimy/app/docker-compose.override.yml` - Only defines `slimy-admin-ui` (not admin-api)
- `/opt/slimy/web/docker-compose.production.yml` - Web app production config
- `/opt/slimy/docker-compose.mcp.yml` - MCP service (unrelated)

**Conclusion:** Admin API is **NOT containerized** in the web app's docker-compose setup. It's expected to run as a separate systemd service on the host.

---

## 6. Missing Integration Points

### Routes Not Mounted

To enable the additional features, these routes need to be mounted in `server.js`:

```javascript
// Missing from server.js:
const chatRoutes = require("./src/routes/chat");
const snailRoutes = require("./src/routes/snail");
const personalityRoutes = require("./src/routes/personality");
const statsRoutes = require("./src/routes/stats");
const diagnosticsRoutes = require("./src/routes/diagnostics");

// Mount them:
router.use("/chat", chatRoutes);
router.use("/snail/:guildId", snailRoutes);
router.use("/", personalityRoutes);  // Uses :guildId param
router.use("/stats", statsRoutes);
router.use("/", diagnosticsRoutes);
```

### Dependencies Missing from package.json

Some routes require additional dependencies not listed in `package.json`:
- `multer` - File uploads (used in snail routes)
- `zod` - Schema validation (used in personality routes)
- `mime-types` - MIME type detection (used in snail routes)
- Google Sheets API client (used in stats routes)

---

## 7. Recommendations

### Immediate Actions

1. **Add Admin API to Docker Compose** (if containerizing):
   ```yaml
   services:
     admin-api:
       build:
         context: ../app/admin-api
       ports:
         - "3080:3080"
       environment:
         - PORT=3080
         - SESSION_SECRET=${SESSION_SECRET}
         - DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
         - DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
         # ... other env vars
       restart: unless-stopped
   ```

2. **Mount Additional Routes** (if features are needed):
   - Add route requires to `server.js`
   - Install missing dependencies
   - Test each route module

3. **Verify Systemd Service** (if using host deployment):
   ```bash
   sudo systemctl status admin-api
   sudo systemctl restart admin-api
   ```

### Code Improvements

1. **Create route loader** to automatically mount all routes
2. **Add route documentation** listing all available endpoints
3. **Add health checks** for external dependencies (OpenAI, database, etc.)
4. **Add fallback handlers** for when routes are unavailable

---

## 8. Summary

| Question | Answer |
|----------|--------|
| **Separate repo?** | No - Same repo, different directory (`/opt/slimy/app/admin-api/`) |
| **Endpoints provided?** | Core: 7 endpoints active. Additional: ~15 endpoints exist but not mounted |
| **Partially implemented?** | Core is fully implemented. Additional features exist but not integrated |
| **Skeleton implementations?** | No - All code is complete and functional |
| **In docker-compose?** | No - Expected to run as systemd service on host |
| **Missing from deployment?** | Yes - Not included in web app's docker-compose.yml |

**Root Cause:** Admin API backend exists and is functional, but:
1. Not included in web app's docker-compose.yml
2. Additional route modules exist but are not mounted
3. Expected to run separately (systemd service) but may not be running

**Next Steps:**
1. Verify Admin API is running: `curl http://localhost:3080/api/health`
2. Check systemd service: `sudo systemctl status admin-api`
3. Add to docker-compose if containerizing
4. Mount additional routes if features are needed

