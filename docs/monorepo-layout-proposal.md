# Slimy.ai Monorepo Layout Proposal

## Overview

This document proposes a comprehensive, scalable monorepo structure for Slimy.ai using pnpm workspaces. The structure is designed to:

- Separate applications from shared packages
- Enable code reuse across services
- Maintain clear boundaries and ownership
- Support independent deployment of services
- Facilitate testing and CI/CD automation

## Current State

The repository already has a partial monorepo structure with:
- **4 apps**: web (Next.js portal), admin-api (Express.js), admin-ui (Next.js dashboard), bot (scaffolding)
- **5 packages**: shared-auth, shared-db, shared-config, shared-codes, shared-snail (all scaffolding)
- **Infrastructure**: Docker configs, Caddy reverse proxy
- **Package Manager**: pnpm with workspace support

## Proposed Directory Structure

```
slimy-monorepo/
├── apps/                          # Runnable applications (services)
│   ├── web/                       # Customer-facing Next.js portal
│   ├── admin-api/                 # Backend administration Express.js API
│   ├── admin-ui/                  # Admin dashboard (Next.js)
│   └── bot/                       # Conversational bot service (Discord/Telegram)
│
├── packages/                      # Shared libraries and utilities
│   ├── shared-auth/               # Authentication & authorization utilities
│   ├── shared-db/                 # Database clients and Prisma helpers
│   ├── shared-config/             # Configuration loaders and validation
│   ├── shared-codes/              # Error codes, enums, protocol constants
│   ├── shared-snail/              # Core "snail" domain logic
│   ├── shared-types/              # Shared TypeScript type definitions
│   ├── shared-utils/              # Common utility functions
│   ├── eslint-config/             # Shared ESLint configurations
│   └── tsconfig/                  # Shared TypeScript configurations
│
├── infra/                         # Infrastructure and deployment
│   ├── docker/                    # Docker Compose configurations
│   ├── caddy/                     # Caddy reverse proxy configs
│   ├── systemd/                   # Systemd service files (future)
│   ├── scripts/                   # Deployment and utility scripts
│   └── monitoring/                # Prometheus, Grafana configs
│
├── tooling/                       # Build and development tooling
│   ├── pnpm-workspace.template.yaml
│   └── scripts/                   # Build and maintenance scripts
│
├── docs/                          # Documentation
│   ├── monorepo-layout-proposal.md    # This document
│   ├── monorepo-migration-checklist.md
│   ├── STRUCTURE.md               # Ownership and responsibilities
│   └── architecture/              # Architecture decision records
│
├── .github/                       # GitHub configuration
│   └── workflows/                 # CI/CD workflows
│
├── package.json                   # Root workspace configuration
├── pnpm-workspace.yaml            # Workspace definition
├── pnpm-lock.yaml                 # Dependency lock file
├── .gitignore
└── README.md
```

---

## Apps (Runnable Services)

### 1. apps/web
**Purpose**: Customer-facing web portal for Slimy.ai

**Tech Stack**:
- Framework: Next.js 16 (React 19, App Router)
- Database: Prisma ORM (MySQL/PostgreSQL)
- Styling: Tailwind CSS 4, Radix UI
- Testing: Vitest (unit), Playwright (E2E)
- Build: Turbopack dev, standalone production

**Key Features**:
- Customer authentication and profiles
- Blog and documentation (MDX)
- Marketing pages
- API routes for client interactions

**Dependencies**:
- `@slimy/shared-db`, `@slimy/shared-auth`, `@slimy/shared-config`, `@slimy/shared-types`

**Port**: 3000

---

### 2. apps/admin-api
**Purpose**: Backend REST API for administration and internal services

**Tech Stack**:
- Framework: Express.js (Node.js 20+)
- Database: Prisma ORM (MySQL/PostgreSQL)
- Authentication: JWT, Cookie sessions
- File Handling: Multer, Sharp
- Security: Helmet, CORS, Rate limiting

**Key Features**:
- Guild and user management
- Snail tracking and analytics
- File uploads and image processing
- OAuth integration (Discord)
- Real-time metrics collection

**Dependencies**:
- `@slimy/shared-db`, `@slimy/shared-auth`, `@slimy/shared-config`, `@slimy/shared-snail`, `@slimy/shared-codes`

**Port**: 3080

---

### 3. apps/admin-ui
**Purpose**: Admin dashboard for monitoring and management

**Tech Stack**:
- Framework: Next.js 14 (React 18)
- Real-time: Socket.io client
- Data Viz: Chart.js, react-chartjs-2
- Data Fetching: SWR

