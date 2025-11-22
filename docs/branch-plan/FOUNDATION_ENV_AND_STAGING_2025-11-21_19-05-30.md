# Foundation Env & Staging Status

- Timestamp: Fri, 21 Nov 2025 19:05:30 -0500
- Branch: claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn
- Git status: ## claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn...origin/claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn

## Env Files

- apps/admin-api/.env: Created from .env.example then populated with placeholder local values (Discord IDs/secrets, session/JWT secrets, DATABASE_URL). Not committed.
- apps/web/.env.local: Created new with NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080. Not committed.

## Test Results (pnpm test:core)

- @slimy/web: Vitest suites ran; tests appear to pass (only mocked error logs in output).
- @slimy/admin-api: FAILED – 8 suites, 11 tests failed (6 passed). Configuration validation still fails (DISCORD_* / SESSION_SECRET / JWT_SECRET / DATABASE_URL) despite .env present; suggests tests may not load local .env or require specific test env handling. Auth middleware assertions also failing due to missing config/setup.
- @slimy/admin-ui: No tests configured/output.

## Docker Compose

- docker compose v2: missing (command not available).
- Suggested install (not executed):
  - sudo apt-get update
  - sudo apt-get install docker-compose-plugin

## Next Suggested Steps

- Confirm admin-api tests load the intended env file (dotenv/test setup); ensure DISCORD_CLIENT_ID is numeric and secrets length >=32 in the active test env.
- Re-run 
> slimy-monorepo@ test:core /home/mint/slimy-dev/slimy-monorepo
> pnpm --filter admin-api --filter web --filter admin-ui run test || echo "TODO: wire tests"

