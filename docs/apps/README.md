# Application Documentation

This directory contains documentation specific to the applications in the monorepo.

## Applications

### Web App (`apps/web`)
- **Purpose:** Customer-facing Slimy.ai web portal
- **Framework:** Next.js 16 with Turbopack
- **Key Features:** Discord OAuth, chat interface, public stats pages
- **Build Issues:** [web-import-build-errors.md](./web-import-build-errors.md)

### Admin API (`apps/admin-api`)
- **Purpose:** Backend API for administrative workflows
- **Framework:** Node.js/Express
- **Key Features:** Database access, Discord OAuth, session management
- **Build Issues:** [admin-import-build-errors.md](./admin-import-build-errors.md)

### Admin UI (`apps/admin-ui`)
- **Purpose:** Admin interface for operations and support teams
- **Framework:** Next.js
- **Key Features:** API client, Discord helpers, websocket utilities

### Bot (`apps/bot`)
- **Purpose:** Conversational bot services and Discord integrations
- **Framework:** Discord.js

## Environment Configuration

### Admin API
The admin API requires several environment variables. See `apps/admin-api/.env.example` for the template:
- Database: `DATABASE_URL` or `DB_*` variables
- Discord OAuth: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`
- Auth: `SESSION_SECRET`, `JWT_SECRET`, `COOKIE_DOMAIN`
- CORS: `CORS_ORIGIN`, `ADMIN_ALLOWED_ORIGINS`
- Service: `ADMIN_API_SERVICE_NAME`, `ADMIN_API_VERSION`
- Integrations: `OPENAI_API_KEY`, Google Sheets IDs, upload paths

### Admin UI
The admin UI reads build-time environment variables. Create `.env.local`:
- `NEXT_PUBLIC_ADMIN_API_BASE` (defaults to `http://localhost:3080`)
- Discord bot metadata: `NEXT_PUBLIC_BOT_CLIENT_ID`, `NEXT_PUBLIC_BOT_INVITE_SCOPES`, `NEXT_PUBLIC_BOT_PERMISSIONS`
- Optional: `NEXT_BUILD_ID`

## Build Error Logs

### Web App Build Issues
See [web-import-build-errors.md](./web-import-build-errors.md) for a comprehensive log of build errors encountered during the web app import and migration to the monorepo. This includes:
- Next.js 16 migration issues
- TypeScript type errors
- Dependency version conflicts
- Prisma client generation issues

Key resolved issues:
- pnpm v10 build scripts configuration
- Next.js font loading in restricted networks
- Multiple lockfile warnings
- API route signature changes in Next.js 16

### Admin Build Issues
See [admin-import-build-errors.md](./admin-import-build-errors.md) for admin-specific build issues, including:
- Missing `socket.io-client` dependency (resolved)

## Shared Modules

Several reusable modules may be promoted to workspace packages later:

### From admin-api:
- `apps/admin-api/lib`: Database, JWT/session, queue, monitoring helpers
- `apps/admin-api/vendor/slimy-core`: Core domain logic

### From admin-ui:
- `apps/admin-ui/lib`: API client, Discord helpers, session management, Sheets accessors, WebSocket utilities

## Related Documentation

- [Repository Structure](../STRUCTURE.md)
- [Development Workflows](../dev/README.md)
- [Docker Deployment](../infra/DOCKER_DEPLOYMENT.md)

## Agent Reports

App-specific agent improvements will be linked here as they become available.
