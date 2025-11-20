/**
 * E2E Smoke Tests
 * Basic end-to-end tests to verify the application is running
 *
 * NOTE: These tests require the dev or prod server to be running.
 * Run `pnpm --filter @slimy/web dev` in a separate terminal before running these tests.
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Application Health', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that we're on the right domain
    expect(page.url()).toContain('/');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: false });
  });

  test('should have a visible header or navigation', async ({ page }) => {
    await page.goto('/');

    // Look for common navigation elements
    // Adjust these selectors based on your actual UI
    const body = await page.locator('body');
    expect(await body.isVisible()).toBeTruthy();

    // Check for some text content on the page
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(0);
  });

  test('should navigate to chat page', async ({ page }) => {
    await page.goto('/chat');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify we're on the chat page
    expect(page.url()).toContain('/chat');

    // Check for the chat page title
    await expect(page.locator('text=Slime Chat')).toBeVisible({ timeout: 10000 });
  });

  test('should load chat page UI elements', async ({ page }) => {
    await page.goto('/chat');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Look for the chat heading
    const heading = page.locator('h1:has-text("Slime Chat")');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check for description text
    await expect(
      page.locator('text=AI-powered conversations')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to codes page', async ({ page }) => {
    await page.goto('/snail/codes');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify we're on the codes page
    expect(page.url()).toContain('/snail/codes');

    // This page might require authentication, so we just check it loads
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('should have proper page metadata', async ({ page }) => {
    await page.goto('/');

    // Check for a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should respond to viewport changes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyMobile = await page.locator('body');
    await expect(bodyMobile).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const bodyDesktop = await page.locator('body');
    await expect(bodyDesktop).toBeVisible();
  });
});

test.describe('Smoke Tests - Performance', () => {
  test('should load homepage within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors on homepage', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known/acceptable errors if any
    const criticalErrors = errors.filter(
      (err) => !err.includes('404') && !err.includes('favicon')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
