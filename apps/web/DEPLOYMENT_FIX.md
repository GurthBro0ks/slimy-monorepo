# Deployment Fix Guide - 502 Bad Gateway Issue

## Problem Analysis

The 502 Bad Gateway error when accessing `https://admin.slimyai.xyz/api/auth/login` indicates one of these issues:

1. **Admin API not running** - The backend API on port 3080 is not responding
2. **Incorrect environment variable** - `NEXT_PUBLIC_ADMIN_API_BASE` is set incorrectly
3. **Caddy proxy misconfiguration** - The `/api/*` routes are not properly proxied
4. **CORS issues** - The admin API is rejecting requests from the web app

## Solution Steps

### Step 1: Check Admin API Status

```bash
# SSH into your server
ssh your-server

# Check if admin API is running on port 3080
curl http://localhost:3080/api/health
# or
curl http://localhost:3080/api/diag

# If it returns JSON, the API is working
# If it fails, the admin API is not running
```

### Step 2: Verify Environment Variables

The web app needs to know where the admin API is located. Check your docker-compose.yml:

```bash
cd /opt/slimy/web
cat docker-compose.yml | grep NEXT_PUBLIC_ADMIN_API_BASE
```

**Expected value:**
```yaml
environment:
  - NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz
```

**If it's wrong, update it:**

```bash
# Edit docker-compose.yml
nano docker-compose.yml

# Change the environment section to:
services:
  web:
    build: .
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz
      - NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes
    restart: unless-stopped

# Save and rebuild
docker compose down
docker compose up -d --build
```

### Step 3: Fix Caddy Configuration

The Caddyfile needs to proxy `/api/*` requests to your admin API backend.

```bash
# Check current Caddyfile
cat /etc/caddy/Caddyfile
```

**Expected configuration:**

```caddyfile
admin.slimyai.xyz {
    # Proxy API routes to admin API backend
    handle /api/* {
        reverse_proxy localhost:3080
    }

    # Proxy everything else to Next.js web app
    reverse_proxy localhost:3001

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Logging
    log {
        output file /var/log/caddy/admin.slimyai.xyz.log
    }
}
```

**If it's wrong, fix it:**

```bash
# Backup current config
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup-$(date +%s)

# Edit Caddyfile
sudo nano /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

### Step 4: Check Admin API Backend

If your admin API is not running, you need to start it:

```bash
# Check if admin API container exists
docker ps -a | grep admin

# If it exists but stopped, start it
docker start <container-name>

# If it doesn't exist, you need to deploy the admin API first
# The admin API should be running on port 3080
```

### Step 5: Test the Fix

```bash
# Test admin API directly
curl http://localhost:3080/api/health

# Test through Caddy proxy
curl https://admin.slimyai.xyz/api/health

# Test web app
curl https://admin.slimyai.xyz/

# All should return 200 OK
```

## Alternative: Disable Login Until Admin API is Ready

If you don't have the admin API backend ready yet, you can temporarily disable the login functionality:

### Option A: Use Placeholder API Base

Update `docker-compose.yml`:

```yaml
environment:
  - NEXT_PUBLIC_ADMIN_API_BASE=
  - NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes
```

This will make the login button non-functional but won't cause 502 errors.

### Option B: Create Mock Auth Endpoint

Add a simple mock endpoint in the Next.js app:

```bash
# On your development machine
cd /home/ubuntu/slimyai-web
```

Create `app/api/auth/login/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "Discord OAuth not configured yet. Please set up the admin API backend.",
    status: "mock"
  }, { status: 503 });
}
```

Then rebuild and redeploy.

## Root Cause Summary

The issue is that the web app is trying to use Discord OAuth for authentication, which requires:

1. **Admin API Backend** - A separate service that handles Discord OAuth flow
2. **Proper environment variables** - `NEXT_PUBLIC_ADMIN_API_BASE` pointing to the admin API
3. **Reverse proxy configuration** - Caddy routing `/api/*` to the admin API

**Current State:**
- ✅ Web app deployed on port 3001
- ✅ Caddy serving HTTPS on admin.slimyai.xyz
- ❌ Admin API not responding on port 3080 (or not running)
- ❌ `/api/auth/login` returns 502 because there's no backend to handle it

**Next Steps:**
1. Deploy the admin API backend (Discord bot's API server)
2. Ensure it's running on port 3080
3. Update Caddyfile to proxy `/api/*` to port 3080
4. Set `NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz` in docker-compose.yml

## Quick Fix Commands

```bash
# 1. Check what's running
docker ps
netstat -tlnp | grep -E '3080|3001'

# 2. Update docker-compose.yml
cd /opt/slimy/web
nano docker-compose.yml
# Add: NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz

# 3. Rebuild and restart
docker compose down
docker compose up -d --build

# 4. Check Caddyfile
sudo nano /etc/caddy/Caddyfile
# Ensure /api/* routes to port 3080

# 5. Reload Caddy
sudo systemctl reload caddy

# 6. Test
curl https://admin.slimyai.xyz/
curl https://admin.slimyai.xyz/api/health
```

## Contact for Help

If you need further assistance, provide:
1. Output of `docker ps`
2. Output of `cat /etc/caddy/Caddyfile`
3. Output of `cat /opt/slimy/web/docker-compose.yml`
4. Output of `curl http://localhost:3080/api/health`
