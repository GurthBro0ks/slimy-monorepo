import { defineConfig, devices } from "@playwright/test";
import { env } from "./lib/config";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!env.CI,
  retries: env.CI ? 2 : 0,
  workers: env.CI ? 1 : undefined,
  reporter: env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Reduce viewport size for faster tests in CI
        viewport: env.CI ? { width: 1280, height: 720 } : { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
  expect: {
    timeout: 10000,
  },
});
