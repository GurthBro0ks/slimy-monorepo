# SECURITY INCIDENT REPORT
## Date: 2025-11-26
## Severity: CRITICAL

---

## INCIDENT SUMMARY

A comprehensive security audit revealed **multiple critical authentication and authorization vulnerabilities** in the monorepo's `website` (Next.js) and `admin-api` (Node/Fastify) applications.

---

## CRITICAL FINDINGS

### 1. Authentication Bypass via Header Injection (CVSS: 9.8 - CRITICAL)

**Affected Component:** `apps/web/lib/auth/server.ts`
**Attack Vector:** Network / HTTP Header Injection
**Exploitability:** Trivial - no authentication required

**Description:**
The Next.js server-side authentication function `requireAuth()` blindly trusts HTTP headers (`x-user-id`, `x-user-role`, `x-user-roles`) without any validation. The Next.js middleware (`middleware.ts`) does not set these headers, meaning **any client can inject arbitrary headers to impersonate any user with any role, including admin**.

**Proof of Concept:**
```bash
curl -H "x-user-id: any-discord-id" \
     -H "x-user-role: admin" \
     -H "x-user-roles: admin,club,user" \
     https://admin.slimyai.xyz/api/guilds/[id]
# Returns sensitive guild data as if you're an admin
```

**Impact:**
- Complete authentication bypass
- Privilege escalation to admin
- Unauthorized access to all user data
- Ability to modify/delete any guild data
- Potential data breach affecting all users

**Root Cause:**
The authentication design assumes headers are set by trusted middleware, but no such middleware exists. This is a fundamental architectural flaw.

---

### 2. Ghost Authentication in Guild Access Control (CVSS: 8.1 - HIGH)

**Affected Component:** `apps/admin-api/src/middleware/auth.js:196-225`
**Attack Vector:** Stale JWT Token
**Exploitability:** Moderate - requires valid JWT

**Description:**
The `requireGuildMember` middleware checks guild membership by reading `user.guilds` from the JWT token instead of querying the database. However, the OAuth flow intentionally sets `guilds: []` in the JWT to avoid header overflow. This creates a paradox where:
1. Normal users have `guilds: []` in their JWT
2. Middleware checks `user.guilds` from JWT
3. Result: **All non-admin users are denied access to guild endpoints**

Additionally, even if guilds were in the JWT, checking stale token data instead of the database means:
- Removed users can still access guilds until token expires
- Permission changes don't take effect immediately
- No real-time access control

**Impact:**
- Normal users cannot access their guilds (broken functionality)
- Potential unauthorized access if guilds were in JWT (stale permissions)
- Authorization bypass for removed guild members

**Root Cause:**
Trusting JWT data (which is static until expiration) instead of checking current database state for authorization decisions.

---

### 3. Race Condition in Session Hydration (CVSS: 6.5 - MEDIUM)

**Affected Component:** `apps/admin-api/src/middleware/auth.js:103-119`
**Attack Vector:** Timing-based
**Exploitability:** Difficult - requires precise timing

**Description:**
The `resolveUser()` function starts an asynchronous session fetch but doesn't await it:

```javascript
if (maybeSession && typeof maybeSession.then === "function") {
  maybeSession
    .then((value) => {
      if (value && !req._cachedUser) {
        req.session = value;
      }
    })
    .catch(() => {}); // Silently swallows errors
} else if (maybeSession) {
  session = maybeSession;
}

// Continues execution immediately without waiting
req.session = session || payload?.session || payload || null;
```

**Impact:**
- Inconsistent session state
- Potential for stale or missing session data
- Errors are silently swallowed
- Unpredictable authorization behavior

---

### 4. Swallowed Authentication Errors (CVSS: 5.3 - MEDIUM)

**Affected Component:** `apps/admin-api/src/middleware/auth.js:132-136`

**Description:**
Authentication failures are caught and treated as "user not authenticated" rather than errors:

```javascript
catch (err) {
  logReadAuth("token verification failed", { error: err.message });
  req._cachedUser = null;
  return null; // Swallows the error
}
```

**Impact:**
- Security issues masked as normal "not logged in" states
- Harder to detect brute force attacks
- JWT verification failures don't alert monitoring systems
- Attackers can probe without triggering alarms

---

### 5. Test Fixture Tokens in Production Code (CVSS: 4.3 - MEDIUM)

**Affected Component:** `apps/admin-api/src/middleware/auth.js:44-78`

**Description:**
Hardcoded test tokens that bypass JWT verification if `NODE_ENV === "test"`:

```javascript
const fixturePayload = process.env.NODE_ENV === "test"
  ? {
      "valid-token": { user: { id: "test-user", role: "member" } },
      "admin-token": { user: { id: "test-admin", role: "admin" } }
    }[token.value]
  : null;
```

**Impact:**
- If `NODE_ENV` is misconfigured in production, these tokens work
- Backdoor authentication mechanism
- Potential for privilege escalation if test tokens leak

---

## IMMEDIATE ACTIONS TAKEN

1. ✅ **Fixed dashboard crash** (hardcoded admin-api URL causing silent failures)
2. 🔄 **In progress:** Implementing fixes for all critical vulnerabilities

---

## REMEDIATION PLAN

### Priority 1: Fix Authentication Header Injection (TODAY)
- [ ] Implement proper cookie-based authentication in Next.js middleware
- [ ] Remove trust in `x-user-*` headers
- [ ] Add request signing/verification between Next.js and admin-api

### Priority 2: Fix Ghost Auth in Guild Middleware (TODAY)
- [ ] Replace `requireGuildMember` JWT check with database query
- [ ] Use `requireGuildAccess` middleware (which already checks DB)
- [ ] Remove reliance on JWT `guilds` array

### Priority 3: Fix Race Condition (THIS WEEK)
- [ ] Properly await async session fetching
- [ ] Handle errors explicitly
- [ ] Add timeout for session fetch

### Priority 4: Improve Error Handling (THIS WEEK)
- [ ] Distinguish between "no auth" and "auth failed"
- [ ] Add proper error logging and monitoring
- [ ] Remove test fixture tokens from production code path

---

## VERIFICATION NEEDED

- [ ] Penetration testing for header injection
- [ ] Review all API routes for proper authorization checks
- [ ] Audit JWT token contents and expiration policies
- [ ] Test guild access control with various user roles
- [ ] Security code review of all auth middleware

---

## LESSONS LEARNED

1. **Never trust HTTP headers without cryptographic verification**
2. **Always check database for authorization (not just authentication)**
3. **Explicitly await async operations in security-critical code**
4. **Errors in auth flows should fail closed, not open**
5. **Test code paths should be completely separate from production**

---

## TIMELINE

- **2025-11-26 17:11 UTC** - User reported dashboard crash
- **2025-11-26 17:30 UTC** - Investigation began
- **2025-11-26 18:00 UTC** - Critical vulnerabilities discovered
- **2025-11-26 18:30 UTC** - This report created
- **2025-11-26 TBD** - Fixes deployed

---

**Report prepared by:** Security Audit Team
**Next review:** After all fixes are deployed and verified
