# Development Workflow

This guide explains how to develop, test, and run basic health checks on the Slimy monorepo.

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

```bash
pnpm dev:web
```

- **URL**: http://localhost:3000
- **Tech**: Next.js 16 with Turbopack
- **Database**: Uses Prisma (ensure `pnpm prisma:generate` has been run)

### Admin API (`apps/admin-api`)

The backend API server for admin operations.

```bash
pnpm dev:admin-api
```

- **URL**: http://localhost:3080
- **Tech**: Express.js running from source
- **Database**: Uses Prisma + MySQL
- **Health endpoint**: http://localhost:3080/api/health

### Admin UI (`apps/admin-ui`)

The admin dashboard interface.

```bash
pnpm dev:admin-ui
```

- **URL**: http://localhost:3081
- **Tech**: Next.js 14

### Bot (`apps/bot`)

The Discord/chat bot application.

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
