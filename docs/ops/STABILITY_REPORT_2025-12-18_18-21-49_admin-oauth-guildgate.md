# Stability Report: admin oauth + guild gate
- Timestamp: 2025-12-18T18:21:49+00:00
- Repo: /opt/slimy/slimy-monorepo


## git status -sb
```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M scripts/smoke/stability-gate.sh
?? docs/buglog/BUG_2025-12-18_stability-gate-polish-fullmode.md
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


## admin-ui: http://localhost:3001/
```
[FAIL] admin-ui unreachable: http://localhost:3001/
       Hint: docker compose ps | rg -n '(admin-ui|web|admin-api)'
       Hint: check ports (:3001 admin-ui, :3000 web, :3080 admin-api)
       curl error (redacted):
curl: (7) Failed to connect to localhost port 3001 after 0 ms: Couldn't connect to server
```

