# BUGLOG — Admin Panel: guild status, socket.io, settings, active-guild

Date: 2026-01-02  
Slug: `adminpanel_guildstatus_socketio_settings_activeguild`  
Domain under test: https://admin.slimyai.xyz

## Symptom / Context
- Admin UI shows “Chat failed to connect” broadly (Socket.IO).
- Settings requests observed as malformed (double `/api`): `/api/admin-api/api/settings/...`.
- `/guilds` shows “UNAVAILABLE” incorrectly / wrong `botInstalled` gating.
- `POST /api/auth/active-guild` returns `400 guild_not_shared` (possibly downstream of guild status logic).
- Typo: “RUN ANALYZIG” → “RUN ANALYZING”.
- Goal: reduce minified React errors by preventing API failures from cascading (minimal guards only, after core issues).

## Plan (fix order)
1. Fix B: Socket.IO routing/proxy (ensure `/socket.io` hits the real socket server).
2. Fix C: Remove double `/api` in settings URLs (frontend).
3. Fix A: Correct “UNAVAILABLE”/gating + `botInstalled` accuracy (+ TEMP debug panel on `/guilds`).
4. Fix D: Fix `active-guild` 400/retry semantics.
5. Fix E: Typo.
6. Minimal anti-cascade guards after core fixes.

## Baseline Snapshot (NO CHANGES YET)

### Git
Command:
```bash
git rev-parse HEAD
```
Output:
```text
3cb99e9cc0140edb4236338613e97a59730e3f13
```

### Docker compose status
Command:
```bash
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml ps
```
Output:
```text
NAME                 IMAGE                  COMMAND                  SERVICE        CREATED              STATUS                        PORTS
slimy-admin-api      slimy-nuc2-admin-api   "docker-entrypoint.s…"   admin-api      2 hours ago          Up 2 hours (healthy)          0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-admin-ui       slimy-nuc2-admin-ui    "docker-entrypoint.s…"   admin-ui       About a minute ago   Up About a minute (healthy)   0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-db             mysql:8                "docker-entrypoint.s…"   slimy-db       2 weeks ago          Up 7 days (healthy)           0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp
slimy-loopback1455   python:3-alpine        "python3 -m http.ser…"   loopback1455   2 weeks ago          Up 7 days (healthy)           0.0.0.0:1455->1455/tcp, :::1455->1455/tcp
```

### Recent logs (tail 200)
Command:
```bash
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml logs --tail 200 admin-ui admin-api web
```
Output (excerpt; sanitized if needed):
```text
slimy-admin-ui  |   ▲ Next.js 14.2.5
slimy-admin-ui  |   - Local:        http://localhost:3000
slimy-admin-ui  |   - Network:      http://0.0.0.0:3000
slimy-admin-ui  |
slimy-admin-ui  |  ✓ Starting...
slimy-admin-ui  |  ✓ Ready in 173ms
slimy-admin-api  | {"level":"INFO","time":"2026-01-02T14:59:33.104Z","pid":1,"hostname":"0441e130eca7","requestId":"31c69d12-d7b0-4d95-ba71-cb88cce06e0c","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","env":"production","msg":"Request completed"}
...
```

### curl evidence (baseline)

#### 1) `GET /api/health` (headers only)
Command:
```bash
curl -sS -D- https://admin.slimyai.xyz/api/health -o /dev/null
```
Output:
```text
HTTP/2 200
...
via: 1.1 Caddy
...
content-length: 86
```

#### 2) `GET /api/guilds` (first 2000 bytes)
Command:
```bash
curl -sS https://admin.slimyai.xyz/api/guilds | head -c 2000; echo
```
Output:
```text
{"ok":false,"code":"UNAUTHORIZED","message":"Authentication required"}
```

#### 3) `GET /socket.io` (polling probe; first 350 bytes)
Command:
```bash
curl -i "https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling&t=$(date +%s)" | head -c 350; echo
```
Output:
```text
HTTP/2 200
...
0{"sid":"00x8Xx13exGkrYsLAAAB","upgr
```

