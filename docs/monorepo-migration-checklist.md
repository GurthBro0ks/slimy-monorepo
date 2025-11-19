# Monorepo Migration Checklist

## Overview

This document provides a step-by-step guide for migrating the Slimy.ai codebase to the fully realized monorepo structure proposed in `monorepo-layout-proposal.md`.

The migration is designed to be incremental and non-breaking. You can complete it in phases over multiple sprints without disrupting existing functionality.

## Current State

✅ **Already in place**:
- pnpm workspace configuration
- Apps: web, admin-api, admin-ui, bot (scaffolding)
- Packages: shared-auth, shared-db, shared-config, shared-codes, shared-snail (scaffolding)
- Docker infrastructure
- CI/CD workflows

❌ **Needs work**:
- Shared packages are empty scaffolds
- Duplicate code across apps
- No TypeScript project references
- Inconsistent configurations
- Shared code not extracted

## Migration Phases

The migration is divided into **4 phases** that can be completed independently:

1. **Phase 1**: Package Extraction (High Priority)
2. **Phase 2**: Configuration Consolidation (Medium Priority)
3. **Phase 3**: Infrastructure Organization (Low Priority)
4. **Phase 4**: Tooling and Optimization (Nice to Have)

---

## Phase 1: Package Extraction

**Goal**: Extract shared code from apps into reusable packages

**Duration**: 2-3 sprints

**Priority**: **HIGH** - Reduces code duplication and improves maintainability

### Step 1.1: Extract `@slimy/shared-snail` (Week 1)

**Current Location**: `apps/admin-api/vendor/slimy-core/`

**Target**: `packages/shared-snail/`

#### Tasks

- [ ] **1.1.1** Create package structure
  ```bash
  cd packages/shared-snail
  pnpm init
  ```

- [ ] **1.1.2** Copy code from vendor
  ```bash
  cp -r ../../apps/admin-api/vendor/slimy-core/* ./src/
  ```

- [ ] **1.1.3** Set up TypeScript
  ```bash
  cp ../tsconfig/base.json ./tsconfig.json
  # Edit tsconfig.json for package-specific settings
  ```

- [ ] **1.1.4** Add package.json scripts
  ```json
  {
    "name": "@slimy/shared-snail",
    "version": "0.1.0",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "scripts": {
      "build": "tsc",
      "test": "vitest",
      "lint": "eslint src/",
      "clean": "rm -rf dist"
    }
  }
  ```

- [ ] **1.1.5** Write tests
  - Unit tests for all domain logic
  - Aim for 100% coverage

- [ ] **1.1.6** Update admin-api to import from package
  ```typescript
  // Before
  import { SnailService } from './vendor/slimy-core';

  // After
  import { SnailService } from '@slimy/shared-snail';
  ```

- [ ] **1.1.7** Remove vendor code after migration
  ```bash
  rm -rf apps/admin-api/vendor/slimy-core
  ```

- [ ] **1.1.8** Test admin-api still works

- [ ] **1.1.9** Commit changes
  ```bash
  git add packages/shared-snail apps/admin-api
  git commit -m "feat(shared-snail): extract core snail logic to shared package"
  ```

**Acceptance Criteria**:
- ✅ All snail domain logic is in `@slimy/shared-snail`
- ✅ Admin API imports and uses the package
- ✅ All tests pass
- ✅ No code duplication

---

### Step 1.2: Extract `@slimy/shared-db` (Week 1-2)

**Current Location**:
- `apps/admin-api/lib/database.js`
- `apps/web/lib/db.ts`

**Target**: `packages/shared-db/`

#### Tasks

- [ ] **1.2.1** Create package structure
  ```bash
  cd packages/shared-db
  pnpm init
  mkdir -p src/{prisma,redis,repositories,query}
  ```

