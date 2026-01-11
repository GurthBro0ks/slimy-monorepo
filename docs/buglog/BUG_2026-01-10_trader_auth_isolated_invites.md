# Trader Auth Isolation - Invite-based Local Login

**Date**: 2026-01-10
**Branch**: `feat/trader-auth-isolated`
**Status**: In Progress

## Objective

Implement isolated authentication for `trader.slimyai.xyz` that does NOT share login/session with other slimyai.xyz apps.

## Requirements

- Separate cookie: `trader_session` scoped to trader.slimyai.xyz only
- Username/password authentication (not Discord OAuth)
- Invite-only registration
- Passwords hashed with argon2id
- Invite codes hashed (never stored in plaintext)
- Rate limiting on login attempts

## Files Created/Modified

### Schema
- `apps/web/prisma/schema.prisma` - Added TraderUser, TraderInvite, TraderSession, TraderLoginAttempt

### Auth Library
- `apps/web/lib/trader/auth/crypto.ts`
- `apps/web/lib/trader/auth/session.ts`
- `apps/web/lib/trader/auth/rate-limit.ts`
- `apps/web/lib/trader/auth/invite.ts`
- `apps/web/lib/trader/auth/index.ts`

### Route Handlers
- `apps/web/app/trader/auth/login/route.ts`
- `apps/web/app/trader/auth/register/route.ts`
- `apps/web/app/trader/auth/logout/route.ts`
- `apps/web/app/trader/auth/me/route.ts`

### UI Pages
- `apps/web/app/trader/login/page.tsx`
- `apps/web/app/trader/register/page.tsx`

### Modified
- `apps/web/lib/trader/access.ts` - Replaced with isolated auth check
- `apps/web/app/trader/layout.tsx` - Updated redirect to /trader/login

### CLI Script
- `scripts/trader_invite_create.ts`

## Commands Run

```bash
# Install dependency
cd apps/web && pnpm add argon2

# Run migration
cd apps/web && pnpm prisma migrate dev --name add_trader_auth

# Generate Prisma client
pnpm prisma:generate

# Build verification
cd apps/web && pnpm build
```

## Verification Checklist

- [ ] Create invite via CLI (code redacted)
- [ ] Register new user with invite
- [ ] Login/logout cycle works
- [ ] Cookie scoped to trader.slimyai.xyz only (no Domain attribute)
- [ ] Other slimyai.xyz pages do NOT see trader session
- [ ] Rate limiting triggers after 5 failed attempts
- [x] Build succeeds (verified 2026-01-10)

## Build Output

All trader routes created successfully:
- `/trader/auth/login` (POST)
- `/trader/auth/register` (POST)
- `/trader/auth/logout` (POST)
- `/trader/auth/me` (GET)
- `/trader/login` (UI page)
- `/trader/register` (UI page)

Database tables created:
- `trader_users`
- `trader_invites`
- `trader_sessions`
- `trader_login_attempts`

## Notes

- Cookie isolation achieved by NOT setting Domain attribute (defaults to exact host)
- Session duration: 24 hours
- Rate limit: 5 attempts per username, 20 per IP, 15-minute lockout window
