# Services Matrix

Comprehensive reference table for all applications in the Slimy.ai monorepo.

## Quick Reference

| Service | Path | Type | Dev Port | Dev Start Command |
|---------|------|------|----------|-------------------|
| [Web](#web) | `apps/web` | Next.js Web App | 3000 | `pnpm dev:web` or `pnpm --filter @slimy/web dev` |
| [Admin API](#admin-api) | `apps/admin-api` | Express REST API | 3080 | `pnpm dev:admin-api` or `pnpm --filter @slimy/admin-api dev` |
| [Admin UI](#admin-ui) | `apps/admin-ui` | Next.js Dashboard | 3081 | `pnpm dev:admin-ui` or `pnpm --filter @slimy/admin-ui dev` |
| [Bot](#bot) | `apps/bot` | Discord Bot | TBD | `pnpm dev:bot` (not yet implemented) |

## Detailed Service Information

### Web

**Path**: `apps/web`

**Package Name**: `@slimy/web`

**Type**: Next.js 16 web application

**Purpose**: Public-facing website for Slimy.ai Discord bot with user tools, codes aggregator, and documentation system.

**Technology Stack**:
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- Vitest (unit tests)
- Playwright (e2e tests)

**Development**:
```bash
# Start dev server
pnpm dev:web
# or
pnpm --filter @slimy/web dev

# Run tests
pnpm test:web
pnpm --filter @slimy/web test:e2e

# Build
pnpm --filter @slimy/web build
```

**Dev Port**: 3000 (default Next.js port)

**Production URL**: https://slimyai.xyz

**Key Features**:
- Codes aggregator (Snelp + Reddit)
- MDX documentation system with auto-import
- Role-based access control
- Server-side API proxies to Admin API
- Club analytics dashboard

**Environment Variables**:
- `NEXT_PUBLIC_ADMIN_API_BASE` - Admin API base URL (empty string for production)
- `NEXT_PUBLIC_SNELP_CODES_URL` - Snelp codes API URL
- `DOCS_SOURCE_REPO` - GitHub repo for docs import
- `GITHUB_TOKEN` - GitHub API token

**Dependencies**:
- Admin API (for auth and data)
- External APIs (Snelp, Reddit, GitHub)

**Notes**:
- Requires Prisma client generation: `pnpm --filter @slimy/web prisma:generate`
- See `apps/web/README.md` for detailed setup

---

### Admin API

**Path**: `apps/admin-api`

**Package Name**: `@slimy/admin-api`

**Type**: Express.js REST API

**Purpose**: Backend API for Discord bot administration, providing authentication, guild management, and analytics.

**Technology Stack**:
- Express.js
- Prisma ORM
- MySQL 2
- Redis
- JWT authentication
- Multer (file uploads)
- Sharp (image processing)

**Development**:
```bash
# Start dev server
pnpm dev:admin-api
# or
pnpm --filter @slimy/admin-api dev

# Run tests
pnpm test:admin-api
pnpm --filter @slimy/admin-api test

# Build (runs from source, no build step)
pnpm --filter @slimy/admin-api build
```

**Dev Port**: 3080 (configurable via `PORT` or `ADMIN_API_PORT` env var)

**Production URL**: https://admin.slimyai.xyz/api (reverse proxied)

**Key Features**:
- Discord OAuth2 authentication
- JWT session management with httpOnly cookies
- Server-side session store (12-hour expiry)
- Guild CRUD operations
- Club analytics endpoints
- Multi-file image uploads with auto-generated variants
- Health and diagnostics API
- Bot service proxy

**Main API Endpoints**:
- `GET /api/auth/login` - Initiate OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/me` - Get current user session
- `POST /api/auth/logout` - Clear session
- `GET /api/guilds` - List user's guilds with bot status
- `GET /api/guilds/:guildId/*` - Guild-specific endpoints
- `GET /api/guilds/:guildId/club/latest` - Club member metrics
- `POST /api/guilds/:guildId/club/rescan` - Trigger rescan
- `GET /api/uploads/:guildId` - List uploads
- `POST /api/uploads/:guildId` - Upload files
- `GET /api/diag` - System diagnostics

**Environment Variables**:
- `PORT` / `ADMIN_API_PORT` - Server port (default: 3080)
- `HOST` / `ADMIN_API_HOST` - Server host (default: 127.0.0.1)
- `DB_URL` - MySQL connection string
- `JWT_SECRET` - JWT signing secret
- `DISCORD_CLIENT_ID` - Discord OAuth app ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth secret
- `DISCORD_BOT_TOKEN` - Bot token for membership checks
- `SESSION_SECRET` - Session encryption key
- `UPLOADS_DIR` - File upload directory
- `BOT_RESCAN_URL` - Bot service rescan endpoint (optional)

**Dependencies**:
- MySQL database
- Redis (planned for production sessions)
- Discord API

**Notes**:
- Requires `.env.admin` file (see `apps/admin-api/README.md`)
- Requires Prisma client generation: `pnpm --filter @slimy/admin-api prisma:generate`
- Some endpoints return stub data pending full database integration
- Session store is currently in-memory; Redis migration planned

---

### Admin UI

**Path**: `apps/admin-ui`

**Package Name**: `@slimy/admin-ui`

**Type**: Next.js 14 dashboard application

**Purpose**: Web-based admin panel for Discord bot management with guild dashboards and monitoring.

**Technology Stack**:
- Next.js 14
- React 18
- Chart.js
- Socket.io client
- SWR (data fetching)

**Development**:
```bash
# Start dev server
pnpm dev:admin-ui
# or
pnpm --filter @slimy/admin-ui dev

# Build
pnpm --filter @slimy/admin-ui build

# Start production server
pnpm --filter @slimy/admin-ui start
```

**Dev Port**: 3081 (hardcoded in package.json)

**Production URL**: https://admin.slimyai.xyz

**Key Features**:
- Discord OAuth login (via Admin API)
- Guild selection with bot installation status
- Multi-tab guild dashboard:
  - **Dashboard**: Health metrics, task runner, live logs
  - **Uploads**: Screenshot gallery and multi-file uploader
  - **Current Sheet**: Google Sheet embed with corrections and rescan tools
- Live diagnostics sidebar widget
- Session-based authentication

**Environment Variables**:
- `NEXT_PUBLIC_ADMIN_API_BASE` - Admin API base URL
  - Empty string (`""`) for production (relative URLs)
  - `http://localhost:3080` for development
- `NEXT_PUBLIC_BOT_CLIENT_ID` - Discord bot client ID
- `NEXT_PUBLIC_BOT_INVITE_SCOPES` - Bot OAuth scopes
- `NEXT_PUBLIC_BOT_PERMISSIONS` - Bot permission flags

**Dependencies**:
- Admin API (all data operations)

**Notes**:
- Requires rebuild after env var changes (build-time embedding)
- Cache busting needed after rebuild: `echo "cache-bust-$(date +%s)" > .next/BUILD_ID`
- Uses httpOnly cookies from Admin API for authentication
- See `apps/admin-ui/README.md` for troubleshooting

---

### Bot

**Path**: `apps/bot`

**Package Name**: `@slimy/bot`

**Type**: Discord bot application

**Purpose**: Discord bot for Slimy.ai (placeholder - not yet implemented)

**Technology Stack**: TBD

**Development**:
```bash
# Currently only stubs
pnpm dev:bot  # exits with TODO message
```

**Dev Port**: TBD

**Status**: **Not Implemented** - Only package.json placeholder exists

**Planned Features**:
- Discord gateway connection
- Slash commands
- Message handling
- Integration with Admin API for configuration

**Notes**:
- Package.json contains stub scripts only
- No actual implementation files exist yet
- Future development needed

---

## Service Dependencies

### Dependency Graph

```
Web
 ├─→ Admin API (auth, guilds, diagnostics)
 ├─→ Snelp API (codes)
 ├─→ Reddit API (codes)
 └─→ GitHub API (docs import)

Admin UI
 └─→ Admin API (all data operations)

Admin API
 ├─→ Discord API (OAuth, bot checks)
 ├─→ MySQL (Prisma)
 ├─→ Redis (sessions - planned)
 └─→ Bot Service (optional rescan proxy)

Bot (planned)
 ├─→ Discord API
 └─→ Admin API (configuration)
```

### Runtime Dependencies

| Service | Required For | Optional For |
|---------|--------------|--------------|
| MySQL | Admin API | Web (optional Prisma queries) |
| Redis | - | Admin API (session store - planned) |
| Discord API | Admin API, Bot | - |
| Admin API | Web, Admin UI | - |
| Bot Service | - | Admin API (rescan proxy) |

---

## Build Commands Summary

```bash
# Individual service builds
pnpm --filter @slimy/web build
pnpm --filter @slimy/admin-api build      # no-op (runs from source)
pnpm --filter @slimy/admin-ui build
pnpm --filter @slimy/bot build            # stub

# Build all services
pnpm build

# Test all services
pnpm test:all

# Lint all services
pnpm lint
```

## Workspace Scripts

The monorepo root provides convenience scripts (defined in root `package.json`):

```bash
pnpm dev:web          # pnpm --filter @slimy/web dev
pnpm dev:admin-api    # pnpm --filter @slimy/admin-api dev
pnpm dev:admin-ui     # pnpm --filter @slimy/admin-ui dev
pnpm dev:bot          # pnpm --filter @slimy/bot dev

pnpm test:all         # pnpm -r test
pnpm test:web         # pnpm --filter @slimy/web test
pnpm test:admin-api   # pnpm --filter @slimy/admin-api test

pnpm prisma:generate  # pnpm -r prisma:generate
```

## Deployment Methods

| Service | Method | Notes |
|---------|--------|-------|
| Web | Docker / Vercel | Dockerfile included, Vercel-ready |
| Admin API | systemd service | `admin-api.service` on VPS |
| Admin UI | systemd service | `admin-ui.service` on VPS |
| Bot | TBD | Not yet implemented |

All services run behind **Caddy** reverse proxy in production.

---

## Further Reading

- [INFRA_OVERVIEW.md](INFRA_OVERVIEW.md) - High-level architecture and data flows
- [DEV_WORKFLOW.md](DEV_WORKFLOW.md) - Development setup and workflows
- [apps/web/README.md](../apps/web/README.md) - Web app details
- [apps/admin-api/README.md](../apps/admin-api/README.md) - Admin API details
- [apps/admin-ui/README.md](../apps/admin-ui/README.md) - Admin UI details
