# Testing Guide

This document describes the testing setup for the Slimy.ai monorepo and how to run tests.

## Overview

The monorepo uses a comprehensive testing strategy covering:

- **Backend API Tests** - Vitest + Supertest for Express API endpoints
- **Frontend Component Tests** - Vitest + React Testing Library for React components
- **End-to-End Tests** - Playwright for full application testing

## Test Organization

```
slimy-monorepo/
├── tests/                    # Top-level tests folder
│   ├── backend/             # Backend API tests (admin-api)
│   │   ├── health.test.ts   # Health endpoint tests
│   │   └── auth.test.ts     # Authentication tests
│   ├── frontend/            # Frontend component tests
│   │   ├── chat.page.test.tsx      # Chat page component tests
│   │   └── codes.page.test.tsx     # Codes page component tests
│   └── e2e/                 # End-to-end tests
│       └── smoke.spec.ts    # Smoke tests
├── apps/web/tests/          # Web app-specific tests
│   ├── e2e/                 # Playwright E2E tests
│   ├── unit/                # Unit tests
│   ├── api/                 # API route tests
│   └── components/          # Component tests
└── apps/admin-api/          # Admin API (has inline test files)
```

## Running Tests

### All Tests

Run all tests across the monorepo:

```bash
pnpm test
```

### Backend Tests Only

Test backend API endpoints (admin-api):

```bash
pnpm test:backend
```

### Frontend Tests Only

Test frontend React components:

```bash
pnpm test:frontend
```

### Web App Tests

Run the web app's test suite:

```bash
pnpm --filter @slimy/web test
```

### E2E Tests

Run end-to-end tests with Playwright:

```bash
# Install Playwright browsers (first time only)
pnpm playwright:install

# Run E2E tests (requires dev server to be running)
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

**Important:** E2E tests require the web server to be running. Start it in a separate terminal:

```bash
pnpm --filter @slimy/web dev
```

Alternatively, set `E2E_BASE_URL` to point to a running server:

```bash
E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
```

### Watch Mode

Run tests in watch mode (re-runs on file changes):

```bash
pnpm test:watch
```

### Coverage Reports

Generate test coverage reports:

```bash
pnpm test:coverage
```

Coverage reports are generated in the `coverage/` directory.

### Interactive Test UI

Run Vitest with interactive UI:

```bash
pnpm test:ui
```

## Writing New Tests

### Backend API Tests

Create test files in `tests/backend/` with the naming convention `*.test.ts`.

**Example:** `tests/backend/guilds.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Set up environment
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Mock dependencies
vi.mock('../../apps/admin-api/lib/database', () => ({
  isConfigured: () => false,
  initialize: vi.fn(),
  close: vi.fn(),
}));

const app = require('../../apps/admin-api/src/app');

describe('Guilds API', () => {
  it('GET /api/guilds should require authentication', async () => {
    const response = await request(app)
      .get('/api/guilds')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});
```

**Key points:**
- Import the Express app without starting the HTTP server
- Mock environment variables and dependencies
- Use Supertest to make HTTP requests
- Use Vitest's assertion methods

### Frontend Component Tests

Create test files in `tests/frontend/` with the naming convention `*.test.tsx`.

**Example:** `tests/frontend/my-component.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const MyComponent = require('../../apps/web/components/my-component').default;

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

**Key points:**
- Mock Next.js modules (navigation, router, etc.)
- Use React Testing Library for rendering and querying
- Use `@testing-library/user-event` for user interactions
- Use `@testing-library/jest-dom` for enhanced assertions

### E2E Tests

Create test files in `tests/e2e/` with the naming convention `*.spec.ts`.

**Example:** `tests/e2e/user-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should complete user registration', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="submit-btn"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

**Key points:**
- Use Playwright's test runner and assertions
- Test real user flows across multiple pages
- Use `data-testid` attributes for reliable selectors
- Test assumes the dev/prod server is running

## Test Configuration

### Vitest

- **Main config:** `vitest.config.ts` - Root-level Vitest configuration
- **Workspace config:** `vitest.workspace.ts` - Defines backend and frontend test environments
- **Web app config:** `apps/web/vitest.config.ts` - Web app-specific configuration

### Playwright

- **Main config:** `playwright.config.ts` - Root-level Playwright configuration
- **Web app config:** `apps/web/playwright.config.ts` - Web app-specific E2E tests

## Continuous Integration

Tests run automatically on GitHub Actions for:

- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

The CI workflow includes:

1. **Unit & Integration Tests** - Backend and frontend tests
2. **Lint & Build** - Code quality and build verification
3. **E2E Tests** - Playwright tests (marked as optional, won't block merges)

## Best Practices

### General

- **Test file naming:** Use `.test.ts` for unit tests, `.spec.ts` for E2E tests
- **Test organization:** Group related tests in `describe` blocks
- **Assertions:** Use descriptive expect statements
- **Coverage:** Aim for meaningful coverage, not just high percentages

### Backend Tests

- Always mock external dependencies (database, APIs)
- Test both success and error cases
- Test authentication and authorization
- Use environment variables for configuration

### Frontend Tests

- Mock Next.js modules and external dependencies
- Test component rendering and user interactions
- Use `data-testid` for test-specific selectors
- Avoid testing implementation details

### E2E Tests

- Test critical user flows
- Keep tests independent (no shared state)
- Use page objects for complex interactions
- Take screenshots on failure (automatic in CI)

## Debugging Tests

### Vitest

```bash
# Run specific test file
pnpm vitest tests/backend/health.test.ts

# Run tests matching a pattern
pnpm vitest --grep "health endpoint"

# Run in debug mode
pnpm vitest --inspect-brk
```

### Playwright

```bash
# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run specific test file
pnpm test:e2e tests/e2e/smoke.spec.ts

# Debug mode with Playwright Inspector
pnpm test:e2e --debug

# Generate code from browser actions
pnpm playwright codegen http://localhost:3000
```

## Troubleshooting

### "Cannot find module" errors

Make sure dependencies are installed:

```bash
pnpm install
```

### E2E tests timeout

Increase timeout in `playwright.config.ts` or start the dev server manually:

```bash
pnpm --filter @slimy/web dev
```

### Coverage thresholds failing

Check `vitest.config.ts` and adjust thresholds if needed, or add more tests.

### Playwright browser installation

If browsers aren't installed:

```bash
pnpm playwright:install
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/ladjs/supertest)

## Contributing

When adding new features:

1. Write tests for new functionality
2. Ensure all tests pass locally
3. Check test coverage
4. Update this document if adding new test patterns

Questions? Ask in the team chat or create an issue.
