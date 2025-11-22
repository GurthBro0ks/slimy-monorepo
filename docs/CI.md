# Continuous Integration (CI)

This document describes the CI pipeline for the Slimy monorepo.

## Overview

The CI pipeline automatically validates code changes by running tests across the monorepo. It runs on:
- **Pull requests** targeting the `main` branch
- **Pushes** to the `main` branch

## What the CI Workflow Does

The workflow (`.github/workflows/ci.yml`) performs the following steps:

1. **Checkout code** - Clones the repository
2. **Setup Node.js** - Installs Node.js v20 (LTS)
3. **Install pnpm** - Installs pnpm v8 package manager
4. **Cache dependencies** - Caches the pnpm store to speed up subsequent runs
5. **Install dependencies** - Runs `pnpm install --frozen-lockfile`
6. **Generate Prisma clients** - Runs `pnpm prisma:generate` for database schema
7. **Run tests** - Executes `pnpm test:all` to run all workspace tests

## Currently Covered Applications

| App | Test Command | Test Framework | Status |
|-----|-------------|----------------|--------|
| **admin-api** | `pnpm --filter admin-api test` | Jest | ✅ Configured |
| **web** | `pnpm --filter web test` | Vitest | ✅ Configured |
| **bot** | `pnpm --filter bot test` | None | ⚠️ Placeholder only |

### TODOs

- **bot**: Currently has a placeholder test script (`echo "TODO: test bot"`). Real tests need to be implemented before the bot can be properly validated in CI.

## Extending CI Coverage

### Adding Tests to New Apps

When creating a new app in `apps/`, ensure it has a `test` script in its `package.json`:

```json
{
  "scripts": {
    "test": "jest"  // or vitest, or your preferred test runner
  }
}
```

The root-level `pnpm test:all` command will automatically discover and run tests in all workspace packages.

### Adding Individual Test Jobs

If you need to run specific apps in separate CI jobs (for parallelization or different environments):

```yaml
jobs:
  test-web:
    runs-on: ubuntu-latest
    steps:
      # ... setup steps ...
      - run: pnpm --filter web test

  test-admin-api:
    runs-on: ubuntu-latest
    steps:
      # ... setup steps ...
      - run: pnpm --filter admin-api test
```

### Adding Linting

To add linting to CI, uncomment or add a lint step:

```yaml
- name: Run linter
  run: pnpm lint
```

The root `package.json` already has a `lint` script that runs linting across all workspaces.

### Adding Build Validation

To ensure all apps build successfully:

```yaml
- name: Build all apps
  run: pnpm build
```

## Running Tests Locally

Before pushing code, you can run the same tests that CI will run:

```bash
# Run all tests
pnpm test:all

# Run tests for specific apps
pnpm test:web
pnpm test:admin-api
pnpm test:bot

# Or use filter syntax
pnpm --filter web test
pnpm --filter admin-api test
```

## Troubleshooting

### CI Fails But Tests Pass Locally

1. Ensure you've committed all necessary files
2. Check that `pnpm-lock.yaml` is up to date
3. Verify Prisma schema changes are included

### Prisma Generation Fails

The CI runs `pnpm prisma:generate` before tests. If this fails:
- Ensure `schema.prisma` files are valid
- Check that database provider is configured correctly
- Verify Prisma is listed in `devDependencies`

### Cache Issues

If you suspect caching issues, you can manually clear the cache:
1. Go to the GitHub Actions tab
2. Click "Caches" in the left sidebar
3. Delete the relevant cache entries

## Future Enhancements

Potential improvements to consider:

- **Parallel test jobs** - Run each app's tests in parallel
- **E2E tests** - Add Playwright or Cypress tests for web app
- **Coverage reports** - Publish code coverage metrics
- **Build validation** - Ensure all apps build successfully
- **Deployment previews** - Deploy PR previews automatically
- **Performance testing** - Run lighthouse or other performance checks
