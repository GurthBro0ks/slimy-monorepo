# Admin API Route Fixes

- Added a legacy mount for the auth router so `GET /auth/me` behaves identically to `GET /api/auth/me`.
- Relaxed `/api/diag` to allow unauthenticated probes while keeping authenticated diagnostics unchanged.
- Verified via curl smoke tests and `pnpm --filter @slimy/admin-api test`.

## Files Touched

- `apps/admin-api/src/routes/index.js`
- `apps/admin-api/src/routes/diag.js`
