# Phase 9A: Owner Control Plane Backend Implementation

**Date:** 2026-01-13
**Phase:** 9A
**Status:** ✅ Complete

## Overview

Implemented the complete Owner Control Plane backend for managing invites, application settings, and owner access controls. This phase establishes the foundation for administrative control of the application.

## What Changed

### 1. Database Schema (Prisma)
Added four new tables to the unified schema (`apps/web/prisma/schema.prisma`):

#### OwnerAllowlist
- Manages which users/emails can access owner APIs
- Fields: `id`, `email` (unique), `userId`, `createdAt`, `createdBy`, `note`, `revokedAt`
- Relations: invites created, settings updated, audit logs
- Indexes on: email, userId, createdAt

#### OwnerInvite
- Stores owner invitation codes (hashed only)
- Fields: `id`, `codeHash` (unique, 64-char SHA256 hex), `createdById`, `createdAt`, `expiresAt`, `maxUses`, `useCount`, `usedAt`, `revokedAt`, `note`
- Relations: creator (OwnerAllowlist)
- Indexes on: codeHash, createdById, createdAt
- **Security:** Only hash is stored; plaintext token is returned ONE time at creation

#### AppSettings
- Singleton table for application-level configuration
- Fields: `id`, `refreshRateCapMs` (5000ms default, bounds 100-3600000), `debugDockEnabled`, `artifactSourceDisplay` ("icon"|"text"|"both"), `updatedAt`, `updatedById`
- Relations: updatedBy (OwnerAllowlist)

#### OwnerAuditLog
- Immutable log of all owner actions
- Fields: `id`, `actorId`, `action` (INVITE_CREATE|INVITE_REVOKE|SETTINGS_UPDATE|OWNER_ADD|OWNER_REVOKE), `resourceType`, `resourceId`, `changes` (JSON), `ipAddress`, `userAgent`, `createdAt`
- Relations: actor (OwnerAllowlist)
- **Security:** Plaintext tokens are stripped from changes JSON before storage
- Indexes on: actorId, action, resourceType, createdAt

### 2. Authentication & Authorization

#### `lib/auth/owner.ts`
- `requireOwner(request)` - Middleware that enforces owner authorization
  - Returns 401 if not authenticated
  - Returns 403 if authenticated but not in OwnerAllowlist
  - Returns OwnerContext with user, owner, ipAddress, userAgent
- `isOwnerByEmail(email)` - Checks env var `OWNER_EMAIL_ALLOWLIST` for bootstrap initialization
- `initBootstrapOwners()` - Creates initial owners from env var (useful for dev/test)

### 3. Invite System

#### `lib/owner/invite.ts`
- `generateInviteToken(bytes=32)` - Creates cryptographically secure random token (64-char hex)
- `hashInviteToken(token)` - SHA256 hash → 64-char hex (never reveals plaintext)
- `createOwnerInvite(createdById, options)` - Create new invite with optional expiry, maxUses, note
  - Returns: { inviteId, tokenPlaintext (ONE TIME), codeHash, expiresAt, maxUses, note }
  - **Critical:** plaintext token is returned ONCE to display to user; never stored in DB
- `validateOwnerInvite(token)` - Fail-closed validation
  - Checks: exists, not revoked, not expired, useCount < maxUses
  - Returns: { valid: boolean, reason?, invite? }
- `redeemOwnerInvite(inviteId, email)` - Atomic redemption
  - Increments useCount transactionally
  - Adds email to OwnerAllowlist
- `revokeOwnerInvite(inviteId)` - Sets revokedAt
- `listOwnerInvites()` - Lists all invites (no plaintext tokens)

### 4. Audit Logging

#### `lib/owner/audit.ts`
- `logOwnerAction(options)` - Record owner actions to audit log
  - Sanitizes `changes` to remove: token, tokenPlaintext, password, code fields
  - Obscures codeHash as "[64-char-hash]"
  - Caps ipAddress to 45 chars, userAgent to 500 chars
  - **Critical:** Never logs plaintext data
- `getOwnerAuditLogs(limit=100, action?)` - Query audit logs with optional filtering
- `parseAuditChanges(changesJson)` - Safe JSON parsing of stored changes

### 5. API Routes

All routes require `requireOwner()` authorization:

