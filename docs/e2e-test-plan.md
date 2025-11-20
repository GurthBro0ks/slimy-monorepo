# End-to-End Test Plan for Slimy.ai Monorepo

## Overview

This document outlines the comprehensive end-to-end (E2E) testing strategy for the Slimy.ai monorepo, covering critical user workflows across the Web App, Admin UI, and Admin API. These tests validate complete user journeys from browser interactions through backend services.

## Testing Framework

- **Tool**: Playwright (recommended for new tests)
- **Language**: TypeScript
- **Browser Coverage**: Chromium (primary), Firefox and Safari (optional for extended coverage)
- **Test Location**: `/tests/e2e/` (root-level cross-app tests) and `/apps/{app}/tests/e2e/` (app-specific tests)

## Top Priority Test Scenarios

### 1. Admin Login & Authentication Flow

**Priority**: Critical
**Frequency**: Every deployment

**Scenario**:
- User navigates to admin dashboard URL
- System redirects to Discord OAuth login
- User authorizes application with Discord credentials
- System validates OAuth callback and creates session
- User is redirected to admin dashboard with authenticated session
- Dashboard displays user profile and admin controls

**Test Data Assumptions**:
- Valid Discord OAuth credentials (test account)
- Pre-configured OAuth application in Discord Developer Portal
- Test environment has valid `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`
- Database contains test user with admin role

**Success Criteria**:
- OAuth redirect contains correct parameters (`client_id`, `redirect_uri`, `scope`)
- Session cookie is set after successful authentication
- Protected routes become accessible
- User profile data is displayed correctly

---

### 2. Guild/Server List Loading & Display

**Priority**: Critical
**Frequency**: Every deployment

**Scenario**:
- Authenticated admin user navigates to guilds list page
- System fetches guilds from Discord API
- Guilds are displayed with metadata (name, member count, icon)
- User can search/filter guilds
- User can click on a guild to view details
- Guild details page loads with configuration options

**Test Data Assumptions**:
- Test Discord account is a member/admin of at least 3 test guilds
- Guilds have varied configurations (active bot, inactive bot, different settings)
- Database contains guild records synchronized with Discord

**Success Criteria**:
- Guilds list loads within 3 seconds
- All test guilds are visible
- Search/filter functionality works correctly
- Guild details page shows accurate information
- Bot status indicators are correct

---

### 3. Snail Tool/Code Upload & Management

**Priority**: High
**Frequency**: Every deployment

**Scenario**:
- Admin user navigates to codes/tools management page
- User uploads a new snail code/tool configuration
- System validates the upload (format, permissions)
- Code appears in the codes list
- User edits code metadata
- User activates/deactivates code
- Code status is reflected in the guild where it's deployed

**Test Data Assumptions**:
- Valid snail code JSON/configuration file available
- Test guild configured to accept custom codes
- Database has `codes` table with proper schema
- File upload size limits configured (e.g., 5MB max)

**Success Criteria**:
- Upload form accepts valid files
- Upload form rejects invalid files with clear error messages
- Uploaded code appears in list immediately
- Edit operations persist correctly
- Activation status changes are reflected in real-time

---

### 4. Chat Bot Interaction & Personality Modes

**Priority**: High
**Frequency**: Weekly

**Scenario**:
- User navigates to chat interface
- User selects a personality mode (e.g., "Helpful", "Snarky", "Professional")
- User types a message and sends it
- System processes message through OpenAI API with selected personality
- Bot response is displayed with appropriate tone
- User switches personality mid-conversation
- Response tone adjusts accordingly

**Test Data Assumptions**:
- OpenAI API key configured (or mock endpoint for testing)
- Personality configurations defined in database/config
- Chat history is stored and retrievable
- Rate limiting is properly configured

**Success Criteria**:
- Chat interface loads within 2 seconds
- Message submission shows loading state
- Bot response appears within 10 seconds
- Personality mode changes are applied to subsequent messages
- Chat history persists across page reloads

---

### 5. Club/Analytics Dashboard Loading

**Priority**: High
**Frequency**: Every deployment

**Scenario**:
- Authenticated user with club role navigates to analytics dashboard
- System fetches analytics data (guild activity, user engagement, bot usage)
- Charts and graphs render with correct data
- User applies date range filter
- Dashboard updates with filtered data
- User exports analytics report

**Test Data Assumptions**:
- Database contains at least 30 days of test analytics data
- Test user has `club` or `admin` role
- Chart.js library properly initialized
- Analytics endpoints return consistent schema

