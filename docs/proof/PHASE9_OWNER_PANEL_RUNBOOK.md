# Phase 9C: Owner Control Plane Proof & Verification Runbook

## Overview

This runbook documents how to verify Phase 9 Owner Control Plane functionality. It covers:
1. Automated proof script execution
2. Manual verification of UI behavior
3. Expected outputs and how to interpret them

## Automated Proof Execution

### Quick Start

```bash
# Run the complete proof gate
bash scripts/proof_phase9_owner_control_plane.sh
```

### Output Example

```
RESULT=PASS PROOF_DIR=/tmp/proof_phase9_owner_control_plane_20260113T145328Z
```

### Interpreting Results

**Success (RESULT=PASS):**
- All checks passed
- Artifact directory contains detailed logs
- Safe to proceed to manual testing

**Failure (RESULT=FAIL):**
- Check PROOF_DIR logs for specific failures
- Common issues:
  - Port 3001 already in use
  - Build failed (check build.log)
  - Tests failed (check tests.log)

### Proof Artifacts Location

After running the proof script, check the output directory:

```bash
# List all proof artifacts
ls -la /tmp/proof_phase9_owner_control_plane_*/

# View build logs
cat /tmp/proof_phase9_owner_control_plane_*/build.log

# View server startup logs
cat /tmp/proof_phase9_owner_control_plane_*/start.log

# View API test responses
cat /tmp/proof_phase9_owner_control_plane_*/curl_*.txt

# View unit test results
cat /tmp/proof_phase9_owner_control_plane_*/tests.log

# View secrets check
cat /tmp/proof_phase9_owner_control_plane_*/tripwire.log
```

## Manual Verification

### Setup: Create an Owner Account

**Prerequisite:** You must have a valid Discord account and login credentials.

1. Set the owner email in your environment:
```bash
export OWNER_EMAIL_ALLOWLIST="your-email@example.com"
```

2. Restart the application or run the bootstrap:
```bash
# (This is typically automatic on startup)
# Check that your email is in the OwnerAllowlist
```

3. Login via Discord
4. Verify you can access `/owner`

### Test 1: Dashboard Access

**Expected Behavior:** Owner sees dashboard with identity info

```
URL: http://localhost:3001/owner
Method: GET
Expected:
  - Status: 200
  - Shows owner email
  - Shows build version
  - Shows API latency
  - Has links to Invites/Settings/Audit
  - Debug Dock visible (bottom-left)
```

**Verification:**
1. Navigate to `http://localhost:3001/owner`
2. Verify you see your owner email
3. Verify "OWNER PANEL" heading is visible
4. Check debug dock (click "DEBUG" button)

### Test 2: Create Invite (Token Shown Once)

**CRITICAL:** This tests the "plaintext token shown once" requirement.

```
URL: http://localhost:3001/owner/invites
Method: GET → Create Form
```

**Steps:**

1. Click "Create Invite" button
2. Fill form:
   - Max Uses: `1`
   - Expires In: `7`
   - Note: `Test invite for proof`
3. Click "Create Invite"

**Expected Behavior:**

**Immediately after create:**
- ✓ Orange warning card appears at top
- ✓ Title: "⚠️ INVITE TOKEN - SAVE NOW"
- ✓ Plaintext token displayed in monospace font
- ✓ "Copy Token" button is clickable
- ✓ Message: "This token will never be shown again"
- ✓ Auto-hide timer: "This token will auto-hide in 5 minutes"

**Critical Check:**
```
❌ DO NOT let the user navigate away and come back to see the token again
✓ Token must be GONE after:
  - Page refresh
  - Navigate to another /owner page
  - 5 minutes pass
  - Close browser tab
```

**Verification Script:**
```bash
# 1. Create invite and note the plaintext token
# 2. Refresh page (F5)
# 3. Verify token NOT visible anymore
# 4. Check invite table - only shows codeHash, not plaintext
```

**What NOT to see:**
- ❌ Token in the invite list table
- ❌ Token in browser console logs
- ❌ Token in browser DevTools
- ❌ Token in `localStorage` or `sessionStorage`

