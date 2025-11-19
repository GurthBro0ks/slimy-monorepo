/**
 * Example Playwright Configuration for E2E Tests
 *
 * This is a TEMPLATE configuration file demonstrating how to set up
 * cross-application E2E tests for the Slimy.ai monorepo.
 *
 * USAGE:
 * 1. Copy this file to `playwright.config.ts` in your test directory
 * 2. Update the base URLs to match your environment
 * 3. Configure environment variables in `.env.e2e`
 * 4. Run tests with: `pnpm exec playwright test`
 *
 * IMPORTANT: This is an EXAMPLE file. Do not run directly.
 * Copy and customize for your specific testing needs.
 */

import { defineConfig, devices } from "@playwright/test";

/**
 * Environment variables for E2E testing
 *
 * Create a `.env.e2e` file with these variables:
 *
 * E2E_BASE_URL=http://localhost:3000
 * E2E_ADMIN_API_URL=http://localhost:3080
 * E2E_ADMIN_UI_URL=http://localhost:3081
 * E2E_DISCORD_TEST_USER=test-admin@example.com
 * E2E_DISCORD_TEST_PASS=<your-secure-test-password>
 * E2E_READ_ONLY=false
 */

// Load environment variables from .env.e2e if it exists
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env.e2e' });

/**
 * Base URLs for different services
 *
 * Modify these based on your deployment environment:
 * - Local development: http://localhost:PORT
 * - Staging: https://staging.slimy.ai
 * - Production: https://slimy.ai (READ-ONLY tests only!)
 */
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const ADMIN_API_URL = process.env.E2E_ADMIN_API_URL || "http://localhost:3080";
const ADMIN_UI_URL = process.env.E2E_ADMIN_UI_URL || "http://localhost:3081";

/**
 * Test execution mode
 * - READ_ONLY: true = Only run non-destructive tests (safe for production)
 * - READ_ONLY: false = Run full test suite including write operations
 */
const READ_ONLY_MODE = process.env.E2E_READ_ONLY === "true";

