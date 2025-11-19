# NPM/PNPM Scripts Reference

This document describes the main entry-point scripts available in the slimy-monorepo.

## Quick Start

From the repository root, you can run:

```bash
pnpm dev              # Start the web app in development mode
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm lint             # Lint all apps
```

## Script Groups

All scripts are organized into logical groups for better discoverability.

### Development Scripts (dev:*)

Run applications in development mode with hot-reloading:

- `pnpm dev` or `pnpm dev:web` - Start the web application (Next.js on default port)
- `pnpm dev:admin-ui` - Start the admin UI (Next.js on port 3081)
- `pnpm dev:admin-api` - Start the admin API (Express.js)

### Build Scripts (build:*)

Build applications for production:

- `pnpm build` or `pnpm build:all` - Build all applications
- `pnpm build:web` - Build the web application only
- `pnpm build:admin-ui` - Build the admin UI only
- `pnpm build:admin-api` - Build the admin API (currently runs from source)

Additional build utilities for web:
- `pnpm --filter @slimy/web build:analyze` - Build with bundle analyzer
- `pnpm --filter @slimy/web build:check` - Build and check bundle size

### Test Scripts (test:*)

Run tests across the monorepo:

- `pnpm test` or `pnpm test:all` - Run all tests in all workspaces
- `pnpm test:web` - Run unit tests for the web app (Vitest)
- `pnpm test:coverage` - Run web tests with coverage report
- `pnpm test:e2e` - Run end-to-end tests (Playwright)
- `pnpm test:e2e:ui` - Run e2e tests with Playwright UI

### Lint Scripts (lint:*)

Lint code across the monorepo:

- `pnpm lint` or `pnpm lint:all` - Lint all workspaces
- `pnpm lint:web` - Lint the web application only

### Database Scripts (db:*)

Manage Prisma database operations (web app):

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run migrations in development
- `pnpm db:migrate:prod` - Run migrations in production
- `pnpm db:studio` - Open Prisma Studio (database GUI)
- `pnpm db:seed` - Seed the database
- `pnpm db:reset` - Reset the database (warning: destructive)

### Documentation Scripts (docs:*)

Manage documentation imports (web app):

- `pnpm docs:import` - Import documentation files
- `pnpm docs:check` - Check documentation imports (dry-run)

### Infrastructure Scripts (infra:*)

Run performance and quality checks:

- `pnpm lighthouse` - Run Lighthouse performance audit (web)
- `pnpm lighthouse:mobile` - Run Lighthouse with mobile preset

## App-Specific Scripts

Each application has its own package.json with standard scripts:

### apps/web
- Full suite: `dev`, `build`, `start`, `test`, `lint`
- See package.json for specialized scripts (db, docs, lighthouse, etc.)

### apps/admin-ui
- Basic suite: `dev`, `build`, `start`, `test`, `lint`

### apps/admin-api
- Basic suite: `dev`, `start`, `build`, `test`, `lint`

### apps/bot
- Placeholder scripts: `dev`, `start`, `build`, `test`, `lint` (all TODO)

## Running Scripts in Specific Apps

To run a script in a specific app, use the `--filter` flag:

```bash
pnpm --filter @slimy/web <script-name>
pnpm --filter @slimy/admin-ui <script-name>
pnpm --filter @slimy/admin-api <script-name>
pnpm --filter @slimy/bot <script-name>
```

Example:
```bash
pnpm --filter @slimy/web test:coverage
```

## Running Scripts Recursively

To run a script in all workspaces that have it defined:

```bash
pnpm -r run <script-name>
```

Example:
```bash
pnpm -r run build
```

## Notes

- Some apps have placeholder scripts (marked with "TODO") that need implementation
- The bot app currently has minimal scripts and needs proper setup
- Database scripts operate on the web app's Prisma setup
- All scripts maintain backward compatibility with existing commands
