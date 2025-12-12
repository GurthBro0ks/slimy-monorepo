import js from "@eslint/js";
import tseslint from "typescript-eslint";

const tsFiles = ["**/*.{ts,tsx,mts,cts}"];

const nodeGlobals = {
  AbortController: "readonly",
  Buffer: "readonly",
  FormData: "readonly",
  Headers: "readonly",
  Request: "readonly",
  Response: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  console: "readonly",
  exports: "readonly",
  fetch: "readonly",
  global: "readonly",
  module: "readonly",
  process: "readonly",
  queueMicrotask: "readonly",
  setImmediate: "readonly",
  require: "readonly",
  clearImmediate: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
};

const jestGlobals = {
  afterAll: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  jest: "readonly",
  test: "readonly",
};

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: tsFiles })),
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/out/**",
    ],
  },
  {
    files: tsFiles,
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: [
      "**/*.cjs",
      "apps/**/next.config.{js,cjs,mjs}",
      "lib/**/*.{js,cjs}",
      "scripts/**/*.{js,cjs,mjs}",
    ],
    languageOptions: {
      globals: nodeGlobals,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  {
    files: ["apps/admin-api/**/*.{js,cjs}"],
    languageOptions: {
      sourceType: "commonjs",
      globals: nodeGlobals,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  {
    files: [
      "apps/admin-api/tests/**/*.{js,cjs}",
      "apps/admin-api/jest.setup.js",
      "apps/admin-api/**/__tests__/**/*.{js,cjs}",
      "apps/admin-api/src/**/*.test.{js,cjs}",
      "apps/admin-api/src/**/*.spec.{js,cjs}",
    ],
    languageOptions: {
      globals: { ...nodeGlobals, ...jestGlobals },
    },
  },
];
