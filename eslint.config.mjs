/**
 * Root ESLint config — minimal flat config that:
 *   1. Ignores apps/web and apps/bot (they have their own configs)
 *   2. Applies TypeScript ESLint rules to packages/ and root-level TypeScript
 *
 * Each app with its own eslint.config.mjs is excluded so the cascade is broken.
 */

import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import tseslintParser from "@typescript-eslint/parser";
import deprecation from "eslint-plugin-deprecation";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = [
  // Apps with their own eslint.config.mjs — exclude from root-level linting
  {
    ignores: [
      "apps/web/**",
      "apps/bot/**",
    ],
  },
  // TypeScript ESLint rules for packages/ and root-level files
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    plugins: { "@typescript-eslint": tseslintPlugin, deprecation },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
      "deprecation/deprecation": "warn",
    },
  },
];

export default config;
