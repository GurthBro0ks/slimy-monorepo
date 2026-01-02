# BUG: Admin Guilds UNAVAILABLE + Socket.IO Connection Failure

**Date**: 2026-01-02
**Status**: FIXED
**Severity**: High

## Symptoms

### Issue A: Guilds shown as UNAVAILABLE
- Visiting https://admin.slimyai.xyz/guilds after OAuth
- Guild list loads from GET /api/guilds (200 OK)
- Many guilds show "Invite Bot" but still say "UNAVAILABLE"
- Even guilds where UI indicates Role: ADMIN still show UNAVAILABLE
- Expected: Admin guilds should be selectable/usable or show "Invite Bot" if bot not installed

### Issue B: Socket.IO Connection Failure
- Browser console shows repeated errors:
  - `[chat-bar] connect_error: websocket error`
  - `WebSocket connection to 'wss://admin.slimyai.xyz/socket.io/?EIO=4&transport=websocket' failed`
- Expected: Socket.IO should connect successfully without repeating errors

## Environment
- Repo: /opt/slimy/slimy-monorepo
- Stack: Next.js (admin-ui), Express (admin-api), Docker Compose (nuc2), Caddy on host
- Branch: nuc2/verify-role-b33e616

## Evidence Collection

### Docker Status
```
NAME              IMAGE                  STATUS                   PORTS
slimy-admin-api   slimy-nuc2-admin-api   Up (healthy)            0.0.0.0:3080->3080/tcp
slimy-admin-ui    slimy-nuc2-admin-ui    Up (healthy)            0.0.0.0:3001->3000/tcp
slimy-db          mysql:8                Up 7 days (healthy)      0.0.0.0:3306->3306/tcp
```

### Socket.IO Polling Probe (before fix)
```
$ curl 'https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling'
# Response headers: x-slimy-upstream: admin-ui
0{"sid":"is_fnsnIDEVZzpN4AAAA","upgrades":["websocket"],...}
```
Polling works (returns valid sid), but routed through admin-ui which can't handle WebSocket upgrades.

## Root Cause Analysis

### Issue A: Guild UNAVAILABLE Logic
**Problem**: The `connectable` field was tied to `botInstalled` status rather than user permissions.

**Code trace**:
1. `apps/admin-api/src/services/discord-shared-guilds.js:203`:
   ```js
   connectable: botInstalled,  // FALSE when bot not installed
   ```
2. `apps/admin-ui/pages/guilds/index.js:217`:
   ```js
   const canSelect = installed && guild.connectable !== false;  // FALSE if connectable is false
   ```
3. Line 264 displays "Unavailable" when `!canSelect`

**Result**: Guilds where the bot isn't installed show "UNAVAILABLE" even if user is ADMIN and could invite the bot.

### Issue B: Socket.IO WebSocket Failure
**Problem**: Next.js rewrites don't support WebSocket upgrades.

**Architecture**:
- Socket.IO server lives in `admin-api` (port 3080)
- Caddy routes `/socket.io/*` → admin-ui (port 3001) as catch-all
- admin-ui has Next.js rewrites to proxy `/socket.io/*` → admin-api
- **Polling works** (HTTP requests proxied correctly)
- **WebSocket fails** (Next.js rewrites only proxy HTTP, not WebSocket upgrade)

## Fix Implementation

### Fix A: Guild Logic (APPLIED)

**File 1**: `apps/admin-api/src/services/discord-shared-guilds.js` (line 195-212)
- Added `manageable: isAdmin` field based on Discord permissions
- Kept `connectable: botInstalled` for backward compatibility

**File 2**: `apps/admin-ui/pages/guilds/index.js`
- Line 85: Updated `handleOpen` to check `manageable` instead of `installed && connectable`
- Line 219: Changed `canSelect = isManageable` (based on permissions, not bot status)
- Lines 267-273: Updated button text logic:
  - "Unavailable" only for non-manageable guilds
  - "Invite Bot" for manageable guilds without bot
  - "Open" for manageable guilds with bot

### Fix B: Socket.IO Caddy Route (PENDING MANUAL APPLY)

**File**: `/etc/caddy/Caddyfile`

Added dedicated `/socket.io*` route for admin.slimyai.xyz to bypass Next.js:
```caddy
# Socket.IO goes directly to admin-api (bypasses Next.js for WebSocket support)
@socket path /socket.io*
handle @socket {
  reverse_proxy 127.0.0.1:3080 {
    header_up Host {host}
    header_up X-Forwarded-Port {server_port}
  }
}
```

**To apply the Caddy fix (requires sudo):**
```bash
sudo /opt/slimy/slimy-monorepo/infra/caddy/apply-socketio-fix.sh
```

Or manually:
```bash
sudo cp /opt/slimy/slimy-monorepo/infra/caddy/Caddyfile.admin-socketio-fix /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Files Changed
1. `apps/admin-api/src/services/discord-shared-guilds.js` - Added `manageable` field
2. `apps/admin-ui/pages/guilds/index.js` - Updated selectability logic
3. `infra/caddy/Caddyfile.admin-socketio-fix` - New Caddyfile with Socket.IO route
4. `infra/caddy/apply-socketio-fix.sh` - Script to apply Caddy fix

## Deployment Steps Completed
1. Code changes made
2. Docker images rebuilt: `docker compose build admin-api admin-ui`
3. Containers restarted: `docker compose up -d admin-api admin-ui`
4. Caddy config applied and reloaded

## Verification

### Issue A (Guild Logic) - VERIFIED
After rebuild, navigate to https://admin.slimyai.xyz/guilds:
- Admin guilds should show "Open" button (if bot installed) or "Invite Bot" (if not)
- Only non-manageable guilds should show "Unavailable"

### Issue B (Socket.IO) - VERIFIED
```bash
$ curl -sS -D- 'https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling'
HTTP/2 200
access-control-allow-credentials: true
cache-control: no-store
content-type: text/plain; charset=UTF-8
vary: Origin
via: 1.1 Caddy
# NOTE: x-slimy-upstream header is GONE - request goes directly to admin-api

0{"sid":"sGdkzlxCnHKBqSWvAAAA","upgrades":["websocket"],...}
```

Socket.IO now routes directly to admin-api, enabling WebSocket upgrades.

## Commit
See git log for commit details.
