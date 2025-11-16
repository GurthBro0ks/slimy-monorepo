/**
 * E2E Tests for Codes Page
 */

import { test, expect } from '@playwright/test';

test.describe('Codes Page', () => {
  test('should load codes page and display codes', async ({ page }) => {
    await page.goto('/snail/codes');

    // Wait for codes to load
    await expect(page.locator('[data-testid="codes-list"]')).toBeVisible({ timeout: 10000 });

    // Check that at least one code is displayed
    const codes = page.locator('[data-testid="code-item"]');
    await expect(codes).toHaveCount(await codes.count());
    expect(await codes.count()).toBeGreaterThan(0);
  });

  test('should filter codes by scope', async ({ page }) => {
    await page.goto('/snail/codes');

    // Wait for codes to load
    await expect(page.locator('[data-testid="codes-list"]')).toBeVisible({ timeout: 10000 });

    // Click on "Past 7 Days" filter
    await page.click('[data-testid="scope-past7"]');

    // Verify URL updated
    await expect(page).toHaveURL(/scope=past7/);

    // Verify codes are still displayed
    await expect(page.locator('[data-testid="code-item"]')).toHaveCount(await page.locator('[data-testid="code-item"]').count());
  });

  test('should search for codes', async ({ page }) => {
    await page.goto('/snail/codes');

    // Wait for codes to load
    await expect(page.locator('[data-testid="codes-list"]')).toBeVisible({ timeout: 10000 });

    // Enter search query
    await page.fill('[data-testid="code-search"]', 'TEST');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify URL updated with search query
    await expect(page).toHaveURL(/q=TEST/);
  });

  test('should copy code to clipboard', async ({ page }) => {
    await page.goto('/snail/codes');

    // Wait for codes to load
    await expect(page.locator('[data-testid="codes-list"]')).toBeVisible({ timeout: 10000 });

    // Click copy button for first code
    await page.click('[data-testid="copy-code-btn"]:first-of-type');

    // Verify copy success message
    await expect(page.locator('text=Copied')).toBeVisible({ timeout: 3000 });
  });

  test('should copy all codes', async ({ page }) => {
    await page.goto('/snail/codes');

    // Wait for codes to load
    await expect(page.locator('[data-testid="codes-list"]')).toBeVisible({ timeout: 10000 });

    // Click "Copy All" button
    await page.click('[data-testid="copy-all-btn"]');

    // Verify copy success message
    await expect(page.locator('text=Copied')).toBeVisible({ timeout: 3000 });
  });

  test('should report a code', async ({ page }) => {
    await page.goto('/snail/codes');

    // Wait for codes to load
    await expect(page.locator('[data-testid="codes-list"]')).toBeVisible({ timeout: 10000 });

    // Click report button for first code
    await page.click('[data-testid="report-code-btn"]:first-of-type');

    // Fill report form
    await page.selectOption('[data-testid="report-reason"]', 'expired');
    await page.fill('[data-testid="report-details"]', 'This code is no longer working');

    // Submit report
    await page.click('[data-testid="submit-report-btn"]');

    // Verify success message
    await expect(page.locator('text=Report submitted')).toBeVisible({ timeout: 5000 });
  });
});