#### 4) `GET /api/admin-api/settings/guild/:id` (first 40 lines)
Command:
```bash
curl -i https://admin.slimyai.xyz/api/admin-api/settings/guild/1176605506912141444 | head -n 40
```
Output:
```text
HTTP/2 404
...
{"ok":false,"error":{"code":"NOT_FOUND","message":"Route GET /api/admin-api/settings/guild/1176605506912141444 not found","requestId":"cbd9bf18-753e-479a-be6f-234ed3534a74"}}
```

#### 5) `GET /api/admin-api/api/settings/guild/:id` (first 40 lines)
Command:
```bash
curl -i https://admin.slimyai.xyz/api/admin-api/api/settings/guild/1176605506912141444 | head -n 40
```
Output:
```text
HTTP/2 404
...
{"ok":false,"error":{"code":"NOT_FOUND","message":"Route GET /api/admin-api/api/settings/guild/1176605506912141444 not found","requestId":"3a99ff36-a057-4359-bc38-39ceac75b56f"}}
```

## Browser Incognito Evidence (TODO — paste here)
- `/guilds`: capture `GET /api/guilds` response JSON row for guildId `1176605506912141444` (fields present in response).
- Capture failing WS attempt + status:
  - `wss://admin.slimyai.xyz/socket.io/?EIO=4&transport=websocket`
- Capture `POST /api/auth/active-guild` request payload + response JSON.

---

## Commit 1 — FIX B: Socket.IO routing (highest impact)
Commit message target: `fix(proxy): route /socket.io to socket server`

### Notes / investigation
- Baseline polling probe already returns a valid Socket.IO open packet (`sid`) when **no** `Origin` header is present.
- Browser requests include `Origin: https://admin.slimyai.xyz`; admin-api Socket.IO CORS origin allowlist default did **not** include `https://admin.slimyai.xyz`, causing a `400 Bad request` during the polling handshake.

### Commands / outputs
- Repro (pre-fix): polling handshake with `Origin` returns 400.
  ```bash
  curl -i -H "Origin: https://admin.slimyai.xyz" \
    "https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling&t=$(date +%s)" | head -n 25
  ```
  Output (pre-fix):
  ```text
  HTTP/2 400
  ...
  {"code":3,"message":"Bad request"}
  ```

- Fix deployed: rebuild/recreate admin-api container.
  ```bash
  docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --build admin-api
  ```
  Output (tail):
  ```text
  ✔ Container slimy-admin-api  Started
  ```

- Verify (post-fix): polling handshake with `Origin` returns 200 + `access-control-allow-origin`.
  ```bash
  curl -i -H "Origin: https://admin.slimyai.xyz" \
    "https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling&t=$(date +%s)" | head -n 25
  ```
  Output (post-fix):
  ```text
  HTTP/2 200
  access-control-allow-origin: https://admin.slimyai.xyz
  ...
  0{"sid":"...","upgrades":["websocket"],...}
  ```

### Files changed
- `apps/admin-api/src/config.js`

### Verification evidence
- `curl` with `Origin: https://admin.slimyai.xyz` now returns `HTTP/2 200` (was `HTTP/2 400`).

---

## Commit 2 — FIX C: Double `/api` in settings URLs (frontend)
Commit message target: `fix(admin-ui): remove duplicate /api from admin-api settings requests`

### Commands / outputs
- TODO

### Files changed
- TODO

### Verification evidence
- TODO

---

## Commit 3 — FIX A: Guild status + UNAVAILABLE logic
Commit message target: `fix(guilds): correct availability gating + botInstalled display (+ temp debug panel)`

### Commands / outputs
- TODO

### Files changed
- TODO

### Verification evidence
- TODO

---

## Commit 4 — FIX D: active-guild 400 guild_not_shared
Commit message target: `fix(auth): accept manageable guild selection; prevent active-guild retry spam`

### Commands / outputs
- TODO

### Files changed
- TODO

### Verification evidence
- TODO

---

## Commit 5 — FIX E: Typo
Commit message target: `chore(ui): fix snail tools button typo`

### Commands / outputs
- TODO

### Files changed
- TODO

### Verification evidence
- TODO
