# BUG: post-login-wrong-domain (2025-12-31)

## Symptom / Context
- After successful Discord OAuth callback, user is redirected to `https://slimyai.xyz/guilds` (public site)
- Expected: redirect to `https://admin.slimyai.xyz/guilds` (admin site)
- Result: admin cookie (`slimy_admin_token`) not sent on slimyai.xyz, `/api/auth/me` returns 401, UI shows `token_exchange_failed`

## Evidence from Container Logs
```
[auth/callback] Redirect decision {
  requestOrigin: 'https://admin.slimyai.xyz',
  redirectTarget: 'https://slimyai.xyz/guilds',  // WRONG!
  callbackLoopGuardTriggered: false,
  loopbackGuardTriggered: false
}
```

## Container Environment
```bash
$ docker exec slimy-admin-api env | egrep "ADMIN_UI_POST_LOGIN_REDIRECT|CLIENT_URL"
ADMIN_UI_POST_LOGIN_REDIRECT=/guilds
CLIENT_URL=https://slimyai.xyz
```

---

## Root Cause

In `apps/admin-api/src/routes/auth.js` lines 569-579, the OAuth callback handler called `resolvePostLoginRedirectUrl()` BEFORE computing `requestOrigin`:

```javascript
const redirectUrl = resolvePostLoginRedirectUrl({
  ...
  clientUrl: config.clientUrl,    // https://slimyai.xyz (WRONG fallback)
  ...
});

const requestOrigin = getRequestOrigin(req);  // https://admin.slimyai.xyz (CORRECT, but too late!)
```

The `resolvePostLoginRedirectUrl()` function in `apps/admin-api/src/lib/auth/post-login-redirect.js` has this fallback chain:
1. Try cookie origin (`https://admin.slimyai.xyz` from `oauth_redirect_uri`)
2. BUT `admin.slimyai.xyz` is NOT in `allowedOrigins` (only localhost values from `DEFAULT_ALLOWED_ORIGINS`)
3. `isOriginAllowed()` returns `false` → cookie origin rejected
4. Falls back to `clientUrl` which is `https://slimyai.xyz`
5. Result: `new URL("/guilds", "https://slimyai.xyz")` = `https://slimyai.xyz/guilds`

---

## Fix Applied

Moved `getRequestOrigin(req)` call BEFORE `resolvePostLoginRedirectUrl()` and passed it as the `clientUrl` parameter:

```javascript
const requestOrigin = getRequestOrigin(req);  // Moved BEFORE resolvePostLoginRedirectUrl

const redirectUrl = resolvePostLoginRedirectUrl({
  ...
  clientUrl: requestOrigin || config.clientUrl,  // Use requestOrigin as primary fallback
  ...
});
```

This ensures the fallback uses the same origin the request came from (`admin.slimyai.xyz`).

---

## Verification

### After Fix
```bash
$ curl -sk "https://admin.slimyai.xyz/api/auth/callback?debug=1"
{
  "ok": true,
  "internal": false,
  "requestOrigin": "https://admin.slimyai.xyz",
  "redirectUri": "https://admin.slimyai.xyz/api/auth/callback",
  "postLoginDefaultPath": "/guilds",
  "postLoginRedirect": "https://admin.slimyai.xyz/guilds",  # FIXED!
  "note": "no redirect performed in debug mode"
}

$ curl -skI "https://admin.slimyai.xyz/api/auth/callback?code=test&state=test" 2>&1 | grep -i location
HTTP/2 302
location: /?error=state_mismatch  # Relative URL stays on admin domain
```

### Manual Test
1. Visit `https://admin.slimyai.xyz/api/auth/discord/authorize-url`
2. Complete Discord OAuth
3. Confirm landing at `https://admin.slimyai.xyz/guilds` (NOT slimyai.xyz)

---

## Files Changed
- `apps/admin-api/src/routes/auth.js`
  - Lines 300-314: Debug mode path - added `debugRequestOrigin` variable, use as `clientUrl` fallback
  - Lines 569-579: Main callback path - moved `requestOrigin` before `resolvePostLoginRedirectUrl`, use as `clientUrl` fallback
