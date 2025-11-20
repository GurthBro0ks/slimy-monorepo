# Admin Authentication Diagnostics

Standalone diagnostic tools for the Slimy admin authentication flow.

## Quick Start

```bash
# Install dependencies
cd tools/admin-auth
npm install

# Run diagnostics against local API
npm run inspect:local

# Run against production
npm run inspect:prod

# Run against staging
npm run inspect:staging

# Custom URL
ADMIN_API_BASE=https://custom.example.com npm run inspect
```

## What This Tool Does

The `inspect-auth-flow.ts` script performs the following checks:

1. **API Reachability** - Verifies the admin API is accessible
2. **Login Endpoint** - Tests `/api/auth/login` redirects to Discord OAuth
3. **Auth Endpoint** - Tests `/api/auth/me` requires authentication
4. **Diagnostics Endpoint** - Tests `/api/diag` is available
5. **Health Check** - Looks for common health endpoints
6. **CORS Headers** - Validates CORS configuration
7. **Security Headers** - Checks for Helmet.js security headers

It also validates environment variable configuration (from `admin-api/.env`).

## Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Available options:

- `ADMIN_API_BASE`: Target API URL (default: `http://localhost:3080`)
- `TEST_TIMEOUT`: Timeout per test in ms (default: `5000`)
- `NO_COLOR`: Set to `1` to disable colored output

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║  Slimy Admin Authentication Flow Inspector                ║
╚════════════════════════════════════════════════════════════╝

ℹ Target API: http://localhost:3080
ℹ Timeout: 5000ms

═══ Environment Variables ═══

Required Variables:
✓ DISCORD_CLIENT_ID: 1234***7890
✓ DISCORD_CLIENT_SECRET: abc1***xyz9
✓ DISCORD_REDIRECT_URI: https://admin.slimyai.xyz/api/auth/callback
✓ SESSION_SECRET: (set)
✓ DATABASE_URL: postgresql://***

Optional Variables:
ℹ DISCORD_BOT_TOKEN: (set)
ℹ JWT_SECRET: (set)
  ROLE_ADMIN_IDS: not set
  ROLE_CLUB_IDS: not set

═══ Endpoint Tests ═══

✓ API Reachability: API is reachable (requires auth)
  { "status": 401, "note": "Endpoint exists but requires authentication" }
  (142ms)

✓ Login Endpoint: Login endpoint redirects to Discord OAuth
  {
    "status": 302,
    "redirectTo": "https://discord.com/oauth2/authorize?client_id=...",
    "hasClientId": true,
    "hasRedirectUri": true,
    "hasScope": true,
    "hasState": true
  }
  (89ms)

✓ Auth Me Endpoint: Auth endpoint requires authentication (as expected)
  { "status": 401, "note": "This is correct behavior - endpoint is protected" }
  (45ms)

✓ Diagnostics Endpoint: Diag endpoint requires authentication
  { "status": 401, "note": "Endpoint is protected - login required" }
  (38ms)

✗ Health/Uptime Check: No standard health endpoint found
  {
    "note": "Tried: /health, /api/health, /ping, /api/ping",
    "suggestion": "Use /api/diag endpoint instead"
  }
  (2015ms)

✓ CORS Headers: CORS configured: https://admin.slimyai.xyz
  {
    "allowOrigin": "https://admin.slimyai.xyz",
    "allowCredentials": "true",
    "note": "Specific origin configured (good)"
  }
  (52ms)

✓ Security Headers: 4/4 security headers present
  {
    "x-frame-options": "SAMEORIGIN",
    "x-content-type-options": "nosniff",
    "x-xss-protection": "0",
    "strict-transport-security": "max-age=15552000; includeSubDomains"
  }
  (41ms)

═══ Summary ═══

⚠ 6/7 tests passed

ℹ Review failures above for troubleshooting

═══ Recommendations ═══

  💡 Set DISCORD_BOT_TOKEN for accurate role resolution

═══ Next Steps ═══

  1. Review docs/admin-auth-flow.md for complete flow documentation
  2. Check apps/admin-api logs for detailed error messages
  3. Test OAuth flow manually: visit /api/auth/login
  4. See docs/admin-auth-diagnostics.md for integration options
```

## Files in This Directory

- `inspect-auth-flow.ts` - Main diagnostic script
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Example environment configuration
- `README.md` - This file

## Integration

This tool is designed to be **standalone and unreferenced**. It will not affect your existing codebase until you choose to integrate it.

Possible integration options (see `docs/admin-auth-diagnostics.md`):

1. Add to CI/CD pipeline for automated health checks
2. Create an admin UI page that runs diagnostics
3. Schedule periodic checks with cron/systemd
4. Use as a CLI tool during development

## Documentation

- **Complete auth flow**: `docs/admin-auth-flow.md`
- **Integration guide**: `docs/admin-auth-diagnostics.md`

## Requirements

- Node.js 18+
- Access to admin-api endpoint (local or remote)

## License

UNLICENSED - Internal Slimy.ai tool
