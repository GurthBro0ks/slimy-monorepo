# Infrastructure Overview

This document provides a high-level overview of the Slimy.ai infrastructure and how the various services communicate with each other.

## System Architecture

The Slimy.ai platform consists of four main applications working together to provide a comprehensive Discord bot management experience:

```
┌──────────────────────────────────────────────────────────────┐
│                     End Users & Services                      │
└──────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    [Discord]            [Web Users]         [Admin Users]
         │                    │                    │
         │                    ▼                    ▼
         │              ┌──────────┐        ┌──────────┐
         │              │   Web    │        │ Admin UI │
         │              │  :3000   │        │  :3081   │
         │              └──────────┘        └──────────┘
         │                    │                    │
         │                    └────────┬───────────┘
         │                             ▼
         │                      ┌────────────┐
         │                      │ Admin API  │
         └─────────────────────▶│   :3080    │
                                └────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │   Database & Storage     │
                        │  • MySQL (Prisma)        │
                        │  • Redis (sessions)      │
                        │  • File uploads          │
                        └──────────────────────────┘
```

## Component Descriptions

### Web App (`:3000`)

**Purpose**: Public-facing website for Slimy.ai Discord bot featuring user tools and documentation.

**Key Features**:
- **Home & Landing Pages**: Bot information and feature showcase
- **Codes Aggregator**: Merges codes from Snelp API and Reddit r/SuperSnailGame
- **MDX Documentation System**: Auto-imported docs from GitHub with sidebar navigation
- **Role-Based Routing**: Directs authenticated users to appropriate dashboards
  - Admin users → `/guilds`
  - Club users → `/club`
  - Regular users → `/snail`

**Technology**: Next.js 16 with App Router, TypeScript, Tailwind CSS

**Communication**:
- **→ Admin API**: Server-side proxies for auth (`/api/auth/me`), diagnostics (`/api/diag`), and guild management
- **→ External APIs**: Snelp codes API, Reddit API, GitHub API (docs import)

### Admin API (`:3080`)

**Purpose**: RESTful API backend powering the admin dashboard and providing Discord bot management capabilities.

**Key Features**:
- **Discord OAuth2 Authentication**: Login flow with `identify` and `guilds` scopes
- **Session Management**: JWT in httpOnly cookies with server-side session store
- **Guild Management**: CRUD operations for guild settings, channels, and configurations
- **Club Analytics**: Member power metrics and rescan functionality
- **Upload Management**: Multi-file image uploads with automatic thumbnail generation
- **Health & Diagnostics**: System metrics and monitoring endpoints

**Technology**: Express.js with Prisma ORM, MySQL, Redis

**Communication**:
- **← Web App**: API proxies for auth and data
- **← Admin UI**: Direct API calls for dashboard functionality
- **→ Discord API**: OAuth flow and bot membership checks
- **→ Database**: MySQL via Prisma for persistent storage
- **→ Redis**: Session caching
- **→ Bot Service** (optional): Rescan triggers via `BOT_RESCAN_URL`

**API Endpoints**:
- `/api/auth/*` - Authentication (login, callback, logout, session check)
- `/api/guilds` - Guild listing and management
- `/api/guilds/:guildId/*` - Guild-specific endpoints (health, settings, channels, personality, corrections, usage)
- `/api/guilds/:guildId/club/*` - Club analytics (latest metrics, rescan)
- `/api/uploads/:guildId` - Upload management
- `/api/diag` - System diagnostics
- `/api/bot/rescan` - Bot service proxy

### Admin UI (`:3081`)

**Purpose**: Web-based dashboard for Discord bot administrators to manage guilds and monitor bot health.

**Key Features**:
- **Guild Selection**: List of user's guilds with bot installation status
- **Guild Dashboard Tabs**:
  - **Dashboard**: Health metrics, task runner, live log stream
  - **Uploads**: Multi-file screenshot uploader with responsive gallery
  - **Current Sheet**: Google Sheet embed with corrections manager and rescan tools
- **Live Diagnostics Widget**: Real-time uptime, memory, and upload statistics
- **Session-Based Auth**: httpOnly cookies from Admin API

**Technology**: Next.js 14 with standalone output

**Communication**:
- **→ Admin API**: All data operations via REST API
  - Authentication: `GET /api/auth/me`, `POST /api/auth/logout`
  - Guilds: `GET /api/guilds`, `GET /api/guilds/:guildId/*`
  - Uploads: `GET/POST /api/uploads/:guildId`
  - Diagnostics: `GET /api/diag`

