# Quickstart Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for installing admin-api dependencies)
- Credentials from `/opt/slimy/app/admin-api/.env.admin.production`

## Quick Start

### Option 1: Automated Quickstart (Recommended)

```bash
cd /opt/slimy/web
./quickstart.sh
```

This script will:
1. ✅ Create `.env.docker` from admin-api credentials
2. ✅ Install admin-api dependencies if needed
3. ✅ Build Docker images
4. ✅ Start services
5. ✅ Verify health checks

### Option 2: Manual Setup

```bash
cd /opt/slimy/web

# 1. Create .env.docker (already created with credentials)
# The file .env.docker has been created with credentials from admin-api

# 2. Install admin-api dependencies
cd ../app/admin-api
npm install
cd ../../web

# 3. Build and start services
docker compose build
docker compose up -d

# 4. Check logs
docker compose logs -f
```

## Verify Setup

### Check Admin API Health
```bash
curl http://localhost:3080/api/health | jq
```

Expected response:
```json
{
  "ok": true,
  "service": "slimy-admin-api",
  "version": "2025-11-01",
  "uptimeSec": 123,
  "sessions": {
    "active": 0
  },
  "config": {
    "oauthConfigured": true,
    "botTokenConfigured": true
  }
}
```

### Check Web App
```bash
curl http://localhost:3001
```

### Check Route Mounting
```bash
docker compose logs admin-api | grep "Mounted"
```

You should see:
```
[admin-api] Mounted /api/chat routes
[admin-api] Mounted /api/snail/:guildId routes
[admin-api] Mounted /api/:guildId/personality routes
[admin-api] Mounted /api/stats routes
[admin-api] Mounted /api/diagnostics route
```

## Environment Variables

The `.env.docker` file contains:
- **Discord OAuth credentials** (from admin-api .env)
- **Session secret** (from admin-api .env)
- **Web app configuration** (internal Docker networking)

### For Production Deployment

If deploying to production with Caddy reverse proxy, update:
```bash
NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz
```

## Troubleshooting

### Admin API Not Starting
```bash
# Check logs
docker compose logs admin-api

# Common issues:
# - Missing dependencies: cd ../app/admin-api && npm install
# - Port 3080 in use: netstat -tlnp | grep 3080
# - Invalid credentials: Check .env.docker
```

### Routes Not Mounting
```bash
# Check for errors in logs
docker compose logs admin-api | grep -i "failed to mount"

# Install missing dependencies
cd ../app/admin-api
npm install multer mime-types zod
```

### Web App Can't Connect to Admin API
```bash
# Verify internal networking
docker compose exec web ping -c 2 admin-api

# Check environment variable
docker compose exec web printenv | grep NEXT_PUBLIC_ADMIN_API_BASE
```

## Next Steps

1. **Test OAuth Flow**: Visit http://localhost:3001 and click "Login with Discord"
2. **Verify Routes**: Test endpoints like `/api/chat/bot`, `/api/snail/:guildId/stats`
3. **Configure Caddy**: Update Caddyfile to proxy `/api/*` to `localhost:3080`
4. **Add Optional Features**: Set `OPENAI_API_KEY` for chat/snail features

## Useful Commands

```bash
# View logs
docker compose logs -f admin-api
docker compose logs -f web

# Restart services
docker compose restart

# Stop services
docker compose down

# Rebuild after code changes
docker compose up -d --build

# Access admin-api shell
docker compose exec admin-api sh

# Access web app shell
docker compose exec web sh
```

