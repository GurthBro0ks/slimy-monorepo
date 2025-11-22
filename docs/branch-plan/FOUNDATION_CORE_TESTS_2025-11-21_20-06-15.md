# Foundation Core Tests Snapshot

- Timestamp: 2025-11-21_20-06-15
- Branch: claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn
- Command: `pnpm test:core`

## Workspace Summary

- @slimy/web: Vitest completes; tests log expected mock errors (API Error, Disk full, Analysis failed) but suite exits 0.
- @slimy/admin-api: Jest runs all suites (no missing-module/require errors). 2 suites pass, 3 fail with runtime/assertion issues.
- @slimy/admin-ui: no tests configured (as before).

## Admin-API Failure Details (no import crashes)

- `tests/diag.test.js`
  - Jest error: "Your test suite must contain at least one test." (file executes and exits via process.exit).
- `tests/auth-and-guilds.test.js`
  - Expected HTTP 200 from `/api/guilds`; received 401 `{"ok":false,"code":"UNAUTHORIZED","message":"Authentication required"}`.
  - Test logs after completion trigger "Cannot log after tests are done" warnings and `process.exit(1)` is invoked.
- Global warnings
  - Multiple `console.info` from `src/middleware/auth.js` after tests finish cause Jest buffered-console warnings (app still booted via Express stack).

## Observations

- All prior bootstrap/import blockers (e.g., `@googleapis/sheets`, redis/queue/snail/database shims) remain resolved.
- Remaining failures are behavioral: auth flow returning 401s and diag script exiting, not module resolution.
