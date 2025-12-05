# Docker Containerization Summary

## Overview

The Slimy monorepo has been fully containerized with Docker and orchestrated using Docker Compose. All applications can now be run in isolated containers with a single command.

## Files Created

### Dockerfiles

1. **`apps/admin-ui/Dockerfile`** (NEW)
   - Multi-stage build for Next.js admin dashboard
   - Uses pnpm for workspace dependency management
   - Standalone output for optimized production builds
   - Non-root user (nextjs) for security

2. **`apps/bot/Dockerfile`** (NEW)
   - Multi-stage build for TypeScript Discord bot
   - Compiles TypeScript to JavaScript in builder stage
   - Minimal production runtime with only compiled code
   - Non-root user (botuser) for security

3. **`apps/admin-api/Dockerfile`** (EXISTING)
   - Already containerized
   - Simple Node.js API with Prisma

4. **`apps/web/Dockerfile`** (EXISTING)
   - Already containerized
   - Next.js with standalone output

### Orchestration

5. **`docker-compose.yml`** (NEW - ROOT LEVEL)
   - Defines 5 services: db, admin-api, web, admin-ui, bot
   - Shared network: `slimy-network`
   - Persistent volume: `mysql_data`
   - Health checks for db and admin-api
   - Proper service dependencies with health conditions
   - Comprehensive environment variable configuration

### Configuration

6. **`.env.docker.example`** (NEW)
   - Template for all required environment variables
   - Includes Discord OAuth, database, security settings
   - Documents all optional integrations
   - Ready to copy to `.env` and customize

### Documentation

7. **`docs/docker-setup.md`** (NEW)
   - Comprehensive guide for running the stack
   - Prerequisites, quick start, configuration
   - Troubleshooting common issues
   - Production deployment checklist
   - Development workflow tips

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         slimy-network (bridge)                   │  │
│  │                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │   web    │  │ admin-ui │  │   bot    │      │  │
│  │  │ :3000    │  │  :3001   │  │          │      │  │
│  │  └────┬─────┘  └────┬─────┘  └──────────┘      │  │
│  │       │             │                           │  │
│  │       └─────────────┼───────────┐               │  │
│  │                     │           │               │  │
│  │              ┌──────▼─────┐     │               │  │
│  │              │ admin-api  │     │               │  │
│  │              │   :3080    │     │               │  │
│  │              └──────┬─────┘     │               │  │
│  │                     │           │               │  │
│  │              ┌──────▼───────────▼──┐            │  │
│  │              │     MySQL DB        │            │  │
│  │              │      :3306          │            │  │
│  │              └─────────────────────┘            │  │
│  │                     │                           │  │
│  └─────────────────────┼───────────────────────────┘  │
│                        │                              │
│                  ┌─────▼──────┐                       │
│                  │ mysql_data │ (persistent volume)   │
│                  └────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

## Port Mappings

| Service    | Container Port | Host Port | Access URL                |
|------------|----------------|-----------|---------------------------|
| web        | 3000           | 3000      | http://localhost:3000     |
| admin-ui   | 3000           | 3001      | http://localhost:3001     |
| admin-api  | 3080           | 3080      | http://localhost:3080     |
| db         | 3306           | 3306      | localhost:3306            |
| bot        | N/A            | N/A       | (Discord connection only) |

## Key Features

### Multi-Stage Builds

All Dockerfiles use multi-stage builds to minimize final image size:

- **base**: Base Node.js image with pnpm
- **deps**: Install dependencies
- **builder**: Build the application
- **runner**: Minimal production runtime

### Workspace Support

All builds properly handle the pnpm monorepo workspace:

- Copy workspace configuration files (`pnpm-workspace.yaml`, root `package.json`)
- Copy all app `package.json` files for dependency resolution
- Install dependencies with `--frozen-lockfile`
- Copy shared packages for build

### Security

- Non-root users in all containers
- Secrets managed via environment variables
- Health checks for critical services
- Restart policies for resilience

### Next.js Optimization

Both Next.js apps (web, admin-ui) use:

- `output: 'standalone'` for minimal production builds
- Proper static asset copying
- Environment variable injection at build time
- Server-side API proxying via rewrites

