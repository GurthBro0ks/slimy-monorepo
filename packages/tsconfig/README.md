# @slimy/tsconfig

Shared TypeScript configurations for Slimy.ai services

## Purpose

Provides centralized TypeScript configurations across all Slimy.ai applications, ensuring:
- Consistent compiler options
- Type-safe code across services
- Framework-specific settings (React, Node.js)
- Project references for monorepo builds
- Reusable base configurations

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Configurations need to be:
- Extracted from existing `tsconfig.json` files
- Standardized across all services
- Optimized for monorepo setup

## Proposed Tech Stack

- **TypeScript 5.x** - Type system and compiler
- **Project References** - Monorepo build optimization
- **Strict Mode** - Maximum type safety

## Proposed Configurations

### Base Config (`@slimy/tsconfig/base.json`)

```json
{
  "extends": "@slimy/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### React Config (`@slimy/tsconfig/react.json`)

```json
{
  "extends": "@slimy/tsconfig/react.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### Next.js Config (`@slimy/tsconfig/next.json`)

```json
{
  "extends": "@slimy/tsconfig/next.json"
}
```

### Node.js Config (`@slimy/tsconfig/node.json`)

```json
{
  "extends": "@slimy/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

## Proposed Directory Structure

```
packages/tsconfig/
├── base.json                 # Base TypeScript config
├── react.json                # React-specific config
├── next.json                 # Next.js-specific config
├── node.json                 # Node.js-specific config
├── package.json
└── README.md
```

## Base Configuration

```json
// base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "importHelpers": true,
    "downlevelIteration": true,

    // Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    // Interop Constraints
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,

    // Completeness
    "skipLibCheck": true,

    // Advanced
    "resolveJsonModule": true,
    "allowJs": false,
    "incremental": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage"
  ]
}
```

## React Configuration

```json
// react.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

## Next.js Configuration

```json
// next.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./react.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## Node.js Configuration

```json
// node.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "types": ["node"]
  }
}
```

## Package Configuration

```json
// package.json
{
  "name": "@slimy/tsconfig",
  "version": "0.1.0",
  "description": "Shared TypeScript configurations for Slimy.ai",
  "main": "base.json",
  "files": [
    "base.json",
    "react.json",
    "next.json",
    "node.json"
  ],
  "keywords": [
    "typescript",
    "tsconfig",
    "config"
  ],
  "license": "PROPRIETARY"
}
```

## Usage

### In Web App (Next.js)

```json
// apps/web/tsconfig.json
{
  "extends": "@slimy/tsconfig/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next"
  ]
}
```

### In Admin API (Node.js)

```json
// apps/admin-api/tsconfig.json
{
  "extends": "@slimy/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

### In Shared Package

```json
// packages/shared-db/tsconfig.json
{
  "extends": "@slimy/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declarationMap": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

## Project References (Monorepo)

Enable faster builds with TypeScript project references:

### Root tsconfig.json

```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./apps/web" },
    { "path": "./apps/admin-api" },
    { "path": "./apps/admin-ui" },
    { "path": "./apps/bot" },
    { "path": "./packages/shared-auth" },
    { "path": "./packages/shared-db" },
    { "path": "./packages/shared-config" },
    { "path": "./packages/shared-codes" },
    { "path": "./packages/shared-snail" },
    { "path": "./packages/shared-types" },
    { "path": "./packages/shared-utils" }
  ]
}
```

### Package with Dependencies

```json
// packages/shared-auth/tsconfig.json
{
  "extends": "@slimy/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "references": [
    { "path": "../shared-types" },
    { "path": "../shared-config" }
  ]
}
```

## Build Scripts

```json
// Root package.json
{
  "scripts": {
    "build": "tsc --build",
    "build:force": "tsc --build --force",
    "clean": "tsc --build --clean",
    "watch": "tsc --build --watch"
  }
}
```

## Strict Mode Benefits

Enabling strict mode catches common errors:

```typescript
// Without strict mode
function getUser(id: string) {
  // Might return undefined, but type says User
  return users.find(u => u.id === id);
}

