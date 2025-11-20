# Admin Authentication Diagnostics Guide

**Last Updated**: 2025-11-19
**Related**: `docs/admin-auth-flow.md`, `tools/admin-auth/`

## Table of Contents

1. [Overview](#overview)
2. [Diagnostic Script Usage](#diagnostic-script-usage)
3. [Example Output](#example-output)
4. [Interpreting Results](#interpreting-results)
5. [Common Issues & Fixes](#common-issues--fixes)
6. [Integration Options](#integration-options)
7. [Advanced Usage](#advanced-usage)

---

## Overview

The admin authentication diagnostics toolkit provides automated health checks for the Discord OAuth flow, session management, and API endpoints.

**Location**: `tools/admin-auth/`

**Key Files**:
- `inspect-auth-flow.ts` - Main diagnostic script
- `package.json` - Dependencies and npm scripts
- `.env.example` - Configuration template
- `README.md` - Quick reference

**What It Does**:
- Tests API reachability and response times
- Validates OAuth endpoint configuration
- Checks authentication requirements
- Verifies CORS and security headers
- Reports environment variable status
- Provides actionable recommendations

**What It Doesn't Do**:
- Does NOT require authentication (tests external endpoints)
- Does NOT modify any data
- Does NOT import or affect existing code
- Does NOT require deployment to use

---

## Diagnostic Script Usage

### Installation

```bash
# Navigate to the diagnostics directory
cd tools/admin-auth

# Install dependencies
npm install
```

**Dependencies**:
- `tsx` - TypeScript execution engine
- `@types/node` - Node.js type definitions
- `typescript` - TypeScript compiler

---

### Running the Script

**Local Development**:
```bash
npm run inspect:local
# Tests http://localhost:3080
```

**Production**:
```bash
npm run inspect:prod
# Tests https://admin-api.slimyai.xyz
```

**Staging**:
```bash
npm run inspect:staging
# Tests https://admin-api-staging.slimyai.xyz
```

**Custom URL**:
```bash
ADMIN_API_BASE=https://custom.example.com npm run inspect
```

**With Custom Timeout**:
```bash
ADMIN_API_BASE=https://slow-server.com TEST_TIMEOUT=10000 npm run inspect
```

**Disable Colors** (for logging to file):
```bash
NO_COLOR=1 npm run inspect > diagnostics.log
```

---

### Configuration

Create a `.env` file (copy from `.env.example`):

```bash
cd tools/admin-auth
cp .env.example .env
```

**Available Options**:

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_API_BASE` | Target API URL | `http://localhost:3080` |
| `TEST_TIMEOUT` | Timeout per test (ms) | `5000` |
| `NO_COLOR` | Disable colored output | `0` (colors enabled) |

**Example `.env`**:
```bash
ADMIN_API_BASE=http://localhost:3080
TEST_TIMEOUT=5000
```

---

## Example Output

### Successful Run

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
ℹ ROLE_ADMIN_IDS: role***123
ℹ ROLE_CLUB_IDS: role***456
ℹ COOKIE_DOMAIN: .slimyai.xyz
ℹ CORS_ORIGIN: https://admin.slimyai.xyz

═══ Endpoint Tests ═══

✓ API Reachability: API is reachable (requires auth)
  {
    "status": 401,
    "note": "Endpoint exists but requires authentication"
  }
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
  {
    "status": 401,
    "note": "This is correct behavior - endpoint is protected"
  }
  (45ms)

✓ Diagnostics Endpoint: Diag endpoint requires authentication
  {
    "status": 401,
    "note": "Endpoint is protected - login required"
  }
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

---

### Failed Run (API Down)

```
╔════════════════════════════════════════════════════════════╗
║  Slimy Admin Authentication Flow Inspector                ║
╚════════════════════════════════════════════════════════════╝

ℹ Target API: http://localhost:3080
ℹ Timeout: 5000ms

═══ Environment Variables ═══

Required Variables:
✗ DISCORD_CLIENT_ID: NOT SET
✗ DISCORD_CLIENT_SECRET: NOT SET
✗ DISCORD_REDIRECT_URI: NOT SET
✗ SESSION_SECRET: NOT SET
✗ DATABASE_URL: NOT SET

⚠ 5 required variable(s) missing - auth may not work

═══ Endpoint Tests ═══

✗ API Reachability: Cannot reach API: connect ECONNREFUSED 127.0.0.1:3080
  {
    "error": "Error: connect ECONNREFUSED 127.0.0.1:3080"
  }
  (12ms)

✗ Login Endpoint: Login endpoint error: connect ECONNREFUSED 127.0.0.1:3080
  {
    "error": "Error: connect ECONNREFUSED 127.0.0.1:3080"
  }
  (8ms)

✗ Auth Me Endpoint: Auth me endpoint error: connect ECONNREFUSED 127.0.0.1:3080
  {
    "error": "Error: connect ECONNREFUSED 127.0.0.1:3080"
  }
  (7ms)

... (more failures) ...

═══ Summary ═══

⚠ 0/7 tests passed

ℹ Review failures above for troubleshooting

═══ Recommendations ═══

  ⚠ Set missing required environment variables
  🔒 Configure specific CORS_ORIGIN instead of wildcard

═══ Next Steps ═══

  1. Review docs/admin-auth-flow.md for complete flow documentation
  2. Check apps/admin-api logs for detailed error messages
  3. Test OAuth flow manually: visit /api/auth/login
  4. See docs/admin-auth-diagnostics.md for integration options
```

---

## Interpreting Results

### Test Results

Each test reports:
- **✓ Success**: Test passed as expected
- **✗ Failure**: Test failed, review details
- **⚠ Warning**: Test passed but with concerns
- **Duration**: Time taken in milliseconds

---

### API Reachability

**✓ Passed**:
```
✓ API Reachability: API is reachable (requires auth)
  { "status": 401 }
```
- API is running and responding
- Authentication middleware is working (returns 401 for unauthenticated requests)

**✗ Failed**:
```
✗ API Reachability: Cannot reach API: connect ECONNREFUSED
```
- API is not running
- Wrong URL configured
- Network/firewall issue

**Action**: Start the admin-api server or verify `ADMIN_API_BASE` URL

---

### Login Endpoint

**✓ Passed**:
```
✓ Login Endpoint: Login endpoint redirects to Discord OAuth
  {
    "status": 302,
    "hasClientId": true,
    "hasRedirectUri": true,
    "hasScope": true,
    "hasState": true
  }
```
- OAuth flow is configured correctly
- All required parameters are present

**✗ Failed**:
```
✗ Login Endpoint: Login redirects but not to Discord
```
- `DISCORD_CLIENT_ID` or `DISCORD_REDIRECT_URI` misconfigured
- Check `apps/admin-api/src/config.js`

**Action**: Verify Discord OAuth configuration in `.env`

---

### Auth Me Endpoint

**✓ Passed (Unauthenticated)**:
```
✓ Auth Me Endpoint: Auth endpoint requires authentication (as expected)
  { "status": 401 }
```
- Endpoint is protected correctly
- This is expected behavior when not logged in

**✓ Passed (Authenticated)**:
```
✓ Auth Me Endpoint: Auth endpoint accessible (with valid session)
  {
    "status": 200,
    "hasUser": true,
    "role": "admin",
    "guildCount": 3
  }
```
- Authentication is working
- Session is valid
- User data is being returned

**✗ Failed**:
```
✗ Auth Me Endpoint: Unexpected response: 500
```
- Server error (check logs)
- Database connection issue
- JWT verification failed

**Action**: Check `apps/admin-api` logs for errors

---

### Diagnostics Endpoint

**✓ Passed (Protected)**:
```
✓ Diagnostics Endpoint: Diag endpoint requires authentication
  { "status": 401 }
```
- Endpoint exists and is protected (expected)

**✓ Passed (Authenticated)**:
```
✓ Diagnostics Endpoint: Diagnostics endpoint accessible
  {
    "status": 200,
    "uptimeSec": 12345,
    "memory": { "rssMb": 150, "heapUsedMb": 80 },
    "nodeVersion": "v20.10.0"
  }
```
- Diagnostics endpoint is working
- Server health looks good

---

### CORS Headers

**✓ Passed**:
```
✓ CORS Headers: CORS configured: https://admin.slimyai.xyz
  {
    "allowOrigin": "https://admin.slimyai.xyz",
    "allowCredentials": "true",
    "note": "Specific origin configured (good)"
  }
```
- CORS is properly configured for specific origin
- Credentials are allowed (required for cookies)

**⚠ Warning**:
```
✓ CORS Headers: CORS configured: *
  {
    "allowOrigin": "*",
    "note": "Warning: Wildcard CORS is insecure for production"
  }
```
- CORS allows all origins (development only)
- Should be restricted in production

**Action**: Set `CORS_ORIGIN` to specific URL in production

**✗ Failed**:
```
✗ CORS Headers: CORS headers not present
```
- CORS middleware not configured
- Frontend requests will fail from different origin

**Action**: Add CORS middleware in `apps/admin-api/src/app.js`

---

### Security Headers

**✓ Passed**:
```
✓ Security Headers: 4/4 security headers present
  {
    "x-frame-options": "SAMEORIGIN",
    "x-content-type-options": "nosniff",
    "x-xss-protection": "0",
    "strict-transport-security": "max-age=15552000"
  }
```
- Helmet.js is configured
- Security headers are present
- Good protection against XSS, clickjacking, etc.

**✗ Failed**:
```
✗ Security Headers: No security headers detected
```
- Helmet.js not installed or not configured
- Application is vulnerable to common attacks

**Action**: Add Helmet.js middleware

---

### Environment Variables

**Required Variables**:

Must be set for authentication to work:
- `DISCORD_CLIENT_ID` - Discord OAuth app ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth secret
- `DISCORD_REDIRECT_URI` - OAuth callback URL
- `SESSION_SECRET` - Session signing key
- `DATABASE_URL` - PostgreSQL connection string

**Optional Variables**:

Recommended for full functionality:
- `DISCORD_BOT_TOKEN` - For accurate role resolution
- `JWT_SECRET` - Falls back to `SESSION_SECRET`
- `ROLE_ADMIN_IDS` - Discord role IDs for admin access
- `ROLE_CLUB_IDS` - Discord role IDs for club access
- `COOKIE_DOMAIN` - For subdomain support
- `CORS_ORIGIN` - Restrict CORS to specific origin

**Secrets are Masked**:
```
✓ DISCORD_CLIENT_SECRET: abc1***xyz9
✓ SESSION_SECRET: (set)
```
- Only first/last 4 characters shown
- Full values never logged

---

## Common Issues & Fixes

### Issue: All Tests Fail with ECONNREFUSED

**Symptom**:
```
✗ API Reachability: Cannot reach API: connect ECONNREFUSED
```

**Cause**: Admin API is not running

**Fix**:
```bash
# Start the admin API
cd apps/admin-api
npm run dev
# Or in production
npm start
```

---

### Issue: Login Redirects to Wrong URL

**Symptom**:
```
✗ Login Endpoint: Login redirects but not to Discord
```

**Cause**: `DISCORD_REDIRECT_URI` doesn't match Discord app config

**Fix**:
1. Check Discord app settings: https://discord.com/developers/applications
2. OAuth2 → Redirects → Add your callback URL
3. Update `apps/admin-api/.env`:
   ```bash
   DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback
   ```
4. Restart admin-api

---

### Issue: Missing Environment Variables

**Symptom**:
```
✗ DISCORD_CLIENT_ID: NOT SET
⚠ 5 required variable(s) missing
```

**Cause**: `.env` file not configured

**Fix**:
```bash
cd apps/admin-api
cp .env.example .env
# Edit .env and add values
nano .env
```

**Required Values**:
```bash
DISCORD_CLIENT_ID=1234567890
DISCORD_CLIENT_SECRET=abc123xyz...
DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback
SESSION_SECRET=random_32_plus_character_secret_key
DATABASE_URL=postgresql://user:pass@localhost:5432/slimy
```

---

### Issue: Wildcard CORS Warning

**Symptom**:
```
⚠ CORS configured: *
Warning: Wildcard CORS is insecure for production
```

**Cause**: `CORS_ORIGIN` not set or set to `*`

**Fix**:
```bash
# In apps/admin-api/.env
CORS_ORIGIN=https://admin.slimyai.xyz
```

---

### Issue: No Security Headers

**Symptom**:
```
✗ Security Headers: No security headers detected
```

**Cause**: Helmet.js not configured

**Fix**:
```bash
# Install Helmet (if not already installed)
cd apps/admin-api
npm install helmet

# Verify it's used in apps/admin-api/src/app.js
# Should see: app.use(helmet())
```

---

## Integration Options

The diagnostic script is **standalone** and doesn't affect existing code. Here are ways you can integrate it when ready:

### Option 1: CI/CD Health Check

Add to your CI/CD pipeline to validate deployments:

**GitHub Actions Example**:
```yaml
# .github/workflows/admin-auth-check.yml
name: Admin Auth Health Check

on:
  push:
    branches: [main, staging]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: tools/admin-auth
        run: npm install

      - name: Run diagnostics
        working-directory: tools/admin-auth
        env:
          ADMIN_API_BASE: https://admin-api.slimyai.xyz
          TEST_TIMEOUT: 10000
        run: npm run inspect
```

---

### Option 2: Admin UI Diagnostics Page

Create a page in `admin-ui` that displays diagnostics:

**Proposed File**: `apps/admin-ui/pages/admin/diagnostics.js`

```javascript
// This is a PROPOSAL - not implemented yet
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function DiagnosticsPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // Create a new endpoint that runs the diagnostics
      const data = await apiFetch('/api/admin/diagnostics');
      setResults(data);
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diagnostics-page">
      <h1>Authentication Diagnostics</h1>
      <button onClick={runDiagnostics} disabled={loading}>
        {loading ? 'Running...' : 'Run Diagnostics'}
      </button>

      {results && (
        <pre>{JSON.stringify(results, null, 2)}</pre>
      )}
    </div>
  );
}
```

**Backend Endpoint** (proposal): `apps/admin-api/src/routes/admin.js`

```javascript
// Import the diagnostic script (would need to be adapted)
router.get('/admin/diagnostics', requireAuth, requireRole('admin'), async (req, res) => {
  // Run diagnostics and return results
  // This would need to import/adapt the inspect-auth-flow.ts logic
  const results = await runDiagnostics();
  res.json(results);
});
```

---

### Option 3: Scheduled Monitoring

Run diagnostics on a schedule and send alerts:

**Cron Job Example**:
```bash
# Add to crontab
# Run every hour and email results if failed
0 * * * * cd /path/to/slimy-monorepo/tools/admin-auth && npm run inspect:prod > /tmp/diag.log 2>&1 || mail -s "Auth Diagnostics Failed" admin@slimyai.xyz < /tmp/diag.log
```

**Systemd Timer Example**:
```ini
# /etc/systemd/system/slimy-auth-check.service
[Unit]
Description=Slimy Admin Auth Diagnostics
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/path/to/slimy-monorepo/tools/admin-auth
Environment="ADMIN_API_BASE=https://admin-api.slimyai.xyz"
ExecStart=/usr/bin/npm run inspect
StandardOutput=journal
StandardError=journal
```

```ini
# /etc/systemd/system/slimy-auth-check.timer
[Unit]
Description=Run Slimy Auth Diagnostics Hourly

[Timer]
OnBootSec=5min
OnUnitActiveSec=1h

[Install]
WantedBy=timers.target
```

---

### Option 4: Development CLI Tool

Add npm script to root `package.json` for easy access:

**Root package.json**:
```json
{
  "scripts": {
    "diag:auth": "cd tools/admin-auth && npm run inspect:local",
    "diag:auth:prod": "cd tools/admin-auth && npm run inspect:prod"
  }
}
```

**Usage**:
```bash
# From repo root
npm run diag:auth        # Check local
npm run diag:auth:prod   # Check production
```

---

### Option 5: Docker Health Check

Use in Docker Compose health checks:

**docker-compose.yml**:
```yaml
services:
  admin-api:
    build: ./apps/admin-api
    ports:
      - "3080:3080"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3080/api/diag', (r) => process.exit(r.statusCode === 200 || r.statusCode === 401 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

### Option 6: Monitoring Integration

Send results to monitoring systems:

**Datadog Example**:
```bash
# Run diagnostics and send metrics
RESULT=$(npm run inspect:prod)
if [ $? -eq 0 ]; then
  echo "admin.auth.health:1|g" | nc -u -w1 localhost 8125
else
  echo "admin.auth.health:0|g" | nc -u -w1 localhost 8125
fi
```

**Prometheus Example**:
Create a simple exporter that exposes metrics:
```javascript
// tools/admin-auth/prometheus-exporter.js (proposal)
const express = require('express');
const app = express();

app.get('/metrics', async (req, res) => {
  const results = await runDiagnostics();
  const metrics = [
    `slimy_auth_tests_passed ${results.passed}`,
    `slimy_auth_tests_total ${results.total}`,
    `slimy_auth_api_reachable ${results.apiReachable ? 1 : 0}`,
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

app.listen(9090);
```

---

## Advanced Usage

### Programmatic Usage

Import and use the diagnostic functions in your own scripts:

```typescript
import { runTest, loadConfig } from './inspect-auth-flow';

async function customDiagnostics() {
  const config = loadConfig();

  const result = await runTest('Custom Test', async () => {
    // Your custom test logic
    return {
      passed: true,
      message: 'Custom test passed',
      details: { foo: 'bar' }
    };
  });

  console.log(result);
}
```

---

### Custom Tests

Add your own tests to the script:

```typescript
// Add to inspect-auth-flow.ts
async function testCustomEndpoint(config: Config): Promise<TestResult> {
  return runTest('Custom Endpoint', async () => {
    const response = await fetch(`${config.adminApiBase}/api/custom`, {
      timeout: config.testTimeout,
    });

    return {
      passed: response.status === 200,
      message: `Custom endpoint returned ${response.status}`,
      details: response.json,
    };
  });
}

// Add to tests array in main()
const tests = [
  // ... existing tests
  testCustomEndpoint(config),
];
```

---

### Automated Alerts

Send alerts on failure:

```bash
#!/bin/bash
# tools/admin-auth/run-with-alerts.sh

cd "$(dirname "$0")"

# Run diagnostics
npm run inspect:prod > /tmp/diag-output.txt 2>&1

# Check exit code
if [ $? -ne 0 ]; then
  # Send alert (example: Slack webhook)
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"🚨 Admin auth diagnostics failed\", \"attachments\": [{\"text\": \"$(cat /tmp/diag-output.txt)\"}]}"
fi
```

---

### JSON Output Mode

Modify the script for machine-readable output:

```typescript
// Add to inspect-auth-flow.ts (future enhancement)
if (process.env.OUTPUT_FORMAT === 'json') {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    config: { adminApiBase: config.adminApiBase },
    results: results,
    summary: { passed: passedTests, total: totalTests },
  }, null, 2));
} else {
  // ... existing human-readable output
}
```

**Usage**:
```bash
OUTPUT_FORMAT=json npm run inspect > results.json
```

---

## Next Steps

1. **Review**: See `docs/admin-auth-flow.md` for complete authentication flow
2. **Test**: Run diagnostics against your environment
3. **Monitor**: Set up scheduled checks (cron, CI/CD, etc.)
4. **Integrate**: Choose an integration option above when ready
5. **Customize**: Add environment-specific tests as needed

---

## Troubleshooting the Diagnostic Tool

### Script Won't Run

**Error**: `Cannot find module 'tsx'`

**Fix**:
```bash
cd tools/admin-auth
npm install
```

---

### Timeout Errors

**Error**: `Request timeout` on all tests

**Fix**: Increase timeout
```bash
TEST_TIMEOUT=10000 npm run inspect
```

---

### TypeScript Errors

**Error**: `TS2304: Cannot find name 'require'`

**Fix**: Ensure `tsconfig.json` has correct settings:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true
  }
}
```

---

## Support

- **Documentation**: `docs/admin-auth-flow.md`
- **Source Code**: `tools/admin-auth/inspect-auth-flow.ts`
- **Configuration**: `tools/admin-auth/.env.example`
- **Issues**: Check admin-api logs and environment variables

---

## Related Documentation

- **Authentication Flow**: `docs/admin-auth-flow.md`
- **Admin API Routes**: `apps/admin-api/src/routes/auth.js`
- **Middleware**: `apps/admin-api/src/middleware/auth.js`
- **Session Management**: `apps/admin-api/lib/session-store.js`
