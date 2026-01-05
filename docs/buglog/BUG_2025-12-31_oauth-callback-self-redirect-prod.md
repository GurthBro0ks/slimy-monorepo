# BUG: oauth-callback-self-redirect-prod (2025-12-31)

## Symptom / Context
- Chrome: `ERR_TOO_MANY_REDIRECTS` on `https://admin.slimyai.xyz/api/auth/callback?code=REDACTED&state=REDACTED`
- DevTools Network: repeated `302` responses where `Location` points back to the same callback URL (self-redirect loop)
- Response header: `via: 1.1 Caddy`
- Browser Remote Address: `68.179.170.248:443`

## Evidence from Browser (DevTools)

### Request
```
URL: https://admin.slimyai.xyz/api/auth/callback?code=...&state=...
Status: 302
```

### Response Headers
```
location: https://admin.slimyai.xyz/api/auth/callback?code=...&state=... (IDENTICAL - self-redirect)
via: 1.1 Caddy
```

### Request Cookies
```
oauth_state=<same as state>
oauth_return_to=%2Fguilds
oauth_redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fcallback
```

---

## Investigation Timeline

### Step 1: DNS & Host Resolution
```
$ dig +short admin.slimyai.xyz A
68.179.170.248

$ getent ahosts admin.slimyai.xyz
68.179.170.248  STREAM admin.slimyai.xyz
```
DNS correctly resolves to `68.179.170.248`.

### Step 2: Host Identification
- Current machine: `slimy-nuc2` (hostname)
- Local IP: `192.168.68.65`
- Public IP (via NAT): `68.179.170.248`
- Production IS served from NUC2 via NAT port forwarding

### Step 3: Container Status
```
$ docker ps
slimy-monorepo-admin-api-1   Up 2 days (healthy)
slimy-monorepo-admin-ui-1    Up 2 days
```
Containers were running but with OLD code.

### Step 4: Code Version Check
```
$ docker exec slimy-monorepo-admin-api-1 grep -n "isCanonicalAdminRequest" /app/apps/admin-api/src/routes/auth.js
(no output - function does not exist)
```
**Finding**: Container was running OLD code from Dec 28, missing the `isCanonicalAdminRequest` function.

---

## Root Cause

The deployed container was running **OLD auth.js code** (built Dec 28) that had this logic at lines 196-199:

```javascript
if (!internal) {
    const qs = ...;
    return res.redirect(302, `${CANONICAL_CALLBACK_URL}${qs}`);
}
```

This ALWAYS redirects non-internal requests to `CANONICAL_CALLBACK_URL` (`https://admin.slimyai.xyz/api/auth/callback`). When the browser is already AT that URL (via Discord OAuth redirect), it creates an infinite self-redirect loop.

The NEW code (commit `83dd71b`) has a fix that checks `isCanonicalAdminRequest(req)` first:

```javascript
if (!internal && !isCanonicalAdminRequest(req)) {
    // Only redirect if NOT already at canonical admin origin
    return res.redirect(302, `${CANONICAL_CALLBACK_URL}${qs}`);
}
```

---

## Fix Applied

1. Rebuilt admin-api container with `--no-cache` to include new code:
   ```bash
   docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build --no-cache admin-api
   ```

2. Stopped old `slimy-monorepo-admin-api-1` container (port 3080 conflict):
   ```bash
   docker stop slimy-monorepo-admin-api-1 && docker rm slimy-monorepo-admin-api-1
   ```

3. Started new container with NUC2 compose:
   ```bash
   docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d admin-api admin-ui
   ```

---

## Verification

### 1. Code Marker Check
```bash
$ docker exec slimy-admin-api grep -n "Redirect decision" /app/apps/admin-api/src/routes/auth.js
584:    console.log("[auth/callback] Redirect decision", {
```
New code is deployed.

### 2. Debug Endpoint
```bash
$ curl -sk "https://admin.slimyai.xyz/api/auth/callback?debug=1"
{
  "ok": true,
  "internal": false,
  "requestOrigin": "https://admin.slimyai.xyz",
  "redirectUri": "https://admin.slimyai.xyz/api/auth/callback",
  "postLoginRedirect": "https://slimyai.xyz/guilds",
  "note": "no redirect performed in debug mode"
}
```
Request origin correctly identified.

### 3. Callback Redirect Test
```bash
$ curl -skI "https://admin.slimyai.xyz/api/auth/callback?code=TEST&state=TEST"
HTTP/2 302
location: /?error=state_mismatch
```
**FIXED**: Redirects to error page, NOT to itself.

### 4. Authorize URL Test
```bash
$ curl -sk -o /dev/null -w "%{redirect_url}\n" "https://admin.slimyai.xyz/api/auth/discord/authorize-url"
https://discord.com/oauth2/authorize?...&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fcallback&...
```
OAuth flow initiates correctly with proper redirect_uri.

---

## Container State After Fix
```
NAMES               STATUS                   PORTS
slimy-admin-api     Up (healthy)             0.0.0.0:3080->3080/tcp
slimy-admin-ui      Up (health: starting)    0.0.0.0:3001->3000/tcp
```

---

## Lessons Learned

1. **Docker cache issue**: The initial `docker compose build` used cached layers that didn't pick up the new source files. Always use `--no-cache` when deploying critical fixes.

2. **Container name conflicts**: There were two sets of containers (`slimy-monorepo-*` and `slimy-*`) using the same ports. The NUC2-specific compose file uses the `slimy-*` prefix.

3. **Code version verification**: Before debugging redirect issues, verify the deployed container actually has the expected code by grepping for known markers.
