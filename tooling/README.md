# Tooling

Build tools, configurations, and scripts for the Slimy.ai monorepo

## Overview

This directory contains monorepo-wide tooling and configuration templates that aren't specific to any individual app or package. It serves as a centralized location for:

- Workspace configuration templates
- Build scripts and utilities
- Development tools
- CI/CD helpers
- Validation scripts

## Contents

### pnpm-workspace.template.yaml

**Purpose**: Enhanced workspace configuration template for pnpm

**Status**: Template only - NOT actively used

**Description**:
This file shows the PROPOSED complete workspace structure for the Slimy.ai monorepo. It includes:
- All current apps and packages
- Proposed future packages
- Inline documentation for each workspace
- Development workflow tips
- Migration notes

**How to Use**:
1. Review the proposed workspace structure
2. Ensure all listed packages exist with `package.json` files
3. Copy to root if you want to adopt it:
   ```bash
   cp tooling/pnpm-workspace.template.yaml pnpm-workspace.yaml
   ```
4. Modify as needed
5. Run `pnpm install`

**Current vs Template**:
- **Current** (`pnpm-workspace.yaml` in root): Active workspace configuration
- **Template** (this file): Proposed enhanced version with documentation

## Proposed Additional Scripts

### validate-workspace.js

**Purpose**: Validate workspace integrity

```javascript
// Checks:
// - All packages have package.json
// - No circular dependencies
// - Consistent version ranges
// - All workspace dependencies exist

const packages = ['apps/*', 'packages/*'];
// ... validation logic
```

**Usage**:
```bash
node tooling/validate-workspace.js
```

### sync-dependencies.js

**Purpose**: Ensure consistent dependency versions across workspace

```javascript
// Syncs versions of:
// - TypeScript
// - React
// - Prisma
// - Testing libraries

const dependencies = {
  typescript: '^5.3.0',
  '@types/node': '^20.0.0',
  // ...
};
// ... sync logic
```

**Usage**:
```bash
node tooling/sync-dependencies.js --fix
```

### generate-docs.js

**Purpose**: Auto-generate documentation from code

```javascript
// Generates:
// - Package dependency graph
// - API documentation from JSDoc
// - Workspace structure visualization

// ... documentation generation logic
```

**Usage**:
```bash
node tooling/generate-docs.js
```

## Workspace Commands

### Common pnpm Workspace Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm -r run build

# Run tests across all packages
pnpm -r run test

# Lint all code
pnpm -r run lint

# Run command in parallel
pnpm -r --parallel run dev

# Filter by location
pnpm --filter "./apps/*" build        # All apps
pnpm --filter "./packages/*" test     # All packages

# Filter by name
pnpm --filter web dev                 # Run web app
pnpm --filter @slimy/shared-db build  # Build shared-db

# Filter by dependencies
pnpm --filter "...web" build          # Build web and its dependencies
pnpm --filter "web..." test           # Test web and packages that depend on it
```

### Root package.json Scripts

Recommended scripts for root `package.json`:

```json
{
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "lint:fix": "pnpm -r run lint:fix",
    "typecheck": "pnpm -r run typecheck",
    "clean": "pnpm -r run clean && rm -rf node_modules",
    "dev": "pnpm -r --parallel run dev",
    "validate": "node tooling/validate-workspace.js",
    "sync-deps": "node tooling/sync-dependencies.js"
  }
}
```

## Dependency Management

### Workspace Protocol

Use `workspace:*` for internal dependencies:

```json
{
  "dependencies": {
    "@slimy/shared-db": "workspace:*",
    "@slimy/shared-auth": "workspace:*"
  }
}
```

This ensures packages always use the latest local version.

### Version Synchronization

Keep critical dependencies synchronized:

| Dependency | Version | Scope |
|------------|---------|-------|
| TypeScript | ^5.3.0 | All |
| Node.js | 20.x | All |
| React | 18.x or 19.x | Web apps |
| Prisma | ^6.19.0 | DB packages |
| ESLint | ^9.0.0 | All |
| Vitest | ^4.0.0 | All |

### Adding New Packages

To add a new package to the workspace:

1. **Create package directory**:
   ```bash
   mkdir -p packages/new-package
   cd packages/new-package
   ```

2. **Initialize package.json**:
   ```bash
   pnpm init
   ```

3. **Configure package.json**:
   ```json
   {
     "name": "@slimy/new-package",
     "version": "0.1.0",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "test": "vitest",
       "lint": "eslint src/"
     }
   }
   ```

4. **Add to workspace** (if using template):
   Update `pnpm-workspace.yaml`:
   ```yaml
   packages:
     # ...
     - 'packages/new-package'
   ```

5. **Install dependencies**:
   ```bash
   pnpm install
   ```

6. **Build and test**:
   ```bash
   pnpm --filter @slimy/new-package build
   pnpm --filter @slimy/new-package test
   ```

## Build Order

pnpm automatically determines build order based on dependencies. For example:

```
shared-types (no dependencies)
  ↓
shared-config (depends on shared-types)
  ↓
shared-db (depends on shared-config, shared-types)
  ↓
admin-api (depends on shared-db, shared-config, shared-types)
```

To see build order:
```bash
pnpm -r run build --dry-run
```

## TypeScript Project References

For faster builds, enable project references:

1. **Root tsconfig.json**:
   ```json
   {
     "files": [],
     "references": [
       { "path": "./packages/shared-types" },
       { "path": "./packages/shared-db" },
       { "path": "./apps/web" }
     ]
   }
   ```

2. **Package tsconfig.json**:
   ```json
   {
     "extends": "@slimy/tsconfig/base.json",
     "compilerOptions": {
       "composite": true,
       "outDir": "./dist"
     },
     "references": [
       { "path": "../shared-types" }
     ]
   }
   ```

3. **Build with references**:
   ```bash
   pnpm tsc --build
   ```

## Caching

pnpm caches builds for faster subsequent runs. To clear cache:

```bash
# Clear pnpm store
pnpm store prune

# Clear build artifacts
pnpm -r run clean
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Test
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm -r run build

      - run: pnpm -r run test

      - run: pnpm -r run lint
```

## Troubleshooting

### "Cannot find module" errors

```bash
# Clean and reinstall
pnpm -r run clean
rm -rf node_modules
pnpm install
```

### Build fails due to missing dependencies

```bash
# Check workspace structure
pnpm ls --depth 0

# Validate workspace
node tooling/validate-workspace.js
```

### Version conflicts

```bash
# Check for duplicate dependencies
pnpm why <package-name>

# Deduplicate
pnpm dedupe
```

## Best Practices

1. **Use workspace protocol**: Always use `workspace:*` for internal deps
2. **Keep versions in sync**: Synchronize critical dependencies
3. **Run from root**: Use `pnpm -r` commands from root
4. **Filter efficiently**: Use filters to run commands on subsets
5. **Enable caching**: Use TypeScript project references
6. **Validate regularly**: Run workspace validation in CI
7. **Document changes**: Update this README when adding tools

## Future Enhancements

- **Turborepo**: Consider migrating to Turborepo for better caching
- **Changesets**: Use changesets for versioning and changelogs
- **Bundle Analysis**: Track bundle sizes across packages
- **Dependency Graph**: Visualize package dependencies
- **Performance Metrics**: Track build and test times
- **Auto-sync**: Automatically sync dependency versions

## Related Documentation

- [Monorepo Layout Proposal](../docs/monorepo-layout-proposal.md)
- [Migration Checklist](../docs/monorepo-migration-checklist.md)
- [pnpm Workspaces Docs](https://pnpm.io/workspaces)

## License

Proprietary - Slimy.ai
