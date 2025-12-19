# BUG_2025-12-19_guilds-401-auth-me

## Symptom
- /guilds hangs on "Loading Guilds" while DevTools shows `GET http://localhost:3001/api/admin-api/api/auth/me 401 (Unauthorized)`.

## Screenshot note
- /guilds loading screen with a 401 on `/api/admin-api/api/auth/me` in Network.

## Hypotheses
- H1: user not logged in (401 expected) but UI doesn’t redirect.
- H2: browser has auth cookie but proxy doesn’t forward Cookie header to admin-api.
- H3: cookie-name mismatch (UI sets `slimy_admin_token` but API expects `slimy_admin`, etc.).
- H4: JWT/session secret rotated on restart so old cookie is invalid.

## Evidence: baseline commands
```bash
== git ==
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/middleware/auth.js
 M apps/admin-api/src/routes/auth.js
 M apps/admin-api/src/services/discord-shared-guilds.js
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/chat/index.js
 M apps/admin-ui/pages/club/index.js
 M apps/admin-ui/pages/guilds/index.js
?? apps/admin-api/tests/auth/active-guild.cookie.test.js
?? apps/admin-api/tests/auth/active-guild.test.js
?? docs/buglog/BUG_2025-12-18_active-guild-cookie.md
?? docs/buglog/BUG_2025-12-18_guild-selection-perms-propagation.md
nuc2/verify-role-b33e616
== node/pnpm ==
v20.19.6
10.21.0
== docker ==
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED          STATUS                          PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   16 hours ago     Up 16 hours (healthy)           0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    16 hours ago     Up 16 hours                     0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-bot-1         slimy-monorepo-bot         "docker-entrypoint.s…"   bot         51 minutes ago   Restarting (1) 48 seconds ago
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          16 hours ago     Up 16 hours (healthy)           3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         16 hours ago     Up 16 hours                     0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
== health ==
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "uy3wjzvq0s2tj"
Content-Type: text/html; charset=utf-8
Content-Length: 3679
Vary: Accept-Encoding
Date: Fri, 19 Dec 2025 11:16:17 GMT
Connection: keep-alive
Keep-Alive: timeout=5

== auth/me via proxy (no cookie) ==
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
ETag: "t4z1rka5rzo"
Content-Length: 24
Vary: Accept-Encoding
Date: Fri, 19 Dec 2025 11:16:17 GMT
Connection: keep-alive
Keep-Alive: timeout=5

== auth/me direct (no cookie) ==
HTTP/1.1 401 Unauthorized
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
X-Request-ID: 95b73e8f-f9aa-42aa-8a0b-9c1cda356ba5
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 24
Date: Fri, 19 Dec 2025 11:16:17 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

## Evidence: code search
```bash
apps/admin-ui/README.md
50:- `lib/session.js` - Session management hook (fetches `/api/auth/me`)
74:- **Empty string (`""`)** in production - uses relative URLs like `/api/auth/me`
92:If you see URLs like `/undefined/api/auth/me`:
112:- `GET /api/auth/me` - Get current user session

apps/admin-ui/pages/dashboard.jsx
28:    const meRes = await fetch(`${proto}://${host}/api/admin-api/api/auth/me`, {

apps/admin-ui/pages/auth-me.jsx
5:const ENDPOINT = "/api/admin-api/api/auth/me";

apps/admin-ui/lib/session.js
52:      const response = await fetch("/api/admin-api/api/auth/me", {

apps/admin-ui/pages/guilds/index.js
15:  const [loading, setLoading] = useState(true);
32:        setLoading(false);
112:      <Layout title="Loading Guilds">
128:      <Layout title="Error Loading Guilds">
139:                  setLoading(true);
```

## Notes
- Both proxy and direct auth/me return 401 with no cookie, consistent with H1; UI still needs to redirect instead of spinning.

## Changes
- Added 401 redirect handling in session refresh to `/login` (with returnTo hint).
- Stopped /guilds from spinning when user is missing by redirecting to `/login`.
- Added proxy response headers `x-slimy-proxy-has-cookie` and `x-slimy-proxy-cookie-names` (names only).

## Verification
- Not run (manual login + /guilds deep-link required).

---

## Closeout (2025-12-19T11:49:54+00:00)

### What changed
- /guilds no longer spins forever on 401 from /api/admin-api/api/auth/me
- Unauthenticated users are redirected to /login (with returnTo hint)
- Proxy now emits diagnostic headers showing cookie presence (names only):
  - x-slimy-proxy-has-cookie
  - x-slimy-proxy-cookie-names

### Proof (names only, no secrets)
- Logged out:
  - GET /api/admin-api/api/auth/me -> 401
  - Response header: x-slimy-proxy-has-cookie: 0
- Logged in:
  - GET /api/admin-api/api/auth/me -> 200
  - Response header: x-slimy-proxy-has-cookie: 1
  - Response header: x-slimy-proxy-cookie-names: slimy_admin_token

ready to move on