**Success Criteria**:
- Dashboard loads within 5 seconds
- All charts render without errors
- Data matches expected values from seeded test data
- Date filters work correctly
- Export functionality generates valid file (CSV/PDF)

---

### 6. Code Redemption Flow (End-User)

**Priority**: Medium
**Frequency**: Weekly

**Scenario**:
- End user visits public code redemption page
- User enters a valid snail code
- System validates code (not expired, not already redeemed)
- Code is marked as redeemed in database
- User sees success confirmation
- User's Discord account is credited (if applicable)

**Test Data Assumptions**:
- Database seeded with valid, unexpired codes
- Database seeded with expired codes for negative testing
- Discord bot connected and can process redemptions
- Rate limiting configured to prevent abuse

**Success Criteria**:
- Valid codes are accepted
- Expired codes show appropriate error
- Already-redeemed codes show appropriate error
- Success page displays confirmation
- Database redemption record is created

---

### 7. Guild Settings Configuration

**Priority**: Medium
**Frequency**: Weekly

**Scenario**:
- Admin navigates to guild settings page
- User modifies bot prefix, welcome message, auto-role settings
- User saves configuration
- Settings are persisted to database
- User navigates away and returns
- Settings are still applied
- Changes are reflected in Discord bot behavior

**Test Data Assumptions**:
- Test guild exists in database
- User has admin permissions for test guild
- Settings schema is well-defined
- Bot service can read updated settings

**Success Criteria**:
- Settings form loads with current values
- Form validation works (e.g., prefix length limits)
- Save operation shows success confirmation
- Settings persist across sessions
- Bot behavior updates within 60 seconds

---

### 8. User Role & Permission Management

**Priority**: Medium
**Frequency**: Bi-weekly

**Scenario**:
- Super admin navigates to user management page
- Admin searches for a user by Discord ID or username
- Admin updates user role (member → admin, admin → club)
- Role change is saved to database
- User's permissions are immediately updated
- User sees new interface elements based on new role

**Test Data Assumptions**:
- Database contains test users with various roles
- Role-based access control (RBAC) properly implemented
- Session middleware checks permissions on each request

**Success Criteria**:
- User search works correctly
- Role dropdown shows available roles
- Role changes are persisted
- User interface updates without requiring re-login
- Unauthorized users cannot access role management

---

### 9. API Health & Monitoring Dashboard

**Priority**: Low
**Frequency**: Monthly

**Scenario**:
- Admin navigates to monitoring dashboard
- System displays API health metrics (uptime, response times, error rates)
- Prometheus/Grafana metrics are visualized
- Admin can view recent errors and logs
- Admin can filter by time range and service

**Test Data Assumptions**:
- Prometheus scraping configured
- Mock metrics available for testing
- Grafana dashboard templates exist

**Success Criteria**:
- Dashboard loads within 5 seconds
- Metrics display accurate data
- Time range filters work correctly
- No errors in console

---

### 10. Error Handling & Edge Cases

**Priority**: High
**Frequency**: Every deployment

**Scenario**:
- Test various error conditions:
  - Network failures during API calls
  - Session expiration mid-operation
  - Invalid form inputs
  - Missing permissions
  - Database connection failures
- Verify graceful degradation
- Verify user-friendly error messages
- Verify error logging/monitoring

**Test Data Assumptions**:
- Mock endpoints configured to simulate errors
- Error boundaries implemented in React components

**Success Criteria**:
- No uncaught exceptions
- User sees helpful error messages
- Errors are logged to monitoring system
- User can recover from errors (e.g., retry button)

---

## Test Data Management

### Database Seeding

Before running E2E tests, seed the database with:

1. **Users**:
   - `test-admin@example.com` (role: `admin`)
   - `test-club@example.com` (role: `club`)
   - `test-member@example.com` (role: `member`)

2. **Guilds**:
   - 3 test Discord guilds with varied configurations
   - Guild IDs should match actual Discord test server IDs

3. **Codes**:
   - 10 active codes
   - 5 expired codes
   - 5 redeemed codes

4. **Chat History**:
   - Sample conversations for each personality mode

5. **Analytics Data**:
   - 30 days of synthetic activity data

### Seeding Script

```bash
# Run from repository root
pnpm run db:seed:e2e
```

---

## Environment Configuration

### Running Against Staging

**Staging URL**: `https://staging.slimy.ai`

```bash
# Set environment variables
export E2E_BASE_URL=https://staging.slimy.ai
export E2E_ADMIN_API_URL=https://staging.slimy.ai/admin-api
export E2E_DISCORD_TEST_USER=test-user@example.com
export E2E_DISCORD_TEST_PASS=<secure-password>

# Run tests
pnpm run test:e2e --headed
```

