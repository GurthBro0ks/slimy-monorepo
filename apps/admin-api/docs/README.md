# Slimy.ai Monorepo Documentation

**Integration Date**: 2025-11-20  
**Total Branches Integrated**: 125 claude/* branches  
**Status**: ✅ Complete Integration

## Overview

This is the unified Slimy.ai monorepo, integrating all features, improvements, and infrastructure from 125 separate development branches into a single cohesive codebase.

## What's Included

### Core Applications
- **Admin API**: Backend API server with Prisma, Redis sessions, and PostgreSQL
- **Web App**: Next.js frontend application
- **Discord Bot**: SlimeCraft Discord integration

### Infrastructure
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **Caching**: Redis for sessions and caching
- ✅ **Docker**: Full containerized deployment setup
- ✅ **Monitoring**: Health checks, metrics, and logging

### Key Features Integrated
- User authentication & sessions (Discord OAuth)
- Guild management & analytics
- Chat persistence & conversations
- Screenshot analysis pipeline
- Club analytics & reporting
- Webhook integrations
- Audit logging & event sourcing
- Testing framework (Vitest + Playwright)
- Auto-deployment scripts
- Comprehensive API validation

### Shared Packages
- `@slimy/shared-auth`: Authentication utilities
- `@slimy/shared-db`: Database utilities & Prisma client
- `@slimy/shared-config`: Configuration & constants

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate --schema=./prisma/schema.prisma

# Run database migrations (if needed)
npx prisma migrate dev --schema=./prisma/schema.prisma

# Start development services
docker-compose -f infra/docker/docker-compose.yml up -d

# Run tests
pnpm test

# Start development
pnpm dev
```

## Directory Structure

```
slimy-monorepo/
├── admin-api/          # Legacy admin API directory
├── apps/               # Application packages (if any)
├── docs/               # Documentation
│   ├── adr/           # Architecture Decision Records
│   ├── api/           # API documentation
│   ├── ops/           # Operations & deployment docs
│   ├── guides/        # Developer guides
│   └── architecture/  # Architecture diagrams & docs
├── infra/
│   ├── auto-deploy/   # Auto-deployment scripts
│   └── docker/        # Docker infrastructure
├── lib/               # Shared libraries
├── packages/          # Shared packages
│   ├── shared-auth/   # Auth utilities
│   ├── shared-db/     # Database utilities
│   └── shared-config/ # Configuration
├── prisma/            # Prisma schema & migrations
├── scripts/           # Utility scripts
├── src/               # Source code
├── tests/             # Test suites
└── types/             # TypeScript type definitions
```

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run specific test suites
pnpm test:backend
pnpm test:frontend
```

## Deployment

See [infra/auto-deploy/README.md](../infra/auto-deploy/README.md) for automated deployment instructions.

## Architecture Decision Records (ADRs)

See [docs/adr/](./adr/) for all architecture decisions.

## Contributing

This repository integrates contributions from 125 feature branches. For new contributions:

1. Create a new branch from `main`
2. Make your changes
3. Run tests: `pnpm test`
4. Submit a pull request

## Database Schema

The integrated Prisma schema includes:
- Users & Sessions
- Guilds & User-Guild relationships
- Conversations & Chat messages
- Statistics & Analytics
- Club analysis & metrics
- Screenshot analysis pipeline
- Audit logs
- Webhooks & deliveries

See [prisma/schema.prisma](../prisma/schema.prisma) for the complete schema.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://slimy:password@localhost:5432/slimy

# Redis
REDIS_URL=redis://localhost:6379

# Discord OAuth
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_key

# Session
SESSION_SECRET=your_session_secret
```

## Monitoring & Health

All services include health check endpoints:
- Admin API: `GET /health`
- PostgreSQL: Built-in health checks
- Redis: Built-in health checks

## Support

For questions or issues, refer to:
- [Operations Runbook](./ops/)
- [API Documentation](./api/)
- [Developer Guides](./guides/)

---

**Last Updated**: 2025-11-20  
**Integration Status**: ✅ All 125 branches successfully merged
