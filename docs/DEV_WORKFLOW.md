# Development Workflow

This guide explains how to develop, test, and run applications in the Slimy monorepo. Whether you're new to the project or need a quick reference, this document covers the essential commands and workflows.

## Prerequisites

- **Node.js**: Version 20 or higher
- **pnpm**: Install with `npm install -g pnpm` if not already available
- **Git**: For version control

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/GurthBro0ks/slimy-monorepo.git
cd slimy-monorepo
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the entire monorepo workspace, including all apps and packages.

### 3. Environment Configuration

Each app may require environment variables. Check for `.env.example` files in each app directory:

- `apps/admin-api/.env.example` → Copy to `apps/admin-api/.env`
- `apps/web/.env.example` → Copy to `apps/web/.env` (if exists)

Example:
```bash
cp apps/admin-api/.env.example apps/admin-api/.env
# Edit .env files with your local configuration
```

### 4. Generate Prisma Client (if needed)

Some apps use Prisma for database access:

```bash
pnpm prisma:generate
```

## Running Applications in Development Mode

Each application can be started individually in development mode with hot reloading enabled.

### Web Application

The main public-facing web application built with Next.js.

```bash
# From root
pnpm dev:web

# Or from apps/web
cd apps/web
pnpm dev
```

- **Port**: 3000 (default Next.js port)
- **URL**: http://localhost:3000
- **Features**: Turbopack enabled for faster builds

### Admin API

Backend API service for admin operations.

```bash
# From root
pnpm dev:admin-api

# Or from apps/admin-api
cd apps/admin-api
pnpm dev
```

- **Port**: 3080 (configured in `.env`)
- **URL**: http://localhost:3080
- **Note**: Requires database connection and proper `.env` configuration

### Admin UI

Admin dashboard interface built with Next.js.

```bash
# From root
pnpm dev:admin-ui

# Or from apps/admin-ui
cd apps/admin-ui
pnpm dev
```

- **Port**: 3081
- **URL**: http://localhost:3081

### Bot Application

Discord/chat bot application (currently in development).

```bash
# From root
pnpm dev:bot

# Or from apps/bot
cd apps/bot
pnpm dev
```

- **Status**: Placeholder - implementation pending
- **Note**: Currently outputs a TODO message

## Running Tests

### Test Individual Apps

Run tests for a specific application:

```bash
# Web app tests (Vitest + Playwright)
pnpm test:web

# Admin API tests (Jest)
pnpm test:admin-api

# Admin UI tests (placeholder)
pnpm test:admin-ui

# Bot tests (placeholder)
pnpm test:bot
```

### Test All Apps

Run the entire test suite across all apps:

```bash
pnpm test:all
```

Or use the shorthand:

```bash
pnpm test
```

### Web-Specific Test Commands

The web app has additional test options:

```bash
cd apps/web

# Run tests with coverage
pnpm test:coverage

# Run end-to-end tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

## Building for Production

### Build Individual Apps

```bash
pnpm --filter web build
pnpm --filter admin-api build
pnpm --filter admin-ui build
pnpm --filter bot build
```

### Build All Apps

```bash
pnpm build
```

### Build Core Apps Only

To build just the main production apps (web, admin-api, admin-ui):

```bash
pnpm build:core
```

## Code Quality

### Linting

```bash
# Lint all apps
pnpm lint

# Lint core apps only
pnpm lint:core

# Lint specific app
pnpm --filter web lint
```

## Health Check & Verification

To verify your development environment is properly set up, run this sequence:

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma clients
pnpm prisma:generate

# 3. Build all apps
pnpm build

# 4. Run all tests
pnpm test:all
```

If all commands complete successfully, your environment is ready for development!

## Common Development Tasks

### Adding a New Package/Dependency

```bash
# Add to a specific app
pnpm --filter web add <package-name>
pnpm --filter admin-api add <package-name>

# Add as dev dependency
pnpm --filter web add -D <package-name>

# Add to workspace root
pnpm add -w <package-name>
```

### Database Operations (Prisma)

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations (web app)
cd apps/web
pnpm db:migrate

# Open Prisma Studio
cd apps/web
pnpm db:studio

# Seed database
cd apps/web
pnpm db:seed
```

### Working with Multiple Apps

To run multiple apps simultaneously, open separate terminal windows/tabs:

```bash
# Terminal 1
pnpm dev:web

# Terminal 2
pnpm dev:admin-api

# Terminal 3
pnpm dev:admin-ui
```

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

```bash
# Find process using port 3000 (web)
lsof -i :3000

# Find process using port 3080 (admin-api)
lsof -i :3080

# Kill process by PID
kill -9 <PID>
```

### Prisma Issues

```bash
# Regenerate Prisma client
pnpm prisma:generate

# Reset database (WARNING: deletes data)
cd apps/web
pnpm db:reset
```

### Dependency Issues

```bash
# Clear all node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Build Failures

```bash
# Clear Next.js cache
rm -rf apps/web/.next apps/admin-ui/.next

# Rebuild
pnpm build
```

## Project Structure Reference

```
slimy-monorepo/
├── apps/
│   ├── admin-api/    # Backend API (Express, port 3080)
│   ├── admin-ui/     # Admin dashboard (Next.js, port 3081)
│   ├── web/          # Public web app (Next.js, port 3000)
│   └── bot/          # Chat bot (TBD)
├── packages/         # Shared libraries
├── docs/            # Documentation
│   ├── STRUCTURE.md # Architecture details
│   └── DEPLOY.md    # Deployment guide
└── infra/           # Deployment configs
```

## Deployment

This guide focuses on local development. For deployment instructions, see:

- **[docs/DEPLOY.md](DEPLOY.md)** - Comprehensive deployment guide
- **Docker**: See `DEPLOY.md` for Docker-based deployment
- **Production**: Environment-specific configuration in `apps/*/env.*.example`

## Getting Help

- **Project Documentation**: Check `docs/` directory
- **API Documentation**: See `apps/admin-api/README.md`
- **Issue Tracker**: GitHub Issues for bug reports and feature requests
- **Monitoring**: See `apps/admin-api/MONITORING_README.md` for observability setup

## Quick Reference

### Most Common Commands

```bash
# Install everything
pnpm install

# Start web app
pnpm dev:web

# Start admin API
pnpm dev:admin-api

# Start admin UI
pnpm dev:admin-ui

# Run all tests
pnpm test:all

# Build everything
pnpm build

# Lint all code
pnpm lint
```

---

**Last Updated**: November 2025
