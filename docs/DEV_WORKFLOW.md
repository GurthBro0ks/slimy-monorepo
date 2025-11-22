# Development Workflow

This guide explains how to develop, test, and run basic health checks on the Slimy monorepo. For a quick click-through checklist, see `docs/DEV_SANITY_CHECK.md`.

## Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: Install globally with `npm install -g pnpm`

## Initial Setup

1. Clone the repository and navigate to the project root
2. Install all dependencies:
   ```bash
   pnpm install
   ```
3. Generate Prisma client files (required for admin-api and web):
   ```bash
   pnpm prisma:generate
   ```

## Running Applications

All applications can be started from the monorepo root using standardized dev scripts.

### Web Dashboard (`apps/web`)

The main web dashboard built with Next.js.
- **Git**: For version control

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/GurthBro0ks/slimy-monorepo.git
cd slimy-monorepo
pnpm install
```

The `pnpm install` command installs dependencies for all workspace packages in the monorepo.

### 2. Generate Prisma Clients

Some apps use Prisma ORM and require generated clients before running:

```bash
pnpm prisma:generate
```

This generates Prisma clients for `admin-api` and `web` apps.

## Running Apps in Development Mode

The monorepo contains four main applications. Each can be started individually in development mode.

### Web App (Port 3000)

The main Slimy.ai web application built with Next.js.

```bash
pnpm dev:web
```

- **URL**: http://localhost:3000
- **Tech**: Next.js 16 with Turbopack
- **Database**: Uses Prisma (ensure `pnpm prisma:generate` has been run)

### Admin API (`apps/admin-api`)

The backend API server for admin operations.
- Runs on: `http://localhost:3000` (default Next.js port)
- Tech: Next.js 16 with Turbopack
- Features: MDX docs, Redis cache, Prisma database

### Admin API (Port 3080)

Backend API for administrative operations.

```bash
pnpm dev:admin-api
```

- **URL**: http://localhost:3080
- **Tech**: Express.js running from source
- **Database**: Uses Prisma + MySQL
- **Health endpoint**: http://localhost:3080/api/health

### Admin UI (`apps/admin-ui`)

The admin dashboard interface.
- Runs on: `http://localhost:3080` (configurable via `PORT` or `ADMIN_API_PORT` env vars)
- Tech: Express.js
- Features: REST API, Prisma database, Redis, JWT auth

### Admin UI (Port 3081)

Administrative dashboard interface.

```bash
pnpm dev:admin-ui
```

- **URL**: http://localhost:3081
- **Tech**: Next.js 14

### Bot (`apps/bot`)

The Discord/chat bot application.
- Runs on: `http://localhost:3081`
- Tech: Next.js 14
- Features: Real-time monitoring, charts, Socket.io integration

### Bot (TBD)

The bot application is currently a placeholder.

```bash
pnpm dev:bot
```

- **Status**: Placeholder - not yet implemented
- **Output**: Prints a TODO message

## Running Tests

### Test All Workspaces

Run tests across all applications:

```bash
pnpm test:all
```

### Test Individual Apps

Test specific applications:

```bash
# Web app (Vitest + Playwright)
pnpm test:web

# Admin API (Jest)
pnpm test:admin-api
```

**Note**: `admin-ui` and `bot` do not have test suites yet and will output placeholder messages.

### Advanced Web Testing

The web app includes additional test scripts:

```bash
# Coverage report
pnpm --filter @slimy/web run test:coverage

# E2E tests with Playwright
pnpm --filter @slimy/web run test:e2e

# E2E tests with UI mode
pnpm --filter @slimy/web run test:e2e:ui
```

## Building

### Build All Apps

```bash
pnpm build
```

### Build Core Apps Only

Builds only admin-api, web, and admin-ui (excludes bot):

```bash
pnpm build:core
```

## First-Time Sanity Check

After initial setup, verify everything is working:

1. **Check dependencies installed**:
   ```bash
   pnpm install
   ```

2. **Generate Prisma clients**:
   ```bash
   pnpm prisma:generate
   ```

3. **Start admin-api**:
   ```bash
   pnpm dev:admin-api
   ```
   - Verify it's listening on http://localhost:3080
   - Check health endpoint: `curl http://localhost:3080/api/health`

4. **Start web dashboard** (in a new terminal):
   ```bash
   pnpm dev:web
   ```
   - Open http://localhost:3000 in your browser
   - Verify the page loads without errors

5. **Start admin-ui** (in a new terminal):
   ```bash
   pnpm dev:admin-ui
   ```
   - Open http://localhost:3081 in your browser

6. **Run tests**:
   ```bash
   pnpm test:all
   ```
   - Verify core tests pass (web and admin-api)

## Environment Configuration

Each app may require environment variables. Check for `.env.example` files:

- `apps/admin-api/.env.example` - Admin API configuration (database, ports, auth)
- `apps/web/.env` or `.env.local` - Web app configuration

Copy example files and configure as needed:

```bash
cp apps/admin-api/.env.example apps/admin-api/.env
```

## Database Operations

Prisma commands are available for apps that use it (admin-api and web):

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations (web only)
pnpm --filter @slimy/web run db:migrate