// With strict mode
function getUser(id: string): User | undefined {
  // Explicitly returns User | undefined
  return users.find(u => u.id === id);
}

// Usage with strict null checks
const user = getUser('123');
if (user) {
  // TypeScript knows user is defined here
  console.log(user.name);
}
```

## Path Aliases

Configure path aliases for cleaner imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

Usage:

```typescript
// Before
import { Button } from '../../../components/ui/Button';

// After
import { Button } from '@/components/ui/Button';
```

## Migration Checklist

1. **Audit existing configs**:
   - Collect all `tsconfig.json` files
   - Identify common settings
   - Document differences

2. **Create base configs**:
   - Base config with strict mode
   - Framework-specific configs
   - Test configurations

3. **Enable project references**:
   - Mark packages as `composite: true`
   - Define reference graph
   - Update build scripts

4. **Update all projects**:
   - Replace local configs with shared configs
   - Fix type errors from strict mode
   - Test builds

5. **Optimize build**:
   - Use `tsc --build` for incremental builds
   - Configure `incremental: true`
   - Set up build cache

## VSCode Integration

Ensure VSCode uses the correct TypeScript version:

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

## Type Checking in CI

```yaml
# .github/workflows/typecheck.yml
name: Type Check
on: [push, pull_request]

jobs:
  typecheck:
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
      - run: pnpm install
      - run: pnpm typecheck
```

```json
// Root package.json
{
  "scripts": {
    "typecheck": "tsc --build --force"
  }
}
```

## Used By

- `@slimy/web` - Next.js config
- `@slimy/admin-api` - Node.js config
- `@slimy/admin-ui` - Next.js config
- `@slimy/bot` - Node.js config
- All packages - Base or Node config

## Related Packages

- `@slimy/eslint-config` - Linting configurations
- TypeScript - Required peer dependency

## Common Compiler Options

### Emit Options
- `declaration`: Generate `.d.ts` files
- `sourceMap`: Generate source maps for debugging
- `removeComments`: Remove comments in output
- `outDir`: Output directory

### Type Checking Options
- `strict`: Enable all strict type-checking options
- `noImplicitAny`: Error on expressions with implied `any`
- `strictNullChecks`: Include `null` and `undefined` in type checking
- `noUnusedLocals`: Error on unused local variables
- `noUnusedParameters`: Error on unused parameters

### Module Options
- `module`: Module system (ESNext, CommonJS, NodeNext)
- `moduleResolution`: How to resolve modules (bundler, node, nodenext)
- `esModuleInterop`: Emit helpers for CommonJS interop
- `resolveJsonModule`: Allow importing JSON files

## Debugging Type Issues

### Check Types in VSCode
1. Hover over variables to see inferred types
2. Use "Go to Type Definition" (F12)
3. Check "Problems" panel for errors

### Use TypeScript Compiler
```bash
# Check types without emitting
pnpm tsc --noEmit

# See why a file is included
pnpm tsc --listFiles

# Verbose output
pnpm tsc --verbose
```

### Type Coverage
```bash
# Install type-coverage
pnpm add -D type-coverage

# Check type coverage
pnpm type-coverage
```

## Future Enhancements

- **Stricter Configs**: Even stricter options for new code
- **Performance Configs**: Optimized for build speed
- **Library Config**: For publishing npm packages
- **Test Config**: TypeScript config for tests
- **Workspace Config**: VSCode workspace settings

## Best Practices

1. **Start Strict**: Enable strict mode from the beginning
2. **Use Project References**: For faster builds in monorepo
3. **Consistent Paths**: Use path aliases consistently
4. **Version Lock**: Lock TypeScript version across workspace
5. **Incremental Builds**: Enable incremental compilation

## Troubleshooting

### "Cannot find module" errors
- Check `paths` in tsconfig.json
- Ensure `baseUrl` is set correctly
- Verify package is in `node_modules`

### Slow type checking
- Enable `incremental: true`
- Use project references
- Exclude unnecessary files

### Type errors in dependencies
- Enable `skipLibCheck: true`
- Update dependency versions
- Add type definitions (@types/*)

## License

Proprietary - Slimy.ai
