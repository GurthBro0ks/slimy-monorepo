# Foundation Admin-API Test Status

- Timestamp: Fri, 21 Nov 2025 19:23:25 -0500
- Branch: claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn
- Git status: ## claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn...origin/claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn

## Changes Applied

- Added apps/admin-api/jest.config.js to run Jest in node env and include jest.setup.js.
- Enhanced apps/admin-api/jest.setup.js to load .env, set required env defaults, and mock token verification with deterministic test payloads; aligned JWT cookie name to slimy_admin_token.
- Updated auth middleware tests to use the slimy_admin_token cookie key.

## Test Results (pnpm test:core)

- @slimy/web: ✅ Tests run via Vitest; only expected mock/error logs from resilience cases.
- @slimy/admin-api: ❌ 3 suites failed / 1 passed. Auth middleware suite now passes. Remaining failures due to missing dependency ../../lib/numparse when loading @slimy/core from vendor bundle (affects auth-routes.test.js, diag.test.js, auth-and-guilds.test.js).
- @slimy/admin-ui: (no tests configured/output).

## Remaining Issues

- Admin-api suites still failing because @slimy/core depends on ../../lib/numparse which is not present in vendor bundle.
- Docker Compose v2 still not installed (outside scope here).

## Next Suggested Steps

- Provide or mock ../../lib/numparse for @slimy/core, or adjust module resolution for admin-api tests.
- Once dependency issue fixed, re-run 
> slimy-monorepo@ test:core /home/mint/slimy-dev/slimy-monorepo
> pnpm --filter admin-api --filter web --filter admin-ui run test || echo "TODO: wire tests"