**Safety Considerations**:
- Use dedicated test Discord accounts, not production accounts
- Staging database is isolated from production
- Test guilds are clearly labeled `[TEST]` in Discord
- Rate limiting is relaxed in staging

---

### Running Against Production (READ-ONLY)

**Production URL**: `https://slimy.ai`

⚠️ **WARNING**: Production tests should be **READ-ONLY** and **non-destructive**.

```bash
# Set environment variables
export E2E_BASE_URL=https://slimy.ai
export E2E_READ_ONLY=true
export E2E_ADMIN_API_URL=https://slimy.ai/admin-api

# Run read-only smoke tests
pnpm run test:e2e:smoke
```

**Production Test Guidelines**:
- ✅ **Allowed**: Login flow, navigation, dashboard loading, read-only API calls
- ❌ **Prohibited**: Creating/updating/deleting data, uploading files, changing settings
- ⚠️ **Required**: `E2E_READ_ONLY=true` environment variable check in tests
- 🔒 **Access**: Use read-only test account with minimal permissions

**Example Read-Only Test**:
```typescript
test.describe('Production Smoke Tests', () => {
  test.skip(!process.env.E2E_READ_ONLY, 'Skipping write operation in read-only mode');

  test('should load admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

---

## Running Tests Locally

### Prerequisites

```bash
# Install dependencies
pnpm install

# Build applications
pnpm run build

# Start services (in separate terminals)
pnpm --filter @slimy/web dev          # http://localhost:3000
pnpm --filter @slimy/admin-api dev    # http://localhost:3080
pnpm --filter @slimy/admin-ui dev     # http://localhost:3081
```

### Running E2E Tests

```bash
# Run all E2E tests (headless)
pnpm run test:e2e

# Run with browser UI (headed mode)
pnpm run test:e2e --headed

# Run specific test file
pnpm run test:e2e tests/e2e/example-admin-login.spec.ts

# Run in debug mode
pnpm run test:e2e --debug

# Update snapshots
pnpm run test:e2e --update-snapshots
```

### Playwright UI Mode

```bash
# Interactive test runner
pnpm exec playwright test --ui

# View last test report
pnpm exec playwright show-report
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Seed test database
        run: pnpm run db:seed:e2e

      - name: Run E2E tests
        run: pnpm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Execution Timeline

| Frequency | Trigger | Test Scope |
|-----------|---------|------------|
| Every commit | Push to feature branch | Smoke tests (scenarios 1, 2, 5) |
| Every PR | Pull request opened/updated | Full critical tests (scenarios 1-5) |
| Daily | Scheduled 2 AM UTC | Full suite (all 10 scenarios) |
| Weekly | Scheduled Saturday 6 AM UTC | Extended suite + performance tests |
| Pre-release | Manual trigger | Full suite + production smoke tests |

---

## Performance Benchmarks

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Page Load Time (Dashboard) | < 2s | < 5s |
| API Response Time (p95) | < 500ms | < 2s |
| Chat Bot Response | < 8s | < 15s |
| Guild List Load (100 guilds) | < 3s | < 8s |
| Full Test Suite Duration | < 10 min | < 20 min |

---

## Troubleshooting

### Common Issues

1. **Tests timing out**:
   - Increase timeout in `playwright.config.ts`: `timeout: 30000`
   - Check if services are running
   - Verify network connectivity

2. **Authentication failures**:
   - Ensure Discord OAuth credentials are valid
   - Check session cookie domain matches base URL
   - Verify test user exists in database

3. **Flaky tests**:
   - Add explicit waits: `await page.waitForLoadState('networkidle')`
   - Use `test.retry()` for unstable scenarios
   - Check for race conditions in async operations

4. **Database state issues**:
   - Run `pnpm run db:reset:e2e` before tests
   - Use database transactions that rollback after tests
   - Implement proper test isolation

---

## Future Enhancements

- [ ] Visual regression testing with Percy or Playwright screenshots
- [ ] Performance testing with Lighthouse CI
- [ ] Accessibility testing with axe-core
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Load testing with k6 or Artillery
- [ ] Contract testing for API endpoints
- [ ] Cross-browser testing matrix (Firefox, Safari)
- [ ] Parallel test execution optimization
- [ ] Test data factory using Faker.js

---

## References

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles/)
- [OAuth 2.0 Testing Guide](https://oauth.net/2/)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-19
**Owner**: Engineering Team
**Review Cycle**: Quarterly
