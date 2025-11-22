# Development Workflow

This guide explains how to develop locally in the Slimy monorepo.

## Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: Install globally with `npm install -g pnpm`
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

- Runs on: `http://localhost:3000` (default Next.js port)
- Tech: Next.js 16 with Turbopack
- Features: MDX docs, Redis cache, Prisma database

### Admin API (Port 3080)

Backend API for administrative operations.

```bash
pnpm dev:admin-api
```

- Runs on: `http://localhost:3080` (configurable via `PORT` or `ADMIN_API_PORT` env vars)
- Tech: Express.js
- Features: REST API, Prisma database, Redis, JWT auth

### Admin UI (Port 3081)

Administrative dashboard interface.

```bash
pnpm dev:admin-ui
```

- Runs on: `http://localhost:3081`
- Tech: Next.js 14
- Features: Real-time monitoring, charts, Socket.io integration

### Bot (TBD)

The bot application is currently a placeholder.

```bash
pnpm dev:bot
```

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
