# BUG: admin.slimyai.xyz 404 + Rogue Caddy Blocking systemd

**Date:** 2025-12-21
**Host:** slimy-nuc2
**Status:** In Progress

---

## Symptoms
- `admin.slimyai.xyz/` returns 404
- `admin.slimyai.xyz/api/health` returns 200
- systemd `caddy.service` FAILED with "127.0.0.1:2019 already in use"
- Rogue root Caddy process is listening on 80/443

---

## Baseline Evidence

### Port Bindings
```
$ sudo ss -ltnp | grep -E ':(80|443|2019)\b'
LISTEN 0 4096 127.0.0.1:2019 0.0.0.0:* users:(("caddy",pid=1558277,fd=8))
LISTEN 0 4096        *:80          *:* users:(("caddy",pid=1558277,fd=10))
LISTEN 0 4096        *:443         *:* users:(("caddy",pid=1558277,fd=11))
```

### systemd Caddy Status
```
$ sudo systemctl status caddy --no-pager
× caddy.service - Caddy
     Loaded: loaded (/usr/lib/systemd/system/caddy.service; enabled; preset: enabled)
     Active: failed (Result: exit-code) since Tue 2025-12-02 20:47:43 UTC; 2 weeks 4 days ago
     Status: "loading new config: starting caddy administration endpoint: listen tcp 127.0.0.1:2019: bind: address already in use"
```

### HTTP Tests
```
$ curl -I https://admin.slimyai.xyz/
HTTP/2 404
content-type: application/json; charset=utf-8
via: 1.1 Caddy

$ curl -I https://admin.slimyai.xyz/api/health
HTTP/2 200
content-type: application/json; charset=utf-8
```

---

## Root Cause Analysis

### Rogue Caddy Process
```
$ sudo ps -fp 1558277
UID   PID     PPID  C STIME TTY   TIME     CMD
root  1558277 1558275 0 Dec02 ?  00:14:11 caddy run --config /etc/caddy/Caddyfile --adapter caddyfile

$ sudo ps -fp 1558275
UID   PID     PPID  C STIME TTY   TIME     CMD
root  1558275 1     0 Dec02 ?  00:00:00 sudo -S nohup caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
```

**Finding:** A manual `sudo nohup caddy run` was executed on Dec 02, which:
1. Started a standalone caddy process (not managed by systemd)
2. Took ownership of ports 80, 443, and 2019 (admin API)
3. Blocked systemd caddy.service from starting

### Stale /etc/caddy/Caddyfile
The live `/etc/caddy/Caddyfile` is **missing the `admin.slimyai.xyz` block entirely!**

Current live config only has:
- `slimyai.xyz, www.slimyai.xyz` with `/admin/*` -> 3081
- `login.slimyai.xyz`, `panel.slimyai.xyz` -> 3000
- No `admin.slimyai.xyz` block

The repo's `infra/docker/Caddyfile.slimy-nuc2` has the correct `admin.slimyai.xyz` block.

---

## Fix Actions

### 1. Backup current Caddyfile
```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.20251221-023500
```

### 2. Kill rogue Caddy
```bash
sudo kill 1558275 1558277  # TERM first
# Verify ports freed
sudo ss -ltnp | grep -E ':(80|443|2019)\b'
```

### 3. Update /etc/caddy/Caddyfile
Replace with correct config from repo, adding `admin.slimyai.xyz` block with:
- `/api/*` -> 127.0.0.1:3080 (admin-api)
- `/*` -> 127.0.0.1:3001 (admin-ui)

### 4. Validate and start systemd Caddy
```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl start caddy
sudo systemctl status caddy --no-pager
```

---

## Verification

### Port Bindings (After Fix)
```
$ sudo ss -ltnp | grep -E ':(80|443|2019)\b'
LISTEN 0 4096 127.0.0.1:2019 0.0.0.0:* users:(("caddy",pid=599090,fd=4))
LISTEN 0 4096        *:80          *:* users:(("caddy",pid=599090,fd=10))
LISTEN 0 4096        *:443         *:* users:(("caddy",pid=599090,fd=7))
```
PID 599090 is the systemd-managed Caddy process.

### systemd Status (After Fix)
```
$ sudo systemctl status caddy --no-pager
● caddy.service - Caddy
     Loaded: loaded (/usr/lib/systemd/system/caddy.service; enabled; preset: enabled)
     Active: active (running) since Sun 2025-12-21 02:39:12 UTC
```

### HTTP Tests (After Fix)
```
$ curl -sS -I https://admin.slimyai.xyz/ | head -5
HTTP/2 200
content-type: text/html; charset=utf-8
x-slimy-upstream: admin-ui
x-powered-by: Next.js

$ curl -sS -I https://admin.slimyai.xyz/api/health | head -3
HTTP/2 200
content-type: application/json; charset=utf-8

$ curl -sS -D- -o /dev/null https://admin.slimyai.xyz/api/auth/discord/authorize-url | grep -iE 'location:|set-cookie:.*oauth_redirect_uri'
location: https://discord.com/oauth2/authorize?...redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback...
set-cookie: oauth_redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback; Path=/; HttpOnly; SameSite=Lax
```

OAuth redirect_uri correctly uses `https://admin.slimyai.xyz/api/auth/discord/callback` (not localhost).

---

## Routing Summary

**Final admin.slimyai.xyz Caddyfile block:**
```caddy
admin.slimyai.xyz {
  import slime_common

  # OAuth/auth routes go to admin-ui (Next.js handles these)
  @admin_ui_auth path /api/auth/*
  handle @admin_ui_auth {
    reverse_proxy 127.0.0.1:3001 {
      header_up Host {host}
      header_up X-Forwarded-Port {server_port}
    }
  }

  # Other API routes go to admin-api backend
  @admin_api path /api/*
  handle @admin_api {
    reverse_proxy 127.0.0.1:3080 {
      header_up Host {host}
      header_up X-Forwarded-Port {server_port}
    }
  }

  # Everything else goes to admin-ui
  handle {
    header X-Slimy-Upstream "admin-ui"
    reverse_proxy 127.0.0.1:3001 {
      header_up Host {host}
      header_up X-Forwarded-Port {server_port}
    }
  }
}
```

---

## Repo Sync
Synced `/etc/caddy/Caddyfile` to `infra/docker/Caddyfile.slimy-nuc2` in the repo.

---

## Conclusion

**Root Causes:**
1. A manual `sudo nohup caddy run` was executed on Dec 02, creating a rogue Caddy process that blocked systemd Caddy from starting.
2. The live `/etc/caddy/Caddyfile` was completely stale and missing the `admin.slimyai.xyz` block.

**Actions Taken:**
1. Killed rogue Caddy process (PID 1558277) and its parent (PID 1558275)
2. Updated `/etc/caddy/Caddyfile` with correct config from repo, modified to route `/api/auth/*` to admin-ui (for OAuth) and other `/api/*` to admin-api
3. Started systemd-managed Caddy (now running as PID 599090)
4. Synced repo template `infra/docker/Caddyfile.slimy-nuc2`

**Result:** All endpoints now work correctly. OAuth redirect_uri uses the public domain `https://admin.slimyai.xyz/...`.

**ready to move on**
