# Phase 9D — Manual-UI Runbook: Owner Bootstrap & Invite System

**Purpose**: Verify that the Slimy application correctly implements:
- Database persistence (MySQL with Prisma)
- Owner-only access control (via OwnerAllowlist)
- Invite-only signup flow (via OwnerInvite tokens)
- Session-based authentication

**Identities**:
- **OWNER**: crypto@slimyai.xyz (has owner privileges)
- **NORMAL USER**: gurth@slimyai.xyz (created via invite, no owner privileges)

---

## System Architecture Verified

### 1. Authentication System
- **Type**: Custom session-based (not NextAuth/Auth.js)
- **Session Storage**: Cookies (slimy_admin, slimy_session, connect.sid)
- **User Lookup**: /api/auth/me endpoint validates sessions

### 2. Database Layer
- **Database**: MySQL 8.0
- **ORM**: Prisma with MySQL provider
- **Key Models**:
  - `User`: Authenticated users
  - `Session`: Session tokens
  - `OwnerAllowlist`: Allowed owner emails (unique index on email)
  - `OwnerInvite`: Single-use or limited-use invitation codes
  - `OwnerAuditLog`: Audit trail for all owner actions
  - `AppSettings`: Singleton settings

### 3. Owner Allowlist & Gating
**Location**: `lib/auth/owner.ts:requireOwner()`
- Validates user is authenticated
- Checks `OwnerAllowlist` table by email
- Rejects non-owners with 403 Forbidden
- All owner API endpoints (`/api/owner/*`) require this check

### 4. Invite System
**Location**: `lib/owner/invite.ts` (223 lines)
**Functions**:
- `generateInviteToken()`: Creates random 32-byte token
- `hashInviteToken()`: SHA256 hash
- `createOwnerInvite()`: Creates invite with expiry, maxUses
- `validateOwnerInvite()`: Verifies token against hash
- `redeemOwnerInvite()`: Atomically increments use count, adds email to allowlist
- `revokeOwnerInvite()`: Revokes an invite

**Database Schema**:
```
OwnerInvite {
  codeHash:   String (SHA256, unique) 
  createdAt:  DateTime
  createdById: String (owner email)
  expiresAt:  DateTime
  maxUses:    Int (default 1)
  useCount:   Int (tracks redeems)
  revokedAt:  DateTime (null = active)
}
```

---

## Manual Verification Steps

### Prerequisites

**CRITICAL INFRASTRUCTURE GUARDRAILS:**
- ❌ **DO NOT** start dev servers for manual verification
- ❌ **DO NOT** modify `/etc/caddy/Caddyfile` or proxy production domains to dev ports
- ❌ **DO NOT** open firewall ports (ufw/iptables) for dev servers
- ✅ **USE** real production website URLs (e.g., https://slimyai.xyz) for manual testing
- ✅ **VERIFY** production deployment is running and accessible

1. MySQL database running and accessible
2. Prisma migrations applied (`owner_allowlist`, `owner_invite` tables created)
3. Owner bootstrap completed (crypto@slimyai.xyz added to allowlist)
4. Production web app accessible via real domain (e.g., https://slimyai.xyz)

### Verification Checklist

#### A. Owner Dashboard Access
- [ ] Login as crypto@slimyai.xyz
- [ ] Navigate to /owner (owner panel)
- [ ] Confirm page loads successfully (no 403 Forbidden)
- [ ] See owner controls (invite management, audit logs)

#### B. Create Invite
- [ ] In /owner panel, create a new invite
- [ ] Receive invite code/link (token shown in modal)
- [ ] Confirm token is displayed only once
- [ ] Copy token to clipboard (do NOT log token)
- [ ] Close modal to hide token from UI
- [ ] Screenshot after closing (shows "invite created" state without token)

#### C. Use Invite as New User
- [ ] Open incognito browser window (fresh session)
- [ ] Navigate to signup or use invite link
- [ ] Enter invite code when prompted
- [ ] Create account as gurth@slimyai.xyz
- [ ] Confirm account creation succeeds
- [ ] Verify login as gurth@

#### D. Verify Non-Owner Cannot Access /owner
- [ ] While logged in as gurth@
- [ ] Visit https://slimyai.xyz/owner
- [ ] Confirm 403 Forbidden page displayed
- [ ] Screenshot forbidden page

#### E. Invite Single-Use Enforcement (Optional)
- [ ] Open another incognito window
- [ ] Try to use same invite code again
- [ ] Confirm "invite used" or "invalid" error
- [ ] Screenshot error message

---

## Proof Artifacts

Files saved to `/tmp/proof_phase9d_manual_*/`:

- `phase0_git/`: Git setup and branch creation
- `phase1_discovery/`: System discovery (runtime, auth, db, invite, owner gate)
- `phase2_db/`: Database startup and connectivity
- `phase3_prisma/`: Prisma client generation and migrations
- `phase4_auth/`: Auth persistence check
- `phase5_owner_bootstrap/`: Owner bootstrap completion
- `phase6_manual_verify/`: Manual UI verification screenshots and notes
  - `ui_owner_dashboard.png`: Owner panel screenshot
  - `ui_invite_created_no_token.png`: Invite created (token hidden)
  - `ui_non_owner_forbidden.png`: Non-owner 403 page
  - `ui_invite_reuse_denied.png`: Invite reuse error (optional)
  - `ui_notes.txt`: Summary of manual verifications

- `phase7_closeout/`: Final tests, build, and commit

---

## Key Audit Logging

All owner actions are logged to `OwnerAuditLog`:
- `INVITE_CREATE`: When owner creates invite
- `INVITE_REVOKE`: When owner revokes invite
- `SETTINGS_UPDATE`: When owner changes settings
- `OWNER_ADD`: When owner adds new owner
- `OWNER_REVOKE`: When owner revokes owner privileges

Audit logs include: actor, action, resource type, changes (JSON), IP address, user agent.

---

## Security Notes

**No Bypasses**:
- Invite codes are SHA256 hashed (plaintext never stored)
- Owner email added to allowlist only after successful invite redemption
- Single-use or limited-use enforcement (tracked with `useCount`)
- Revocation supported (soft delete via `revokedAt`)

**Fail-Closed**:
- Default: users are NOT owners
- Owner endpoints return 401 (unauthenticated) or 403 (not owner)
- Invite must be valid, not expired, not revoked, use count not exceeded

---

## Environment Variables

```bash
# .env.local for development
NODE_ENV=development
PORT=3001
DATABASE_URL=mysql://slimyai:slimypassword@127.0.0.1:3306/slimyai
OWNER_BOOTSTRAP_EMAIL=crypto@slimyai.xyz
NEXT_PUBLIC_ADMIN_API_BASE=http://127.0.0.1:3080
```

---

## Bootstrap Command

```bash
cd /opt/slimy/slimy-monorepo
OWNER_BOOTSTRAP_EMAIL="crypto@slimyai.xyz" pnpm tsx scripts/bootstrap_owner.ts
```

Expected output:
```
✓ Owner bootstrapped successfully
  Email: crypto@slimyai.xyz
  Created: 2026-01-15T04:30:00.000Z
  Created by: crypto@slimyai.xyz
```

If already exists:
```
✓ Owner already exists and is active: crypto@slimyai.xyz
  Created: 2026-01-15T04:30:00.000Z
  Created by: crypto@slimyai.xyz
```

---

**Runbook Version**: Phase 9D (2026-01-15)
**Author**: Manual-UI Verification Protocol
**Status**: TRUTH + STOP-ON-FAIL + PROOF + INVITE-ONLY SIGNUP