Scope: 3 of 10 workspace projects
apps/admin-api test$ jest
apps/web test$ vitest
apps/web test: [1m[46m RUN [49m[22m [36mv4.0.9 [39m[90m/home/mint/slimy-dev/slimy-monorepo/apps/web[39m
apps/admin-api test: {"level":"ERROR","time":"2025-11-22T00:05:32.460Z","pid":14007,"hostname":"mint","service":"slimy-admin-api","version":"dev","env":"test","hostname":"mint","pid":14007,"msg":"Configuration validation failed:"}
apps/admin-api test: FAIL src/routes/stats-tracker.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     ConfigurationError: Configuration validation failed:
apps/admin-api test:     DISCORD_CLIENT_ID is required
apps/admin-api test:     DISCORD_CLIENT_SECRET is required
apps/admin-api test:     SESSION_SECRET is required
apps/admin-api test:     JWT_SECRET or SESSION_SECRET is required
apps/admin-api test:     DATABASE_URL is required
apps/admin-api test:       100 |   if (errors.length > 0) {
apps/admin-api test:       101 |     logger.error('Configuration validation failed:', { errors });
apps/admin-api test:     > 102 |     throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`);
apps/admin-api test:           |           ^
apps/admin-api test:       103 |   }
apps/admin-api test:       104 |
apps/admin-api test:       105 |   logger.info('Configuration validated successfully');
apps/admin-api test:       at validateConfig (src/lib/config/index.js:102:11)
apps/admin-api test:       at validateConfig (src/lib/config/index.js:227:10)
apps/admin-api test:       at Object.loadConfig (src/lib/config/index.js:231:16)
apps/admin-api test:       at Object.require (src/lib/database.js:3:16)
apps/admin-api test:       at Object.require (lib/session-store.js:3:18)
apps/admin-api test:       at Object.require (src/routes/auth.js:6:52)
apps/admin-api test:       at Object.require (src/routes/index.js:5:20)
apps/admin-api test:       at Object.require (src/app.js:8:16)
apps/admin-api test:       at Object.require (src/routes/stats-tracker.test.js:4:13)
apps/admin-api test: FAIL src/routes/chat.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     ConfigurationError: Configuration validation failed:
apps/admin-api test:     DISCORD_CLIENT_ID is required
apps/admin-api test:     DISCORD_CLIENT_SECRET is required
apps/admin-api test:     SESSION_SECRET is required
apps/admin-api test:     JWT_SECRET or SESSION_SECRET is required
apps/admin-api test:     DATABASE_URL is required
apps/admin-api test:       100 |   if (errors.length > 0) {
apps/admin-api test:       101 |     logger.error('Configuration validation failed:', { errors });
apps/admin-api test:     > 102 |     throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`);
apps/admin-api test:           |           ^
apps/admin-api test:       103 |   }
apps/admin-api test:       104 |
apps/admin-api test:       105 |   logger.info('Configuration validated successfully');
apps/admin-api test:       at validateConfig (src/lib/config/index.js:102:11)
apps/admin-api test:       at validateConfig (src/lib/config/index.js:227:10)
apps/admin-api test:       at Object.loadConfig (src/lib/config/index.js:231:16)
apps/admin-api test:       at Object.require (src/lib/database.js:3:16)
apps/admin-api test:       at Object.require (lib/session-store.js:3:18)
apps/admin-api test:       at Object.require (src/routes/auth.js:6:52)
apps/admin-api test:       at Object.require (src/routes/index.js:5:20)
apps/admin-api test:       at Object.require (src/app.js:8:16)
apps/admin-api test:       at Object.require (src/routes/chat.test.js:4:13)
apps/admin-api test: {"level":"ERROR","time":"2025-11-22T00:05:32.684Z","pid":14014,"hostname":"mint","service":"slimy-admin-api","version":"dev","env":"test","hostname":"mint","pid":14014,"msg":"Configuration validation failed:"}
apps/admin-api test: {"level":"ERROR","time":"2025-11-22T00:05:32.693Z","pid":14033,"hostname":"mint","service":"slimy-admin-api","version":"dev","env":"test","hostname":"mint","pid":14033,"msg":"Configuration validation failed:"}
apps/admin-api test: FAIL tests/diag.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     ConfigurationError: Configuration validation failed:
apps/admin-api test:     DISCORD_CLIENT_ID must be a valid Discord application ID (numeric)
apps/admin-api test:     SESSION_SECRET must be at least 32 characters long
apps/admin-api test:     JWT_SECRET (or SESSION_SECRET if JWT_SECRET not set) must be at least 32 characters long
apps/admin-api test:     DATABASE_URL is required
apps/admin-api test:       100 |   if (errors.length > 0) {
apps/admin-api test:       101 |     logger.error('Configuration validation failed:', { errors });
apps/admin-api test:     > 102 |     throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`);
apps/admin-api test:           |           ^
apps/admin-api test:       103 |   }
apps/admin-api test:       104 |
apps/admin-api test:       105 |   logger.info('Configuration validated successfully');
apps/admin-api test:       at validateConfig (src/lib/config/index.js:102:11)
apps/admin-api test:       at validateConfig (src/lib/config/index.js:227:10)
apps/admin-api test:       at Object.loadConfig (src/lib/config/index.js:231:16)
apps/admin-api test:       at Object.require (src/lib/database.js:3:16)
apps/admin-api test:       at Object.require (lib/session-store.js:3:18)
apps/admin-api test:       at Object.require (src/routes/auth.js:6:52)
apps/admin-api test:       at Object.require (src/routes/index.js:5:20)
apps/admin-api test:       at Object.require (src/app.js:8:16)
apps/admin-api test:       at Object.require (tests/diag.test.js:9:13)
apps/admin-api test: FAIL tests/api/auth-routes.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     ConfigurationError: Configuration validation failed:
apps/admin-api test:     DISCORD_CLIENT_ID is required
apps/admin-api test:     DISCORD_CLIENT_SECRET is required
apps/admin-api test:     SESSION_SECRET is required
apps/admin-api test:     JWT_SECRET or SESSION_SECRET is required
apps/admin-api test:     DATABASE_URL is required
apps/admin-api test:       100 |   if (errors.length > 0) {
apps/admin-api test:       101 |     logger.error('Configuration validation failed:', { errors });
apps/admin-api test:     > 102 |     throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`);
apps/admin-api test:           |           ^
apps/admin-api test:       103 |   }
apps/admin-api test:       104 |
apps/admin-api test:       105 |   logger.info('Configuration validated successfully');
apps/admin-api test:       at validateConfig (src/lib/config/index.js:102:11)
apps/admin-api test:       at validateConfig (src/lib/config/index.js:227:10)
apps/admin-api test:       at Object.loadConfig (src/lib/config/index.js:231:16)
apps/admin-api test:       at Object.require (src/lib/database.js:3:16)
apps/admin-api test:       at Object.require (lib/session-store.js:3:18)
apps/admin-api test:       at Object.require (src/routes/auth.js:6:52)
apps/admin-api test:       at Object.require (src/routes/index.js:5:20)
apps/admin-api test:       at Object.require (src/app.js:8:16)
apps/admin-api test:       at Object.require (tests/api/auth-routes.test.js:2:13)
apps/admin-api test: {"level":"ERROR","time":"2025-11-22T00:05:32.957Z","pid":14027,"hostname":"mint","service":"slimy-admin-api","version":"dev","env":"test","hostname":"mint","pid":14027,"msg":"Configuration validation failed:"}
apps/admin-api test: {"level":"ERROR","time":"2025-11-22T00:05:33.011Z","pid":14039,"hostname":"mint","service":"slimy-admin-api","version":"dev","env":"test","hostname":"mint","pid":14039,"msg":"Configuration validation failed:"}
apps/admin-api test: {"level":"ERROR","time":"2025-11-22T00:05:33.012Z","pid":14006,"hostname":"mint","service":"slimy-admin-api","version":"dev","env":"test","hostname":"mint","pid":14006,"msg":"Configuration validation failed:"}
apps/admin-api test: FAIL tests/auth-and-guilds.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     ConfigurationError: Configuration validation failed:
apps/admin-api test:     DISCORD_CLIENT_ID must be a valid Discord application ID (numeric)
apps/admin-api test:     SESSION_SECRET must be at least 32 characters long
apps/admin-api test:     JWT_SECRET (or SESSION_SECRET if JWT_SECRET not set) must be at least 32 characters long
apps/admin-api test:     DATABASE_URL is required
apps/admin-api test:       100 |   if (errors.length > 0) {
apps/admin-api test:       101 |     logger.error('Configuration validation failed:', { errors });
apps/admin-api test:     > 102 |     throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`);
apps/admin-api test:           |           ^
apps/admin-api test:       103 |   }
apps/admin-api test:       104 |
apps/admin-api test:       105 |   logger.info('Configuration validated successfully');
apps/admin-api test:       at validateConfig (src/lib/config/index.js:102:11)
apps/admin-api test:       at validateConfig (src/lib/config/index.js:227:10)
apps/admin-api test:       at Object.loadConfig (src/lib/config/index.js:231:16)
apps/admin-api test:       at Object.require (src/lib/database.js:3:16)
apps/admin-api test:       at Object.require (lib/session-store.js:3:18)
apps/admin-api test:       at Object.require (src/routes/auth.js:6:52)
apps/admin-api test:       at Object.require (src/routes/index.js:5:20)
apps/admin-api test:       at Object.require (src/app.js:8:16)
apps/admin-api test:       at Object.require (tests/auth-and-guilds.test.js:10:13)
apps/admin-api test: FAIL tests/auth/auth-middleware.test.js
apps/admin-api test:   ● Console
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:     console.info
apps/admin-api test:       [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
apps/admin-api test:       at info (src/middleware/auth.js:9:13)
apps/admin-api test:   ● Auth Middleware › resolveUser › should return hydrated user when session exists
apps/admin-api test:     expect(received).toEqual(expected) // deep equality
apps/admin-api test:     Expected: {"avatar": null, "globalName": Any<String>, "guilds": Any<Array>, "id": Any<String>, "role": Any<String>, "username": Any<String>}
apps/admin-api test:     Received: null
apps/admin-api test:       42 |
apps/admin-api test:       43 |       const result = resolveUser(mockReq);
apps/admin-api test:     > 44 |       expect(result).toEqual({
apps/admin-api test:          |                      ^
apps/admin-api test:       45 |         id: expect.any(String),
apps/admin-api test:       46 |         username: expect.any(String),
apps/admin-api test:       47 |         globalName: expect.any(String),
apps/admin-api test:       at Object.toEqual (tests/auth/auth-middleware.test.js:44:22)
apps/admin-api test:   ● Auth Middleware › resolveUser › should return fallback user when no session exists
apps/admin-api test:     ConfigurationError: Configuration validation failed:
apps/admin-api test:     DISCORD_CLIENT_ID is required
apps/admin-api test:     DISCORD_CLIENT_SECRET is required
apps/admin-api test:     SESSION_SECRET is required
apps/admin-api test:     JWT_SECRET or SESSION_SECRET is required
apps/admin-api test:     DATABASE_URL is required
apps/admin-api test:       100 |   if (errors.length > 0) {
apps/admin-api test:       101 |     logger.error('Configuration validation failed:', { errors });
apps/admin-api test:     > 102 |     throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`);
apps/admin-api test:           |           ^
apps/admin-api test:       103 |   }
apps/admin-api test:       104 |
apps/admin-api test:       105 |   logger.info('Configuration validated successfully');
apps/admin-api test:       at validateConfig (src/lib/config/index.js:102:11)
apps/admin-api test:       at validateConfig (src/lib/config/index.js:227:10)
apps/admin-api test:       at Object.loadConfig (src/lib/config/index.js:231:16)
apps/admin-api test:       at Object.require (src/lib/database.js:3:16)
apps/admin-api test:       at Object.require (lib/session-store.js:3:18)
apps/admin-api test:       at Object.require (tests/auth/auth-middleware.test.js:61:34)
apps/admin-api test:   ● Auth Middleware › requireAuth › should call next when user is authenticated
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalled()
apps/admin-api test:     Expected number of calls: >= 1
apps/admin-api test:     Received number of calls:    0
apps/admin-api test:       93 |       requireAuth(mockReq, mockRes, mockNext);
apps/admin-api test:       94 |
apps/admin-api test:     > 95 |       expect(mockNext).toHaveBeenCalled();
apps/admin-api test:          |                        ^
apps/admin-api test:       96 |       expect(mockReq.user).toBeDefined();
apps/admin-api test:       97 |       expect(mockReq.session).toBeDefined();
apps/admin-api test:       98 |     });
apps/admin-api test:       at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:95:24)
apps/admin-api test:   ● Auth Middleware › requireRole › should call next when user has required role (member)
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalled()
apps/admin-api test:     Expected number of calls: >= 1
apps/admin-api test:     Received number of calls:    0
apps/admin-api test:       121 |       requireMemberRole(mockReq, mockRes, mockNext);
apps/admin-api test:       122 |
apps/admin-api test:     > 123 |       expect(mockNext).toHaveBeenCalled();
apps/admin-api test:           |                        ^
apps/admin-api test:       124 |       expect(mockReq.user).toBeDefined();
apps/admin-api test:       125 |     });
apps/admin-api test:       126 |
apps/admin-api test:       at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:123:24)
apps/admin-api test:   ● Auth Middleware › requireRole › should call next when user has higher role than required
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalled()
apps/admin-api test:     Expected number of calls: >= 1
apps/admin-api test:     Received number of calls:    0
apps/admin-api test:       130 |       requireMemberRole(mockReq, mockRes, mockNext);
apps/admin-api test:       131 |
apps/admin-api test:     > 132 |       expect(mockNext).toHaveBeenCalled();
apps/admin-api test:           |                        ^
apps/admin-api test:       133 |     });
apps/admin-api test:       134 |
apps/admin-api test:       135 |     test("should return 403 when user has insufficient role", () => {
apps/admin-api test:       at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:132:24)
apps/admin-api test:   ● Auth Middleware › requireRole › should return 403 when user has insufficient role
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalledWith(...expected)
apps/admin-api test:     Expected: 403
apps/admin-api test:     Received: 401
apps/admin-api test:     Number of calls: 1
apps/admin-api test:       139 |
apps/admin-api test:       140 |       expect(mockNext).not.toHaveBeenCalled();
apps/admin-api test:     > 141 |       expect(mockRes.status).toHaveBeenCalledWith(403);
apps/admin-api test:           |                              ^
apps/admin-api test:       142 |       expect(mockRes.json).toHaveBeenCalledWith({
apps/admin-api test:       143 |         ok: false,
apps/admin-api test:       144 |         code: "FORBIDDEN",
apps/admin-api test:       at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:141:30)
apps/admin-api test:   ● Auth Middleware › requireGuildMember › should call next for admin user regardless of guild membership
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalled()
apps/admin-api test:     Expected number of calls: >= 1
apps/admin-api test:     Received number of calls:    0
apps/admin-api test:       164 |       middleware(mockReq, mockRes, mockNext);
apps/admin-api test:       165 |
apps/admin-api test:     > 166 |       expect(mockNext).toHaveBeenCalled();
apps/admin-api test:           |                        ^
apps/admin-api test:       167 |     });
apps/admin-api test:       168 |
apps/admin-api test:       169 |     test("should call next when user is member of the guild", () => {
apps/admin-api test:       at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:166:24)
apps/admin-api test:   ● Auth Middleware › requireGuildMember › should call next when user is member of the guild
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalled()
apps/admin-api test:     Expected number of calls: >= 1
apps/admin-api test:     Received number of calls:    0
apps/admin-api test:       173 |       middleware(mockReq, mockRes, mockNext);
apps/admin-api test:       174 |
apps/admin-api test:     > 175 |       expect(mockNext).toHaveBeenCalled();
apps/admin-api test:           |                        ^
apps/admin-api test:       176 |     });
apps/admin-api test:       177 |
apps/admin-api test:       178 |     test("should return 403 when user is not member of the guild", () => {
apps/admin-api test:       at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:175:24)
apps/admin-api test:   ● Auth Middleware › requireGuildMember › should return 403 when user is not member of the guild
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalledWith(...expected)
apps/admin-api test:     Expected: 403
apps/admin-api test:     Received: 401
apps/admin-api test:     Number of calls: 1
apps/admin-api test:       183 |
apps/admin-api test:       184 |       expect(mockNext).not.toHaveBeenCalled();
apps/admin-api test:     > 185 |       expect(mockRes.status).toHaveBeenCalledWith(403);
apps/admin-api test:           |                              ^
apps/admin-api test:       186 |       expect(mockRes.json).toHaveBeenCalledWith({
apps/admin-api test:       187 |         ok: false,
apps/admin-api test:       188 |         code: "FORBIDDEN",
apps/admin-api test:       at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:185:30)
apps/admin-api test:   ● Auth Middleware › requireGuildMember › should return 400 when guildId parameter is missing
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalledWith(...expected)
apps/admin-api test:     Expected: 400
apps/admin-api test:     Received: 401
apps/admin-api test:     Number of calls: 1
apps/admin-api test:       197 |
apps/admin-api test:       198 |       expect(mockNext).not.toHaveBeenCalled();
apps/admin-api test:     > 199 |       expect(mockRes.status).toHaveBeenCalledWith(400);
apps/admin-api test:           |                              ^
apps/admin-api test:       200 |       expect(mockRes.json).toHaveBeenCalledWith({
apps/admin-api test:       201 |         ok: false,
apps/admin-api test:       202 |         code: "BAD_REQUEST",
apps/admin-api test:       at Object.toHaveBeenCalledWith (tests/auth/auth-middleware.test.js:199:30)
apps/admin-api test:   ● Auth Middleware › requireGuildMember › should use custom parameter name
apps/admin-api test:     expect(jest.fn()).toHaveBeenCalled()
apps/admin-api test:     Expected number of calls: >= 1
apps/admin-api test:     Received number of calls:    0
apps/admin-api test:       221 |       customMiddleware(mockReq, mockRes, mockNext);
apps/admin-api test:       222 |
apps/admin-api test:     > 223 |       expect(mockNext).toHaveBeenCalled();
apps/admin-api test:           |                        ^
apps/admin-api test:       224 |     });
apps/admin-api test:       225 |   });
apps/admin-api test:       226 | });
apps/admin-api test:       at Object.toHaveBeenCalled (tests/auth/auth-middleware.test.js:223:24)
apps/admin-api test: FAIL src/middleware/auth.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     ConfigurationError: Configuration validation failed:
apps/admin-api test:     DISCORD_CLIENT_ID is required
apps/admin-api test:     DISCORD_CLIENT_SECRET is required
apps/admin-api test:     SESSION_SECRET is required
apps/admin-api test:     JWT_SECRET or SESSION_SECRET is required
apps/admin-api test:     DATABASE_URL is required
apps/admin-api test:       100 |   if (errors.length > 0) {
apps/admin-api test:       101 |     logger.error('Configuration validation failed:', { errors });
apps/admin-api test:     > 102 |     throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`);
apps/admin-api test:           |           ^
apps/admin-api test:       103 |   }
apps/admin-api test:       104 |
apps/admin-api test:       105 |   logger.info('Configuration validated successfully');
apps/admin-api test:       at validateConfig (src/lib/config/index.js:102:11)
apps/admin-api test:       at validateConfig (src/lib/config/index.js:227:10)
apps/admin-api test:       at Object.loadConfig (src/lib/config/index.js:231:16)
apps/admin-api test:       at Object.require (src/lib/database.js:3:16)
apps/admin-api test:       at Object.require (lib/session-store.js:3:18)
apps/admin-api test:       at Object.require (src/routes/auth.js:6:52)
apps/admin-api test:       at Object.require (src/routes/index.js:5:20)
apps/admin-api test:       at Object.require (src/app.js:8:16)
apps/admin-api test:       at Object.require (src/middleware/auth.test.js:4:13)
apps/admin-api test: {"level":"ERROR","time":"2025-11-22T00:05:33.106Z","pid":14020,"hostname":"mint","service":"slimy-admin-api","version":"dev","env":"test","hostname":"mint","pid":14020,"msg":"Configuration validation failed:"}
apps/admin-api test: FAIL src/routes/guilds.test.js
apps/admin-api test:   ● Test suite failed to run
apps/admin-api test:     ConfigurationError: Configuration validation failed:
apps/admin-api test:     DISCORD_CLIENT_ID is required
apps/admin-api test:     DISCORD_CLIENT_SECRET is required
apps/admin-api test:     SESSION_SECRET is required
apps/admin-api test:     JWT_SECRET or SESSION_SECRET is required
apps/admin-api test:     DATABASE_URL is required
apps/admin-api test:       100 |   if (errors.length > 0) {
apps/admin-api test:       101 |     logger.error('Configuration validation failed:', { errors });
apps/admin-api test:     > 102 |     throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`);
apps/admin-api test:           |           ^
apps/admin-api test:       103 |   }
apps/admin-api test:       104 |
apps/admin-api test:       105 |   logger.info('Configuration validated successfully');
apps/admin-api test:       at validateConfig (src/lib/config/index.js:102:11)
apps/admin-api test:       at validateConfig (src/lib/config/index.js:227:10)
apps/admin-api test:       at Object.loadConfig (src/lib/config/index.js:231:16)
apps/admin-api test:       at Object.require (src/lib/database.js:3:16)
apps/admin-api test:       at Object.require (lib/session-store.js:3:18)
apps/admin-api test:       at Object.require (src/routes/auth.js:6:52)
apps/admin-api test:       at Object.require (src/routes/index.js:5:20)
apps/admin-api test:       at Object.require (src/app.js:8:16)
apps/admin-api test:       at Object.require (src/routes/guilds.test.js:4:13)
apps/web test: [90mstdout[2m | tests/unit/codes-cache.test.ts[2m > [22m[2mCodesCache[2m > [22m[2mconnection management[2m > [22m[2mshould connect successfully
apps/web test: [22m[39mRedis cache connected
apps/web test: Redis cache connected
apps/web test: [90mstderr[2m | tests/unit/codes-cache.test.ts[2m > [22m[2mCodesCache[2m > [22m[2mconnection management[2m > [22m[2mshould handle connection failures
apps/web test: [22m[39mFailed to connect to Redis: Error: Connection failed
apps/web test:     at [90m/home/mint/slimy-dev/slimy-monorepo/apps/web/[39mtests/unit/codes-cache.test.ts:88:26
apps/web test:     at file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:157:11
apps/web test:     at file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:753:26
apps/web test:     at file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1636:20
apps/web test:     at new Promise (<anonymous>)
apps/web test:     at runWithTimeout (file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1602:10)
apps/web test:     at runTest (file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1309:12)
apps/web test: [90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
apps/web test:     at runSuite (file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1468:8)
apps/web test:     at runSuite (file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1468:8)
apps/admin-api test: {"level":"ERROR","time":"2025-11-22T00:05:33.216Z","pid":14013,"hostname":"mint","service":"slimy-admin-api","version":"dev","env":"test","hostname":"mint","pid":14013,"msg":"Configuration validation failed:"}
apps/admin-api test: Test Suites: 8 failed, 8 total
apps/admin-api test: Tests:       11 failed, 6 passed, 17 total
apps/admin-api test: Snapshots:   0 total
apps/admin-api test: Time:        2.112 s
apps/admin-api test: Ran all test suites.
apps/web test: [90mstderr[2m | tests/unit/codes-cache.test.ts[2m > [22m[2mCodesCache[2m > [22m[2mcache operations[2m > [22m[2mshould handle cache set failures
apps/web test: [22m[39mCache set attempt 1 failed: Error: Set failed
apps/web test:     at [90m/home/mint/slimy-dev/slimy-monorepo/apps/web/[39mtests/unit/codes-cache.test.ts:143:47
apps/web test:     at file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:157:11
apps/web test:     at file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:753:26
apps/web test:     at file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1636:20
apps/web test:     at new Promise (<anonymous>)
apps/web test:     at runWithTimeout (file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1602:10)
apps/web test:     at runTest (file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1309:12)
apps/web test: [90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
apps/web test:     at runSuite (file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1468:8)
apps/web test:     at runSuite (file:///home/mint/slimy-dev/slimy-monorepo/node_modules/[4m.pnpm[24m/@vitest+runner@4.0.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1468:8)
apps/admin-api test: Failed
/home/mint/slimy-dev/slimy-monorepo/apps/admin-api:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @slimy/admin-api@1.0.0 test: `jest`
Exit status 1
TODO: wire tests after env loading is verified to see if admin-api failures shift from config errors to logic assertions.
- Keep NEXT_PUBLIC_ADMIN_API_BASE aligned with admin-api host/port for web builds/tests.
- Install Docker Compose v2 plugin to enable staging stack scripts.
