# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Slimy.ai is a Discord bot management platform built as a pnpm monorepo with four main applications:

- **Web** (`apps/web`) - Public Next.js 16 app (port 3000) with React 19, Tailwind CSS 4, Prisma
- **Admin API** (`apps/admin-api`) - Express REST API (port 3080) with Prisma, MySQL, Redis
- **Admin UI** (`apps/admin-ui`) - Admin dashboard Next.js 14 (port 3081) with React 18
- **Bot** (`apps/bot`) - Discord.js bot (placeholder, not yet implemented)

## Common Commands

```bash
# Install dependencies and generate Prisma clients (required after clone)
pnpm install
pnpm prisma:generate

# Development
pnpm dev:web          # http://localhost:3000
pnpm dev:admin-api    # http://localhost:3080
pnpm dev:admin-ui     # http://localhost:3081

# Testing
pnpm test:all         # All apps
pnpm test:web         # Web only (Vitest)
pnpm test:admin-api   # Admin API only (Jest)

# Run single test file
pnpm --filter @slimy/web test path/to/test.ts
pnpm --filter @slimy/admin-api test -- path/to/test.ts

# Building and linting
pnpm build            # Build all
pnpm lint             # Lint all
pnpm lint:deprecations # Check for deprecated code usage

# Database (run from app directory)
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Add dependencies
pnpm --filter @slimy/web add package-name
pnpm --filter @slimy/admin-api add -D package-name  # dev dependency
```

## Architecture

```
Users → [Web :3000] ─────────────────┐
                                     ↓
Discord → [Bot] ──────────→ [Admin API :3080] → MySQL + Redis
                                     ↑
Admins → [Admin UI :3081] ──────────┘
```

- **Web App**: Proxies auth/guild requests server-side to Admin API
- **Admin UI**: Makes direct REST calls to Admin API
- **Admin API**: Central backend for all data operations, Discord OAuth2, file uploads
- **Authentication**: Discord OAuth2 with JWT in httpOnly cookies

## Key Files

- `prisma/schema.prisma` in each app defines database models
- `apps/admin-api/src/routes/` - API route handlers
- `apps/web/app/` - Next.js App Router pages and API routes
- `scripts/check-deprecation.ts` - Deprecation checker

## Code Quality

Mark unused exports with `/** @deprecated [Manus Audit] Unused */` before removal. Run `pnpm lint:deprecations` to find deprecated usage. The CI will fail if deprecated exports are still used.

Git hooks via Husky run ESLint fix on staged files.

## Environment Setup

Each app needs `.env` files - copy from `.env.example`:
- `apps/admin-api/.env` - Required: Discord OAuth, JWT_SECRET, SESSION_SECRET, DATABASE_URL
- `apps/web/.env` - Required: DATABASE_URL, optional API keys

## Docker

```bash
docker compose up --build    # Full stack
docker compose down -v       # Reset with volume cleanup
```