/**
 * Playwright Test Configuration
 *
 * See: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /**
   * Test directory containing .spec.ts files
   */
  testDir: "./",

  /**
   * Run tests in parallel across files
   * Set to false for sequential execution (useful for debugging)
   */
  fullyParallel: true,

  /**
   * Fail the build on CI if you accidentally leave test.only in source
   */
  forbidOnly: !!process.env.CI,

  /**
   * Retry failed tests
   * - CI: 2 retries (for flaky network/timing issues)
   * - Local: 0 retries (fail fast for quick feedback)
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * Number of parallel workers
   * - CI: 1 worker (more stable, less resource intensive)
   * - Local: undefined (uses all CPU cores)
   */
  workers: process.env.CI ? 1 : undefined,

  /**
   * Test reporter configuration
   * - CI: GitHub Actions reporter (integrates with GitHub UI)
   * - Local: HTML reporter (generates visual report)
   */
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "on-failure" }], ["list"]],

  /**
   * Global test timeout (30 seconds)
   * Individual tests can override this with test.setTimeout()
   */
  timeout: 30 * 1000,

  /**
   * Expect timeout (10 seconds)
   * How long to wait for expect() assertions to pass
   */
  expect: {
    timeout: 10 * 1000,
  },

  /**
   * Shared settings for all projects
   */
  use: {
    /**
     * Base URL for page.goto() calls
     * Example: page.goto('/admin') → http://localhost:3000/admin
     */
    baseURL: BASE_URL,

    /**
     * Collect trace on first retry
     * Useful for debugging flaky tests
     */
    trace: "on-first-retry",

    /**
     * Screenshot on test failure
     */
    screenshot: "only-on-failure",

    /**
     * Record video on test failure
     */
    video: "retain-on-failure",

    /**
     * Maximum time for each action (click, fill, etc.)
     */
    actionTimeout: 10 * 1000,

    /**
     * Maximum time to wait for navigation
     */
    navigationTimeout: 15 * 1000,

    /**
     * Emulate viewport size
     * Desktop: 1920x1080
     * CI: Smaller viewport for performance (1280x720)
     */
    viewport: process.env.CI
      ? { width: 1280, height: 720 }
      : { width: 1920, height: 1080 },

    /**
     * Ignore HTTPS certificate errors
     * Set to true for staging environments with self-signed certs
     */
    ignoreHTTPSErrors: process.env.E2E_IGNORE_HTTPS === "true",

    /**
     * Custom headers for all requests
     * Example: Add API keys, auth tokens, etc.
     */
    // extraHTTPHeaders: {
    //   'X-API-Key': process.env.E2E_API_KEY || '',
    // },
  },

  /**
   * Test projects for different browsers/configurations
   *
   * Uncomment additional browsers as needed
   */
  projects: [
    /**
     * Chromium (Chrome, Edge)
     * Primary browser for testing
     */
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    /**
     * Firefox
     * Uncomment for cross-browser testing
     */
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //   },
    // },

    /**
     * WebKit (Safari)
     * Uncomment for cross-browser testing
     */
    // {
    //   name: "webkit",
    //   use: {
    //     ...devices["Desktop Safari"],
    //   },
    // },

    /**
     * Mobile browsers
     * Uncomment for mobile testing
     */
    // {
    //   name: "mobile-chrome",
    //   use: {
    //     ...devices["Pixel 5"],
    //   },
    // },
    // {
    //   name: "mobile-safari",
    //   use: {
    //     ...devices["iPhone 13"],
    //   },
    // },

    /**
     * Authenticated setup project
     * Runs before other tests to create authenticated session
     * See: https://playwright.dev/docs/auth
     */
    // {
    //   name: "setup",
    //   testMatch: /.*\.setup\.ts/,
    // },
    // {
    //   name: "authenticated",
    //   use: {
    //     storageState: ".auth/user.json",
    //   },
    //   dependencies: ["setup"],
    // },
  ],

  /**
   * Web server configuration
   *
   * Automatically start the application server before running tests
   * Useful for local development
   *
   * EXAMPLE 1: Start Next.js Web App
   */
  webServer: process.env.CI ? undefined : {
    /**
     * Command to start the server
     * Options:
     * - Development: `pnpm --filter @slimy/web dev`
     * - Production build: `pnpm --filter @slimy/web build && pnpm --filter @slimy/web start`
     */
    command: "pnpm --filter @slimy/web dev",

    /**
     * URL to wait for before running tests
     */
    url: BASE_URL,

    /**
     * Reuse existing server if already running
     * Set to false in CI to always start fresh
     */
    reuseExistingServer: !process.env.CI,

    /**
     * Maximum time to wait for server to start (2 minutes)
     */
    timeout: 120 * 1000,

    /**
     * Output server logs to console
     */
    stdout: "pipe",
    stderr: "pipe",
  },

  /**
   * EXAMPLE 2: Start multiple services
   *
   * Uncomment this section if you need to run multiple services
   * (Web App, Admin API, Admin UI) simultaneously
   */
  // webServer: process.env.CI ? undefined : [
  //   {
  //     command: "pnpm --filter @slimy/web dev",
  //     url: BASE_URL,
  //     reuseExistingServer: true,
  //     timeout: 120 * 1000,
  //   },
  //   {
  //     command: "pnpm --filter @slimy/admin-api dev",
  //     url: ADMIN_API_URL,
  //     reuseExistingServer: true,
  //     timeout: 120 * 1000,
  //   },
  //   {
  //     command: "pnpm --filter @slimy/admin-ui dev",
  //     url: ADMIN_UI_URL,
  //     reuseExistingServer: true,
  //     timeout: 120 * 1000,
  //   },
  // ],

  /**
   * Global setup script
   * Runs once before all tests (useful for database seeding)
   */
  // globalSetup: require.resolve('./global-setup.ts'),

  /**
   * Global teardown script
   * Runs once after all tests (useful for cleanup)
   */
  // globalTeardown: require.resolve('./global-teardown.ts'),
});

/**
 * NEXT STEPS:
 *
 * 1. Copy this file to `playwright.config.ts`
 * 2. Create `.env.e2e` with your environment variables
 * 3. Install Playwright: `pnpm add -D @playwright/test`
 * 4. Install browsers: `pnpm exec playwright install --with-deps chromium`
 * 5. Write tests in `*.spec.ts` files
 * 6. Run tests: `pnpm exec playwright test`
 * 7. View report: `pnpm exec playwright show-report`
 *
 * For more information, see:
 * - Playwright Docs: https://playwright.dev/
 * - E2E Test Plan: /docs/e2e-test-plan.md
 */
