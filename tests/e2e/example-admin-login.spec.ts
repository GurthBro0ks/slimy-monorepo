/**
 * Example E2E Test: Admin Login Flow
 *
 * This is an ILLUSTRATIVE test demonstrating how to test the admin
 * authentication flow with Discord OAuth in the Slimy.ai application.
 *
 * IMPORTANT: This is an EXAMPLE test using placeholder steps.
 * It is designed to be safe to run without modifying real data.
 *
 * USAGE:
 * 1. Set up environment variables in `.env.e2e`
 * 2. Ensure test Discord account exists
 * 3. Run with: `pnpm exec playwright test example-admin-login.spec.ts`
 *
 * NOTE: This test uses MOCK Discord OAuth flow to avoid external dependencies.
 * For real OAuth testing, see Playwright's authentication guide:
 * https://playwright.dev/docs/auth
 */

import { test, expect, type Page } from "@playwright/test";

/**
 * Environment variables for testing
 * These should be set in .env.e2e or your CI/CD environment
 */
const ADMIN_URL = process.env.E2E_ADMIN_URL || "/admin";
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

/**
 * Test Discord credentials
 * IMPORTANT: Use dedicated test accounts, never production credentials
 */
const TEST_DISCORD_EMAIL = process.env.E2E_DISCORD_TEST_USER || "test-admin@example.com";
const TEST_DISCORD_PASSWORD = process.env.E2E_DISCORD_TEST_PASS || "PLACEHOLDER_PASSWORD";

/**
 * Mock user data for testing
 * This simulates a successful Discord OAuth response
 */
const MOCK_USER = {
  id: "123456789012345678",
  username: "test_admin",
  discriminator: "0001",
  avatar: "a_1234567890abcdef",
  email: TEST_DISCORD_EMAIL,
  verified: true,
};

/**
 * Test suite: Admin Authentication Flow
 */
