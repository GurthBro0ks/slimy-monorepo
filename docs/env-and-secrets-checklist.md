# Slimy-Land Environment Variables & Secrets Checklist

**Version**: 1.0
**Last Updated**: 2025-11-19
**Purpose**: Central reference for all environment variables and secrets used across Slimy applications

> **⚠️ Important**: This document describes the structure and purpose of environment variables. It does NOT contain actual secret values. Refer to your secure configuration management system for real credentials.

---

## Table of Contents

1. [Admin API](#admin-api)
2. [Web Application](#web-application)
3. [Admin UI](#admin-ui)
4. [Discord Bot](#discord-bot)
5. [Minecraft / Slime.craft Status](#minecraft--slimecraft-status)
6. [Infrastructure](#infrastructure)
7. [Database & Caching](#database--caching)
8. [External Integrations](#external-integrations)
9. [Deployment Location Matrix](#deployment-location-matrix)
10. [Validation & Best Practices](#validation--best-practices)

---

## Admin API

**Service**: `apps/admin-api`
**Port**: 3080
**Runtime**: Node.js (Express)

### Core Authentication & Security

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `SESSION_SECRET` | Session encryption key for Express sessions (min 32 chars) | NUC1, NUC2 | Yes |
| `JWT_SECRET` | JWT signing key for token-based authentication (min 32 chars) | NUC1, NUC2 | Yes |
| `COOKIE_DOMAIN` | Cookie domain for session management (e.g., `.slimyai.xyz`) | NUC1, NUC2 | No |
| `ADMIN_COOKIE_SECURE` | Force secure cookies (HTTPS only) | NUC1, NUC2 | No |
| `ADMIN_COOKIE_SAMESITE` | SameSite cookie attribute (Strict/Lax/None) | NUC1, NUC2 | No |
| `ADMIN_TOKEN_COOKIE` | Token cookie name | NUC1, NUC2 | No |

### Server Configuration

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `PORT` | API server port (default: 3080) | NUC1, NUC2 | No |
| `NODE_ENV` | Environment mode (development/test/production) | NUC1, NUC2 | No |
| `ADMIN_API_SERVICE_NAME` | Service identifier for logging/monitoring | NUC1, NUC2 | No |
| `ADMIN_API_VERSION` | API version string | NUC1, NUC2 | No |
| `TRUST_PROXY` | Trust proxy headers (required behind Caddy) | NUC1, NUC2 | No |
| `ADMIN_TRUST_PROXY` | Alternative proxy trust setting | NUC1, NUC2 | No |

### CORS & Network Security

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated URLs) | NUC1, NUC2 | No |
| `CORS_ENABLED` | Enable CORS middleware | NUC1, NUC2 | No |
| `ALLOWED_ORIGIN` | Alternative allowed origin configuration | NUC1, NUC2 | No |
| `ADMIN_ALLOWED_ORIGINS` | Comma-separated allowed origins for admin routes | NUC1, NUC2 | No |
| `ADMIN_BASE_URL` | Base URL for admin API | NUC1, NUC2 | No |

### Discord OAuth Integration

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `DISCORD_CLIENT_ID` | Discord OAuth application ID | NUC1, NUC2, GitHub | No |
| `DISCORD_CLIENT_SECRET` | Discord OAuth application secret | NUC1, NUC2, GitHub | Yes |
| `DISCORD_REDIRECT_URI` | OAuth callback URL (e.g., `https://panel.slimyai.xyz/auth/callback`) | NUC1, NUC2 | No |
| `DISCORD_OAUTH_SCOPES` | OAuth scopes (default: "identify guilds") | NUC1, NUC2 | No |
| `DISCORD_BOT_TOKEN` | Optional Discord bot token for enhanced verification | NUC1, NUC2, GitHub | Yes |

### User Permissions & Access Control

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `ADMIN_USER_IDS` | Comma-separated Discord user IDs with admin permissions | NUC1, NUC2 | No |
| `CLUB_USER_IDS` | Comma-separated Discord user IDs with club permissions | NUC1, NUC2 | No |
| `ADMIN_GUILD_IDS` | Comma-separated allowed Discord guild IDs | NUC1, NUC2 | No |
| `ADMIN_OWNER_IDS` | Comma-separated owner user IDs (highest permissions) | NUC1, NUC2 | No |

### Backup & Storage

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `UPLOAD_MAX_FILE_SIZE` | Max upload size in bytes (default: 10485760 = 10MB) | NUC1, NUC2 | No |
| `UPLOAD_STORAGE_DIR` | Upload storage directory (default: ./uploads) | NUC1, NUC2 | No |
| `BACKUP_ROOT` | Backup root directory (default: /var/backups/slimy) | NUC1, NUC2 | No |
| `BACKUP_MYSQL_DIR` | MySQL backup directory | NUC1, NUC2 | No |
| `BACKUP_DATA_DIR` | Data backup directory | NUC1, NUC2 | No |
| `BACKUP_RETENTION_DAYS` | Backup retention days (default: 14) | NUC1, NUC2 | No |

### OpenAI Integration

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | NUC1, NUC2, GitHub | Yes |
| `OPENAI_MODEL` | OpenAI model to use (default: gpt-4o-mini) | NUC1, NUC2 | No |

### Google Sheets Integration

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `STATS_SHEET_ID` | Google Sheets ID for stats/analytics export | NUC1, NUC2 | No |
| `STATS_BASELINE_TITLE` | Stats baseline title for sheet tabs | NUC1, NUC2 | No |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Google service account JSON file | NUC1, NUC2 | No |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Google service account credentials as JSON string | NUC1, NUC2, GitHub | Yes |

### Rate Limiting

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `ADMIN_TASK_LIMIT_WINDOW_MS` | Rate limit window in milliseconds (default: 60000) | NUC1, NUC2 | No |
| `ADMIN_TASK_LIMIT_MAX` | Max requests per window (default: 5) | NUC1, NUC2 | No |

### Security Headers & Monitoring

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `HSTS_MAX_AGE` | HSTS max age in seconds (default: 31536000 = 1 year) | NUC1, NUC2 | No |
| `SENTRY_DSN` | Sentry error tracking DSN | NUC1, NUC2, GitHub | Yes |
| `LOG_LEVEL` | Logging level (default: info) | NUC1, NUC2 | No |

### Admin Features

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `ADMIN_AUDIT_DISABLED` | Disable audit logging (default: false) | NUC1, NUC2 | No |
| `ADMIN_REDIRECT_SUCCESS` | Success redirect URL after authentication | NUC1, NUC2 | No |
| `ADMIN_REDIRECT_FAILURE` | Failure redirect URL after failed authentication | NUC1, NUC2 | No |
| `SNELP_CODES_URL` | Snelp API endpoint for codes/verification | NUC1, NUC2 | No |

---

## Web Application

**Service**: `apps/web`
**Port**: 3000
**Runtime**: Next.js (TypeScript)

### Server-Side (Private) Variables

These variables are only available on the server and NOT exposed to the browser.

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `NODE_ENV` | Environment mode (development/test/production) | NUC1, NUC2, GitHub | No |
| `OPENAI_API_KEY` | OpenAI API key for server-side AI features | NUC1, NUC2, GitHub | Yes |
| `OPENAI_API_BASE` | OpenAI API base URL (default: https://api.openai.com/v1) | NUC1, NUC2 | No |
| `MCP_BASE_URL` | Model Context Protocol integration base URL | NUC1, NUC2 | No |
| `MCP_API_KEY` | MCP API key for server-side requests | NUC1, NUC2, GitHub | Yes |
| `DOCS_SOURCE_REPO` | GitHub repo for documentation auto-import (e.g., owner/repo) | NUC1, NUC2 | No |
| `GITHUB_TOKEN` | GitHub API token for docs import and API access | NUC1, NUC2, GitHub | Yes |
| `FIRECRAWL_API_KEY` | Firecrawl API key for web scraping | NUC1, NUC2, GitHub | Yes |
| `DISCORD_TOKEN` | Discord bot token for server-side Discord integration | NUC1, NUC2, GitHub | Yes |
| `DISCORD_CLIENT_ID` | Discord application client ID | NUC1, NUC2 | No |
| `REQUEST_SIGNING_SECRET` | Secret for request signing/verification (default: change-me-in-production) | NUC1, NUC2, GitHub | Yes |
| `CI` | CI environment flag (GitHub Actions) | GitHub | No |
| `PLAYWRIGHT_DEBUG` | Playwright debug mode for E2E tests | Local, GitHub | No |

### Client-Side (Public) Variables

These variables are prefixed with `NEXT_PUBLIC_` and are embedded in browser bundles.

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `NEXT_PUBLIC_APP_URL` | Application URL (default: http://localhost:3000) | NUC1, NUC2 | No |
| `NEXT_PUBLIC_ADMIN_API_BASE` | Admin API base URL (REQUIRED) | NUC1, NUC2 | No |
| `NEXT_PUBLIC_SNELP_CODES_URL` | Snelp codes API URL (REQUIRED) | NUC1, NUC2 | No |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible analytics tracking domain | NUC1, NUC2 | No |
| `NEXT_PUBLIC_CDN_DOMAIN` | CDN domain for images (e.g., cdn.slimyai.xyz) | NUC1, NUC2 | No |
| `NEXT_PUBLIC_CDN_URL` | CDN URL path for assets | NUC1, NUC2 | No |

### Build-Time Variables

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `ANALYZE` | Enable webpack bundle analyzer | Local | No |

---

## Admin UI

**Service**: `apps/admin-ui`
**Port**: 3081
**Runtime**: Next.js

### Build-Time Variables

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `NEXT_PUBLIC_ADMIN_API_BASE` | Admin API base URL (defaults to http://localhost:3080 in dev) | NUC1, NUC2 | No |
| `NEXT_PUBLIC_BOT_CLIENT_ID` | Discord bot client ID (default: 1415387116564910161) | NUC1, NUC2 | No |
| `NEXT_PUBLIC_BOT_INVITE_SCOPES` | Bot invite scopes (default: "bot applications.commands") | NUC1, NUC2 | No |
| `NEXT_PUBLIC_BOT_PERMISSIONS` | Bot permissions bitmask (default: "274878286848") | NUC1, NUC2 | No |
| `NEXT_BUILD_ID` | Custom build ID override | NUC1, NUC2 | No |
| `NODE_ENV` | Environment mode | NUC1, NUC2 | No |

---

## Discord Bot

**Service**: `apps/bot`
**Status**: Stub/TODO (not yet fully implemented)

### Planned Variables

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `DISCORD_BOT_TOKEN` | Discord bot token for authentication | NUC1, NUC2, GitHub | Yes |
| `DISCORD_CLIENT_ID` | Discord application client ID | NUC1, NUC2 | No |
| `DISCORD_CLIENT_SECRET` | Discord application client secret | NUC1, NUC2, GitHub | Yes |
| `BOT_PREFIX` | Command prefix for bot commands | NUC1, NUC2 | No |
| `BOT_OWNER_IDS` | Bot owner Discord user IDs | NUC1, NUC2 | No |

---

## Minecraft / Slime.craft Status

**Status**: Currently integrated via external APIs/services
**Notes**: Minecraft server status checking may be handled via Admin API endpoints

### Potential Variables

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `MINECRAFT_SERVER_HOST` | Minecraft server hostname or IP | NUC1, NUC2 | No |
| `MINECRAFT_SERVER_PORT` | Minecraft server query port (default: 25565) | NUC1, NUC2 | No |
| `MINECRAFT_RCON_PASSWORD` | RCON password for server management | NUC1, NUC2 | Yes |

---

## Infrastructure

### Reverse Proxy (Caddy)

**Service**: `infra/docker/Caddyfile.*`
**Deployment**: NUC1, NUC2

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `CADDY_ADMIN_PORT` | Caddy admin API port | NUC1, NUC2 | No |
| `ACME_EMAIL` | Email for Let's Encrypt certificate registration | NUC1, NUC2 | No |

### Auto-Deploy & Git Dirt Watcher

**Service**: Infrastructure monitoring and deployment scripts
**Location**: Systemd units and monitoring services on NUC hosts

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `DEPLOY_BRANCH` | Git branch to monitor for auto-deploy (e.g., main) | NUC1, NUC2 | No |
| `DEPLOY_REMOTE` | Git remote to pull from (default: origin) | NUC1, NUC2 | No |
| `DEPLOY_WEBHOOK_URL` | Webhook URL for deployment notifications | NUC1, NUC2 | Yes |
| `GIT_DIRT_CHECK_INTERVAL` | Interval for git status checking (seconds) | NUC1, NUC2 | No |

### Docker Compose

**Files**: `infra/docker/docker-compose.slimy-nuc*.yml`

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `COMPOSE_PROJECT_NAME` | Docker Compose project name | NUC1, NUC2 | No |
| `DOCKER_RESTART_POLICY` | Container restart policy (default: unless-stopped) | NUC1, NUC2 | No |

---

## Database & Caching

### PostgreSQL Database

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `DATABASE_URL` | PostgreSQL connection string (postgresql://user:pass@host:port/db) | NUC1, NUC2, GitHub | Yes |
| `DB_HOST` | Database host (alternative to DATABASE_URL) | NUC1, NUC2 | No |
| `DB_PORT` | Database port (default: 5432) | NUC1, NUC2 | No |
| `DB_NAME` | Database name | NUC1, NUC2 | No |
| `DB_USER` | Database username | NUC1, NUC2 | No |
| `DB_PASSWORD` | Database password | NUC1, NUC2, GitHub | Yes |
| `DB_CONNECTION_LIMIT` | Connection pool size limit | NUC1, NUC2 | No |

### Redis Cache

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `REDIS_URL` | Redis connection URL (redis://host:port) | NUC1, NUC2, GitHub | Yes |
| `REDIS_HOST` | Redis host (alternative to REDIS_URL) | NUC1, NUC2 | No |
| `REDIS_PORT` | Redis port (default: 6379) | NUC1, NUC2 | No |
| `REDIS_PASSWORD` | Redis password | NUC1, NUC2, GitHub | Yes |

---

## External Integrations

### CDN Configuration

| Variable | Description | Location | Sensitive |
|----------|-------------|----------|-----------|
| `CDN_URL` | CDN base URL for static assets | NUC1, NUC2 | No |
| `CDN_ENABLED` | Enable CDN integration | NUC1, NUC2 | No |
| `STATIC_MAX_AGE` | Static asset cache TTL (default: 31536000 seconds = 1 year) | NUC1, NUC2 | No |
| `UPLOADS_MAX_AGE` | Uploads cache TTL (default: 86400 seconds = 1 day) | NUC1, NUC2 | No |

---

## Deployment Location Matrix

This table shows which environment variables should be configured in each deployment location.

| Variable Category | NUC1 | NUC2 | GitHub Secrets | Local Dev |
|-------------------|------|------|----------------|-----------|
| **Core Secrets** (SESSION_SECRET, JWT_SECRET) | ✓ | ✓ | ✓ | ✓ |
| **Discord OAuth** (CLIENT_ID, CLIENT_SECRET) | ✓ | ✓ | ✓ | ✓ |
| **Database** (DATABASE_URL) | ✓ | ✓ | ✓ | ✓ |
| **Redis** (REDIS_URL) | ✓ | ✓ | ✓ | Optional |
| **OpenAI API** (OPENAI_API_KEY) | ✓ | ✓ | ✓ | Optional |
| **Firecrawl API** (FIRECRAWL_API_KEY) | ✓ | ✓ | ✓ | Optional |
| **Google Sheets** (GOOGLE_APPLICATION_CREDENTIALS_JSON) | ✓ | ✓ | ✓ | Optional |
| **GitHub Token** (GITHUB_TOKEN) | ✓ | ✓ | ✓ | Optional |
| **MCP Integration** (MCP_BASE_URL, MCP_API_KEY) | ✓ | ✓ | ✓ | Optional |
| **Sentry** (SENTRY_DSN) | ✓ | ✓ | ✓ | Optional |
| **Public URLs** (NEXT_PUBLIC_*) | ✓ | ✓ | Optional | ✓ |
| **Feature Flags** | ✓ | ✓ | Optional | ✓ |

### NUC1 vs NUC2 Differences

- **NUC1**: Primary production deployment (slimyai.xyz, panel.slimyai.xyz)
- **NUC2**: Secondary/staging deployment or redundant production
- Both should have identical configuration for high availability

### GitHub Secrets Usage

GitHub Secrets are primarily used for:
- **CI/CD**: Running tests, builds, and deployments in GitHub Actions
- **Integration Tests**: E2E tests that require API keys
- **Automated Deployments**: Secret injection during container builds

**Required GitHub Secrets**:
- `SESSION_SECRET`
- `JWT_SECRET`
- `DISCORD_CLIENT_SECRET`
- `DATABASE_URL` (test database)
- `OPENAI_API_KEY` (for AI feature tests)
- `GITHUB_TOKEN` (for GitHub API access)

---

## Validation & Best Practices

### Required Variables by Service

#### Admin API (Minimum Required)
- `SESSION_SECRET`
- `JWT_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DATABASE_URL`

#### Web Application (Minimum Required)
- `NEXT_PUBLIC_ADMIN_API_BASE`
- `NEXT_PUBLIC_SNELP_CODES_URL`

#### Admin UI (Minimum Required)
- `NEXT_PUBLIC_ADMIN_API_BASE`

### Secret Generation Best Practices

1. **Session & JWT Secrets**: Minimum 32 characters, use cryptographically random values
   ```bash
   # Generate secure random secret
   openssl rand -base64 32
   ```

2. **Database URLs**: Always use strong passwords and connection pooling
   ```
   postgresql://username:password@hostname:5432/database_name?pool_timeout=0
   ```

3. **Discord Configuration**: Obtain from Discord Developer Portal
   - Create application at https://discord.com/developers/applications
   - Client ID: Public identifier
   - Client Secret: Private, never commit to git

4. **API Keys**: Rotate regularly, use separate keys for dev/staging/production

### Validation Rules

The Admin API validates environment variables at startup:

- **Required**: SESSION_SECRET, JWT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DATABASE_URL
- **Recommended**: DISCORD_BOT_TOKEN, OPENAI_API_KEY, ADMIN_USER_IDS, CLUB_USER_IDS
- **Validation**:
  - Secrets must be 32+ characters
  - Discord Client ID must be numeric
  - Database URL must start with `postgresql://` or `postgres://`
  - Port must be 1-65535
  - CORS origins must be valid HTTP/HTTPS URLs

The Web App uses Zod schema validation and provides detailed error messages for missing or invalid variables.

### Environment File Security

**DO NOT**:
- Commit `.env` files with real values to git
- Share `.env` files via insecure channels (email, Slack, etc.)
- Use production secrets in development

**DO**:
- Use `.env.example` files as templates (committed to git)
- Store production secrets in secure vaults (1Password, AWS Secrets Manager, etc.)
- Use different secrets for each environment (dev/staging/production)
- Rotate secrets regularly
- Audit access to production environment files

---

## CLI Validation Tool (Proposed)

A future CLI tool could validate `.env` files against the schema defined in `infra/config-reference/env-schema.example.yml`.

### Proposed Features

```bash
# Validate a .env file against the schema
slimy-config validate apps/admin-api/.env.admin.production

# Check for missing required variables
slimy-config check --service admin-api --env production

# Generate a .env template for a service
slimy-config template --service web --output .env.example

# Diff two environments
slimy-config diff .env.staging .env.production

# Encrypt/decrypt .env files
slimy-config encrypt .env.production --output .env.production.enc
slimy-config decrypt .env.production.enc --output .env.production
```

### Implementation Approach

1. **Schema Format**: YAML-based schema in `infra/config-reference/env-schema.example.yml`
2. **Validation Library**: Use existing libraries (Joi, Zod, AJV) for schema validation
3. **CLI Framework**: Commander.js or similar for CLI interface
4. **Integration**: Hook into CI/CD pipelines to validate before deployment
5. **Security**: Never log sensitive values, provide masked output

### Example Validation Output

```
✓ SESSION_SECRET: Present, 64 characters (required: 32+)
✓ JWT_SECRET: Present, 64 characters (required: 32+)
✓ DATABASE_URL: Valid PostgreSQL URL
✗ OPENAI_API_KEY: Missing (recommended)
⚠ ADMIN_USER_IDS: Not set (authorization may not work)
✓ PORT: 3080 (valid range)

Summary: 4 passed, 1 failed, 1 warning
Status: ⚠ Warning - review recommended variables
```

### Benefits

- **Consistency**: Ensure all deployments have required configuration
- **Documentation**: Self-documenting through schema and validation messages
- **Security**: Catch missing secrets before deployment failures
- **Onboarding**: New developers can quickly identify required setup
- **Compliance**: Audit trail of configuration changes

---

## See Also

- [Repository Structure](./STRUCTURE.md) - Overall monorepo architecture
- `apps/admin-api/.env.example` - Complete Admin API environment template
- `apps/web/lib/env.ts` - Web app environment validation schema
- `infra/config-reference/env-schema.example.yml` - Machine-readable schema reference

---

**Maintained by**: Slimy DevOps Team
**Questions**: Contact infrastructure team or create an issue in the repository
