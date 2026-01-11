# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-18T18:10:50+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
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
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   4 hours ago    Up 4 hours (healthy)    0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          24 hours ago   Up 24 hours (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         24 hours ago   Up 24 hours             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
```


## curl -fsS -D- -o /dev/null http://localhost:3001/ | sed -n '1,15p'
```
curl: (7) Failed to connect to localhost port 3001 after 0 ms: Couldn't connect to server
```


## curl -fsS -D- -o /dev/null http://localhost:3080/api/health | sed -n '1,20p'
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
X-Request-ID: 15f9058a-8e29-4f26-afcb-9d9b79de2626
Access-Control-Allow-Origin: http://localhost:3000
Vary: Origin
Access-Control-Allow-Credentials: true
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
Content-Length: 87
```


## curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep 'redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fcallback'
```
curl: (7) Failed to connect to localhost port 3001 after 0 ms: Couldn't connect to server
