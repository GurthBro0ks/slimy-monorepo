import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate from home to features", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Slimy.ai");
    
    await page.click('a[href="/features"]');
    await expect(page).toHaveURL("/features");
    await expect(page.locator("h1")).toContainText("Features");
  });

  test("should navigate to docs", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/docs"]');
    await expect(page).toHaveURL(/\/docs/);
  });

  test("should navigate to status page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/status"]');
    await expect(page).toHaveURL("/status");
    await expect(page.locator("h1")).toContainText("System Status");
  });
});

test.describe("Codes Page", () => {
  test("should display codes and copy button", async ({ page }) => {
    await page.goto("/snail/codes");
    await expect(page.locator("h1")).toContainText("Secret Codes");
    
    // Check for Copy All button
    await expect(page.locator('button:has-text("Copy All")')).toBeVisible();
  });
});
