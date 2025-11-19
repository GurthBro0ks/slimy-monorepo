# Docker Deployment Guide

This guide explains how to build and deploy the Slimy.ai monorepo using Docker on your NUC servers.

## Prerequisites

- Docker and Docker Compose installed
- Git configured to pull from the repository
- pnpm installed (for local development/testing)

## Quick Start (Fresh Deploy)

From a fresh clone, follow these steps:

```bash
# 1. Clone the repository
git clone <repo-url> slimy-monorepo
cd slimy-monorepo

# 2. Build Docker images (from infra/docker directory)
cd infra/docker

# For slimy-nuc1:
docker compose -f docker-compose.slimy-nuc1.yml build

# For slimy-nuc2:
docker compose -f docker-compose.slimy-nuc2.yml build

# 3. Start services
docker compose -f docker-compose.slimy-nuc1.yml up -d
# OR
docker compose -f docker-compose.slimy-nuc2.yml up -d
```

## Updating an Existing Deployment

```bash
# 1. Pull latest changes
cd slimy-monorepo
git pull origin main

# 2. Rebuild images
cd infra/docker
docker compose -f docker-compose.slimy-nuc1.yml build

# 3. Restart services
docker compose -f docker-compose.slimy-nuc1.yml up -d
```

## How It Works

### Monorepo Structure

The repository uses pnpm workspaces with the following structure:

- `apps/web` - Next.js web application
- `apps/admin-api` - Admin API service
- `apps/admin-ui` - Admin UI application
- `apps/bot` - Discord bot service
- `packages/` - Shared libraries

### Docker Build Context

**IMPORTANT**: All Dockerfiles now use the **monorepo root** as the build context, not individual app directories.

**docker-compose configuration:**
```yaml
web:
  build:
    context: ../..          # Points to monorepo root
    dockerfile: apps/web/Dockerfile
```

This ensures that:
- Root `pnpm-workspace.yaml` is available during build
- All workspace dependencies can be resolved
- Build scripts run correctly in non-interactive mode

### pnpm v10 Build Scripts

**Background**: pnpm v10 introduced a security feature that blocks dependency lifecycle scripts by default. This previously caused Docker builds to fail with:

```
Error: Cannot find module '/app/node_modules/prisma/build/index.js'
Warning: Ignored build scripts: @prisma/client, @prisma/engines, prisma, sharp, esbuild
```

**Solution**: The `pnpm-workspace.yaml` file now includes `onlyBuiltDependencies`:

```yaml
onlyBuiltDependencies:
  - "@prisma/client"
  - "@prisma/engines"
  - "prisma"
  - "sharp"
  - "esbuild"
  - "unrs-resolver"
```

This explicitly allows these trusted packages to run their build scripts during `pnpm install` in Docker, enabling:
- Prisma CLI binary installation
- Prisma client generation
- Sharp native binary compilation
- esbuild native binary compilation

### Environment Variables

Each deployment requires an env file at the path specified in docker-compose:

**slimy-nuc1:**
- Web: `/opt/slimy/test/slimyai-web/.env.production`
- Admin API: `/opt/slimy/app/admin-api/.env.admin.production`
- Admin UI: `/opt/slimy/app/admin-ui/.env.production`

**slimy-nuc2:**
- Web: `/opt/slimy/secrets/.env.web.production`
- Admin API: `/opt/slimy/secrets/.env.admin.production`
- DB: `/opt/slimy/secrets/.env.db.slimy-nuc2`

## Local Development (Without Docker)

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client for web app
pnpm --filter @slimy/web run db:generate

# 3. Build web app
pnpm --filter @slimy/web run build

# 4. Run tests
pnpm --filter @slimy/web test

# 5. Start development server
pnpm --filter @slimy/web run dev
```

## Troubleshooting

### Build Scripts Warning

If you see warnings about ignored build scripts:

```
Warning: Ignored build scripts: @prisma/client, ...
```

**Cause**: The `pnpm-workspace.yaml` file is missing or not being used.

**Fix**: Ensure Docker build context is the monorepo root, not `apps/web`.

### Prisma Generate Fails

**Error**: `Cannot find module '/app/node_modules/prisma/build/index.js'`

**Cause**: Prisma's postinstall script didn't run.

**Fix**: Verify that `pnpm-workspace.yaml` includes `prisma`, `@prisma/client`, and `@prisma/engines` in `onlyBuiltDependencies`.

### Font Loading Fails in Build

**Error**: `Failed to fetch 'Inter' from Google Fonts`

**Cause**: Next.js trying to fetch fonts at build time in a network-restricted environment.

**Fix**: Already resolved! The app now uses system fonts via Tailwind CSS instead of `next/font/google`.

### Multiple Lockfiles Warning

**Error**: `Warning: Next.js detected multiple lockfiles`

**Cause**: Leftover `pnpm-lock.yaml` or `package-lock.json` in app directories.

**Fix**: Already resolved! Only the root `pnpm-lock.yaml` exists now.

## Architecture Notes

### Why Monorepo Root Context?

Using the monorepo root as the Docker build context enables:

1. **Workspace dependency resolution**: pnpm needs `pnpm-workspace.yaml` to understand the monorepo structure
2. **Build script configuration**: The `onlyBuiltDependencies` setting applies to all workspaces
3. **Shared lockfile**: Single `pnpm-lock.yaml` ensures consistent dependencies
4. **Simplified CI/CD**: Same commands work locally and in Docker

### Dockerfile Stages

The web app Dockerfile uses multi-stage builds:

1. **base**: Sets up pnpm v10.22.0
2. **deps**: Installs dependencies with build scripts enabled
3. **builder**: Generates Prisma client and builds Next.js app
4. **runner**: Minimal production runtime image

This approach:
- Reduces final image size
- Separates build-time and runtime dependencies
- Enables better Docker layer caching

## Support

For issues with deployment:
1. Check recent commits in git log for related fixes
2. Review this documentation for configuration requirements
3. Verify environment files are in the correct locations
4. Check Docker logs: `docker compose -f docker-compose.slimy-nuc1.yml logs -f web`
