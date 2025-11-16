/**
 * E2E Tests for Club Analytics
 */

import { test, expect } from '@playwright/test';

test.describe('Club Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to club analytics page
    await page.goto('/club');
  });

  test('should load club analytics page', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Club Analytics');

    // Verify main components are visible
    await expect(page.locator('[data-testid="club-analyzer"]')).toBeVisible();
  });

  test('should upload screenshot', async ({ page }) => {
    // Click upload button
    await page.click('[data-testid="upload-btn"]');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/club-screenshot.png');

    // Verify file was uploaded
    await expect(page.locator('text=Upload successful')).toBeVisible({ timeout: 5000 });
  });

  test('should analyze screenshot', async ({ page }) => {
    // Mock file upload
    await page.click('[data-testid="upload-btn"]');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/club-screenshot.png');

    // Wait for upload
    await page.waitForTimeout(2000);

    // Click analyze button
    await page.click('[data-testid="analyze-btn"]');

    // Verify analysis is running
    await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible({ timeout: 3000 });

    // Wait for analysis to complete
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 60000 });

    // Verify results contain metrics
    await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(await page.locator('[data-testid="metric-card"]').count());
    expect(await page.locator('[data-testid="metric-card"]').count()).toBeGreaterThan(0);
  });

  test('should export analysis results', async ({ page }) => {
    // Assuming we have an analysis already
    await page.goto('/club?analysisId=test-123');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-btn"]');

    // Verify download starts
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/club-analysis.*\.(json|csv|pdf)/);
  });

  test('should view analysis history', async ({ page }) => {
    // Click history tab
    await page.click('[data-testid="history-tab"]');

    // Verify history list is visible
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible();

    // Verify at least one analysis is shown (if any exist)
    const historyItems = page.locator('[data-testid="history-item"]');
    const count = await historyItems.count();

    if (count > 0) {
      // Click on first item
      await historyItems.first().click();

      // Verify analysis details are shown
      await expect(page.locator('[data-testid="analysis-details"]')).toBeVisible();
    }
  });

  test('should delete an analysis', async ({ page }) => {
    // Navigate to history
    await page.click('[data-testid="history-tab"]');

    // Verify history list is visible
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible();

    // Get initial count
    const historyItems = page.locator('[data-testid="history-item"]');
    const initialCount = await historyItems.count();

    if (initialCount > 0) {
      // Click delete on first item
      await page.click('[data-testid="delete-analysis-btn"]:first-of-type');

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-btn"]');

      // Verify item was deleted
      await expect(historyItems).toHaveCount(initialCount - 1);
    }
  });
});
