# Development Documentation

This directory contains guides for local development, testing, and common workflows.

## Quick Start

### Initial Setup

```bash
# Clone the repository
git clone <repo-url> slimy-monorepo
cd slimy-monorepo

# Enable pnpm v10
corepack enable && corepack prepare pnpm@10.22.0 --activate

# Install dependencies
pnpm install

# Generate Prisma client for web app
pnpm --filter @slimy/web run db:generate
```

### Development Server

```bash
# Start web app dev server
pnpm --filter @slimy/web run dev

# Start admin-api dev server
pnpm --filter @slimy/admin-api run dev

# Start admin-ui dev server
pnpm --filter @slimy/admin-ui run dev
```

### Building

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @slimy/web run build
pnpm --filter @slimy/admin-api run build
pnpm --filter @slimy/admin-ui run build
```

### Testing

```bash
# Run web app tests
pnpm --filter @slimy/web test

# Run tests in watch mode
pnpm --filter @slimy/web test:watch
```

## Common Workflows

### Adding a New Dependency

```bash
# Add to specific workspace
pnpm --filter @slimy/web add <package-name>

# Add as dev dependency
pnpm --filter @slimy/web add -D <package-name>

# Add to root (only for dev tools)
pnpm add -w -D <package-name>
```

### Database Migrations (Prisma)

```bash
# Generate Prisma client
pnpm --filter @slimy/web run db:generate

# Create a new migration
pnpm --filter @slimy/web run db:migrate:dev --name <migration-name>

# Apply migrations in production
pnpm --filter @slimy/web run db:migrate:deploy

# Open Prisma Studio
pnpm --filter @slimy/web run db:studio
```

### Checking Types

```bash
# Type-check web app
pnpm --filter @slimy/web run type-check

# Type-check all apps
pnpm run type-check
```

### Linting and Formatting

```bash
# Lint specific app
pnpm --filter @slimy/web run lint

# Format code
pnpm run format

# Fix linting issues
pnpm run lint:fix
```

## Monorepo Structure

The repository uses pnpm workspaces. Key directories:

- **apps/**: Application code (web, admin-api, admin-ui, bot)
- **packages/**: Shared libraries and utilities
- **infra/**: Infrastructure configuration (Docker, Caddy, systemd)
- **docs/**: Documentation (you are here)

See [../STRUCTURE.md](../STRUCTURE.md) for the complete structure.

## Workspace Commands

```bash
# Run command in specific workspace
pnpm --filter @slimy/web <command>

# Run command in all workspaces
pnpm -r <command>

# Run command in all workspaces in parallel
pnpm -r --parallel <command>
```

## Environment Variables

### Development
Each app has `.env.example` files. Copy them to create your local environment:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/admin-api/.env.example apps/admin-api/.env.local
cp apps/admin-ui/.env.example apps/admin-ui/.env.local
```

### Required Variables

See [../apps/README.md](../apps/README.md) for detailed environment variable requirements per app.

## Troubleshooting

### pnpm Installation Issues
Ensure you're using pnpm v10:
```bash
corepack enable
corepack prepare pnpm@10.22.0 --activate
pnpm --version  # Should show 10.22.0
```

### Prisma Client Not Found
Generate the Prisma client:
```bash
pnpm --filter @slimy/web run db:generate
```

### Build Scripts Not Running
Check that `pnpm-workspace.yaml` includes necessary packages in `onlyBuiltDependencies`:
- `@prisma/client`, `@prisma/engines`, `prisma`
- `sharp`, `esbuild`, `unrs-resolver`

### TypeScript Errors After Dependency Update
Clear build caches and regenerate:
```bash
pnpm run clean
pnpm install
pnpm --filter @slimy/web run db:generate
pnpm build
```

### Port Already in Use
Kill the process using the port:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Testing Strategies

### Unit Tests
- Place test files next to source files: `component.tsx` → `component.test.tsx`
- Use Jest and React Testing Library for web app
- Run with `pnpm --filter @slimy/web test`

### Integration Tests
- Test API endpoints with supertest
- Mock external services (OpenAI, Discord API)
- Use test databases (separate from development)

### E2E Tests
- Use Playwright for end-to-end testing
- Run in CI/CD pipeline before deployment

## Scripts Reference

Common scripts defined in package.json files:

- `dev`: Start development server
- `build`: Build for production
- `start`: Start production server
- `test`: Run tests
- `test:watch`: Run tests in watch mode
- `lint`: Run ESLint
- `type-check`: Run TypeScript compiler checks
- `db:generate`: Generate Prisma client
- `db:migrate:dev`: Create and apply migration
- `db:migrate:deploy`: Apply migrations (production)

## Related Documentation

- [Repository Structure](../STRUCTURE.md)
- [Application Docs](../apps/README.md)
- [Infrastructure](../infra/README.md)
- [Docker Deployment](../infra/DOCKER_DEPLOYMENT.md)

## Agent Reports

Development workflow improvements from agents will be linked here as they become available.
