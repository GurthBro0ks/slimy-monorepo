// Root-level eslint config that delegates to apps/web config.
// This allows `pnpm exec eslint` from repo root (used by lint-staged pre-commit hook)
// to discover the config without requiring --config flags or running from subdirectories.
export { default } from "./apps/web/eslint.config.mjs";
// test
