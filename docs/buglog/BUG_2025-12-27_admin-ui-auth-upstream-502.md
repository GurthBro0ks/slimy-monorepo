# BUGLOG: admin-ui-auth-upstream-502 (2025-12-27)

## Symptom / Context
- `https://admin.slimyai.xyz/api/auth/discord/callback` returns `502` JSON:
  - `{"ok":false,"error":{"code":"UPSTREAM_UNREACHABLE","message":"fetch failed"}}`

## Plan
1) Collect evidence (search + compose + in-container DNS + in-container fetch).
2) Identify exact file/line returning `UPSTREAM_UNREACHABLE`.
3) Fix upstream URL selection / env wiring so admin-ui can reach admin-api.
4) Add deterministic guardrail verify script and a minimal proxy tripwire test.

## Evidence (required commands)

### 1) Search
Command:
- `rg -n "UPSTREAM_UNREACHABLE|fetch failed|api/auth/discord" apps -S`

Output:
```
apps/admin-ui/tests/oauth-tripwire.test.js
33:  authorizeSrc.includes("/api/auth/discord/callback"),
34:  `[tripwire] ${rel(authorizeFile)} must use /api/auth/discord/callback`,
57:  { needle: "/api/auth/login", reason: "browser must use /api/auth/discord/authorize-url" },

apps/admin-ui/pages/index.js
43:        <a className="hero__cta" href="/api/auth/discord/authorize-url">
69:loginEndpoint: /api/auth/discord/authorize-url

apps/admin-ui/pages/api/auth/discord/callback.js
42:      error: { code: "UPSTREAM_UNREACHABLE", message: String(e?.message || e) },

apps/admin-ui/pages/api/auth/discord/authorize-url.js
19:  const redirectUri = `${origin}/api/auth/discord/callback`;

apps/admin-api/src/routes/auth.js
26:const CANONICAL_AUTHORIZE_URL = `${CANONICAL_ADMIN_ORIGIN}/api/auth/discord/authorize-url`;
27:const CANONICAL_CALLBACK_URL = `${CANONICAL_ADMIN_ORIGIN}/api/auth/discord/callback`;

apps/admin-ui/pages/api/admin-api/api/auth/login.js
12:  res.setHeader("Location", `/api/auth/discord/authorize-url${qs}`);

apps/admin-api/ERROR_HANDLING.md
33:  - `UserFetchError` - User fetch failed
34:  - `GuildFetchError` - Guild fetch failed

apps/admin-ui/pages/login.js
5:const LOGIN_ENDPOINT = "/api/auth/discord/authorize-url";

apps/admin-api/src/lib/config/index.js
142:  const DEFAULT_REDIRECT_URI = "https://admin.slimyai.xyz/api/auth/discord/callback";

apps/admin-api/src/lib/auth/post-login-redirect.test.js
17:      cookieRedirectUri: "http://localhost:3001/api/auth/discord/callback",

apps/admin-api/src/config.js
66:    ? "https://admin.slimyai.xyz/api/auth/discord/callback"
67:    : "http://localhost:3081/api/auth/discord/callback";

apps/web/tests/unit/lib/admin-client.test.ts
24:    const networkError = new TypeError("fetch failed");

apps/web/lib/codes/sources/snelp.ts
83:      console.error(`Snelp source fetch failed:`, error);

apps/web/lib/codes/sources/reddit.ts
62:      console.error(`Reddit source fetch failed:`, error);

apps/web/lib/codes/refresh.ts
92:      // If we have stale data, return it even if fetch failed

apps/web/app/auth/discord/callback/route.ts
8:    targetUrl.pathname = '/api/auth/discord/callback';

apps/web/app/api/auth/discord.bak/login/route.ts
9:    return `${baseUrl}/api/auth/discord/callback`;
14:  return `${origin}/api/auth/discord/callback`;

apps/web/app/api/auth/discord.bak/callback/route.ts
22:    return `${baseUrl}/api/auth/discord/callback`;
26:  return `${origin}/api/auth/discord/callback`;
```

### 2) Compose status
Command:
- `docker compose ps`

