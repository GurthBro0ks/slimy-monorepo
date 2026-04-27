import webConfigs from "./apps/web/eslint.config.mjs";
import tseslintParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...webConfigs,
  {
    ignores: [
      "apps/bot/tests/**",
      "apps/bot/src/**/__tests__/**",
      "apps/bot/src/**/*.test.ts",
      "apps/bot/dist/**",
    ],
  },
  {
    files: ["apps/bot/**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: "./apps/bot/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "deprecation/deprecation": "warn",
    },
  },
];