Scope: 3 of 10 workspace projects
apps/admin-api test$ jest
apps/web test$ vitest
apps/web test: [1m[46m RUN [49m[22m [36mv4.0.9 [39m[90m/home/mint/slimy-dev/slimy-monorepo/apps/web[39m
apps/admin-api test: PASS tests/auth/auth-middleware.test.js
apps/admin-api test:   ● Console
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: token verification failed { error: 'jwt malformed' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-user' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-admin' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-admin' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: user hydrated { userId: 'test-member' }
apps/admin-api test:       at logReadAuth (src/middleware/auth.js:9:13)
apps/admin-api test: FAIL tests/api/auth-routes.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     Cannot find module '../../lib/numparse' from '../../node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js'
apps/admin-api test:     Require stack:
apps/admin-api test:       /home/mint/slimy-dev/slimy-monorepo/node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js
apps/admin-api test:       src/services/settings.js
apps/admin-api test:       src/routes/guilds.js
apps/admin-api test:       src/routes/index.js
apps/admin-api test:       src/app.js
apps/admin-api test:       tests/api/auth-routes.test.js
apps/admin-api test:       3 | const guildSettings = require("../../lib/guild-settings");
apps/admin-api test:       4 | const { getWarnThresholds } = require("../../lib/thresholds");
apps/admin-api test:     > 5 | const slimyCore = require("@slimy/core");
apps/admin-api test:         |                   ^
apps/admin-api test:       6 |
apps/admin-api test:       7 | function toNumber(value) {
apps/admin-api test:       8 |   if (value === null || typeof value === "undefined") return null;
apps/admin-api test:       at Resolver._throwModNotFoundError (../../node_modules/.pnpm/jest-resolve@29.7.0/node_modules/jest-resolve/build/resolver.js:427:11)
apps/admin-api test:       at Object.<anonymous> (../../node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js:5:24)
apps/admin-api test:       at Object.<anonymous> (src/services/settings.js:5:19)
apps/admin-api test:       at Object.<anonymous> (src/routes/guilds.js:11:25)
apps/admin-api test:       at Object.<anonymous> (src/routes/index.js:7:21)
apps/admin-api test:       at Object.<anonymous> (src/app.js:8:16)
apps/admin-api test:       at Object.<anonymous> (tests/api/auth-routes.test.js:2:13)
apps/admin-api test: FAIL tests/diag.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     Cannot find module '../../lib/numparse' from '../../node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js'
apps/admin-api test:     Require stack:
apps/admin-api test:       /home/mint/slimy-dev/slimy-monorepo/node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js
apps/admin-api test:       src/services/settings.js
apps/admin-api test:       src/routes/guilds.js
apps/admin-api test:       src/routes/index.js
apps/admin-api test:       src/app.js
apps/admin-api test:       tests/diag.test.js
apps/admin-api test:       3 | const guildSettings = require("../../lib/guild-settings");
apps/admin-api test:       4 | const { getWarnThresholds } = require("../../lib/thresholds");
apps/admin-api test:     > 5 | const slimyCore = require("@slimy/core");
apps/admin-api test:         |                   ^
apps/admin-api test:       6 |
apps/admin-api test:       7 | function toNumber(value) {
apps/admin-api test:       8 |   if (value === null || typeof value === "undefined") return null;
apps/admin-api test:       at Resolver._throwModNotFoundError (../../node_modules/.pnpm/jest-resolve@29.7.0/node_modules/jest-resolve/build/resolver.js:427:11)
apps/admin-api test:       at Object.<anonymous> (../../node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js:5:24)
apps/admin-api test:       at Object.<anonymous> (src/services/settings.js:5:19)
apps/admin-api test:       at Object.<anonymous> (src/routes/guilds.js:11:25)
apps/admin-api test:       at Object.<anonymous> (src/routes/index.js:7:21)
apps/admin-api test:       at Object.<anonymous> (src/app.js:8:16)
apps/admin-api test:       at Object.<anonymous> (tests/diag.test.js:9:13)
apps/admin-api test: FAIL tests/auth-and-guilds.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     Cannot find module '../../lib/numparse' from '../../node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js'
apps/admin-api test:     Require stack:
apps/admin-api test:       /home/mint/slimy-dev/slimy-monorepo/node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js
apps/admin-api test:       src/services/settings.js
apps/admin-api test:       src/routes/guilds.js
apps/admin-api test:       src/routes/index.js
apps/admin-api test:       src/app.js
apps/admin-api test:       tests/auth-and-guilds.test.js
apps/admin-api test:       3 | const guildSettings = require("../../lib/guild-settings");
apps/admin-api test:       4 | const { getWarnThresholds } = require("../../lib/thresholds");
apps/admin-api test:     > 5 | const slimyCore = require("@slimy/core");
apps/admin-api test:         |                   ^
apps/admin-api test:       6 |
apps/admin-api test:       7 | function toNumber(value) {
apps/admin-api test:       8 |   if (value === null || typeof value === "undefined") return null;
apps/admin-api test:       at Resolver._throwModNotFoundError (../../node_modules/.pnpm/jest-resolve@29.7.0/node_modules/jest-resolve/build/resolver.js:427:11)
apps/admin-api test:       at Object.<anonymous> (../../node_modules/.pnpm/@slimy+core@file+apps+admin-api+vendor+slimy-core/node_modules/@slimy/core/index.js:5:24)
apps/admin-api test:       at Object.<anonymous> (src/services/settings.js:5:19)
apps/admin-api test:       at Object.<anonymous> (src/routes/guilds.js:11:25)
apps/admin-api test:       at Object.<anonymous> (src/routes/index.js:7:21)
apps/admin-api test:       at Object.<anonymous> (src/app.js:8:16)
apps/admin-api test:       at Object.<anonymous> (tests/auth-and-guilds.test.js:10:13)
apps/admin-api test: Test Suites: 3 failed, 1 passed, 4 total
apps/admin-api test: Tests:       17 passed, 17 total
apps/admin-api test: Snapshots:   0 total
apps/admin-api test: Time:        1.197 s
apps/admin-api test: Ran all test suites.
apps/admin-api test: Failed
/home/mint/slimy-dev/slimy-monorepo/apps/admin-api:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @slimy/admin-api@1.0.0 test: `jest`
Exit status 1
TODO: wire tests to confirm admin-api suites.
- Install Docker Compose v2 plugin if staging stack needs to be exercised.