## Quick Start Commands

```bash
# 1. Configure environment
cp .env.docker.example .env
# Edit .env with your Discord credentials and secrets

# 2. Build and run
docker compose up --build

# 3. Access services
# Web:      http://localhost:3000
# Admin UI: http://localhost:3001
# API:      http://localhost:3080

# 4. Stop
docker compose down

# 5. Stop and remove data
docker compose down -v
```

## Environment Variables

### Required (Must Set)

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_BOT_TOKEN`
- `SESSION_SECRET` (generate with `openssl rand -base64 32`)
- `JWT_SECRET` (generate with `openssl rand -base64 32`)

### Optional (Have Defaults)

- `MYSQL_ROOT_PASSWORD` (default: rootpassword)
- `MYSQL_DATABASE` (default: slimyai)
- `MYSQL_USER` (default: slimyai)
- `MYSQL_PASSWORD` (default: slimypassword)
- `NODE_ENV` (default: production)

### Integrations (Optional)

- `OPENAI_API_KEY`
- `STATS_SHEET_ID`
- `NEXT_PUBLIC_SNELP_CODES_URL`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`

## Service Dependencies

The compose file ensures proper startup order:

1. **db** starts first (no dependencies)
2. **admin-api** waits for db to be healthy
3. **web** waits for both db and admin-api to be healthy
4. **admin-ui** waits for admin-api to be healthy
5. **bot** starts independently (no dependencies)

## Health Checks

### Database (db)

- Command: `mysqladmin ping`
- Interval: 10s
- Timeout: 5s
- Retries: 5

### Admin API (admin-api)

- Command: HTTP GET to `/api/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

## Volumes

### mysql_data

- Type: Named volume
- Driver: local
- Purpose: Persist MySQL database across container restarts
- Location: `/var/lib/mysql` in container

**Note**: To completely reset the database, run `docker compose down -v`

## Networks

### slimy-network

- Type: Bridge network
- Purpose: Allow inter-service communication
- DNS: Automatic service name resolution (e.g., `admin-api` resolves to the admin-api container)

## Build Context

All Dockerfiles use the **monorepo root** as the build context:

```bash
docker compose build
# Equivalent to:
# docker build -f apps/admin-api/Dockerfile .
# docker build -f apps/web/Dockerfile .
# docker build -f apps/admin-ui/Dockerfile .
# docker build -f apps/bot/Dockerfile .
```

This allows access to:
- Root `package.json` and `pnpm-workspace.yaml`
- All `apps/*/package.json` files
- Shared `packages/*` code

## Troubleshooting

See `docs/docker-setup.md` for comprehensive troubleshooting, including:

- Database connection issues
- Port conflicts
- Build failures
- Permission errors
- Next.js build errors
- Discord bot authentication

## Production Considerations

Before deploying to production:

1. **Security**
   - Change all default passwords
   - Use strong secrets (32+ characters)
   - Update cookie domains to your domain
   - Configure CORS for your domain

2. **Database**
   - Consider using managed MySQL (AWS RDS, etc.)
   - Set up automated backups
   - Configure connection pooling

3. **Reverse Proxy**
   - Use Nginx or Traefik for HTTPS/TLS
   - Configure SSL certificates
   - Set up load balancing if needed

4. **Monitoring**
   - Add logging aggregation
   - Set up health check monitoring
   - Configure alerts for service failures

5. **Scaling**
   - Use Docker Swarm or Kubernetes for orchestration
   - Run multiple instances of web/admin-api
   - Use external session store (Redis) for admin-api

## Next Steps

1. Review the `docker-compose.yml` file (printed below)
2. Test the build on your local machine
3. Customize environment variables in `.env`
4. Run `docker compose up --build`
5. Verify all services are healthy
6. Test the application end-to-end

## Files to Commit

```
.env.docker.example
docker-compose.yml
apps/admin-ui/Dockerfile
apps/bot/Dockerfile
docs/docker-setup.md
```

**Do NOT commit**: `.env` (contains secrets)

---

**Status**: ✅ Complete and ready for testing  
**Date**: December 2024  
**Docker Compose Version**: v2.0+
