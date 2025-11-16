# Implementation Summary: Admin API Recommendations

## Completed Implementations

### 1. ✅ Dockerfile Created
**File:** `/opt/slimy/app/admin-api/Dockerfile`

- Node.js 18-slim base image
- Production dependencies only
- Health check configured
- Port 3080 exposed
- Data directories created

### 2. ✅ Docker Compose Updated
**File:** `/opt/slimy/web/docker-compose.yml`

**Changes:**
- Added `admin-api` service
- Configured environment variables with defaults
- Added volumes for data persistence (`admin-api-data`, `admin-api-uploads`)
- Added health check
- Web service now depends on admin-api
- Web service uses internal URL (`http://admin-api:3080`) by default

**Environment Variables:**
- All Discord OAuth variables configurable via environment
- Optional features (OpenAI, Stats) can be enabled via env vars
- Uses `${VAR:-default}` syntax for optional variables

### 3. ✅ Additional Routes Mounted
**File:** `/opt/slimy/app/admin-api/server.js`

**Routes Added:**
- `/api/chat/*` - Chat bot and history endpoints
- `/api/snail/:guildId/*` - Super Snail screenshot analysis
- `/api/:guildId/personality/*` - Guild personality configuration
- `/api/stats/*` - Club statistics
- `/api/diagnostics` - System diagnostics

**Implementation:**
- Routes mounted with try/catch for graceful degradation
- Console logs indicate which routes are successfully mounted
- Routes that fail to load won't crash the server

### 4. ✅ Missing Dependencies Added
**File:** `/opt/slimy/app/admin-api/package.json`

**Dependencies Added:**
- `multer@^1.4.5-lts.1` - File upload handling (snail routes)
- `mime-types@^2.1.35` - MIME type detection (snail routes)
- `zod@^3.22.4` - Schema validation (personality routes)

### 5. ✅ Supporting Files Created
- `.dockerignore` - Excludes unnecessary files from Docker build
- `.env.example` - Documents all required environment variables

## Usage

### Development (Docker Compose)

```bash
cd /opt/slimy/web

# Create .env file with required variables
cat > .env << EOF
SESSION_SECRET=your-secret-here
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_BOT_TOKEN=your-bot-token
EOF

# Start services
docker compose up -d

# Check logs
docker compose logs -f admin-api
docker compose logs -f web

# Test admin API
curl http://localhost:3080/api/health
```

### Production (Systemd)

If you prefer to run admin-api as a systemd service instead:

```bash
# The admin-api can still run as systemd service
# Update web docker-compose.yml to use external URL:
# NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz
```

## Route Endpoints Now Available

### Chat Routes
- `POST /api/chat/bot` - Chat with bot (member+)
- `GET /api/chat/:guildId/history` - Get chat history (member+)

### Snail Routes
- `POST /api/snail/:guildId/analyze` - Analyze screenshots (member+)
- `GET /api/snail/:guildId/stats` - Get user stats (member+)
- `GET /api/snail/:guildId/analyze_help` - Get help text (member+)
- `POST /api/snail/:guildId/calc` - Calculate tier costs (member+)
- `GET /api/snail/:guildId/codes` - Get secret codes (member+)

### Personality Routes
- `GET /api/:guildId/personality/presets` - List presets (admin+)
- `GET /api/:guildId/personality` - Get guild personality (admin+)
- `PUT /api/:guildId/personality` - Update guild personality (admin+)
- `POST /api/:guildId/personality/reset` - Reset to default (admin+)
- `POST /api/:guildId/personality/test` - Test personality output (admin+)

### Stats Routes
- `GET /api/stats/summary` - Get club stats summary (requires STATS_SHEET_ID)

### Diagnostics Routes
- `GET /api/diagnostics` - System diagnostics (authenticated)

## Next Steps

### 1. Install Dependencies
```bash
cd /opt/slimy/app/admin-api
npm install
```

### 2. Test Route Mounting
```bash
# Start the server and check logs
node server.js

# Look for mount messages:
# [admin-api] Mounted /api/chat routes
# [admin-api] Mounted /api/snail/:guildId routes
# etc.
```

### 3. Verify External Dependencies
Some routes require additional services:
- **Chat/Snail routes:** Require `OPENAI_API_KEY`
- **Stats routes:** Require `STATS_SHEET_ID` and Google Sheets API
- **Personality routes:** Require database connectivity

### 4. Update Caddy Configuration
If using Caddy reverse proxy, ensure it routes `/api/*` to the admin-api service:

```caddyfile
admin.slimyai.xyz {
    handle_path /api/* {
        reverse_proxy localhost:3080
    }
    reverse_proxy localhost:3001
}
```

## Troubleshooting

### Routes Not Mounting
Check server logs for error messages:
```bash
docker compose logs admin-api | grep "Failed to mount"
```

Common issues:
- Missing dependencies: Run `npm install` in admin-api directory
- Missing middleware: Check that `src/middleware/auth.js` exists
- Missing services: Some routes require external services (OpenAI, database)

### Docker Build Fails
- Ensure `package.json` has all dependencies listed
- Check that `Dockerfile` paths are correct
- Verify Node.js version compatibility

### Health Check Fails
- Verify port 3080 is not already in use
- Check that environment variables are set correctly
- Review server logs for startup errors

## Notes

- Routes are mounted with error handling - if a route module fails to load, the server will continue running
- The web app can use either internal Docker network URL (`http://admin-api:3080`) or external URL (`https://admin.slimyai.xyz`)
- Data persistence is handled via Docker volumes
- Environment variables can be set via `.env` file or docker-compose override files