# Open Prisma Studio (web only)
pnpm --filter @slimy/web run db:studio

# Seed database (web only)
pnpm --filter @slimy/web run db:seed
```

## Linting

```bash
# Lint all workspaces
pnpm lint

# Lint core apps only
pnpm lint:core
```

## Common Issues

### "Cannot find module" errors

Run `pnpm install` and `pnpm prisma:generate` to ensure all dependencies and generated code are up to date.

### Port already in use

If you get EADDRINUSE errors, ensure no other process is using the required ports (3000, 3080, 3081).

### Database connection errors

Verify your `.env` files are configured correctly with valid database credentials.

## Project Structure

```
slimy-monorepo/
├── apps/
│   ├── admin-api/      # Express API server (port 3080)
│   ├── admin-ui/       # Admin dashboard (port 3081)
│   ├── web/            # Main web app (port 3000)
│   └── bot/            # Discord bot (WIP)
├── packages/           # Shared libraries
├── infra/             # Deployment configs
└── docs/              # Documentation
```

## Next Steps

- Review `docs/STRUCTURE.md` for architectural details
- Check individual app READMEs for app-specific documentation
- Set up your local database using the admin-api guide
- Configure environment variables for your development environment
This will display a TODO message. Implementation pending.

## Running Tests

### Test Individual Apps

Run tests for a specific app:

```bash
pnpm test:web         # Vitest unit tests + Playwright e2e tests
pnpm test:admin-api   # Jest tests
pnpm test:admin-ui    # TODO: tests not yet implemented
pnpm test:bot         # TODO: tests not yet implemented
```

### Test All Apps

Run tests across the entire workspace:

```bash
pnpm test:all
```

This recursively runs the `test` script in all workspace packages.

### Additional Web Test Commands

The `web` app has additional testing options:

```bash
cd apps/web
pnpm test:coverage     # Run tests with coverage report
pnpm test:e2e          # Run Playwright e2e tests
pnpm test:e2e:ui       # Run e2e tests with Playwright UI
```

## Other Useful Commands

### Linting

```bash
pnpm lint              # Lint all packages (recursive)
pnpm lint:core         # Lint core apps only (admin-api, web, admin-ui)
```

### Building

```bash
pnpm build             # Build all packages (recursive)
pnpm build:core        # Build core apps only
```

Individual app builds:

```bash
cd apps/web && pnpm build        # Production build for web
cd apps/admin-ui && pnpm build   # Production build for admin-ui
cd apps/admin-api && pnpm build  # No build needed (runs from source)
```

### Database Operations (Web & Admin API)

Both `web` and `admin-api` use Prisma. Common operations:

```bash
# From the root:
pnpm prisma:generate   # Generate Prisma clients

# From apps/web or apps/admin-api:
pnpm db:migrate        # Run database migrations (dev)
pnpm db:studio         # Open Prisma Studio GUI
pnpm db:seed           # Seed the database (web only)
pnpm db:reset          # Reset database (web only)
```

## Health Check

To verify the monorepo is set up correctly:

1. **Install dependencies**: `pnpm install`
2. **Generate Prisma clients**: `pnpm prisma:generate`
3. **Run builds**: `pnpm build:core`
4. **Run tests**: `pnpm test:all`

If all steps complete without errors, your environment is ready for development.

## Workspace Structure

```
slimy-monorepo/
├── apps/
│   ├── admin-api/      # Express API server
│   ├── admin-ui/       # Next.js admin dashboard
│   ├── web/            # Main Next.js web app
│   └── bot/            # Bot application (placeholder)
├── packages/           # Shared libraries and utilities
├── infra/              # Deployment and infrastructure
└── docs/               # Documentation
```

## Environment Variables

Each app may require environment variables. Check for `.env.example` files in each app directory:

- `apps/admin-api/.env` - Database URLs, JWT secrets, Redis config
- `apps/web/.env` - Database URLs, OpenAI keys, Redis config
- `apps/admin-ui/.env` - API endpoints, feature flags

Copy `.env.example` to `.env` and fill in appropriate values for your local environment.

## Deployment

Deployment is out of scope for this guide. See:

- `apps/web/DEPLOYMENT.md` - Web app deployment guide
- `infra/docker/` - Docker configurations
- `docs/STRUCTURE.md` - Monorepo architecture and ownership

## Troubleshooting

### "Module not found" errors

Run `pnpm install` to ensure all dependencies are installed.

### Prisma client errors

Run `pnpm prisma:generate` to regenerate Prisma clients.

### Port already in use

If a port is already in use, either:
- Stop the process using that port
- Change the port via environment variables (see app-specific docs)

### pnpm command not found

Install pnpm globally: `npm install -g pnpm`

## Getting Help

- Check app-specific README files in `apps/*/`
- Review `docs/STRUCTURE.md` for architecture details
- Check `.github/` for CI/CD workflows
- Review commit history for recent changes

## Contributing

When working on the monorepo:

1. Create a feature branch from `main`
2. Make your changes in the appropriate app or package
3. Run tests: `pnpm test:all`
4. Run linting: `pnpm lint`
5. Commit with clear messages
6. Push and create a pull request

Keep changes focused and test thoroughly before pushing.
