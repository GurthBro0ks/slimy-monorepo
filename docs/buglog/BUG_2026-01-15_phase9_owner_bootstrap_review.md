# Bug/Review Log: Phase 9D Owner Bootstrap & Invite System

**Date**: 2026-01-15  
**Phase**: 9D - Manual-UI Runbook  
**Status**: IN PROGRESS - Manual UI Verification  

## Overview

Phase 9D implements and verifies:
1. Database persistence with MySQL + Prisma
2. Owner allowlist (`OwnerAllowlist` model)
3. Invite system (`OwnerInvite` model with token hashing)
4. Owner-only access control (`requireOwner()` middleware)
5. Session-based authentication persistence

## Verification Checklist

### ✅ Code Review Passed
- [x] OwnerAllowlist model exists with email unique index
- [x] OwnerInvite model exists with SHA256 codeHash
- [x] Invite functions: generate, hash, validate, redeem, revoke all present
- [x] requireOwner() middleware enforces 401/403 gating
- [x] Audit logging implemented (OwnerAuditLog model)
- [x] No plaintext secrets in logs
- [x] Fail-closed: defaults to non-owner

### ⏳ Pending Manual Verification
- [ ] Database migrations applied successfully
- [ ] Owner bootstrap executed (crypto@slimyai.xyz)
- [ ] Manual Chrome: Owner can access /owner panel
- [ ] Manual Chrome: Owner can create invites
- [ ] Manual Chrome: Invite-based signup works for normal user
- [ ] Manual Chrome: Normal user cannot access /owner (403)
- [ ] Manual Chrome: Invite single-use enforcement works

## Key Files

- `lib/auth/owner.ts` (124 lines) - Owner gating middleware
- `lib/owner/invite.ts` (223 lines) - Invite system implementation
- `lib/owner/audit.ts` (133 lines) - Audit logging
- `prisma/schema.prisma` (lines 587-668) - Owner models
- `scripts/bootstrap_owner.ts` - Owner bootstrap script
- `docs/proof/PHASE9_FIRST_OWNER_BOOTSTRAP.md` - Full runbook

## Database Schema

```sql
-- OwnerAllowlist: Email-based owner list
CREATE TABLE owner_allowlist (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(36) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  note VARCHAR(255),
  revoked_at TIMESTAMP
);

-- OwnerInvite: Single-use or limited-use codes
CREATE TABLE owner_invites (
  id VARCHAR(36) PRIMARY KEY,
  code_hash VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_id VARCHAR(36) NOT NULL,
  expires_at TIMESTAMP,
  max_uses INT DEFAULT 1,
  use_count INT DEFAULT 0,
  used_at TIMESTAMP,
  revoked_at TIMESTAMP,
  note VARCHAR(255),
  FOREIGN KEY (created_by_id) REFERENCES owner_allowlist(id)
);
```

## API Endpoints

Protected by `requireOwner()`:
- GET `/api/owner/me` - Get current owner info
- GET `/api/owner/invites` - List invites
- POST `/api/owner/invites` - Create invite (returns token in response)
- POST `/api/owner/invites/[id]/revoke` - Revoke invite
- GET/PUT `/api/owner/settings` - App settings (CRUD)
- GET `/api/owner/audit` - Fetch audit logs

## Security Properties

1. **Token Hashing**: Invite tokens are SHA256 hashed before storage
   - Plaintext token never stored in database
   - Even DB breach cannot reveal invite codes

2. **Single-Use Enforcement**: 
   - Each invite tracks `useCount` and `maxUses`
   - Atomic increment on redemption prevents race conditions
   - Expired/revoked invites rejected in validation

3. **Owner Email Validation**:
   - Email stored in database (unique constraint)
   - Lowercase normalization applied
   - Audit trail of who created the entry

4. **Fail-Closed**:
   - All owner endpoints require `requireOwner()` check
   - Default is non-owner (no special privileges)
   - Returns 403 for non-owners, 401 for unauthenticated

## Environment Setup

**Local Development**:
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=mysql://slimyai:slimypassword@127.0.0.1:3306/slimyai
OWNER_BOOTSTRAP_EMAIL=crypto@slimyai.xyz
```

**Bootstrap Command**:
```bash
OWNER_BOOTSTRAP_EMAIL="crypto@slimyai.xyz" pnpm tsx scripts/bootstrap_owner.ts
```

## Manual Verification Protocol

See `docs/proof/PHASE9_FIRST_OWNER_BOOTSTRAP.md` for:
1. Owner login and dashboard access
2. Invite creation and token handling
3. Non-owner signup via invite
4. Non-owner access denial to /owner
5. Invite reuse prevention

## Next Steps

1. **Phase 4**: User verifies auth system via production website
2. **Phase 5**: Bootstrap owner (crypto@), run migrations
3. **Phase 6**: Manual browser verification of full flow on production website
4. **Phase 7**: Tests, build, commit

**Infrastructure Guardrails**:
- ❌ Do NOT start dev servers for manual verification
- ❌ Do NOT modify Caddy/UFW/iptables
- ✅ Use production URLs (https://slimyai.xyz) for all manual testing

---

**Status**: Ready for manual UI verification
**Runbook**: /docs/proof/PHASE9_FIRST_OWNER_BOOTSTRAP.md
**Bootstrap Script**: /scripts/bootstrap_owner.ts