#### `GET /api/owner/me`
- Returns authenticated owner info (user + owner fields)
- Response: `{ ok: true, user, owner, isOwner: true }`

#### `GET /api/owner/invites`
- List all owner invites (no plaintext tokens)
- Response: array of invites with codeHash, createdAt, expiresAt, maxUses, useCount, revokedAt, note, createdBy

#### `POST /api/owner/invites`
- Create new owner invite
- Body: `{ expiresIn?: number, maxUses?: 1-100, note?: string }`
- Response: `{ ok: true, inviteId, tokenPlaintext, codeHash, expiresAt, maxUses, note, message: "Token displayed above..." }`
- Logs: INVITE_CREATE audit entry

#### `POST /api/owner/invites/[id]/revoke`
- Revoke an invite (sets revokedAt)
- Response: `{ ok: true, message: "Invite revoked" }`
- Logs: INVITE_REVOKE audit entry

#### `GET /api/owner/settings`
- Get current app settings (creates singleton if missing)
- Response: `{ ok: true, settings: { id, refreshRateCapMs, debugDockEnabled, artifactSourceDisplay, updatedAt, updatedById } }`

#### `PUT /api/owner/settings`
- Update app settings
- Body: `{ refreshRateCapMs?: 100-3600000, debugDockEnabled?: bool, artifactSourceDisplay?: "icon"|"text"|"both" }`
- Response: updated settings object
- Logs: SETTINGS_UPDATE audit entry with change details

#### `GET /api/owner/audit`
- Get recent audit logs (newest first)
- Query: `?limit=1-500&action=INVITE_CREATE|INVITE_REVOKE|SETTINGS_UPDATE|...`
- Response: `{ ok: true, logs: [...], count }`

### 6. Testing

Added comprehensive test suites:

#### `lib/owner/__tests__/invite.test.ts` (40+ tests)
- Token generation (randomness, hex encoding, length)
- Hashing (consistency, uniqueness, 64-char format)
- Invite creation (defaults, custom maxUses, expiry)
- Database storage (hash only, no plaintext)
- Validation (valid, invalid, revoked, expired, max uses exceeded)
- Security (hash uniqueness, timing safety)

#### `lib/auth/__tests__/owner.test.ts` (15+ tests)
- Email allowlist checking (case-insensitive, whitespace handling)
- Bootstrap initialization from env var
- Duplicate prevention
- Note setting

#### `lib/owner/__tests__/audit.test.ts` (25+ tests)
- Action logging with context (IP, user agent)
- Sanitization (token, password, code removal)
- Obscuring hashes
- JSON change tracking
- Query filtering by action
- Limit enforcement
- Secure JSON parsing

**Test Results:** All 269 tests pass ✅

## Security Non-Negotiables

### 1. Token Handling - ✅ Implemented
- Tokens generated with `crypto.randomBytes()` (cryptographically secure)
- Hashed with SHA256 before storage
- Plaintext returned ONCE at creation for user to copy
- Never stored in DB, never logged

