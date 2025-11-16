import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Try to access a protected route
    await page.goto("/admin");

    // Should redirect to login or show login prompt
    await expect(page).toHaveURL(/\/login|\/auth|discord\.com/);
  });

  test("should show login button on home page", async ({ page }) => {
    await page.goto("/");

    // Check for login/admin link in navigation
    const loginLink = page.locator('a[href*="login"], a[href*="admin"], a[href*="auth"]').first();
    await expect(loginLink).toBeVisible();
  });

  test("should handle OAuth login flow", async ({ page }) => {
    await page.goto("/");

    // Click login link
    const loginLink = page.locator('a[href*="login"], a[href*="admin"]').first();
    await loginLink.click();

    // Should redirect to Discord OAuth
    await expect(page).toHaveURL(/discord\.com\/api\/oauth2\/authorize/);

    // Check OAuth parameters
    const url = new URL(page.url());
    expect(url.searchParams.get('client_id')).toBeTruthy();
    expect(url.searchParams.get('redirect_uri')).toBeTruthy();
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toContain('identify');
  });
});

test.describe("Admin Dashboard", () => {
  test("should require authentication for admin routes", async ({ page }) => {
    await page.goto("/admin");

    // Should not show admin content without authentication
    const adminContent = page.locator('[data-testid="admin-content"], .admin-dashboard, h1:has-text("Admin")').first();
    await expect(adminContent).not.toBeVisible();
  });

  test("should show authentication error for protected routes", async ({ page }) => {
    await page.goto("/admin");

    // Should show some form of authentication required message
    const errorMessage = page.locator('text=/login|authenticate|sign in|unauthorized/i').first();
    await expect(errorMessage).toBeVisible();
  });
});

test.describe("Chat Interface", () => {
  test("should load chat page", async ({ page }) => {
    await page.goto("/chat");

    // Check for chat interface elements
    const chatInput = page.locator('input[type="text"], textarea, [contenteditable]').first();
    await expect(chatInput).toBeVisible();
  });

  test("should show personality selector", async ({ page }) => {
    await page.goto("/chat");

    // Check for personality mode selector
    const personalitySelector = page.locator('select, [role="combobox"], button:has-text("Personality")').first();
    await expect(personalitySelector).toBeVisible();
  });

  test("should handle message input", async ({ page }) => {
    await page.goto("/chat");

    // Find message input
    const messageInput = page.locator('input[type="text"], textarea').first();

    // Type a message
    await messageInput.fill("Hello, test message!");
    await expect(messageInput).toHaveValue("Hello, test message!");
  });

  test("should show send button", async ({ page }) => {
    await page.goto("/chat");

    // Check for send button
    const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();
    await expect(sendButton).toBeVisible();
  });
});

test.describe("API Integration", () => {
  test("should handle API errors gracefully", async ({ page }) => {
    // Mock API failure
    await page.route('/api/chat/bot', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    }));

    await page.goto("/chat");

    const messageInput = page.locator('input[type="text"], textarea').first();
    const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();

    await messageInput.fill("Test message");
    await sendButton.click();

    // Should show error message
    const errorMessage = page.locator('text=/error|failed|sorry/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test("should show loading state during API calls", async ({ page }) => {
    // Mock slow API response
    await page.route('/api/chat/bot', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, reply: "Test response" })
      });
    });

    await page.goto("/chat");

    const messageInput = page.locator('input[type="text"], textarea').first();
    const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();

    await messageInput.fill("Test message");
    await sendButton.click();

    // Should show loading state
    const loadingIndicator = page.locator('[aria-busy="true"], .loading, .spinner, text=/loading|thinking/i').first();
    await expect(loadingIndicator).toBeVisible();
  });
});
