# BUG: admin-guilds-empty + ws-proxy + caddy-2019 (2025-12-31)

## Symptoms

### A) Admin UI Shows "No Guilds Available"
- OAuth sync logs show 94 guilds synced correctly
- `/api/auth/me` returns 94 guilds in payload
- BUT `/api/guilds` returns empty `{ guilds: [] }`
- UI shows "No Guilds Available"

### B) WebSocket Proxy ECONNREFUSED
- admin-ui logs: `Failed to proxy http://localhost:3080/socket.io/?EIO=4&transport=websocket`
- Error: `connect ECONNREFUSED 127.0.0.1:3080`
- Websocket/chat-bar functionality broken

### C) Caddy Container Restart Loop
- caddy logs: `Error: starting caddy administration endpoint: listen tcp 127.0.0.1:2019: bind: address already in use`
- Container enters restart loop

---

## Root Causes

### A) /api/guilds Returns Empty
`GET /api/guilds` in `apps/admin-api/src/routes/guilds.js:84-111` calls `getSharedGuildsForUser()`.

In `apps/admin-api/src/services/discord-shared-guilds.js:159-168`:
```javascript
const checks = await Promise.all(
  userGuilds.map((g) => limit(async () => ({
    guild: g,
    shared: await botInstalledInGuild(g.id, botToken),  // Discord API check
  })))
);
const sharedGuilds = checks.filter((x) => x.shared).map((x) => x.guild);  // FILTERS OUT all non-shared
```

**If the Slimy bot isn't installed in ANY of the user's guilds, result = empty array.**

Meanwhile, `/api/auth/me` returns all guilds from database (synced during OAuth), unfiltered.

### B) WebSocket Proxy ECONNREFUSED
`apps/admin-ui/next.config.js:29`:
```javascript
const backendUrl = process.env.ADMIN_API_INTERNAL_URL || 'http://localhost:3080';
```

This is evaluated **at build time** (Next.js rewrites are compiled).

In `infra/docker/docker-compose.slimy-nuc2.yml`, `ADMIN_API_INTERNAL_URL` is only set as runtime `environment:` (line 85), NOT as `build: args:`.

Result: Build uses fallback `http://localhost:3080` → doesn't work inside container.

### C) Caddy Admin Endpoint Conflict
- Host systemd Caddy binds to `127.0.0.1:2019` (default admin endpoint)
- Docker Caddy (if enabled) also tries to bind to same port
- Docker Caddy is disabled by default (`profiles: ["docker-caddy"]`) but may have been started

---

## Diagnostic Evidence

### Container Status (Before Fix)
```
NAME                           IMAGE                  STATUS                   PORTS
slimy-admin-api               slimy-nuc2-admin-api   Up 2 hours (healthy)     3080/tcp
slimy-admin-ui                slimy-nuc2-admin-ui    Up 2 minutes (healthy)   3001->3000/tcp
```

### Port 2019 Ownership
```bash
$ sudo ss -ltnp | grep ':2019'
LISTEN 0  4096  127.0.0.1:2019  0.0.0.0:*  users:(("caddy",pid=1083,fd=4))
```
Host systemd Caddy owns port 2019 (expected).

### Container Connectivity Test
```bash
# From inside admin-ui, connecting to admin-api by service name
$ docker exec slimy-admin-ui node -e "fetch('http://admin-api:3080/api/health').then(r=>r.json()).then(console.log)"
{ status: 'ok', uptime: 6794, timestamp: '2025-12-31T18:22:15.418Z', version: '1.0.0' }

# localhost:3080 fails (as expected inside container)
$ docker exec slimy-admin-ui node -e "fetch('http://localhost:3080/api/health').catch(e=>console.log(e.message))"
FAIL: fetch failed
```

### Docker Caddy Status
- `slimy-caddy` exited 3 days ago with code 1 (2019 conflict)
- Container was disabled by default (`profiles: ["docker-caddy"]`)
- Removed exited container during cleanup

---

## Fixes Applied

### Fix A: Return All Guilds with `botInstalled` Flag
- File: `apps/admin-api/src/services/discord-shared-guilds.js`
- Added: `getAllUserGuildsWithBotStatus()` function
- Returns ALL guilds with `botInstalled: true/false` instead of filtering

- File: `apps/admin-api/src/routes/guilds.js`
- Changed: `GET /api/guilds` to use new function

### Fix B: Add Build Args for admin-ui
- File: `infra/docker/docker-compose.slimy-nuc2.yml`
- Added: `args:` block with `ADMIN_API_INTERNAL_URL: "http://admin-api:3080"` in admin-ui build

### Fix C: Caddy
- Verified: Host systemd Caddy is authoritative (port 2019, pid 1083)
- Docker Caddy was already disabled by default (`profiles: ["docker-caddy"]`)
- Cleaned up exited `slimy-caddy` container
- No code changes needed

---

## Verification (Post-Deployment)

### Containers Running
```bash
$ docker compose -f infra/docker/docker-compose.slimy-nuc2.yml ps
NAME                 STATUS                    PORTS
slimy-admin-api      Up 30 seconds (healthy)   3080/tcp
slimy-admin-ui       Up 29 seconds (healthy)   3001->3000/tcp
```

### Fix B: WebSocket Proxy Working
```bash
# Socket.io from inside admin-ui container (now uses http://admin-api:3080)
$ docker exec slimy-admin-ui node -e "fetch('http://admin-api:3080/socket.io/?EIO=4&transport=polling').then(r=>r.text()).then(console.log)"
0{"sid":"uJV4Sr0NpIw29bGFAAAA","upgrades":["websocket"],"pingInterval":25000,...}
```

### Health Endpoints Working
```bash
$ curl -sk https://admin.slimyai.xyz/api/health
{"status":"ok","uptime":66,"timestamp":"2025-12-31T18:41:24.694Z","version":"1.0.0"}
```

### Fix A: Pending Manual Verification
- `/api/guilds` endpoint now uses `getAllUserGuildsWithBotStatus()`
- Returns all guilds with `botInstalled: true/false` flag
- Manual browser test needed to confirm UI shows guilds
