# ESLint tsconfigRootDir Fix Plan

## Diagnosis

**Root Cause:** Root `eslint.config.mjs` re-exports ONLY `apps/web/eslint.config.mjs`:
```js
export { default } from "./apps/web/eslint.config.mjs";
```

When `lint-staged` runs `pnpm exec eslint --fix` from repo root on `apps/bot/src/index.ts`:
1. ESLint discovers the root config, which delegates to `apps/web/eslint.config.mjs`
2. Web config has `tsconfigRootDir: __dirname` → resolves to `/opt/slimy/slimy-monorepo/apps/web/`
3. Web config has `project: ./tsconfig.json` → resolves to `apps/web/tsconfig.json`
4. `apps/web/tsconfig.json` only includes web source files — bot files are not in it
5. Error: "that TSConfig does not include this file"

**This is NOT:**
- A tsconfigRootDir pointing to the wrong directory per se (it's correct for web)
- A missing project references issue
- A parser compatibility issue

**It IS:** The root config only knows about web, not bot.

## Fix Plan

Change `eslint.config.mjs` to import BOTH `apps/web/eslint.config.mjs` and `apps/bot/eslint.config.mjs`, using file overrides to scope each config to its app directory.

### Approach

1. Import both app configs
2. Use `files: ["apps/web/**/*.{ts,tsx}"]` for web config elements
3. Use `files: ["apps/bot/**/*.{ts,tsx}"]` for bot config elements
4. Each app config already has its own `tsconfigRootDir` and `project` pointing to its own `tsconfig.json`

### Tradeoffs

- **vs projectService:** `projectService` (ESLint 9+) would auto-resolve tsconfigs but requires ESLint 9+. Current ESLint is 8.57.1 — not available.
- **vs separate root ignores:** The flat config with file scoping is the standard monorepo pattern for ESLint 8.
- **Config duplication:** Minimal — we import the existing app configs directly rather than duplicating rules.

### Changes

| File | Change |
|------|--------|
| `eslint.config.mjs` | Replace single re-export with merged config that scopes both app configs |
| `apps/bot/eslint.config.mjs` | No change |
| `apps/web/eslint.config.mjs` | No change |
| `apps/bot/tsconfig.json` | No change |
| `apps/web/tsconfig.json` | No change |