**Key Features**:
- Real-time dashboard metrics
- Guild and user management UI
- Snail tracking interface
- Chat monitoring

**Dependencies**:
- `@slimy/shared-types`, `@slimy/shared-utils`, `@slimy/shared-config`

**Port**: 3081

---

### 4. apps/bot
**Purpose**: Conversational bot service for Discord/Telegram

**Tech Stack** (Proposed):
- Discord.js or Telegram Bot API
- Event-driven architecture
- Redis for state management
- WebSocket connections

**Status**: Currently scaffolding only

**Dependencies** (Proposed):
- `@slimy/shared-snail`, `@slimy/shared-db`, `@slimy/shared-codes`, `@slimy/shared-config`

**Future Extensions**:
- Multi-platform support (Discord, Telegram, Slack)
- Command routing and middleware
- Integration with admin-api

---

## Packages (Shared Libraries)

### Core Business Logic

#### packages/shared-snail
**Purpose**: Core "snail" domain logic and business rules

**Contents**:
- Snail state machine
- Game mechanics
- Validation logic
- Domain events

**Current Location**: `apps/admin-api/vendor/slimy-core/`

**Tech Stack**: TypeScript, pure business logic (framework-agnostic)

---

### Data Layer

#### packages/shared-db
**Purpose**: Database clients, ORM helpers, and data access patterns

**Contents**:
- Prisma client factory
- Database connection pooling
- Migration utilities
- Query helpers and utilities
- Type-safe repository patterns

**Current Location**: `apps/admin-api/lib/database.js`, `apps/web/lib/db.ts`

**Tech Stack**: Prisma, TypeScript

---

#### packages/shared-auth
**Purpose**: Authentication and authorization utilities

**Contents**:
- JWT token generation/validation
- Session management
- OAuth providers (Discord, Google)
- RBAC (Role-Based Access Control)
- Password hashing and validation

**Current Location**:
- `apps/admin-api/lib/jwt.js`
- `apps/admin-api/lib/session.js`
- `apps/admin-api/middleware/auth.js`

**Tech Stack**: JWT, bcrypt, OAuth libraries

---

### Configuration & Constants

#### packages/shared-config
**Purpose**: Configuration loaders and schema validation

**Contents**:
- Environment variable parsing
- Configuration schema (Zod or similar)
- Multi-environment support (dev, staging, prod)
- Feature flags

**Current Location**: `apps/admin-api/src/config.js`, various `.env.example` files

**Tech Stack**: Zod, dotenv

---

#### packages/shared-codes
**Purpose**: Error codes, enums, and protocol constants

**Contents**:
- HTTP status codes
- Error code definitions
- API response codes
- Shared enums (user roles, statuses, etc.)
- Protocol constants

**Tech Stack**: TypeScript enums and constants

---

### Utilities

#### packages/shared-types
**Purpose**: Shared TypeScript type definitions

**Contents**:
- API request/response types
- Domain entity types
- Utility types
- Type guards

**Tech Stack**: TypeScript

---

#### packages/shared-utils
**Purpose**: Common utility functions

**Contents**:
- Date/time formatting
- String manipulation
- Array/object helpers
- Logging utilities
- Validation helpers

**Current Location**: Scattered across `apps/*/lib/` directories

**Tech Stack**: TypeScript, Lodash (optional)

---

### Development Tooling

#### packages/eslint-config
**Purpose**: Shared ESLint configurations for consistent code style

**Contents**:
- Base ESLint config
- React/Next.js specific rules
- TypeScript rules
- Import ordering rules

**Exports**:
- `@slimy/eslint-config/base`
- `@slimy/eslint-config/react`
- `@slimy/eslint-config/node`

---

#### packages/tsconfig
**Purpose**: Shared TypeScript configurations

**Contents**:
- `base.json` - Base TypeScript config
- `react.json` - React-specific config
- `node.json` - Node.js-specific config

**Usage**: Apps extend these configs in their `tsconfig.json`

---

## Infrastructure (infra/)

### infra/docker/
**Purpose**: Docker and container orchestration

**Contents**:
- `docker-compose.slimy-nuc1.yml` - MySQL-based dev environment
- `docker-compose.slimy-nuc2.yml` - PostgreSQL production environment
- Dockerfiles for each service
- Docker networking and volume configs
- Health check scripts

**Tech Stack**: Docker Compose, Docker

---

### infra/caddy/
**Purpose**: Reverse proxy and TLS termination

