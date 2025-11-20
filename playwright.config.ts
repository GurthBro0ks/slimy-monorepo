import { defineConfig, devices } from '@playwright/test';

/**
 * Root-level Playwright Configuration
 * For E2E tests in tests/e2e/
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    // Base URL from environment or default to localhost
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Reduce viewport size in CI for faster tests
        viewport: process.env.CI
          ? { width: 1280, height: 720 }
          : { width: 1920, height: 1080 },
      },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // NOTE: E2E tests require the web server to be running
  // To run tests automatically with server, uncomment the webServer section below
  // For manual testing, start the server separately: pnpm --filter @slimy/web dev

  // webServer: {
  //   command: 'pnpm --filter @slimy/web dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000, // 2 minutes
  // },

  // Folder for test artifacts
  outputDir: 'test-results/',

  // Global timeout for each test
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
