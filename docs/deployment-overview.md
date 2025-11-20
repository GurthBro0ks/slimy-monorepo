# Deployment Overview

This document provides a comprehensive overview of the Slimy.ai infrastructure, including what runs where, domain mappings, and repository organization.

## Infrastructure Hosts

### nuc1 (Development/Testing Environment)

**Database:** MySQL 8
- Container: `slimy-mysql`
- Port: 3306
- Data volume: `slimy-db-data`
- Authentication: mysql_native_password plugin

**Services:**
- **admin-api** (port 3080)
  - Container: `slimy-admin-api`
  - Built from: `apps/admin-api`
  - Environment: `/opt/slimy/app/admin-api/.env.admin.production`
  - Data volumes: `admin-api-data`, `admin-api-uploads`
  - Dependencies: MySQL database

- **admin-ui** (port 3081)
  - Container: `slimy-admin-ui`
  - Built from: `apps/admin-ui`
  - Environment: `/opt/slimy/app/admin-ui/.env.production`
  - Node.js 22 Alpine image
  - Dependencies: admin-api

- **web** (port 3000)
  - Container: `slimy-web`
  - Built from: `apps/web`
  - Environment: `/opt/slimy/test/slimyai-web/.env.production`
  - Dependencies: admin-api

**Network:** All services connected via `slimy-net` bridge network

**Docker Compose:** `infra/docker/docker-compose.slimy-nuc1.yml`

---

### nuc2 (Production Environment)

**Database:** PostgreSQL 16 Alpine
- Container: `slimy-db`
- Port: 5432
- Data volume: `postgres_data` (external volume)
- Backup directory: `/opt/slimy/backups/postgres`
- Environment: `/opt/slimy/secrets/.env.db.slimy-nuc2`

**Services:**
- **admin-api** (port 3080)
  - Container: `slimy-admin-api`
  - Built from: `apps/admin-api`
  - Environment: `/opt/slimy/secrets/.env.admin.production`
  - Data directories:
    - `/opt/slimy/data/admin-api/data` → `/app/data`
    - `/opt/slimy/data/admin-api/uploads` → `/var/lib/slimy/uploads`
    - `/opt/slimy/backups/admin-api` → `/var/backups/slimy`
    - `/opt/slimy/logs/admin-api` → `/app/logs`
  - Dependencies: PostgreSQL database

