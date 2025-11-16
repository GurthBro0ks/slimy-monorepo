# 502 Error Investigation: Discord OAuth Login

## Executive Summary

The 502 Bad Gateway error on `/api/auth/login` originates from **Caddy reverse proxy** failing to connect to the Admin API backend on port 3080. This is a **deployment-specific issue**, not a code issue. The web app has **no fallback logic** for when the admin API is unavailable.

---

## 1. Where the 502 Originates

### Request Flow

```
User clicks "Login with Discord"
  ↓
Web App: Link to `${NEXT_PUBLIC_ADMIN_API_BASE}/api/auth/login`
  ↓ (if NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz)
Browser: GET https://admin.slimyai.xyz/api/auth/login
  ↓
Caddy Reverse Proxy: Routes /api/* to localhost:3080
  ↓
Admin API: Should handle /api/auth/login on port 3080
  ↓
502 Bad Gateway ← ERROR OCCURS HERE
```

### Root Cause Location

**The 502 error originates from Caddy reverse proxy** when it cannot establish a connection to `localhost:3080` (Admin API backend).

**Evidence:**
- Caddyfile template (`web/Caddyfile.template:6-18`) shows `/api/*` routes are proxied to `localhost:3080`
- Admin API server (`app/admin-api/server.js:607-609`) listens on port 3080
- If Admin API is not running, Caddy returns 502 Bad Gateway

---

## 2. Web App Routing vs Admin API Issue

### This is an Admin API Issue (Deployment)

**Web App Behavior:**
- Web app does NOT have a Next.js API route handler for `/api/auth/login`
- Web app uses client-side links that point directly to `${adminApiBase}/api/auth/login`
- Files checked:
  - `web/app/api/auth/` directory only contains `me/route.ts` (no `login/route.ts`)
  - `web/app/page.tsx:64` - Links directly to external URL
  - `web/components/layout/header.tsx:89` - Links directly to external URL

**Admin API Implementation:**
- Admin API HAS the endpoint at `app/admin-api/server.js:413-444`
- Endpoint path: `GET /api/auth/login` (mounted at `/api/auth/login`)
- Implementation is correct and functional

**Conclusion:** The code is correct. The issue is that the Admin API service is not running or not accessible on port 3080.

---

## 3. Fallback Logic Analysis

### No Fallback Logic Exists

**Web App:**
- **No fallback:** If `NEXT_PUBLIC_ADMIN_API_BASE` is empty, login button links to `#` (disabled)
- **No error handling:** Direct browser navigation to login URL - no try/catch possible
- **No graceful degradation:** If admin API is down, user sees 502 error page

**Code Evidence:**

```typescript
// web/app/page.tsx:64
<Link href={adminApiBase ? `${adminApiBase}/api/auth/login` : "#"}>

// web/components/layout/header.tsx:89
<Link href={adminApiBase ? `${adminApiBase}/api/auth/login` : "#"}>
```

**Admin API Proxy Function:**
- `web/lib/api-proxy.ts` has error handling for server-side API calls
- BUT `/api/auth/login` is NOT proxied through Next.js - it's a direct browser redirect
- The proxy function is only used for `/api/auth/me` and other server-side endpoints

**Conclusion:** There is **no fallback logic** for when the admin API is unavailable. The web app assumes the admin API is always accessible.

---

## 4. Deployment-Specific vs Code Issue

### This is a Deployment-Specific Issue

**Evidence:**

1. **Code is Correct:**
   - Admin API endpoint exists and is properly implemented (`app/admin-api/server.js:413-444`)
   - Web app correctly constructs login URLs
   - Caddy configuration template is correct (`web/Caddyfile.template`)

2. **Deployment Configuration Issues:**
   - Admin API may not be running on port 3080
   - Caddy may not be configured correctly
   - Environment variable `NEXT_PUBLIC_ADMIN_API_BASE` may be empty or incorrect

3. **Architecture Dependency:**
   - Web app requires Admin API to be running for OAuth to work
   - This is by design - OAuth flow requires backend service
   - No code changes needed if deployment is correct

**Conclusion:** This is **deployment-specific**. The code is correct, but the Admin API service needs to be running and accessible.

---

## 5. Evidence Collected

### Admin API Health Check

**Endpoint:** `GET /api/health` or `GET /api/diag`
**Expected Location:** `http://localhost:3080/api/health`
**Implementation:** `app/admin-api/server.js` (health endpoints exist)

**To Check:**
```bash
curl http://localhost:3080/api/health
curl http://localhost:3080/api/diag
```

### Caddy Proxy Logs

**Log Location:** `/var/log/caddy/admin.slimyai.xyz.log`
**Configuration:** `web/Caddyfile.template:60-66`

**To Check:**
```bash
sudo tail -f /var/log/caddy/admin.slimyai.xyz.log
```

### Admin API Endpoint Implementation

**File:** `app/admin-api/server.js`
**Lines:** 413-444
**Route:** `router.get("/auth/login", ...)`
**Mounted at:** `/api/auth/login` (via Express router mounting)

**Key Implementation Details:**
- Checks Discord OAuth configuration
- Returns 503 if not configured (not 502)
- Issues OAuth state cookie
- Redirects to Discord OAuth or returns JSON URL