- [ ] **1.2.2** Extract Prisma client factory
  - Copy from `apps/admin-api/lib/database.js`
  - Make it configurable (don't hardcode env vars)

- [ ] **1.2.3** Extract Redis client factory
  - If using Redis for caching/sessions

- [ ] **1.2.4** Create repository base class
  ```typescript
  // src/repositories/base.ts
  export class BaseRepository<T> {
    constructor(protected model: any) {}
    // CRUD methods
  }
  ```

- [ ] **1.2.5** Add query helpers
  - Pagination
  - Filtering
  - Sorting

- [ ] **1.2.6** Add dependencies
  ```bash
  pnpm add @prisma/client prisma redis
  pnpm add -D @types/node typescript vitest
  ```

- [ ] **1.2.7** Decide on Prisma schema strategy
  - **Option A**: Shared schema in `packages/shared-db/prisma/`
  - **Option B**: Keep separate schemas in apps
  - Document decision

- [ ] **1.2.8** Update apps to use `@slimy/shared-db`
  ```typescript
  // apps/web/lib/db.ts
  import { getPrismaClient } from '@slimy/shared-db';

  export const prisma = getPrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
  ```

- [ ] **1.2.9** Write tests for DB utilities

- [ ] **1.2.10** Remove duplicate DB code from apps

- [ ] **1.2.11** Commit changes

**Acceptance Criteria**:
- ✅ Prisma client factory is reusable
- ✅ Both web and admin-api use the shared package
- ✅ All database operations work correctly
- ✅ Tests cover all DB utilities

---

### Step 1.3: Extract `@slimy/shared-auth` (Week 2)

**Current Location**:
- `apps/admin-api/lib/jwt.js`
- `apps/admin-api/lib/session.js`
- `apps/admin-api/middleware/auth.js`

**Target**: `packages/shared-auth/`

#### Tasks

- [ ] **1.3.1** Create package structure
  ```bash
  cd packages/shared-auth
  pnpm init
  mkdir -p src/{jwt,session,oauth,rbac,cookies}
  ```

- [ ] **1.3.2** Extract JWT utilities
  - Token generation
  - Token verification
  - Token refresh

- [ ] **1.3.3** Extract session management
  - Session creation
  - Session validation
  - Session storage (Redis)

- [ ] **1.3.4** Extract OAuth providers
  - Discord OAuth
  - Google OAuth (if applicable)

- [ ] **1.3.5** Extract RBAC logic
  - Permission checking
  - Role validation
  - Middleware functions

- [ ] **1.3.6** Add dependencies
  ```bash
  pnpm add jsonwebtoken bcrypt cookie
  pnpm add -D @types/jsonwebtoken @types/bcrypt @types/cookie
  ```

- [ ] **1.3.7** Make utilities configurable
  ```typescript
  // Don't read process.env directly
  export const createToken = (payload, options: TokenOptions) => {
    // Use options.secret instead of process.env.JWT_SECRET
  };
  ```

- [ ] **1.3.8** Update admin-api to use package
  ```typescript
  import { createToken, verifyToken } from '@slimy/shared-auth';
  ```

- [ ] **1.3.9** Write tests

- [ ] **1.3.10** Remove duplicate auth code from apps

- [ ] **1.3.11** Commit changes

**Acceptance Criteria**:
- ✅ All auth logic is in `@slimy/shared-auth`
- ✅ Apps import from shared package
- ✅ Auth still works correctly
- ✅ Tests cover all auth utilities

---

### Step 1.4: Extract `@slimy/shared-types` (Week 3)

**Current Location**: Scattered across `apps/*/types/`

**Target**: `packages/shared-types/`

#### Tasks

- [ ] **1.4.1** Create package structure
  ```bash
  cd packages/shared-types
  pnpm init
  mkdir -p src/{api,entities,utilities,guards,events}
  ```

- [ ] **1.4.2** Define API types
  - Request types
  - Response types
  - Error types
  - Pagination types

- [ ] **1.4.3** Define domain entity types
  - User, Guild, Snail, Item, etc.

- [ ] **1.4.4** Define utility types
  - Nullable, Optional, DeepPartial, etc.

- [ ] **1.4.5** Create type guards
  ```typescript
  export function isUser(data: unknown): data is User {
    return typeof data === 'object' && data !== null && 'id' in data;
  }
  ```

- [ ] **1.4.6** Update apps to import from package
  ```typescript
  import type { User, ApiResponse } from '@slimy/shared-types';
  ```

- [ ] **1.4.7** Write tests for type guards

- [ ] **1.4.8** Remove duplicate type definitions

- [ ] **1.4.9** Commit changes

**Acceptance Criteria**:
- ✅ All shared types are in `@slimy/shared-types`
- ✅ Apps import types from package
- ✅ TypeScript compilation works
- ✅ Type guards have tests

---

### Step 1.5: Extract `@slimy/shared-utils` (Week 3)

**Current Location**: Scattered across `apps/*/lib/utils/`

**Target**: `packages/shared-utils/`

#### Tasks

- [ ] **1.5.1** Create package structure
  ```bash
  cd packages/shared-utils
  pnpm init
  mkdir -p src/{string,date,array,object,validation,crypto,async,logger}
  ```

- [ ] **1.5.2** Extract string utilities
  - capitalize, slugify, truncate, etc.

- [ ] **1.5.3** Extract date utilities
  - formatDate, parseDate, isExpired, etc.

- [ ] **1.5.4** Extract array/object utilities
  - chunk, unique, groupBy, pick, omit, etc.

- [ ] **1.5.5** Extract validation utilities
  - isEmail, isUrl, isUuid, etc.

- [ ] **1.5.6** Add dependencies (if needed)
  ```bash
  pnpm add date-fns
  ```

- [ ] **1.5.7** Update apps to use package
  ```typescript
  import { slugify, formatDate } from '@slimy/shared-utils';
  ```

- [ ] **1.5.8** Write comprehensive tests

- [ ] **1.5.9** Remove duplicate utility code

- [ ] **1.5.10** Commit changes

**Acceptance Criteria**:
- ✅ All shared utilities are in `@slimy/shared-utils`
- ✅ Apps import from package
- ✅ All utilities work correctly
- ✅ Tests cover all utilities

---

## Phase 2: Configuration Consolidation

**Goal**: Standardize configurations across the monorepo

**Duration**: 1-2 sprints

**Priority**: **MEDIUM** - Improves consistency and maintainability

### Step 2.1: Create `@slimy/shared-config` (Week 4)

**Target**: `packages/shared-config/`

#### Tasks

- [ ] **2.1.1** Create package structure
  ```bash
  cd packages/shared-config
  pnpm init
  mkdir -p src/{loader,validator,schema,env,features,presets}
  ```

- [ ] **2.1.2** Add dependencies
  ```bash
  pnpm add zod dotenv dotenv-expand
  ```

- [ ] **2.1.3** Define base configuration schema
  ```typescript
  import { z } from 'zod';

  export const baseConfigSchema = z.object({
    app: z.object({
      name: z.string(),
      port: z.coerce.number(),
      env: z.enum(['development', 'staging', 'production']),
    }),
    database: z.object({
      url: z.string().url(),
    }),
    // ...
  });
  ```

- [ ] **2.1.4** Create configuration loader
  ```typescript
  export function loadConfig(schema: ZodSchema, options?: LoadOptions) {
    // Load from .env, validate, return typed config
  }
  ```

- [ ] **2.1.5** Create app-specific presets
  - Web config preset
  - API config preset
  - Bot config preset

- [ ] **2.1.6** Add feature flag support
  ```typescript
  export function isFeatureEnabled(flag: string): boolean {
    // Check feature flags
  }
  ```

- [ ] **2.1.7** Update apps to use package
  ```typescript
  import { loadConfig, apiConfigSchema } from '@slimy/shared-config';

  const config = loadConfig(apiConfigSchema);
  ```

- [ ] **2.1.8** Write tests

- [ ] **2.1.9** Commit changes

**Acceptance Criteria**:
- ✅ Configuration loading is centralized
- ✅ All env vars are validated
- ✅ Apps use shared config package
- ✅ Feature flags work

---

### Step 2.2: Create `@slimy/eslint-config` (Week 4)

**Target**: `packages/eslint-config/`

#### Tasks

- [ ] **2.2.1** Create package structure
  ```bash
  cd packages/eslint-config
  pnpm init
  mkdir -p src/rules
  ```

- [ ] **2.2.2** Create base ESLint config
  - TypeScript support
  - Import rules
  - Style rules

- [ ] **2.2.3** Create framework-specific configs
  - React config
  - Next.js config
  - Node.js config

- [ ] **2.2.4** Add dependencies
  ```bash
  pnpm add @typescript-eslint/eslint-plugin @typescript-eslint/parser \
    eslint-plugin-import eslint-plugin-react eslint-plugin-react-hooks \
    eslint-config-prettier
  ```

- [ ] **2.2.5** Update apps to use shared config
  ```javascript
  // apps/web/.eslintrc.js
  module.exports = {
    extends: ['@slimy/eslint-config/next'],
  };
  ```

- [ ] **2.2.6** Fix linting errors across apps

- [ ] **2.2.7** Update CI to run linting

- [ ] **2.2.8** Commit changes

**Acceptance Criteria**:
- ✅ All apps use shared ESLint config
- ✅ Linting is consistent across monorepo
- ✅ CI enforces linting

---

### Step 2.3: Create `@slimy/tsconfig` (Week 5)

**Target**: `packages/tsconfig/`

#### Tasks

- [ ] **2.3.1** Create package structure
  ```bash
  cd packages/tsconfig
  pnpm init
  ```

- [ ] **2.3.2** Create base tsconfig.json
  ```json
  {
    "$schema": "https://json.schemastore.org/tsconfig",
    "compilerOptions": {
      "target": "ES2022",
      "lib": ["ES2022"],
      "module": "ESNext",
      "strict": true,
      // ... more options
    }
  }
  ```

- [ ] **2.3.3** Create framework-specific configs
  - react.json
  - next.json
  - node.json

- [ ] **2.3.4** Update apps to extend shared configs
  ```json
  {
    "extends": "@slimy/tsconfig/next.json",
    "compilerOptions": {
      "outDir": "./dist"
    }
  }
  ```

- [ ] **2.3.5** Enable TypeScript project references
  ```json
  // Root tsconfig.json
  {
    "references": [
      { "path": "./packages/shared-types" },
      { "path": "./packages/shared-db" },
      // ...
    ]
  }
  ```

- [ ] **2.3.6** Update build scripts to use `tsc --build`

- [ ] **2.3.7** Test incremental builds work

- [ ] **2.3.8** Commit changes

**Acceptance Criteria**:
- ✅ All apps use shared TypeScript configs
- ✅ Project references are configured
- ✅ Incremental builds work
- ✅ Type checking is consistent

---

## Phase 3: Infrastructure Organization

**Goal**: Better organize infrastructure files

**Duration**: 1 sprint

**Priority**: **LOW** - Nice to have, improves organization

### Step 3.1: Reorganize Caddy Configuration (Week 6)

#### Tasks

- [ ] **3.1.1** Create `infra/caddy/` directory (already done)

- [ ] **3.1.2** Move Caddyfile
  ```bash
  mv infra/docker/Caddyfile.slimy-nuc2 infra/caddy/Caddyfile
  ```

- [ ] **3.1.3** Update docker-compose.yml
  ```yaml
  caddy:
    volumes:
      - ../caddy/Caddyfile:/etc/caddy/Caddyfile:ro
  ```

- [ ] **3.1.4** Test Caddy configuration

- [ ] **3.1.5** Update documentation

- [ ] **3.1.6** Commit changes

**Acceptance Criteria**:
- ✅ Caddyfile is in `infra/caddy/`
- ✅ Caddy works correctly
- ✅ Documentation is updated

---

### Step 3.2: Create Deployment Scripts (Week 6)

**Target**: `infra/scripts/`

#### Tasks

- [ ] **3.2.1** Create script directory (already done)

- [ ] **3.2.2** Create deploy.sh
  - Pull latest code
  - Build images
  - Run migrations
  - Restart services

- [ ] **3.2.3** Create backup-db.sh
  - Backup PostgreSQL database
  - Compress and store

- [ ] **3.2.4** Create health-check.sh
  - Check all services
  - Report status

- [ ] **3.2.5** Make scripts executable
  ```bash
  chmod +x infra/scripts/*.sh
  ```

- [ ] **3.2.6** Test scripts in development

- [ ] **3.2.7** Set up cron jobs for automated tasks
  ```bash
  # Backup database daily at 2 AM
  0 2 * * * /opt/slimy/infra/scripts/backup-db.sh
  ```

- [ ] **3.2.8** Document scripts in README

- [ ] **3.2.9** Commit changes

**Acceptance Criteria**:
- ✅ Deployment scripts are created
- ✅ Scripts work correctly
- ✅ Cron jobs are configured
- ✅ Documentation is complete

---

## Phase 4: Tooling and Optimization

**Goal**: Add developer tooling and optimize builds

**Duration**: 1 sprint

**Priority**: **NICE TO HAVE** - Developer experience improvements

### Step 4.1: Adopt Enhanced Workspace Config (Week 7)

#### Tasks

- [ ] **4.1.1** Review template workspace config
  ```bash
  cat tooling/pnpm-workspace.template.yaml
  ```

- [ ] **4.1.2** Compare with current workspace config
  ```bash
  diff pnpm-workspace.yaml tooling/pnpm-workspace.template.yaml
  ```

- [ ] **4.1.3** Decide whether to adopt template

- [ ] **4.1.4** If adopting, backup current config
  ```bash
  cp pnpm-workspace.yaml pnpm-workspace.yaml.backup
  ```

- [ ] **4.1.5** Copy template to root
  ```bash
  cp tooling/pnpm-workspace.template.yaml pnpm-workspace.yaml
  ```

- [ ] **4.1.6** Run pnpm install

- [ ] **4.1.7** Test builds and workspace commands

- [ ] **4.1.8** Commit changes

**Acceptance Criteria**:
- ✅ Workspace config is up to date
- ✅ All packages are recognized
- ✅ Workspace commands work

---

### Step 4.2: Create Workspace Validation Script (Week 7)

#### Tasks

- [ ] **4.2.1** Create `tooling/validate-workspace.js`
  ```javascript
  // Validate:
  // - All packages have package.json
  // - No circular dependencies
  // - Workspace protocol usage
  ```

- [ ] **4.2.2** Add script to root package.json
  ```json
  {
    "scripts": {
      "validate": "node tooling/validate-workspace.js"
    }
  }
  ```

- [ ] **4.2.3** Run validation manually

- [ ] **4.2.4** Add to CI
  ```yaml
  - run: pnpm validate
  ```

- [ ] **4.2.5** Commit changes

**Acceptance Criteria**:
- ✅ Validation script works
- ✅ CI runs validation
- ✅ No validation errors

---

### Step 4.3: Create Dependency Sync Script (Week 7)

#### Tasks

- [ ] **4.3.1** Create `tooling/sync-dependencies.js`
  ```javascript
  // Ensure consistent versions of:
  // - TypeScript
  // - React
  // - Prisma
  // - Testing libraries
  ```

- [ ] **4.3.2** Add script to root package.json
  ```json
  {
    "scripts": {
      "sync-deps": "node tooling/sync-dependencies.js"
    }
  }
  ```

- [ ] **4.3.3** Run sync manually

- [ ] **4.3.4** Update dependencies as needed

- [ ] **4.3.5** Commit changes

**Acceptance Criteria**:
- ✅ Critical dependencies are synchronized
- ✅ Script works correctly
- ✅ No version conflicts

---

## Verification Checklist

After completing all phases, verify the migration:

### Code Organization
- [ ] All shared code is in packages
- [ ] No duplicate code across apps
- [ ] Clear package boundaries

### Configuration
- [ ] All apps use shared ESLint config
- [ ] All apps use shared TypeScript config
- [ ] Environment variables are validated

### Build System
- [ ] All packages build successfully
- [ ] TypeScript project references work
- [ ] Incremental builds are faster

### Testing
- [ ] All tests pass
- [ ] Shared packages have tests
- [ ] CI runs all tests

### Documentation
- [ ] All packages have READMEs
- [ ] Migration is documented
- [ ] Examples are provided

### Infrastructure
- [ ] Docker setup works
- [ ] Deployment scripts exist
- [ ] Monitoring is in place

---

## Rollback Plan

If something goes wrong during migration:

1. **Revert git commits**:
   ```bash
   git revert <commit-hash>
   ```

2. **Restore backup**:
   ```bash
   git checkout <branch-before-migration>
   ```

3. **Fix and retry**:
   - Identify the issue
   - Fix in isolation
   - Test thoroughly
   - Retry migration

---

## Success Metrics

Measure the success of the migration:

### Code Quality
- **Duplication**: < 5% duplicate code (down from ~30%)
- **Test Coverage**: > 80% across all packages
- **Type Safety**: 100% TypeScript coverage

### Build Performance
- **Incremental Build Time**: < 30s (down from 2min)
- **Cold Build Time**: < 5min
- **CI Time**: < 10min

### Developer Experience
- **Onboarding Time**: < 1 hour for new developers
- **Bug Fix Time**: -50% (easier to locate code)
- **Feature Development Time**: -30% (code reuse)

---

## Timeline

Recommended timeline for completing the migration:

| Phase | Weeks | Sprint |
|-------|-------|--------|
| Phase 1: Package Extraction | 3 weeks | Sprint 1-2 |
| Phase 2: Configuration | 2 weeks | Sprint 2-3 |
| Phase 3: Infrastructure | 1 week | Sprint 3 |
| Phase 4: Tooling | 1 week | Sprint 4 |
| **Total** | **7 weeks** | **4 sprints** |

**Recommendation**: Don't try to do everything at once. Complete one phase before moving to the next.

---

## Support and Questions

If you encounter issues during migration:

1. **Check documentation**: Review README files in each package
2. **Search for similar issues**: Check GitHub issues
3. **Ask the team**: Post in team chat
4. **Create an issue**: Document blockers

---

## License

Proprietary - Slimy.ai