### Test 3: Invite List Shows Hashes Only

**Expected Behavior:** Table shows invite metadata, never the plaintext token

```
URL: http://localhost:3001/owner/invites
Method: GET
```

**Verification:**

1. Navigate to `/owner/invites`
2. Verify table columns:
   - Created (date/time)
   - Expires (date/time)
   - Uses (count/max)
   - Status (ACTIVE, EXPIRED, REVOKED, USED)
   - Note (optional field you entered)
   - Action (Revoke button)

3. **Critical:** Verify NO column shows plaintext token
   - Column showing "codeHash" should be 64 hex characters
   - Column showing "id" (invite ID) should be UUID-like
   - NO column with the plaintext token you just created

### Test 4: Revoke Invite (Fail Closed)

**Expected Behavior:** Revoked invites cannot be reused

```
URL: http://localhost:3001/owner/invites
Method: POST
```

**Steps:**

1. Find an invite in the table
2. Click "Revoke" button
3. Confirm in modal: "Are you sure..."
4. Click "Revoke" in modal

**Expected Behavior:**
- ✓ Modal closes
- ✓ Success notification appears
- ✓ Table refreshes
- ✓ Invite status changes to "REVOKED"
- ✓ Revoke button disappears for that invite
- ✓ Any attempt to use this invite should fail

**Database Check (if you have access):**
```sql
SELECT id, codeHash, maxUses, useCount, revokedAt
FROM "OwnerInvite"
ORDER BY createdAt DESC
LIMIT 5;
```

Expected:
- `codeHash`: 64 hex characters (SHA256)
- `useCount`: integer >= 0
- `revokedAt`: NULL or datetime (not plaintext token)

### Test 5: Settings Page (Configuration)

**Expected Behavior:** Can configure app settings

```
URL: http://localhost:3001/owner/settings
Method: GET/PUT
```

**Steps:**

1. Navigate to `/owner/settings`
2. Verify three settings sections:
   - Refresh Rate Cap (100-3,600,000 ms)
   - Debug Dock (toggle)
   - Artifact Source Display (icon/text/both)

3. Change one setting:
   - Example: Toggle "Debug Dock Enabled"
4. Click "Save Settings"

**Expected Behavior:**
- ✓ "Save Settings" button changes to "Saving..."
- ✓ Success notification appears: "Settings saved successfully!"
- ✓ Form shows new values
- ✓ Last updated timestamp updates
- ✓ "Save Settings" button returns to normal

### Test 6: Audit Log (All Actions Logged)

**Expected Behavior:** Audit log shows all admin actions

```
URL: http://localhost:3001/owner/audit
Method: GET
```

**Steps:**

1. Navigate to `/owner/audit`
2. Verify log entries exist for:
   - INVITE_CREATE (from Test 2)
   - INVITE_REVOKE (from Test 4)
   - SETTINGS_UPDATE (from Test 5)

3. For each entry:
   - Click to expand
   - Verify metadata is visible:
     - Timestamp
     - Actor (your email)
     - Action
     - Changes (JSON)
     - IP Address
     - User Agent (browser name)

4. Filter by action:
   - Click "INVITE_CREATE" button
   - Verify only that action type shows
   - Click "All Actions" to restore

**Critical Check:**
```
❌ Audit log MUST NOT contain:
  - Plaintext tokens
  - Passwords
  - Secrets

✓ Audit log CAN show:
  - codeHash: "[64-char-hash]" (masked)
  - maxUses: 1
  - expiresAt: "2026-01-20T12:34:56Z"
  - note: "Test invite for proof"
```

### Test 7: Non-Owner Cannot Access

**Expected Behavior:** Non-owner users see 403 page

**Steps:**

1. Logout (click "Log Out" in header)
2. Login with a different Discord account (one NOT in OWNER_EMAIL_ALLOWLIST)
3. Try to navigate to `http://localhost:3001/owner`

