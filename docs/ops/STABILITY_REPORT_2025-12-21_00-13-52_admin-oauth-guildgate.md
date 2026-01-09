# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-21T00:13:52+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
M  .gitignore
M  apps/admin-api/tests/auth/auth-middleware.test.js
 M apps/admin-ui/lib/session.js
 M apps/admin-ui/package.json
 M apps/admin-ui/pages/api/auth/discord/authorize-url.js
 M apps/admin-ui/pages/guilds/index.js
M  apps/web/Caddyfile.template
M  docker-compose.yml
M  docs/buglog/BUG_2025-12-20_16-19-30_cors-proxy-origin-forward.md
A  docs/reports/REPORT_2025-12-19_admin-subdomain-structure.md
A  docs/reports/REPORT_2025-12-20_cors-proxy-audit.md
M  infra/docker/Caddyfile.slimy-nuc2
M  scripts/smoke/stability-gate.sh
?? apps/admin-ui/lib/oauth-origin.js
?? apps/admin-ui/lib/settings-tabs.js
?? apps/admin-ui/pages/settings.js
?? apps/admin-ui/tests/
?? docs/buglog/BUG_2025-12-20_admin-domain-oauth-redirect-uri.md
?? docs/buglog/BUG_2025-12-20_oauth-redirect-uri-public-origin.md
?? docs/buglog/BUG_2025-12-20_settings-tabs-gated-guild.md
```


## git rev-parse --abbrev-ref HEAD
```
nuc2/verify-role-b33e616
```


## node -v; pnpm -v
```
v20.19.6
10.21.0
```


## docker compose ps
```
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED        STATUS                  PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   6 hours ago    Up 6 hours (healthy)    0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    6 hours ago    Up 6 hours              0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          32 hours ago   Up 32 hours (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         28 hours ago   Up 28 hours             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## admin-ui: http://localhost:3001/
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "nrbvu9761n2vn"
Content-Type: text/html; charset=utf-8
Content-Length: 3755
Vary: Accept-Encoding
Date: Sun, 21 Dec 2025 00:13:53 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## admin-api health: http://localhost:3080/api/health
```
HTTP/1.1 200 OK
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
X-Request-ID: c305063b-029c-40bb-8fd9-13a71aac7fbb
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 87
Date: Sun, 21 Dec 2025 00:13:53 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```


## curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep 'redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback'
```
