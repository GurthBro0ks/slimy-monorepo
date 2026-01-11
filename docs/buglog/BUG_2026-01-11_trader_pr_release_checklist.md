# BUG_2026-01-11_trader_pr_release_checklist.md

## Phase 2 Verification Receipts

### 1) Confirm chunk is served
Command: `curl -I https://trader.slimyai.xyz/_next/static/`
Output:
```
HTTP/2 308 
alt-svc: h3=":443"; ma=2592000
date: Sun, 11 Jan 2026 10:46:13 GMT
location: /_next/static
refresh: 0;url=/_next/static
via: 1.1 Caddy
```

### 2) Confirm logout redirect is relative + cookie cleared
Command: `curl -I -X POST https://trader.slimyai.xyz/trader/auth/logout`
Output:
```
HTTP/2 303 
alt-svc: h3=":443"; ma=2592000
date: Sun, 11 Jan 2026 10:46:17 GMT
location: /trader/login
set-cookie: trader_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly; SameSite=lax
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
via: 1.1 Caddy
```

### 3) Confirm unauth me is no_session
Command: `curl -i https://trader.slimyai.xyz/trader/auth/me`
Output:
```
HTTP/2 303 
location: /trader/login?reason=no_session
...
```

### 4) Confirm trader isolation
Command: `curl -sS https://trader.slimyai.xyz/trader/register | grep -iE "DashboardChatClub|Log Out|slimyai.xyz" && echo "FOUND_UNWANTED_HEADER" || echo "OK_NO_MAIN_HEADER"`
Output:
```
OK_NO_MAIN_HEADER
```
