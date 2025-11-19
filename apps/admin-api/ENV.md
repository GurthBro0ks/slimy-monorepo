# Admin API Environment Variables

This document describes all environment variables used by the Admin API, including which are required, which are optional, and what they control.

## Overview

The Admin API uses a **type-safe configuration system** powered by [Zod](https://zod.dev/) for runtime validation and TypeScript for compile-time type safety. The configuration is defined in `src/lib/config/typed-config.ts` and validates all environment variables at startup.

## Configuration Loading

Environment variables are loaded from:
1. `.env.admin` (if present)
2. `.env` (fallback for shared values)
3. System environment variables

The configuration is validated at startup. **If required variables are missing or invalid, the application will fail to start with a clear error message.**

## Required Environment Variables

These variables **must** be set or the application will fail to start:

### Authentication & Security

#### `JWT_SECRET`
- **Required**: Yes
- **Format**: String, minimum 32 characters
- **Description**: Secret key for signing JWT tokens
- **Example**: `JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long`

#### `SESSION_SECRET`
- **Required**: Yes
- **Format**: String, minimum 32 characters
- **Description**: Secret key for signing session cookies
- **Example**: `SESSION_SECRET=your-super-secret-session-key-at-least-32-characters`

### Discord OAuth

#### `DISCORD_CLIENT_ID`
- **Required**: Yes
- **Format**: Numeric string (Discord snowflake, 17-19 digits)
- **Description**: Discord OAuth2 application client ID
- **Example**: `DISCORD_CLIENT_ID=1234567890123456789`

#### `DISCORD_CLIENT_SECRET`
- **Required**: Yes
- **Format**: String
- **Description**: Discord OAuth2 application client secret
- **Example**: `DISCORD_CLIENT_SECRET=your-discord-client-secret`

### Database

#### `DATABASE_URL`
- **Required**: Yes
- **Format**: PostgreSQL connection string (`postgresql://` or `postgres://`)
- **Description**: PostgreSQL database connection URL
- **Example**: `DATABASE_URL=postgresql://user:password@localhost:5432/slimy_admin`

---

## Optional Environment Variables

### Server Configuration

#### `NODE_ENV`
- **Default**: `development`
- **Options**: `development`, `production`, `test`
- **Description**: Application environment mode

#### `PORT`
- **Default**: `3080`
- **Format**: Number (1-65535)
- **Description**: Port the server listens on

#### `HOST`
- **Default**: `127.0.0.1`
- **Description**: Host address the server binds to

#### `ADMIN_API_SERVICE_NAME`
- **Default**: `slimy-admin-api`
- **Description**: Service name for logging and monitoring

#### `ADMIN_API_VERSION`
- **Default**: `dev`
- **Description**: Application version for logging and monitoring

### Discord Configuration

#### `DISCORD_REDIRECT_URI`
- **Default**: `https://admin.slimyai.xyz/api/auth/callback`
- **Format**: URL
- **Description**: OAuth2 callback URL for Discord authentication

#### `DISCORD_OAUTH_SCOPES`
- **Default**: `identify guilds`
- **Description**: Space-separated list of Discord OAuth2 scopes

#### `DISCORD_BOT_TOKEN`
- **Default**: (empty)
- **Description**: Discord bot token for bot-specific operations

### CORS & Security

#### `CORS_ALLOW_ORIGIN`
- **Default**: `https://admin.slimyai.xyz,http://127.0.0.1:3000,http://localhost:3000`
- **Format**: Comma-separated list of URLs
- **Description**: Allowed origins for CORS requests
- **Example**: `CORS_ALLOW_ORIGIN=https://admin.example.com,http://localhost:3081`

#### `CORS_ENABLED`
- **Default**: `false`
- **Format**: Boolean (`true`, `false`, `1`, `0`, `yes`, `no`)
- **Description**: Enable or disable CORS middleware

#### `TRUST_PROXY` / `ADMIN_TRUST_PROXY`
- **Default**: `true`
- **Format**: Boolean
- **Description**: Trust proxy headers (X-Forwarded-For, etc.)

#### `HSTS_MAX_AGE`
- **Default**: `31536000` (1 year in seconds)
- **Description**: HTTP Strict Transport Security max age

### Cookies & Session

#### `COOKIE_DOMAIN` / `ADMIN_COOKIE_DOMAIN`
- **Default**: `.slimyai.xyz`
- **Description**: Domain for session cookies

#### `COOKIE_SECURE` / `ADMIN_COOKIE_SECURE`
- **Default**: `true` in production, `false` in development
- **Format**: Boolean
- **Description**: Whether to set Secure flag on cookies

#### `COOKIE_SAMESITE` / `ADMIN_COOKIE_SAMESITE`
- **Default**: `lax`
- **Options**: `strict`, `lax`, `none`
- **Description**: SameSite cookie attribute

#### `ADMIN_TOKEN_COOKIE`
- **Default**: `slimy_admin_token`
- **Description**: Name of the JWT cookie

### JWT Configuration

#### `JWT_EXPIRES_IN`
- **Default**: `12h`
- **Format**: Time string (e.g., `12h`, `7d`, `60s`)
- **Description**: JWT token expiration time

#### `JWT_MAX_AGE_SECONDS`
- **Default**: `43200` (12 hours)
- **Format**: Number (seconds)
- **Description**: Maximum age for JWT tokens in seconds

### User & Permission Management

#### `ADMIN_OWNER_IDS`
- **Format**: Comma-separated Discord user IDs
- **Description**: Discord user IDs with owner permissions
- **Example**: `ADMIN_OWNER_IDS=123456789,987654321`

#### `ADMIN_GUILD_IDS`
- **Format**: Comma-separated Discord guild IDs
- **Description**: Allowed Discord guild IDs
- **Example**: `ADMIN_GUILD_IDS=111222333,444555666`

#### `ADMIN_USER_IDS`
- **Format**: Comma-separated Discord user IDs
- **Description**: Discord user IDs with admin role
- **Example**: `ADMIN_USER_IDS=123456789,987654321`

#### `CLUB_USER_IDS`
- **Format**: Comma-separated Discord user IDs
- **Description**: Discord user IDs with club role
- **Example**: `CLUB_USER_IDS=123456789,987654321`

### Admin UI Redirects

#### `ADMIN_REDIRECT_SUCCESS`
- **Default**: `http://localhost:3081`
- **Format**: URL
- **Description**: Redirect URL after successful authentication

#### `ADMIN_REDIRECT_FAILURE`
- **Default**: `http://localhost:3081/login`
- **Format**: URL
- **Description**: Redirect URL after failed authentication

#### `ADMIN_BASE_URL`
- **Default**: `http://localhost:3081`
- **Format**: URL
- **Description**: Base URL for the admin UI

### File Upload & Backup

#### `UPLOAD_MAX_MB` / `MAX_UPLOAD_MB`
- **Default**: `10`
- **Format**: Number (megabytes)
- **Description**: Maximum file upload size

#### `BACKUP_ROOT`
- **Default**: `/var/backups/slimy`
- **Description**: Root directory for backups

#### `BACKUP_MYSQL_DIR`
- **Default**: `/var/backups/slimy/mysql`
- **Description**: Directory for MySQL backups

#### `BACKUP_DATA_DIR`
- **Default**: `/var/backups/slimy/data`
- **Description**: Directory for data backups

#### `BACKUP_RETENTION_DAYS`
- **Default**: `14`
- **Format**: Number (days)
- **Description**: Number of days to retain backups

### External Services

#### `OPENAI_API_KEY`
- **Format**: String (should start with `sk-`)
- **Description**: OpenAI API key for AI features
- **Example**: `OPENAI_API_KEY=sk-...`

#### `OPENAI_MODEL`
- **Default**: `gpt-4o-mini`
- **Description**: OpenAI model to use

#### `OPENAI_ORG_ID`
- **Format**: String
- **Description**: OpenAI organization ID

### Google Sheets

#### `GOOGLE_APPLICATION_CREDENTIALS`
- **Format**: File path
- **Description**: Path to Google service account JSON file

#### `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- **Format**: JSON string
- **Description**: Google service account credentials as JSON string

#### `STATS_SHEET_ID`
- **Format**: String
- **Description**: Google Sheets ID for stats data

#### `STATS_BASELINE_TITLE`
- **Default**: `Baseline (10-24-25)`
- **Description**: Title of baseline stats sheet

### External URLs

#### `SNELP_CODES_URL`
- **Default**: `https://snelp.com/api/codes`
- **Format**: URL
- **Description**: URL for Snelp codes API

#### `BOT_RESCAN_URL`
- **Format**: URL
- **Description**: URL to trigger bot rescan

### Cache & Redis

#### `REDIS_URL`
- **Format**: Redis connection URL
- **Description**: Redis connection URL for caching and queues
- **Example**: `REDIS_URL=redis://localhost:6379`

### Monitoring & Logging

#### `SENTRY_DSN`
- **Format**: URL
- **Description**: Sentry DSN for error tracking
- **Example**: `SENTRY_DSN=https://...@sentry.io/...`

#### `LOG_LEVEL`
- **Default**: `info`
- **Options**: `error`, `warn`, `info`, `debug`, `trace`
- **Description**: Logging level

### CDN & Static Assets

#### `CDN_ENABLED`
- **Default**: `false`
- **Format**: Boolean
- **Description**: Enable CDN for static assets

#### `CDN_URL`
- **Format**: URL
- **Description**: CDN base URL

#### `STATIC_MAX_AGE`
- **Default**: `31536000` (1 year in seconds)
- **Description**: Cache max-age for static assets

#### `UPLOADS_MAX_AGE`
- **Default**: `86400` (1 day in seconds)
- **Description**: Cache max-age for uploaded files

### Rate Limiting

#### `ADMIN_TASK_LIMIT_WINDOW_MS`
- **Default**: `60000` (1 minute)
- **Format**: Number (milliseconds)
- **Description**: Time window for rate limiting tasks

#### `ADMIN_TASK_LIMIT_MAX`
- **Default**: `5`
- **Format**: Number
- **Description**: Maximum tasks per window

### Feature Flags

#### `ADMIN_AUDIT_DISABLED`
- **Default**: `false`
- **Format**: Boolean
- **Description**: Disable audit logging

---

## Example `.env.admin` File

```bash
# =============================================================================
# REQUIRED VARIABLES
# =============================================================================

# Authentication & Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
SESSION_SECRET=your-super-secret-session-key-at-least-32-characters

# Discord OAuth
DISCORD_CLIENT_ID=1234567890123456789
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/slimy_admin

# =============================================================================
# OPTIONAL VARIABLES
# =============================================================================

# Server
NODE_ENV=development
PORT=3080
HOST=127.0.0.1

# CORS
CORS_ALLOW_ORIGIN=http://localhost:3081,http://localhost:3000

# Discord
DISCORD_REDIRECT_URI=http://localhost:3080/api/auth/callback
DISCORD_OAUTH_SCOPES=identify guilds
DISCORD_BOT_TOKEN=your-discord-bot-token

# OpenAI (optional)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Admin UI
ADMIN_BASE_URL=http://localhost:3081
ADMIN_REDIRECT_SUCCESS=http://localhost:3081
ADMIN_REDIRECT_FAILURE=http://localhost:3081/login

# User permissions (comma-separated Discord IDs)
ADMIN_OWNER_IDS=123456789012345678
ADMIN_USER_IDS=123456789012345678,987654321098765432
CLUB_USER_IDS=111222333444555666

# Monitoring (optional)
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info
```

---

## Type-Safe Configuration

The Admin API uses a **type-safe configuration system** that:

1. **Validates all env vars at startup** using Zod schemas
2. **Provides TypeScript types** for the entire config object
3. **Fails fast** with clear error messages if validation fails
4. **Provides sensible defaults** for optional values

### Using the Config in Code

```javascript
// Import the config
const config = require('./lib/config');

// Access typed, validated config values
const port = config.server.port;            // number
const nodeEnv = config.server.nodeEnv;      // 'development' | 'production' | 'test'
const jwtSecret = config.jwt.secret;        // string
const corsOrigins = config.server.corsOrigins;  // string[]
```

### Config Structure

The config object has the following top-level properties:

- `server` - Server configuration (port, host, nodeEnv, etc.)
- `session` - Session configuration (secret, cookie settings)
- `jwt` - JWT configuration (secret, expiration, cookie settings)
- `discord` - Discord OAuth configuration
- `database` - Database configuration
- `openai` - OpenAI API configuration
- `google` - Google Sheets configuration
- `cache` - Redis/Cache configuration
- `redis` - Redis/Queue configuration
- `cdn` - CDN configuration
- `sentry` - Sentry error tracking configuration
- `roles` - User role configuration
- `guilds` - Guild configuration
- `permissions` - Permission flags
- `ui` - UI/Frontend configuration
- `rateLimit` - Rate limiting configuration
- `audit` - Audit logging configuration
- `cors` - CORS configuration
- `security` - Security settings
- `backup` - Backup configuration
- `csrf` - CSRF protection settings
- `logging` - Logging configuration

---

## Troubleshooting

### Startup Fails with "Configuration validation failed"

If the application fails to start with a validation error, check:

1. All **required** environment variables are set
2. Variables have the correct **format** (e.g., URLs, numeric IDs)
3. Secrets are at least **32 characters** long
4. `DATABASE_URL` starts with `postgresql://` or `postgres://`
5. `DISCORD_CLIENT_ID` is numeric (17-19 digits)

### Example Error Messages

```
Configuration validation failed:
  - JWT_SECRET: Required
  - DATABASE_URL: Required
  - DISCORD_CLIENT_ID: Invalid Discord ID format
```

Each error indicates which variable is missing or invalid.

### Getting a Config Summary

For debugging, you can get a summary of the configuration (without sensitive values):

```javascript
const config = require('./lib/config');
const summary = config.getConfigSummary();
console.log(summary);
```

This will output:
```json
{
  "server": {
    "port": 3080,
    "nodeEnv": "development",
    "serviceName": "slimy-admin-api",
    "version": "dev"
  },
  "database": { "configured": "YES" },
  "discord": { "configured": "YES" },
  "openai": { "configured": "NO" },
  "redis": { "enabled": false },
  "sentry": { "enabled": false }
}
```

---

## Migration from Old Config

If you're migrating from the old configuration system:

1. The new typed config is **backward compatible** with the same env var names
2. Old config files have been backed up:
   - `src/config.js.backup`
   - `src/lib/env-validation.js.backup`
3. All imports of `require('./config')` now use the typed config automatically
4. The config structure is nearly identical, with improved type safety

No code changes should be required in most cases!
