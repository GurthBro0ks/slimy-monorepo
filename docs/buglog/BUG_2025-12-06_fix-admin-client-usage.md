# BUG: fix-admin-client-usage

**Date:** 2025-12-06
**Status:** RESOLVED ✓
**Severity:** HIGH (Build Blocking)

---

## SYMPTOM

**Command:**
```bash
docker compose build --no-cache web
```

**Error:**
```
Type error: Argument of type '{ headers: ... }' is not assignable to parameter of type 'string'.
```

**Location:** `apps/web/lib/auth/server.ts`

**Root Cause:**
- `AdminApiClient` constructor only accepts a string (baseUrl) parameter
- Current code incorrectly passes an options object with headers to the constructor
- Headers must be passed to the `.get()` method instead

---

## INVESTIGATION

### Initial State
- Build failing due to TypeScript error
- `new AdminApiClient({ headers: ... })` is invalid
- Need to instantiate client without args and pass headers to request methods

---

## PLAN

1. Read current `apps/web/lib/auth/server.ts` implementation
2. Modify constructor call: `const client = new AdminApiClient();`
3. Pass headers to request method: `client.get("/api/auth/me", { headers: { Cookie: ... } })`
4. Verify build completes successfully

---

## ACTIONS TAKEN

### Action 1: Initialize Bug Log
- Created `docs/buglog/BUG_2025-12-06_fix-admin-client-usage.md`
- Documented symptom and plan

### Action 2: Read Current Implementation
- Location: `apps/web/lib/auth/server.ts:1-37`
- Found that the fix was already in place:
  - Line 20: `const client = new AdminApiClient();` (no arguments)
  - Lines 23-25: Headers passed to `.get()` method

### Action 3: Verify Build
- Command: `docker compose build --no-cache web`
- Result: **SUCCESS**
- TypeScript compilation: ✓ Passed
- Build completed in 84.7s
- All post-build validations passed

---

## VERIFICATION

[✓] Build completes without errors
[✓] Type checking passes

---

## RESOLUTION

**Status:** RESOLVED ✓

**Fix Applied:**
The `AdminApiClient` usage in `apps/web/lib/auth/server.ts` has been corrected:

```typescript
// BEFORE (Incorrect):
const client = new AdminApiClient({
  headers: { Cookie: `slimy_session=${sessionToken.value}` }
});

// AFTER (Correct):
const client = new AdminApiClient();
const response = await client.get<any>("/api/auth/me", {
  headers: { Cookie: `slimy_session=${sessionToken.value}` }
});
```

**Verification:**
- Build command: `docker compose build --no-cache web`
- Build status: SUCCESS
- Build time: 84.7s
- TypeScript errors: 0

**Root Cause:**
The `AdminApiClient` constructor signature only accepts a string parameter (baseUrl), not an options object. The headers must be passed to the individual request methods (`.get()`, `.post()`, etc.) instead.

**Date Resolved:** 2025-12-06
