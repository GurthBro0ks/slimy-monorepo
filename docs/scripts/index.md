# Slimy Scripts Index

This document catalogs all scripts and automation tooling available in the slimy-monorepo.

## Table of Contents

- [Development Scripts](#development-scripts)
- [Build & Deploy Scripts](#build--deploy-scripts)
- [Testing Scripts](#testing-scripts)
- [Database Scripts](#database-scripts)
- [Diagnostic & Operations Scripts](#diagnostic--operations-scripts)
- [Shell Scripts](#shell-scripts)
- [TypeScript Utility Scripts](#typescript-utility-scripts)
- [Missing Script Ideas](#missing-script-ideas)

---

## Development Scripts

### Root-Level Scripts

**Location:** `/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `lint` | Run linting across all workspace packages | `pnpm lint` |
| `build` | Build all workspace packages | `pnpm build` |
| `test` | Run tests across all workspace packages | `pnpm test` |

### Web App Development

**Location:** `apps/web/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `dev` | Start Next.js development server with Turbopack | `cd apps/web && pnpm dev` |
| `start` | Start Next.js production server | `cd apps/web && pnpm start` |
| `lint` | Run ESLint on web app code | `cd apps/web && pnpm lint` |

### Admin UI Development

**Location:** `apps/admin-ui/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `dev` | Start Next.js dev server on port 3081 | `cd apps/admin-ui && pnpm dev` |
| `start` | Start Next.js production server on port 3081 | `cd apps/admin-ui && pnpm start` |

### Admin API Development

**Location:** `apps/admin-api/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `dev` | Run Express server directly from source | `cd apps/admin-api && pnpm dev` |
| `start` | Run Express server in production mode | `cd apps/admin-api && pnpm start` |

---

## Build & Deploy Scripts

### Web App Build Scripts

**Location:** `apps/web/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `build` | Build Next.js app for production | `cd apps/web && pnpm build` |
| `build:analyze` | Build with webpack bundle analyzer enabled | `cd apps/web && ANALYZE=true pnpm build` |
| `build:check` | Build and check bundle sizes against thresholds | `cd apps/web && pnpm build:check` |
| `postbuild` | Post-build validation (runs automatically after build) | Runs automatically after `pnpm build` |

### Admin UI Build Scripts

**Location:** `apps/admin-ui/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `build` | Build Next.js admin UI for production | `cd apps/admin-ui && pnpm build` |

### Admin API Build Scripts

**Location:** `apps/admin-api/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `build` | No-op build (runs directly from source) | `cd apps/admin-api && pnpm build` |

---

## Testing Scripts

### Web App Testing

**Location:** `apps/web/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `test` | Run Vitest unit tests in watch mode | `cd apps/web && pnpm test` |
| `test:coverage` | Run tests with coverage report | `cd apps/web && pnpm test:coverage` |
| `test:e2e` | Run Playwright end-to-end tests | `cd apps/web && pnpm test:e2e` |
| `test:e2e:ui` | Run Playwright tests with UI mode | `cd apps/web && pnpm test:e2e:ui` |
| `lighthouse` | Run Lighthouse CI performance audit | `cd apps/web && pnpm lighthouse` |
| `lighthouse:mobile` | Run Lighthouse CI with mobile preset | `cd apps/web && pnpm lighthouse:mobile` |

---

## Database Scripts

### Web App Database Scripts

**Location:** `apps/web/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `db:generate` | Generate Prisma client from schema | `cd apps/web && pnpm db:generate` |
| `db:migrate` | Run database migrations in development | `cd apps/web && pnpm db:migrate` |
| `db:migrate:prod` | Deploy migrations to production | `cd apps/web && pnpm db:migrate:prod` |
| `db:studio` | Open Prisma Studio database GUI | `cd apps/web && pnpm db:studio` |
| `db:seed` | Seed database with initial data | `cd apps/web && pnpm db:seed` |
| `db:reset` | Reset database (drop, migrate, seed) | `cd apps/web && pnpm db:reset` |

---

## Diagnostic & Operations Scripts

### Web App Documentation

**Location:** `apps/web/package.json`

| Script | Description | How to Run |
|--------|-------------|------------|
| `docs:import` | Import documentation from GitHub repository | `cd apps/web && pnpm docs:import` |
| `docs:check` | Dry-run check of documentation import | `cd apps/web && pnpm docs:check` |

---

## Shell Scripts

### Web App Shell Scripts

**Location:** `apps/web/`

#### setup-env.sh

**Purpose:** Extract credentials from admin-api .env file and create docker-compose .env

**Description:** This script reads the admin-api production environment file and generates a Docker Compose-compatible .env file with necessary variables for the web app.

**Usage:**
```bash
cd apps/web
./setup-env.sh
```

**Prerequisites:**
- Requires `/opt/slimy/app/admin-api/.env.admin.production` to exist
- Extracts Discord OAuth, session secrets, API keys
- Adds web-specific configuration variables

---

#### quickstart.sh

**Purpose:** Complete Docker-based development environment setup

**Description:** Automated quickstart script that:
- Creates .env.docker from admin-api configuration
- Installs admin-api dependencies if needed
- Builds Docker images for web and admin-api
- Starts services with health checks
- Verifies both services are running correctly

**Usage:**
```bash
cd apps/web
./quickstart.sh
```

**What it does:**
1. Sets up environment variables
2. Installs dependencies
3. Builds Docker images
4. Starts admin-api (port 3080) and web app (port 3001)
5. Runs health checks with 30-attempt retries
6. Displays service status and useful commands

**Output Services:**
- Admin API: http://localhost:3080
- Web App: http://localhost:3001

---

#### deploy-to-server.sh

**Purpose:** Production deployment automation for slimyai-web

**Description:** Complete production deployment script for server environments. Handles:
- Git repository clone/update
- Docker container management
- Caddy reverse proxy configuration
- Systemd service setup
- Health checks and validation

**Usage:**
```bash
# Run on production server
sudo ./deploy-to-server.sh
```

**What it does:**
1. Clones/updates repository to `/opt/slimy/web`
2. Checks admin API availability on port 3080
3. Configures docker-compose.yml with production settings
4. Updates Caddyfile for HTTPS reverse proxy
5. Builds and starts Docker container on port 3001
6. Creates systemd service for auto-restart
7. Validates deployment through health checks

**Configuration:**
- Domain: admin.slimyai.xyz
- Web port: 3001 (container: 3000)
- Admin API port: 3080
- Includes security headers and gzip compression

---

## TypeScript Utility Scripts

**Location:** `apps/web/scripts/`

### import-docs.ts

**Purpose:** Import documentation from GitHub repository

**Description:** Fetches markdown documentation from a GitHub repository and imports it into the local content directory. Supports dry-run mode for validation.

**Usage:**
```bash
cd apps/web

# Import docs
pnpm docs:import

# Dry-run check
pnpm docs:check
```

**Environment Variables:**
- `DOCS_SOURCE_REPO`: Source GitHub repository
- `DOCS_SOURCE_PATH`: Path within repo (default: "docs")
- `GITHUB_TOKEN`: GitHub API token (optional, for private repos)

**Features:**
- Fetches documentation from GitHub API
- Processes frontmatter metadata
- Preserves document order
- Dry-run mode for validation

---

### postbuild-validate.ts

**Purpose:** Post-build validation and sanity checks

**Description:** Runs automatically after Next.js build to validate:
- Required environment variables are set
- Documentation directory exists
- Critical documentation files are present
- Build output directory was created

**Usage:**
```bash
cd apps/web
tsx scripts/postbuild-validate.ts
```

**Note:** Runs automatically via the `postbuild` npm script hook.

**Checks:**
- Production env vars (NEXT_PUBLIC_ADMIN_API_BASE)
- Docs directory existence
- getting-started.mdx presence
- .next build directory

---

### check-bundle-size.ts

**Purpose:** Bundle size monitoring and regression prevention

**Description:** Analyzes Next.js build output and reports bundle sizes. Can be used in CI/CD pipelines to prevent bundle size regressions.

**Usage:**
```bash
cd apps/web
pnpm build:check
```

**Configuration (default thresholds):**
- Max initial bundle: 1MB (1000 KB)
- Max route chunk: 500 KB
- Max total bundle: 3MB (3000 KB)
- Warning threshold: 80% of limit

**Features:**
- Parses Next.js build manifest
- Reports per-route bundle sizes
- Warns when approaching thresholds
- Exits with error code if limits exceeded

---

## Missing Script Ideas

The following scripts would be helpful additions to the repository:

### 1. Monorepo Health Check Script

**Suggested name:** `scripts/health-check.sh`

**Purpose:** Comprehensive health check for the entire monorepo

**What it should do:**
- Check all package.json files for missing dependencies
- Validate pnpm workspace configuration
- Check for circular dependencies
- Verify all apps/packages build successfully
- Check for outdated dependencies with security vulnerabilities
- Validate environment variable configuration across apps

**How to run:**
```bash
./scripts/health-check.sh --full
./scripts/health-check.sh --quick  # Skip slow checks
```

---

### 2. Database Backup & Restore Script

**Suggested name:** `scripts/db-backup.sh` and `scripts/db-restore.sh`

**Purpose:** Easy database backup and restoration for all environments

**What it should do:**
- Create timestamped database backups
- Support multiple backup targets (local, S3, etc.)
- Restore from specific backup files
- List available backups
- Clean up old backups (retention policy)
- Work with both development and production databases

**How to run:**
```bash
./scripts/db-backup.sh --env production --target s3
./scripts/db-restore.sh --file backup-2025-11-19.sql
./scripts/db-backup.sh --list
```

---

### 3. Development Environment Reset Script

**Suggested name:** `scripts/dev-reset.sh`

**Purpose:** Complete development environment reset and cleanup

**What it should do:**
- Stop all running Docker containers
- Clear all node_modules directories
- Clear pnpm cache
- Reset all databases to clean state
- Clear Next.js build caches (.next directories)
- Re-install all dependencies
- Run database migrations and seed data
- Optionally preserve certain data (user configs, etc.)

**How to run:**
```bash
./scripts/dev-reset.sh --full           # Complete reset
./scripts/dev-reset.sh --preserve-data  # Keep database data
./scripts/dev-reset.sh --deps-only      # Only reinstall dependencies
```

---

### 4. CI/CD Preview Script

**Suggested name:** `scripts/ci-preview.sh`

**Purpose:** Run the same checks locally that CI/CD pipeline runs

**What it should do:**
- Run linting across all packages
- Run type checking with TypeScript
- Run all unit tests with coverage
- Run build for all apps
- Check bundle sizes
- Run security audit (npm audit, etc.)
- Check for TODO/FIXME comments in critical areas
- Generate summary report

**How to run:**
```bash
./scripts/ci-preview.sh                # Run all checks
./scripts/ci-preview.sh --lint-only    # Only linting
./scripts/ci-preview.sh --no-build     # Skip builds
```

---

### 5. Dependency Update Script

**Suggested name:** `scripts/update-deps.sh`

**Purpose:** Safe, coordinated dependency updates across the monorepo

**What it should do:**
- Check for outdated dependencies
- Group updates by risk level (major, minor, patch)
- Update dependencies one group at a time
- Run tests after each update group
- Create git commits for each update group
- Roll back if tests fail
- Generate update report with changelogs
- Handle pnpm workspace-specific dependencies

**How to run:**
```bash
./scripts/update-deps.sh --patch-only    # Safe patch updates
./scripts/update-deps.sh --minor         # Include minor updates
./scripts/update-deps.sh --interactive   # Prompt for each update
./scripts/update-deps.sh --report        # Just show what's outdated
```

---

## Notes

- All `pnpm` commands should be run from the respective package directory or from the root with workspace filters
- Shell scripts assume a Linux/Unix environment
- TypeScript scripts use `tsx` for execution (no compilation needed)
- Most scripts have `#!/usr/bin/env` shebangs for portability
- Production deployment scripts assume specific server paths and domain configuration

---

**Last Updated:** 2025-11-19
