# Foundation Health Snapshot – 2025-11-21_18-59-57

Branch: claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn

## Prisma

- pnpm prisma:generate: SUCCESS (admin-api and web clients generated; Prisma 6.19.0; upgrade notice to 7.0.0)

## Builds (pnpm build:core)

- admin-api: PASS (runs directly from source; no build artifacts)
- web: PASS (Next.js build succeeded; warnings about workspace root due to multiple lockfiles and repeated logs for missing NEXT_PUBLIC_ADMIN_API_BASE during build)
- admin-ui: PASS (Next.js 14.2.5 build completed)

## Tests (pnpm test:core)

- @slimy/web: Vitest ran; suites completed without reported failures in output (numerous mocked error logs surfaced but tests appear to pass).
- @slimy/admin-api: FAILED – 8 suites failed (11 tests failed, 6 passed). Blocked by missing env vars (DISCORD_CLIENT_ID/SECRET, SESSION_SECRET/JWT_SECRET, DATABASE_URL), triggering config validation errors and cascading auth middleware assertion failures.
- @slimy/admin-ui: No test script output (likely none defined).

## Staging Stack

- docker found at /usr/bin/docker.
- docker compose v2 NOT FOUND (docker reported "unknown command: docker compose"); staging stack not attempted.

## Key Issues

- Admin API tests require populated env vars; without them config validation fails and auth middleware tests break.
- Web build warns about missing NEXT_PUBLIC_ADMIN_API_BASE; environment config alignment needed for cleaner builds.
- Docker Compose v2 unavailable locally, blocking staging stack probe.

## Next Suggested Fixes (MANUAL)

- Create/populate apps/admin-api/.env (or test env) with DISCORD_CLIENT_ID/DISCORD_CLIENT_SECRET, SESSION_SECRET/JWT_SECRET, and DATABASE_URL before rerunning tests.
- Provide NEXT_PUBLIC_ADMIN_API_BASE (and other required web env vars) prior to web builds/tests to remove warnings.
- Install/enable Docker Compose v2 (`docker compose`) or adjust PATH/alias so staging scripts can run.
- Re-run `pnpm test:core` after env fixes to validate admin-api auth middleware expectations.
- Decide whether/when to adopt Prisma 7.x upgrade noted during generate.