**Contents**:
- `Caddyfile.slimy-nuc2` - Production Caddy config
- Domain routing rules
- TLS/HTTPS configuration
- CORS and security headers

**Domains**:
- slimyai.xyz, www.slimyai.xyz
- login.slimyai.xyz
- panel.slimyai.xyz
- slime.chat, www.slime.chat

**Tech Stack**: Caddy v2

---

### infra/systemd/
**Purpose**: Systemd service definitions (future)

**Proposed Contents**:
- Service unit files for each app
- Auto-restart and logging configuration
- Deployment automation

**Status**: Not yet implemented

---

### infra/scripts/
**Purpose**: Deployment and utility scripts

**Proposed Contents**:
- Database backup scripts
- Deployment automation
- Health check utilities
- Log rotation scripts
- Environment setup scripts

**Status**: Partially implemented

---

### infra/monitoring/
**Purpose**: Monitoring and observability

**Contents**:
- `prometheus.yml` - Prometheus configuration
- Grafana dashboards
- AlertManager configuration
- Metrics collection setup

**Current Location**: `apps/admin-api/monitoring/`

**Proposed**: Move to `infra/monitoring/` for centralized management

---

## Tooling (tooling/)

### Purpose
Central location for build tools, scripts, and configuration templates that aren't service-specific.

**Contents**:
- `pnpm-workspace.template.yaml` - Enhanced workspace configuration template
- `scripts/` - Build and maintenance scripts
  - `validate-workspace.js` - Verify workspace integrity
  - `sync-dependencies.js` - Ensure consistent dependency versions
  - `generate-docs.js` - Auto-generate documentation

---

## Package Naming Convention

All shared packages use the `@slimy/` scope:

```json
{
  "name": "@slimy/shared-db",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

Apps use the same scope for consistency:

```json
{
  "name": "@slimy/web",
  "version": "1.0.0",
  "private": true
}
```

---

## Dependency Management

### Version Synchronization
Critical dependencies should be synchronized across all workspaces:

- React: 18.x or 19.x (standardize across apps)
- Node.js: 20.x
- TypeScript: 5.x
- Prisma: 6.x
- pnpm: 10.x

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

---

## Build and Test Strategy

### Build Order
pnpm automatically handles build order based on dependencies:

1. Shared packages first (no dependencies)
2. Packages depending on other packages
3. Apps last (depend on packages)

### Scripts

**Root `package.json`**:
```json
{
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "dev": "pnpm -r --parallel run dev",
    "clean": "pnpm -r run clean"
  }
}
```

### Testing
- Unit tests: Vitest (packages and apps)
- Integration tests: Vitest with test containers
- E2E tests: Playwright (web apps only)
- Run all: `pnpm test` from root

---

## Migration Path

### Current State → Target State

**Phase 1: Package Extraction** (High Priority)
1. Extract shared code from `apps/admin-api/lib/` to packages
2. Extract `apps/admin-api/vendor/slimy-core/` → `packages/shared-snail`
3. Create `packages/shared-types` from scattered type definitions
4. Create `packages/shared-utils` from common utilities

**Phase 2: Configuration Consolidation**
1. Centralize config in `packages/shared-config`
2. Create `packages/eslint-config` and apply to all apps
3. Create `packages/tsconfig` and apply to all apps

**Phase 3: Infrastructure Organization**
1. Move Caddyfile to `infra/caddy/`
2. Move monitoring to `infra/monitoring/`
3. Create deployment scripts in `infra/scripts/`

**Phase 4: Bot Implementation**
1. Implement `apps/bot` with Discord.js
2. Use shared packages for DB, auth, snail logic

---

## Benefits of This Structure

### Code Reuse
- Shared packages eliminate code duplication
- Single source of truth for business logic
- Consistent behavior across services

### Independent Deployment
- Apps can be deployed independently
- Shared packages versioned separately
- Docker images built per service

### Developer Experience
- Clear boundaries and ownership
- Easier onboarding (README per package/app)
- Type safety across boundaries
- Fast feedback with `pnpm dev`

### Testing
- Packages tested in isolation
- Apps tested with real package imports
- E2E tests validate full stack

### Scalability
- Easy to add new apps/packages
- Clear dependency graph
- CI/CD can parallelize builds

---

## Next Steps

1. Review and approve this proposal
2. Create placeholder READMEs for all apps/packages
3. Create migration checklist
4. Begin Phase 1 migration (package extraction)
5. Update CI/CD to build packages before apps
6. Document internal APIs for each package

---

## References

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
