# @slimy/shared-config-loader

A type-safe configuration loader module for the slimy-monorepo project. This package provides centralized configuration management with runtime validation using Zod schemas.

## Purpose

This module is designed to be used across all applications in the monorepo to:
- Load configuration from environment variables
- Validate configuration at runtime with type safety
- Provide a consistent configuration structure across services
- Catch configuration errors early with helpful error messages

## Status

**Note**: This module is currently a skeleton implementation and is not wired into any applications yet. It can be integrated into apps later as needed.

## Configuration Sections

The loader supports the following configuration sections:

- **adminApi**: Admin API server configuration (base URL, port, API keys, auth settings)
- **web**: Web application configuration (base URL, port, session secrets, API endpoints)
- **discordBot**: Discord bot configuration (bot token, client ID, guild ID, command settings)
- **minecraft**: Minecraft server configuration (server host/port, RCON settings)
- **infra**: Infrastructure configuration (database URL, Redis URL, log level, environment)

## Usage

### Basic Usage

```typescript
import { loadConfigFromEnv } from '@slimy/shared-config-loader';

// Load and validate configuration from environment variables
try {
  const config = loadConfigFromEnv();

  // Access typed configuration
  console.log('Node environment:', config.infra.nodeEnv);
  console.log('Web base URL:', config.web.baseUrl);
  console.log('Admin API port:', config.adminApi.port);
} catch (error) {
  if (error instanceof ConfigLoadError) {
    console.error('Configuration error:', error.message);
    process.exit(1);
  }
  throw error;
}
```

### Environment Variables

The loader reads the following environment variables:

**Admin API:**
- `ADMIN_API_BASE_URL` - Base URL for the admin API
- `ADMIN_API_PORT` - Port number for the admin API
- `ADMIN_API_KEY` - API key for authentication
- `ADMIN_API_ENABLE_AUTH` - Enable/disable authentication (default: true)

**Web:**
- `WEB_BASE_URL` - Base URL for the web application
- `WEB_PORT` - Port number for the web server
- `WEB_SESSION_SECRET` - Session secret for cookie signing
- `WEB_API_ENDPOINT` - Backend API endpoint URL

**Discord Bot:**
- `DISCORD_BOT_TOKEN` - Discord bot authentication token
- `DISCORD_CLIENT_ID` - Discord application client ID
- `DISCORD_GUILD_ID` - Discord server (guild) ID
- `DISCORD_COMMAND_PREFIX` - Command prefix (default: !)
- `DISCORD_ENABLE_LOGGING` - Enable bot logging (default: true)

**Minecraft:**
- `MINECRAFT_SERVER_HOST` - Minecraft server hostname
- `MINECRAFT_SERVER_PORT` - Minecraft server port
- `MINECRAFT_RCON_PASSWORD` - RCON authentication password
- `MINECRAFT_RCON_PORT` - RCON port number
- `MINECRAFT_ENABLE_RCON` - Enable RCON (default: false)

**Infrastructure:**
- `DATABASE_URL` - Database connection string
- `REDIS_URL` - Redis connection string
- `LOG_LEVEL` - Logging level (debug, info, warn, error; default: info)
- `NODE_ENV` - Node environment (development, production, test; default: development)

### Validating Custom Config

You can also validate a configuration object directly:

```typescript
import { validateConfig } from '@slimy/shared-config-loader';

const customConfig = {
  adminApi: { port: 3000 },
  web: { port: 3001 },
  discordBot: {},
  minecraft: {},
  infra: { nodeEnv: 'production' },
};

const validated = validateConfig(customConfig);
```

### Using Individual Schemas

You can import and use individual schemas for specific sections:

```typescript
import { WebConfigSchema, type WebConfig } from '@slimy/shared-config-loader';

const webConfig: WebConfig = WebConfigSchema.parse({
  baseUrl: 'https://example.com',
  port: 3000,
});
```

## Error Handling

The loader throws `ConfigLoadError` when validation fails. The error includes:
- A descriptive error message
- Detailed validation errors from Zod
- Guidance on which environment variables need to be set

Example error output:
```
Configuration validation failed:
  - adminApi.port: Expected number, received string
  - web.baseUrl: Invalid url
  - infra.logLevel: Invalid enum value

Please check your environment variables and ensure all required values are set.
```

## Integration Guide

To integrate this module into an existing app:

1. Add the dependency to your app's `package.json`:
   ```json
   {
     "dependencies": {
       "@slimy/shared-config-loader": "workspace:*"
     }
   }
   ```

2. Replace existing config loading with `loadConfigFromEnv()`:
   ```typescript
   import { loadConfigFromEnv } from '@slimy/shared-config-loader';

   const config = loadConfigFromEnv();
   ```

3. Update your environment variables to match the expected naming convention

4. Remove old config loading code and migrate to the new typed config

## Development

This package uses:
- **Zod** for runtime schema validation
- **TypeScript** for static type checking

All configuration fields are optional by default, allowing apps to only use the sections they need. Required fields should be enforced at the app level or by adding `.refine()` validators to the schemas.

## Future Enhancements

Potential improvements for future iterations:
- Support for `.env` file loading
- Configuration presets for different environments
- Custom validators for app-specific config sections
- Configuration hot-reloading
- Config documentation generation