test.describe("Admin Login Flow", () => {
  /**
   * Before each test, clear cookies and local storage
   * Ensures each test starts with a clean slate
   */
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
  });

  /**
   * Test 1: Unauthenticated user should be redirected to login
   *
   * SCENARIO:
   * 1. User tries to access /admin without being logged in
   * 2. System detects missing session
   * 3. User is redirected to login page or Discord OAuth
   *
   * EXPECTED RESULT:
   * - URL changes to login page or Discord OAuth
   * - User sees login prompt or Discord authorization page
   */
  test("should redirect unauthenticated users to login", async ({ page }) => {
    // STEP 1: Navigate to protected admin route
    await page.goto(ADMIN_URL);

    // STEP 2: Wait for redirect to complete
    await page.waitForLoadState("networkidle");

    // STEP 3: Verify redirect occurred
    // User should NOT be on the admin page
    // User should be on login page OR Discord OAuth page
    const currentUrl = page.url();

    // Check if redirected to login or Discord
    const isRedirected =
      currentUrl.includes("/login") ||
      currentUrl.includes("/auth") ||
      currentUrl.includes("discord.com/api/oauth2/authorize");

    expect(isRedirected).toBe(true);

    // STEP 4: Verify login UI is displayed
    if (!currentUrl.includes("discord.com")) {
      // If on local login page, check for login button
      const loginButton = page.locator(
        'button:has-text("Login"), a:has-text("Login with Discord"), button:has-text("Sign in")'
      ).first();

      await expect(loginButton).toBeVisible({
        timeout: 5000,
      });
    }
  });

  /**
   * Test 2: Discord OAuth redirect should have correct parameters
   *
   * SCENARIO:
   * 1. User clicks "Login with Discord" button
   * 2. System redirects to Discord OAuth authorization
   * 3. OAuth URL contains required parameters
   *
   * EXPECTED RESULT:
   * - Redirect to discord.com/api/oauth2/authorize
   * - URL contains client_id, redirect_uri, response_type, scope
   */
  test("should initiate Discord OAuth with correct parameters", async ({ page }) => {
    // STEP 1: Navigate to home page
    await page.goto("/");

    // STEP 2: Find and click login/admin link
    const loginLink = page
      .locator(
        'a[href*="login"], a[href*="admin"], a[href*="auth"], button:has-text("Login")'
      )
      .first();

    // Wait for element to be visible
    await loginLink.waitFor({ state: "visible", timeout: 10000 });

    // STEP 3: Click login button
    await loginLink.click();

    // STEP 4: Wait for Discord OAuth redirect
    await page.waitForLoadState("networkidle");

    // STEP 5: Verify we're on Discord OAuth page
    const currentUrl = page.url();

    // NOTE: This test may fail if Discord OAuth is not configured
    // In that case, it will stay on local auth page
    if (currentUrl.includes("discord.com/api/oauth2/authorize")) {
      const url = new URL(currentUrl);

      // STEP 6: Verify OAuth parameters
      expect(url.searchParams.get("client_id")).toBeTruthy();
      expect(url.searchParams.get("redirect_uri")).toContain(BASE_URL);
      expect(url.searchParams.get("response_type")).toBe("code");

      // Scope should include 'identify' at minimum
      const scope = url.searchParams.get("scope");
      expect(scope).toContain("identify");
    } else {
      // FALLBACK: If OAuth not configured, just verify we're on an auth page
      console.log("Discord OAuth not configured, skipping OAuth parameter checks");
      expect(currentUrl).toMatch(/login|auth|signin/i);
    }
  });

  /**
   * Test 3: Mock Discord OAuth callback and session creation
   *
   * SCENARIO (SIMULATED):
   * 1. User authorizes app on Discord
   * 2. Discord redirects back with authorization code
   * 3. Backend exchanges code for access token
   * 4. Backend creates session and sets cookie
   * 5. User is redirected to admin dashboard
   *
   * IMPLEMENTATION:
   * This test MOCKS the OAuth callback to avoid external dependencies.
   * In a real scenario, you would:
   * - Use Playwright's authentication persistence
   * - Or mock the OAuth provider
   * - Or use a dedicated test OAuth endpoint
   */
  test("should handle OAuth callback and create session (MOCKED)", async ({ page, context }) => {
    // MOCK APPROACH:
    // Instead of actually going through Discord OAuth, we'll simulate
    // a successful authentication by setting cookies/localStorage directly

    // STEP 1: Intercept OAuth callback route
    // Mock the API endpoint that handles Discord OAuth callback
    await page.route("**/api/auth/callback*", async (route) => {
      // Simulate successful OAuth exchange
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: MOCK_USER,
          redirect: "/admin",
        }),
      });
    });

    // STEP 2: Mock session validation endpoint
    await page.route("**/api/auth/session*", async (route) => {
      // Return mock authenticated session
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          user: MOCK_USER,
          role: "admin",
        }),
      });
    });

    // STEP 3: Set authentication cookies manually
    // This simulates a successful OAuth flow
    await context.addCookies([
      {
        name: "slimy_session",
        value: "mock-session-token-12345",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // STEP 4: Navigate to admin page
    await page.goto(ADMIN_URL);

    // STEP 5: Verify successful authentication
    // Check that we're NOT redirected to login
    await page.waitForLoadState("networkidle");
    const currentUrl = page.url();

    // Should stay on admin page
    expect(currentUrl).toContain("/admin");

    // STEP 6: Verify admin dashboard is displayed
    // Look for common admin UI elements
    const adminElements = page.locator(
      'h1:has-text("Admin"), h1:has-text("Dashboard"), [data-testid="admin-content"], .admin-dashboard'
    );

    // At least one admin element should be visible
    await expect(adminElements.first()).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test 4: Authenticated user should access admin features
   *
   * SCENARIO:
   * 1. User is already authenticated (from previous test)
   * 2. User navigates to various admin pages
   * 3. All pages load successfully without redirect
   *
   * EXPECTED RESULT:
   * - Guilds page loads
   * - Users page loads
   * - Settings page loads
   * - No authentication errors
   */
  test("should access admin features when authenticated (MOCKED)", async ({ page, context }) => {
    // SETUP: Mock authentication (same as previous test)
    await page.route("**/api/auth/session*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          user: MOCK_USER,
          role: "admin",
        }),
      });
    });

    // Mock guilds API endpoint
    await page.route("**/api/admin/guilds*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          guilds: [
            {
              id: "111111111111111111",
              name: "Test Guild 1",
              memberCount: 150,
              botActive: true,
            },
            {
              id: "222222222222222222",
              name: "Test Guild 2",
              memberCount: 89,
              botActive: false,
            },
          ],
        }),
      });
    });

    // Set authentication cookie
    await context.addCookies([
      {
        name: "slimy_session",
        value: "mock-session-token-12345",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // TEST 1: Access admin dashboard
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);

    // TEST 2: Access guilds page (if exists)
    // NOTE: Adjust these routes based on actual application structure
    await page.goto("/admin/guilds");
    await page.waitForLoadState("networkidle");

    // Should NOT be redirected to login
    const guildsUrl = page.url();
    expect(guildsUrl).not.toContain("login");
    expect(guildsUrl).not.toContain("discord.com");

    // TEST 3: Verify guild data is displayed
    // Look for guild names from mock data
    const guildElement = page.locator('text=/Test Guild|Guild/i').first();
    await expect(guildElement).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test 5: Session expiration should redirect to login
   *
   * SCENARIO:
   * 1. User is authenticated with valid session
   * 2. Session expires (simulated by removing cookie)
   * 3. User attempts to access protected route
   * 4. System detects invalid session
   * 5. User is redirected to login
   *
   * EXPECTED RESULT:
   * - Invalid session is detected
   * - User is redirected to login
   * - Error message is displayed
   */
  test("should redirect to login when session expires", async ({ page, context }) => {
    // STEP 1: Start with authenticated session
    await page.route("**/api/auth/session*", async (route) => {
      // First call: valid session
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          user: MOCK_USER,
          role: "admin",
        }),
      });
    });

    await context.addCookies([
      {
        name: "slimy_session",
        value: "mock-session-token-12345",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // STEP 2: Navigate to admin page (should succeed)
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);

    // STEP 3: Simulate session expiration
    // Remove authentication cookie
    await context.clearCookies();

    // Update mock to return unauthorized
    await page.route("**/api/auth/session*", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: false,
          error: "Session expired",
        }),
      });
    });

    // STEP 4: Try to access protected route again
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // STEP 5: Verify redirect to login
    const currentUrl = page.url();
    const isRedirectedToLogin =
      currentUrl.includes("/login") ||
      currentUrl.includes("/auth") ||
      currentUrl.includes("discord.com");

    expect(isRedirectedToLogin).toBe(true);
  });
});