Output:
```
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED          STATUS                          PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   15 minutes ago   Up 15 minutes (healthy)         0.0.0.0:13080->3080/tcp, :::13080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    26 hours ago     Up 26 hours                     0.0.0.0:13001->3000/tcp, :::13001->3000/tcp
slimy-monorepo-bot-1         slimy-monorepo-bot         "docker-entrypoint.s…"   bot         25 hours ago     Restarting (1) 41 seconds ago
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          6 days ago       Up 42 hours (healthy)           3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         15 minutes ago   Up 15 minutes                   0.0.0.0:13000->3000/tcp, :::13000->3000/tcp
```

### 3) Recent logs
Command:
- `docker compose logs --tail 200 admin-ui admin-api`

Output (snippet):
```
admin-ui-1   |   ▲ Next.js 14.2.5
admin-ui-1   |   - Local:        http://localhost:3000
admin-ui-1   |   - Network:      http://0.0.0.0:3000
admin-ui-1   |
admin-ui-1   |  ✓ Starting...
admin-ui-1   |  ✓ Ready in 217ms
```

### 4) DNS inside admin-ui container
Command:
- `docker compose exec -T admin-ui sh -lc 'getent hosts admin-api || true'`

Output:
```
172.22.0.4      admin-api
```

### 5) HTTP reachability from admin-ui to admin-api
Command:
- `docker compose exec -T admin-ui sh -lc 'node -e "fetch(\"http://admin-api:3080/api/health\").then(r=>r.status).then(console.log).catch(e=>{console.error(e);process.exit(1)})"'`

Output:
```
200
```

## Root Cause (confirmed)
- The failing response is generated by `apps/admin-ui/pages/api/auth/discord/callback.js` when `fetch(...)` throws.
- In production, `ADMIN_API_INTERNAL_URL` can be configured to a reachable loopback (ex: `http://localhost:3080` via host networking), but the handler currently ignores any value containing `localhost` and forces `http://admin-api:3080`, which can be unreachable outside a compose network.
- Additionally, the handler returns `e.message` to the client, which risks leaking internal hostnames/loopback in client-visible JSON.

## Fix (planned / implemented)
- Use `ADMIN_API_INTERNAL_URL` when set (even if it is `localhost`), and only fall back to `http://admin-api:3080` when unset/invalid.
- Remove client-visible error message passthrough; return a stable message that does not expose internal DNS/loopback details.
- Add a deterministic verify script ensuring compose wiring includes `ADMIN_API_INTERNAL_URL` for admin-ui.
- Add a minimal admin-ui test tripwire guarding against reintroducing the localhost-gating bug and error-message leakage.

## Files Changed
- `apps/admin-ui/pages/api/auth/discord/callback.js`
- `apps/admin-ui/tests/auth-callback-proxy.test.js`
- `apps/admin-ui/package.json`
- `scripts/verify/admin-ui-can-reach-admin-api.sh`
- `docs/buglog/BUG_2025-12-27_admin-ui-auth-upstream-502.md`

## Commands Run
- `rg -n "UPSTREAM_UNREACHABLE|fetch failed|api/auth/discord" apps -S`
- `docker compose ps`
- `docker compose logs --tail 200 admin-ui admin-api`
- `docker compose exec -T admin-ui sh -lc 'getent hosts admin-api || true'`
- `docker compose exec -T admin-ui sh -lc 'node -e "fetch(\"http://admin-api:3080/api/health\").then(r=>r.status).then(console.log).catch(e=>{console.error(e);process.exit(1)})"'`
- `bash scripts/verify/admin-ui-can-reach-admin-api.sh`
- `pnpm --filter @slimy/admin-ui test`
- `bash scripts/verify/no-localhost-in-client-sources.sh`
- `docker compose build admin-ui`
- `ADMIN_UI_PORT=13001 docker compose up -d --no-deps admin-ui`
- `curl -sSik http://localhost:13001/api/auth/discord/callback | head -n 40`

## Verification Evidence
- `bash scripts/verify/admin-ui-can-reach-admin-api.sh` → PASS
- `pnpm --filter @slimy/admin-ui test` → PASS
- `bash scripts/verify/no-localhost-in-client-sources.sh` → PASS
- In-container reachability: `admin-ui` → `admin-api` `/api/health` returns `200`
- Callback proxy smoke: `curl http://localhost:13001/api/auth/discord/callback` returns `302` (no 502)
