# Docker Infrastructure

This directory contains Docker configuration for running the Slimy.ai monorepo services.

## Services

- **PostgreSQL**: Primary database (port 5432)
- **Redis**: Cache and session store (port 6379)
- **Admin API**: Backend API server (port 3001)

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Environment Variables

See `.env.example` in the root directory for required environment variables.

## Health Checks

All services include health checks:
- PostgreSQL: `pg_isready` check
- Redis: `redis-cli ping` check
- Admin API: HTTP health endpoint at `/health`

## Development

For local development, you can run individual services:

```bash
# Start only database and cache
docker-compose up -d postgres redis

# Run the API locally (outside Docker)
cd ../..
pnpm install
pnpm --filter @slimy/admin-api dev
```