/**
 * Test suite: Admin UI Navigation
 */
test.describe("Admin Dashboard Navigation", () => {
  /**
   * Setup authenticated context before each test
   */
  test.beforeEach(async ({ page, context }) => {
    // Mock session for all navigation tests
    await page.route("**/api/auth/session*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          user: MOCK_USER,
          role: "admin",
        }),
      });
    });

    await context.addCookies([
      {
        name: "slimy_session",
        value: "mock-session-token-12345",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/admin");
  });

  /**
   * Test: Navigation menu should be visible
   */
  test("should display navigation menu", async ({ page }) => {
    // Look for common navigation elements
    const nav = page.locator("nav, [role='navigation'], .sidebar, .menu").first();
    await expect(nav).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test: User profile should be displayed
   */
  test("should display user profile information", async ({ page }) => {
    // Look for username or email in the UI
    const userInfo = page.locator(`text=${MOCK_USER.username}, text=${MOCK_USER.email}`).first();

    // User info might not be visible immediately, so we use a longer timeout
    await expect(userInfo).toBeVisible({
      timeout: 10000,
    });
  });
});

/**
 * IMPORTANT NOTES FOR REAL IMPLEMENTATION:
 *
 * 1. DISCORD OAUTH TESTING:
 *    - Use Playwright's built-in authentication state persistence
 *    - See: https://playwright.dev/docs/auth
 *    - Example:
 *      ```typescript
 *      test.use({ storageState: '.auth/admin-user.json' });
 *      ```
 *
 * 2. ENVIRONMENT SAFETY:
 *    - NEVER commit real Discord credentials
 *    - Use .env.e2e (gitignored) for local testing
 *    - Use GitHub Secrets for CI/CD
 *    - Create dedicated test Discord accounts
 *
 * 3. DATABASE SEEDING:
 *    - Seed test database before running tests
 *    - Use database transactions that rollback after tests
 *    - Keep test data isolated from production
 *
 * 4. MOCKING VS REAL OAUTH:
 *    - Mocking (this example): Fast, no external dependencies
 *    - Real OAuth: More accurate, but slower and requires credentials
 *    - Use mocking for CI, real OAuth for pre-production testing
 *
 * 5. FLAKINESS PREVENTION:
 *    - Use explicit waits: page.waitForLoadState()
 *    - Use retry logic: test.retry()
 *    - Avoid hardcoded timeouts
 *    - Use data-testid attributes for stable selectors
 *
 * 6. NEXT STEPS:
 *    - Copy this test and customize for your routes
 *    - Replace mocks with actual authentication flow
 *    - Add more admin feature tests (guilds, users, settings)
 *    - Integrate into CI/CD pipeline
 */
