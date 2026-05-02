import { FlatCompat } from "@eslint/eslintrc";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import tseslintParser from "@typescript-eslint/parser";
import deprecation from "eslint-plugin-deprecation";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "vitest.config.ts"],
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    plugins: { "@typescript-eslint": tseslintPlugin, deprecation, prettier: eslintPluginPrettier },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
      "deprecation/deprecation": "warn",
      "prettier/prettier": "error",
    },
  },
  eslintConfigPrettier,
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default config;