### Bot (TBD)

**Purpose**: Discord bot application (placeholder - not yet implemented).

**Status**: Currently a placeholder with stub package.json. No actual implementation exists yet.

**Planned Communication**:
- **→ Discord API**: Discord gateway and REST API
- **← Admin API**: Receive configuration updates and rescan triggers

## Data Flow Examples

### User Authentication Flow

```
1. User visits Admin UI
2. Admin UI → Admin API: GET /api/auth/login
3. Admin API → Discord: OAuth redirect
4. Discord → Admin API: OAuth callback with code
5. Admin API → Discord: Exchange code for access token
6. Admin API → Discord: Fetch user info and guilds
7. Admin API: Create JWT, store session, set cookie
8. Admin API → Admin UI: Redirect to /guilds
```

### Guild Data Retrieval

```
1. Admin UI → Admin API: GET /api/guilds
2. Admin API → Discord: Check bot installation status (parallel)
3. Admin API → Database: Fetch guild settings
4. Admin API → Admin UI: Return guild list with metadata
```

### Club Analytics Flow

```
1. Admin UI → Admin API: GET /api/guilds/:guildId/club/latest
2. Admin API → Database: Query member power metrics
3. Admin API → Admin UI: Return sorted member data
```

### Public User Flow

```
1. User visits Web App
2. Web App → Snelp API: Fetch active codes
3. Web App → Reddit API: Fetch r/SuperSnailGame codes
4. Web App: Deduplicate and merge codes
5. Web App → User: Display codes with copy functionality
```

## Development Ports

| Service    | Dev Port | Production Access        |
|-----------|----------|--------------------------|
| Web       | 3000     | https://slimyai.xyz      |
| Admin API | 3080     | https://admin.slimyai.xyz/api (reverse proxied) |
| Admin UI  | 3081     | https://admin.slimyai.xyz |
| Bot       | TBD      | Discord Gateway          |

## Deployment Architecture

All services run behind **Caddy** as a reverse proxy with:
- Automatic HTTPS via Let's Encrypt
- Request routing by domain/path
- Static file serving for uploads

Services are managed as **systemd** units:
- `admin-api.service`
- `admin-ui.service`
- Web deployment via Docker or Vercel

## Database & Storage

### MySQL (via Prisma)
- User data
- Guild configurations
- Club analytics metrics
- Correction history

### Redis
- Session storage (12-hour expiry)
- API response caching (60s)

### File Storage
- Upload directory: `/var/lib/slimy/uploads`
- Image variants: JPEG, XL, thumbnails
- Public access via `/api/uploads/files/*`

## Security Considerations

- **Authentication**: Discord OAuth2 with JWT
- **Session Storage**: Server-side to avoid cookie size limits
- **Cookies**: httpOnly, secure, sameSite=lax
- **CORS**: Restricted to allowed origins
- **Headers**: Helmet.js security headers
- **Rate Limiting**: Express rate limiter
- **File Uploads**: Size limits (25MB/file, 20 files max)

## Notes & Caveats

1. **Club Analytics**: Requires database schema migration (see `docs/CLUB_SCHEMA_MIGRATION.md`)
2. **Bot Service**: Not yet implemented - placeholders exist in codebase
3. **Stub Endpoints**: Some Admin API endpoints return placeholder data pending database integration
4. **Session Persistence**: Current session store is in-memory; Redis integration planned for production
5. **Environment Variables**: Each service requires specific `.env` files - see individual service READMEs
6. **Slimecraft Status Mock**: Not present in current codebase (mentioned in legacy documentation but not implemented)

## Further Reading

- [DEV_WORKFLOW.md](DEV_WORKFLOW.md) - Development setup and workflows
- [SERVICES_MATRIX.md](SERVICES_MATRIX.md) - Detailed service reference table
- [STRUCTURE.md](STRUCTURE.md) - Monorepo structure and ownership
- [WEB_BACKEND_INTEGRATION_SUMMARY.md](WEB_BACKEND_INTEGRATION_SUMMARY.md) - Web and Admin API integration details
- [CLUB_SCHEMA_MIGRATION.md](CLUB_SCHEMA_MIGRATION.md) - Club analytics database schema
