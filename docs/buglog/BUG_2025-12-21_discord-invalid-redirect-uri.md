# BUG: Discord “Invalid OAuth2 redirect_uri” intermittently uses localhost/admin-api callback

## Summary
Sometimes the browser OAuth flow lands on Discord with `400 Invalid OAuth2 redirect_uri`.

Observed querystring examples (from Discord error page):
- `redirect_uri=http://localhost:3080/api/admin-api/api/auth/callback`

Decoded `redirect_uri`:
- `http://localhost:3080/api/admin-api/api/auth/callback`

Expected `redirect_uri` for admin UI login:
- `https://admin.slimyai.xyz/api/auth/discord/callback`

## Evidence (DevTools)
Add screenshots here:
- Screenshot: Discord error page (shows invalid `redirect_uri`)
- Screenshot: Network request details for `oauth2/authorize`

Copy/paste from DevTools → Network → `oauth2/authorize` request:
- Request URL:
  - TODO
- Querystring `redirect_uri` (decoded):
  - TODO
- Initiator:
  - TODO
- Referrer / Request headers → `Referer`:
  - TODO

## Baseline (server endpoints)
Run outputs captured below:

### `GET https://admin.slimyai.xyz/api/auth/discord/authorize-url`
```
HTTP/2 302
location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=547b16ded00d279a6ba617803124c607&prompt=consent
```

### `GET https://admin.slimyai.xyz/api/auth/login` (if it exists)
```
HTTP/2 302
location: https://admin.slimyai.xyz/api/auth/discord/authorize-url
```

### Decoded `Location` from `/api/auth/discord/authorize-url`
```
location: https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+guilds&state=b4af2eca86f5480f89943c3310e92017&prompt=consent

DECODED:
https://discord.com/oauth2/authorize?client_id=1431075878586290377&redirect_uri=https://admin.slimyai.xyz/api/auth/discord/callback&response_type=code&scope=identify+guilds&state=b4af2eca86f5480f89943c3310e92017&prompt=consent
```

## Root cause
- Browser-side auth + admin-api calls were still entangled with legacy “admin-api behind `/api/admin-api`” routing, which is consistent with Discord seeing a `redirect_uri` that includes `/api/admin-api/.../api/auth/callback`.
- Infra routing also allowed ambiguous ownership of `/api/auth/*` (admin-ui vs admin-api), increasing the chances of accidentally re-entering the legacy admin-api flow instead of the canonical admin-ui flow.
- Admin API production env still referenced the legacy OAuth callback (`DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback`), which kept the old endpoint “alive” as a potential fallback.

## Fix
- `infra/docker/Caddyfile.slimy-nuc2`: route only `/api/auth/discord/*` to admin-ui; leave `/api/auth/*` (me/logout/etc) to admin-api.
- `apps/admin-ui/*`: eliminate client usage of `/api/admin-api/...` in favor of direct `/api/...` calls; keep login strictly on `/api/auth/discord/authorize-url` → `/api/auth/discord/callback`.
- `apps/admin-ui/pages/api/auth/discord/authorize-url.js`: add temporary `x-slimy-oauth-*` headers to make curl/DevTools evidence easier.
- `apps/admin-ui/pages/index.js` + `apps/admin-ui/pages/login.js`: keep a temporary on-screen debug box showing which login endpoint is used.
- `apps/admin-ui/tests/oauth-tripwire.test.js`: regression tripwire (fails if client bundle references `/api/admin-api/`, `/api/auth/login`, or non-canonical callback usage in `authorize-url`).
- `infra/docker/docker-compose.slimy-nuc2.yml`: override `DISCORD_REDIRECT_URI` to the canonical admin-ui callback (`/api/auth/discord/callback`).
- `apps/admin-api/src/config.js` + `apps/admin-api/src/lib/config/index.js`: default redirect URI updated to prefer `/api/auth/discord/callback` (avoids accidental `localhost:3080` defaults).

## Proof
- Local smoke report (verification-only): `/tmp/STABILITY_REPORT_2025-12-21_16-17-49_admin-oauth-guildgate.md`
- TODO: re-run DevTools repro and paste Initiator/Referrer + screenshots here.
