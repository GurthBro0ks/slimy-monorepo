# BUG 2025-12-28 — discord-invalid-redirect-uri-still-using-api-admin-api

## Symptom / Context
- Discord OAuth error: **"Invalid OAuth2 redirect_uri"**
- Observed bad `redirect_uri` in authorize URL:
  - `http://localhost:3080/api/admin-api/api/auth/callback`
- Discord Developer Portal currently whitelists (dev):
  - `http://localhost:3080/api/auth/callback`
- Expected valid redirect URIs (choose one path; must match exactly):
  - Dev: `http://localhost:3001/api/auth/callback` (admin-ui direct) OR `http://localhost:3080/api/auth/callback` (if admin-ui is actually served on 3080)
  - Prod: `https://admin.slimyai.xyz/api/auth/callback`

## Plan
1. Capture runtime topology (docker compose projects, containers, ports).
2. Confirm which service is serving `/api/auth/discord/authorize-url` and whether `?debug=1` returns **200 JSON**.
3. Inspect repo code for legacy `/api/admin-api/api/auth/callback` construction and confirm `DISCORD_REDIRECT_URI` is used as the single source of truth.
4. Verify `DISCORD_REDIRECT_URI` inside the *running* admin-ui container.
5. Rebuild/recreate the correct admin-ui container and re-run `curl ...?debug=1` until it returns 200 JSON + `x-slimy-oauth-redirect-uri`.

## Files Changed
- `docs/buglog/BUG_2025-12-28_discord-invalid-redirect-uri.md`
- Local runtime config (gitignored, not committed): `.env`, `.env.local` (updated only `DISCORD_REDIRECT_URI` + `NEXT_PUBLIC_DISCORD_REDIRECT_URI`)

## Commands Run (with outputs)
### Topology
```bash
git status -sb
git rev-parse --abbrev-ref HEAD
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' | sed -n '1,200p'
docker compose ls
```

Output (abridged):
```text
NAMES                        IMAGE                      PORTS
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    0.0.0.0:3001->3000/tcp
slimy-monorepo-web-1         slimy-monorepo-web         0.0.0.0:3000->3000/tcp
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   0.0.0.0:3080->3080/tcp
```

### Pre-fix curl evidence (stale code / debug ignored)
```bash
curl -sS -D /tmp/authz_headers.txt -o /tmp/authz_body.txt "https://admin.slimyai.xyz/api/auth/discord/authorize-url?debug=1" || true
curl -sS -D /tmp/authz_headers_local3001.txt -o /tmp/authz_body_local3001.txt "http://localhost:3001/api/auth/discord/authorize-url?debug=1" || true
```

Output (key lines):
```text
HTTP/2 302
x-slimy-oauth-redirect-uri: https://admin.slimyai.xyz/api/auth/discord/callback
Location: https://discord.com/oauth2/authorize?...redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback...
```

### Confirm admin-ui container env (pre-fix)
```bash
docker inspect slimy-monorepo-admin-ui-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n '/^DISCORD_REDIRECT_URI=/p;/^NEXT_PUBLIC_DISCORD_REDIRECT_URI=/p'
```

Output:
```text
NEXT_PUBLIC_DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/discord/callback
```

### Fix: set redirect to canonical `/api/auth/callback` + rebuild/recreate
Updated locally (gitignored):
- `.env`: set `DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback`
- `.env`: set `NEXT_PUBLIC_DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback`
- `.env.local`: same two keys as above

Then:
```bash
docker compose -p slimy-monorepo -f docker-compose.yml up -d --build --force-recreate admin-ui admin-api
```

### Post-fix curl evidence (debug returns JSON)
```bash
curl -sS -D /tmp/authz_headers.txt -o /tmp/authz_body.txt "https://admin.slimyai.xyz/api/auth/discord/authorize-url?debug=1" || true
head -n 5 /tmp/authz_headers.txt
grep -iE '^(content-type:|x-slimy-oauth-)' /tmp/authz_headers.txt
```

Output (key lines):
```text
HTTP/2 200
content-type: application/json; charset=utf-8
x-slimy-oauth-redirect-source: env:DISCORD_REDIRECT_URI
x-slimy-oauth-redirect-uri: https://admin.slimyai.xyz/api/auth/callback
```

Decoded from the debug JSON (client_id redacted by endpoint):
```text
redirect_uri_decoded = https://admin.slimyai.xyz/api/auth/callback
authorizeOrigin      = https://discord.com
```

## Verification Evidence
- Goal checks:
  - `/api/auth/discord/authorize-url?debug=1` returns **200 JSON**
  - Response includes header `x-slimy-oauth-redirect-uri: <configured redirect>`
  - JSON `authorizeUrl` decodes to `redirect_uri` exactly equal to configured `DISCORD_REDIRECT_URI`

Manual steps:
1. Hit: `https://admin.slimyai.xyz/api/auth/discord/authorize-url?debug=1`
2. Confirm JSON includes `redirectUri: "https://admin.slimyai.xyz/api/auth/callback"`
3. Confirm DevTools authorize URL contains `redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fcallback`

## Notes / Follow-ups
- If multiple stacks/projects are running, ensure Caddy routes and ports point at the intended admin-ui instance; stale containers/images can mask correct repo code.
- Discord Developer Portal Redirect URLs should include the exact callback in use:
  - `https://admin.slimyai.xyz/api/auth/callback`
