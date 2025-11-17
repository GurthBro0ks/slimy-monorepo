import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "e2e-api",
    environment: "node",
    globals: true,
    setupFiles: ["./tests/api/setup.ts"],
    include: ["tests/api/**/*.test.ts"],
    testTimeout: 30000, // 30 seconds for API tests
    hookTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["app/api/**/*.ts", "lib/**/*.ts"],
      exclude: [
        "node_modules/",
        "dist/",
        ".next/",
        "coverage/",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