### 2. Authorization - ✅ Implemented
- Unauthed /api/owner/* → 401 JSON
- Authed non-owner /api/owner/* → 403 JSON
- Owner check: email OR userId in OwnerAllowlist (not revoked)
- Fail-safe: throws NextResponse on auth failure

### 3. Audit Logging - ✅ Implemented
- All owner actions logged with actor, action, timestamp, IP, user agent
- Changes tracked but sanitized (no plaintext tokens)
- Immutable (only CREATE allowed)
- Logs can be reviewed: GET /api/owner/audit

### 4. Data Validation - ✅ Implemented
- Zod schemas for all POST/PUT bodies
- Bounds enforcement: refreshRateCapMs 100-3600000ms, maxUses 1-100
- Date validation (reject future-expiring and past-expired)
- useCount increment is atomic (fail-closed on race conditions)

### 5. No Secrets in Code - ✅ Verified
- Grep check confirms no plaintext passwords, API keys, or tokens in new code
- All references to "token" are in comments or function names (tokenHash, hashToken, tokenPlaintext)
- Changes JSON sanitization removes secrets before storage

## Verification Checklist

- ✅ Prisma schema updated with new tables
- ✅ Database synced (`prisma db push`)
- ✅ Build passes (`pnpm run build`)
- ✅ All tests pass (269 tests)
- ✅ New API routes built and discoverable
- ✅ No plaintext secrets in code
- ✅ 401/403 authorization working
- ✅ Audit logging sanitizes secrets
- ✅ Invite hashes are 64 characters (SHA256)
- ✅ Bootstrap owner initialization working (env var)

## How to Use

### Bootstrap Initial Owner
```bash
export OWNER_EMAIL_ALLOWLIST="admin@example.com,owner@example.com"
# Owners will be created on next /api/owner/* request or call initBootstrapOwners()
```

### Create Owner Invite
```bash
curl -X POST http://localhost:3000/api/owner/invites \
  -H "Authorization: Bearer <owner-session>" \
  -H "Content-Type: application/json" \
  -d '{
    "expiresIn": 604800000,
    "maxUses": 5,
    "note": "team invite"
  }'

# Response:
# {
#   "ok": true,
#   "inviteId": "cuid",
#   "tokenPlaintext": "abcd1234...",  <- Save this!
#   "codeHash": "sha256hash...",
#   "expiresAt": "2026-01-20T...",
#   "maxUses": 5,
#   "note": "team invite",
#   "message": "Token displayed above - save it now, you will not see it again"
# }
```

### List Invites
```bash
curl http://localhost:3000/api/owner/invites \
  -H "Authorization: Bearer <owner-session>"
```

### Update Settings
```bash
curl -X PUT http://localhost:3000/api/owner/settings \
  -H "Authorization: Bearer <owner-session>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshRateCapMs": 10000,
    "debugDockEnabled": true
  }'
```

### View Audit Logs
```bash
curl "http://localhost:3000/api/owner/audit?limit=50&action=INVITE_CREATE" \
  -H "Authorization: Bearer <owner-session>"
```

## Files Modified/Created

### Schema & DB
- `apps/web/prisma/schema.prisma` - Added OwnerAllowlist, OwnerInvite, AppSettings, OwnerAuditLog

### Library Code
- `lib/auth/owner.ts` - Owner auth middleware (requireOwner, isOwnerByEmail, initBootstrapOwners)
- `lib/owner/invite.ts` - Invite generation, validation, redemption (generateInviteToken, hashInviteToken, createOwnerInvite, validateOwnerInvite, redeemOwnerInvite, revokeOwnerInvite, listOwnerInvites)
- `lib/owner/audit.ts` - Audit logging (logOwnerAction, getOwnerAuditLogs, parseAuditChanges, sanitizeChanges)

### API Routes
- `app/api/owner/me/route.ts` - GET /api/owner/me
- `app/api/owner/invites/route.ts` - GET/POST /api/owner/invites
- `app/api/owner/invites/[id]/revoke/route.ts` - POST /api/owner/invites/[id]/revoke
- `app/api/owner/settings/route.ts` - GET/PUT /api/owner/settings
- `app/api/owner/audit/route.ts` - GET /api/owner/audit

### Tests
- `lib/owner/__tests__/invite.test.ts` - Invite system tests
- `lib/auth/__tests__/owner.test.ts` - Owner auth tests
- `lib/owner/__tests__/audit.test.ts` - Audit logging tests

## Next Steps (Phase 9B+)

1. **Frontend:** Build owner control panel UI (create invites, manage settings, view audit logs)
2. **Integration:** Connect existing features to AppSettings (refresh rate, debug mode, display options)
3. **Monitoring:** Dashboard for metrics, alerts on suspicious audit activity
4. **Multi-owner:** Support multiple owners with different permission levels (owner, admin, auditor)
5. **Soft-delete:** Add ability to revoke owner access without deleting history

## Commit Strategy

All changes committed to branch `phase9/owner-control-plane-backend` with small, logical commits:

1. `chore: add owner control plane schema (3 new tables)`
2. `feat: implement owner auth middleware and bootstrap`
3. `feat: implement invite token system (generation, hashing, validation)`
4. `feat: implement audit logging with sanitization`
5. `feat: add /api/owner/* API routes (me, invites, settings, audit)`
6. `test: add comprehensive test suite for owner system`
7. `docs: phase 9A implementation summary`

---

**Implementation Date:** 2026-01-13
**Git Commit:** Multiple small, logical commits (see PR)
**Status:** Ready for PR review and merge to main
