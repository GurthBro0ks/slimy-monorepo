# Foundation Sheets Mock Status

- Timestamp: 2025-11-21_19-54-42
- Branch: claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn

## Current Failure Snapshot (before mocking)

- Command: `pnpm test:core`
- @slimy/web: passes.
- @slimy/admin-api: suites abort during module load with missing Google Sheets SDK:
  - Error: `Cannot find module '@googleapis/sheets' from 'lib/sheets.js'`
  - Require stack:
    - apps/admin-api/lib/sheets.js
    - apps/admin-api/src/routes/stats.js
    - apps/admin-api/src/routes/index.js
    - apps/admin-api/src/app.js
    - apps/admin-api/tests/api/auth-routes.test.js (also in diag.test.js, auth-and-guilds.test.js)
- No assertion failures observed; blocking is purely missing dependency resolution for `@googleapis/sheets` (and transitive auth if loaded).

## Plan

- Add Jest mocks in `apps/admin-api/jest.setup.js` for `@googleapis/sheets` (and `google-auth-library` if needed) to return minimal fake clients.
- Re-run `pnpm test:core` to confirm suites load.

## After Mocks Applied

- Added Jest mocks for `@googleapis/sheets`, `google-auth-library`, `bullmq`, `ioredis`, `../../../lib/snail-vision`, `../../../lib/database`, and stubbed the snail route to avoid filesystem writes. Set `process.env.CORS_ORIGIN` default in test setup.
- `pnpm test:core` now loads admin-api suites without missing-module errors.
- Latest run (2025-11-21_20-06-15): admin-api shows 3 failing suites, 2 passing; failures are runtime/behavioral (diag exits with no tests; auth-and-guilds returns 401s and logs after teardown). No import/require crashes remain. Web still exits 0 with expected mock error logs.