**Expected Result:**
- ✓ Redirects to `/owner/forbidden`
- ✓ Shows "403 Owner Access Denied"
- ✓ Shows "You do not have permission to access the Owner Panel"
- ✓ Offers links: "Return to Dashboard" or "Go to Home"

### Test 8: Unauthenticated Cannot Access

**Expected Behavior:** Unauthenticated users are redirected to login

**Steps:**

1. Logout completely
2. Navigate to `http://localhost:3001/owner`

**Expected Result:**
- ✓ Redirected to home page (`/`)
- ✓ Shown login options or auth required message
- ✓ Can see "Owner" nav item but cannot access

## Troubleshooting

### Issue: "Port 3001 already in use"

```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Then run proof script again
bash scripts/proof_phase9_owner_control_plane.sh
```

### Issue: "Build failed"

```bash
# Check the build log
cat /tmp/proof_phase9_owner_control_plane_*/build.log

# Rebuild manually
cd apps/web
pnpm install
pnpm build
```

### Issue: "Server won't start"

```bash
# Check environment
echo $ADMIN_API_BASE
echo $DATABASE_URL

# Check for errors
cat /tmp/proof_phase9_owner_control_plane_*/start.log

# Run development server instead
PORT=3001 pnpm dev
```

### Issue: "Cannot login to Discord"

```bash
# Verify auth is configured
echo $NEXT_PUBLIC_ADMIN_API_BASE

# Check that admin-api is running
curl http://localhost:3080/api/auth/me
```

## Proof Checklist

Use this checklist to verify all Phase 9C requirements:

```
Build & Startup:
  [ ] pnpm -w build passes
  [ ] pnpm -w start PORT=3001 succeeds
  [ ] Server ready at http://localhost:3001

API Authorization:
  [ ] GET /api/owner/me (unauth) → 401
  [ ] GET /api/owner/invites (unauth) → 401
  [ ] GET /api/owner/settings (unauth) → 401
  [ ] GET /api/owner/audit (unauth) → 401

Owner Access:
  [ ] Authenticated owner can access /owner
  [ ] Authenticated owner sees dashboard
  [ ] Non-owner sees 403 page
  [ ] Unauthenticated redirects to login

Invite Token (CRITICAL):
  [ ] Token shown ONCE after creation
  [ ] Token auto-hides after 5 minutes
  [ ] Token not visible on page refresh
  [ ] Token not in localStorage
  [ ] Token not in browser logs
  [ ] Invite list shows hash, not plaintext

Invite Management:
  [ ] Can create invite with custom maxUses
  [ ] Can create invite with expiration
  [ ] Can create invite with note
  [ ] Can revoke invite
  [ ] Revoked invites appear as "REVOKED"

Database Security:
  [ ] DB stores only 64-hex codeHash
  [ ] No plaintext tokens in database
  [ ] Uses count increments properly
  [ ] Revoke/expire fail closed

Settings:
  [ ] Can read current settings
  [ ] Can update refresh rate cap
  [ ] Can toggle debug dock
  [ ] Can change artifact display mode
  [ ] Changes persist after reload

Audit Logging:
  [ ] Invite create logged
  [ ] Invite revoke logged
  [ ] Settings update logged
  [ ] Logs include timestamp, actor, IP, user agent
  [ ] Logs don't contain secrets

Secrets & Security:
  [ ] Tripwire passes: OK_NO_SECRETS_MATCHED
  [ ] No plaintext tokens in code
  [ ] No passwords in audit logs
  [ ] No API keys in database
```

## Summary

Phase 9C Proof Gates validate:
1. ✅ Build passes
2. ✅ Server starts on PORT=3001
3. ✅ API endpoints return 401 when unauthenticated
4. ✅ Invite tokens shown once, never stored plaintext
5. ✅ Database stores only hashes
6. ✅ Redemption increments uses_count atomically
7. ✅ Revoke/expire fail closed
8. ✅ Audit logs all actions with sanitization
9. ✅ Secrets tripwire passes

All checks must pass for production readiness.

---

**Last Updated:** 2026-01-13
**Runbook Version:** 1.0
