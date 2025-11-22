import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
  {
    files: [
      "**/*.config.{js,ts,mjs}",
      "next.config.ts",
      "next.config.js",
      "tailwind.config.ts",
      "scripts/**/*",
      "test-auth.js",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["tests/**/*", "**/*.test.{ts,tsx}", "test-auth.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