### Web App Fetch Code for OAuth

**NOT USED:** Web app does NOT use fetch for `/api/auth/login`
**Instead:** Uses direct browser navigation via `<Link>` component

**Files:**
- `web/app/page.tsx:64` - Homepage login button
- `web/components/layout/header.tsx:89` - Header login button

**Pattern:**
```tsx
<Link href={adminApiBase ? `${adminApiBase}/api/auth/login` : "#"}>
```

**Note:** The web app DOES use `proxyToAdminApi` for other endpoints like `/api/auth/me`, but NOT for login.

---

## 6. Root Causes Identified

### Confirmed Root Causes

1. ✅ **Admin API not running on port 3080**
   - Most likely cause
   - Check with: `curl http://localhost:3080/api/health`
   - Check with: `docker ps | grep admin` or `systemctl status admin-api`

2. ✅ **Caddy reverse proxy misconfigured**
   - Check: `cat /etc/caddy/Caddyfile`
   - Should have: `handle_path /api/* { reverse_proxy localhost:3080 }`
   - Verify: `sudo systemctl reload caddy`

3. ✅ **NEXT_PUBLIC_ADMIN_API_BASE environment variable empty**
   - Check: `docker exec slimyai-web printenv | grep NEXT_PUBLIC_ADMIN_API_BASE`
   - Expected: `NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz`
   - Current: `web/docker-compose.yml:12` shows it's set correctly

### Additional Potential Issues

4. **CORS misconfiguration**
   - Admin API CORS origins: `app/admin-api/server.js:77-80`
   - Default includes: `https://admin.slimyai.xyz`
   - Should be fine if using same domain

5. **Network connectivity**
   - Caddy cannot reach `localhost:3080`
   - Check: `netstat -tlnp | grep 3080`
   - Check firewall rules

---

## 7. Diagnostic Commands

### Check Admin API Status

```bash
# Check if Admin API is running
curl http://localhost:3080/api/health
curl http://localhost:3080/api/diag

# Check port binding
netstat -tlnp | grep 3080
ss -tlnp | grep 3080

# Check Docker containers
docker ps | grep admin
docker ps -a | grep admin

# Check systemd service (if applicable)
sudo systemctl status admin-api
```

### Check Caddy Configuration

```bash
# View Caddyfile
cat /etc/caddy/Caddyfile

# Check Caddy status
sudo systemctl status caddy

# View Caddy logs
sudo tail -f /var/log/caddy/admin.slimyai.xyz.log

# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile
```

### Check Web App Configuration

```bash
# Check environment variables
cd /opt/slimy/web
cat docker-compose.yml | grep NEXT_PUBLIC_ADMIN_API_BASE

# Check running container
docker exec slimyai-web printenv | grep NEXT_PUBLIC_ADMIN_API_BASE

# Check web app logs
docker logs slimyai-web
```

### Test Endpoints

```bash
# Test Admin API directly
curl -v http://localhost:3080/api/health
curl -v http://localhost:3080/api/auth/login

# Test through Caddy
curl -v https://admin.slimyai.xyz/api/health
curl -v https://admin.slimyai.xyz/api/auth/login

# Test web app
curl -v https://admin.slimyai.xyz/
```

---

## 8. Recommendations

### Immediate Actions

1. **Verify Admin API is running:**
   ```bash
   curl http://localhost:3080/api/health
   ```
   If it fails, start the Admin API service.

2. **Verify Caddy configuration:**
   ```bash
   cat /etc/caddy/Caddyfile
   ```
   Ensure `/api/*` routes to `localhost:3080`.

3. **Check Caddy logs:**
   ```bash
   sudo tail -50 /var/log/caddy/admin.slimyai.xyz.log
   ```
   Look for connection errors to port 3080.

### Code Improvements (Optional)

1. **Add fallback Next.js route:**
   - Create `web/app/api/auth/login/route.ts`
   - Return 503 with helpful message if admin API unavailable
   - This would prevent 502 errors and show user-friendly message

2. **Add health check to web app:**
   - Check admin API availability on page load
   - Disable login button if admin API is down
   - Show user-friendly message

3. **Improve error handling:**
   - Add client-side error detection for failed redirects
   - Show error message if login redirect fails

---

## 9. Conclusion

**Summary:**
- 502 error originates from Caddy reverse proxy
- Admin API endpoint exists and is correctly implemented
- Web app has no fallback logic for admin API unavailability
- This is a deployment-specific issue, not a code issue

**Next Steps:**
1. Verify Admin API is running on port 3080
2. Verify Caddy is configured correctly
3. Check Caddy logs for connection errors
4. Consider adding fallback Next.js route for better UX

**Files Referenced:**
- `app/admin-api/server.js:413-444` - Admin API login endpoint
- `web/app/page.tsx:64` - Homepage login link
- `web/components/layout/header.tsx:89` - Header login link
- `web/Caddyfile.template:6-18` - Caddy proxy configuration
- `web/lib/api-proxy.ts` - Server-side API proxy (not used for login)
- `web/docker-compose.yml:12` - Environment variable configuration