- **web** (port 3000)
  - Container: `slimy-web`
  - Built from: `apps/web`
  - Environment: `/opt/slimy/secrets/.env.web.production`
  - Build args:
    - `NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz`
    - `NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes`
    - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=slimy.ai`
  - Log directory: `/opt/slimy/logs/web`
  - Dependencies: PostgreSQL, admin-api

- **caddy** (reverse proxy)
  - Container: `slimy-caddy`
  - Image: `caddy:2`
  - Network mode: host
  - Configuration: `infra/docker/Caddyfile.slimy-nuc2`
  - Data volumes: `caddy_data`, `caddy_config` (external)
  - Handles SSL/TLS termination and domain routing
  - Dependencies: web, admin-api

- **loopback1455** (test service)
  - Container: `slimy-loopback1455`
  - Image: `python:3-alpine`
  - Port: 1455
  - Purpose: Simple HTTP server for testing

**Network:** All services connected via `slimy-network`

**Docker Compose:** `infra/docker/docker-compose.slimy-nuc2.yml`

---

## Domain Mappings (nuc2 Production)

All domains are managed by Caddy reverse proxy with automatic HTTPS:

### slimyai.xyz / www.slimyai.xyz
- **Primary Purpose:** Main Slimy.ai web portal
- **Backend Services:**
  - `/api/bedrock-status/*` → Web app (port 3000)
  - `/api/*` (except bedrock) → Admin API (port 3080)
  - All other routes → Web app (port 3000)

### login.slimyai.xyz
- **Primary Purpose:** Login portal
- **Backend Services:**
  - `/api/bedrock-status/*` → Web app (port 3000)
  - `/api/*` (except bedrock) → Admin API (port 3080)
  - All other routes → Web app (port 3000)

### panel.slimyai.xyz
- **Primary Purpose:** Admin panel interface
- **Backend Services:**
  - `/api/bedrock-status/*` → Web app (port 3000)
  - `/api/*` (except bedrock) → Admin API (port 3080)
  - All other routes → Web app (port 3000)

### slime.chat / www.slime.chat
- **Primary Purpose:** Chat service interface
- **Backend:** Web app (port 3000)
- **Note:** No admin API routing for this domain

### localhost:8080
- **Primary Purpose:** Local development/testing
- **Backend Services:** Same routing as main domains

---

## Repository Organization

### Monorepo Structure

```
slimy-monorepo/
├── apps/                    # Runnable applications
│   ├── admin-api/          # Express.js API (port 3080)
│   ├── admin-ui/           # Admin interface (port 3081)
│   ├── web/                # Public web portal (port 3000)
│   └── bot/                # Discord bot (planned)
├── packages/               # Shared libraries
│   ├── shared-config/     # Configuration utilities
│   ├── shared-db/         # Database clients & migrations
│   ├── shared-auth/       # Authentication utilities
│   ├── shared-snail/      # Core business logic
│   └── shared-codes/      # Error codes & constants
├── infra/                  # Infrastructure & deployment
│   ├── docker/            # Docker Compose files & Caddyfile
│   ├── caddy/             # Reverse proxy configs (planned)
│   ├── systemd/           # Service unit files (planned)
│   ├── scripts/           # Deployment scripts (planned)
│   ├── monitoring/        # Observability configs (planned)
│   └── backups/           # Backup automation (planned)
└── docs/                   # Documentation
```

### Key Applications

**apps/web** → GitHub: `GurthBro0ks/slimyai-web`
- Customer-facing Slimy.ai web portal
- Next.js application with MDX docs system
- Features: Homepage, Codes aggregator, Status page, Discord OAuth integration

**apps/admin-api** → Part of monorepo
- Express.js REST API for admin operations
- Port: 3080 (behind Caddy reverse proxy)
- Authentication: Discord OAuth2 (identify + guilds scopes)
- Session: JWT in httpOnly cookies + server-side session store
- Features: OAuth flow, guild management, health checks, uploads, diagnostics

**apps/admin-ui** → Part of monorepo
- Admin interface for operations and support teams
- Next.js application
- Port: 3081 (nuc1 only)
- Dependencies: admin-api

---

## Service Dependencies

### Startup Order (nuc2)

1. **PostgreSQL** must be healthy first
2. **admin-api** starts after PostgreSQL is healthy
3. **web** starts after PostgreSQL is healthy and admin-api has started
4. **caddy** starts after web is healthy and admin-api has started
5. **loopback1455** starts independently

### Health Checks

All services have health checks configured:

- **PostgreSQL:** `pg_isready` check every 10s
- **admin-api:** HTTP GET to `/api/health` every 30s (40s start period)
- **web:** HTTP GET to `/api/health` every 30s (30s start period)
- **loopback1455:** HTTP GET to root every 30s

---

## Environment Configuration

### nuc1 Environment Files
- MySQL: Configured via DB_URL in `.env.admin.production`
- admin-api: `/opt/slimy/app/admin-api/.env.admin.production`
- admin-ui: `/opt/slimy/app/admin-ui/.env.production`
- web: `/opt/slimy/test/slimyai-web/.env.production`

### nuc2 Environment Files (Production)
- PostgreSQL: `/opt/slimy/secrets/.env.db.slimy-nuc2`
- admin-api: `/opt/slimy/secrets/.env.admin.production`
- web: `/opt/slimy/secrets/.env.web.production`

### Key Environment Variables

**admin-api:**
- `PORT=3080`
- `NODE_ENV=production`
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`
- `DISCORD_BOT_TOKEN`
- `SESSION_SECRET`, `COOKIE_NAME`, `COOKIE_DOMAIN`
- `ALLOWED_ORIGIN` (CORS configuration)
- `DATABASE_URL` or `DB_*` variables
- `UPLOADS_DIR`, `BACKUP_ROOT`, `BACKUP_MYSQL_DIR`, `BACKUP_DATA_DIR`

**web:**
- `NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz`
- `NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=slimy.ai`
- `NEXT_TELEMETRY_DISABLED=1`

---

## Deployment Methods

### Docker Compose (Recommended)

**nuc1 (Development):**
```bash
cd /opt/slimy/infra/docker
docker compose -f docker-compose.slimy-nuc1.yml up -d
```

**nuc2 (Production):**
```bash
cd /opt/slimy/infra/docker
docker compose -f docker-compose.slimy-nuc2.yml up -d
```

### systemd Services (Alternative)

According to `apps/admin-api/README.md`, the admin-api can also be managed via systemd:

```bash
sudo systemctl restart admin-api
sudo journalctl -u admin-api -f
```

---

## Known Gaps in Documentation

The following infrastructure components were mentioned in the project goals but are not currently documented in the codebase:

- **Laptop:** No references found (mentioned as "control center" in requirements)
- **Minecraft server:** No configuration found (mentioned in backup requirements)
- **VPS:** No explicit VPS configuration found

These may exist outside the current repository or may be planned future additions.

---

## Quick Reference: Ports

| Service | Port | Protocol | Notes |
|---------|------|----------|-------|
| PostgreSQL | 5432 | TCP | nuc2 only |
| MySQL | 3306 | TCP | nuc1 only |
| web | 3000 | HTTP | Both nuc1 & nuc2 |
| admin-api | 3080 | HTTP | Both nuc1 & nuc2 |
| admin-ui | 3081 | HTTP | nuc1 only |
| loopback | 1455 | HTTP | nuc2 only |
| Caddy | 80/443 | HTTP/HTTPS | nuc2 only (host mode) |

---

## Quick Reference: Service Commands

**Check service status (Docker):**
```bash
docker ps
docker compose -f docker-compose.slimy-nuc2.yml ps
```

**View logs:**
```bash
docker logs slimy-admin-api -f
docker logs slimy-web -f
docker logs slimy-caddy -f
```

**Restart services:**
```bash
docker compose -f docker-compose.slimy-nuc2.yml restart admin-api
docker compose -f docker-compose.slimy-nuc2.yml restart web
```

**Check health:**
```bash
curl http://localhost:3080/api/health  # admin-api
curl http://localhost:3000/api/health  # web
curl https://slimyai.xyz/api/health    # via Caddy
```

---

Last updated by Claude Code (2025-11-19)
