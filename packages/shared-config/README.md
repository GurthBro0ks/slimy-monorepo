# @slimy/shared-config

Configuration loaders and schema validation for Slimy.ai services

## Purpose

Provides centralized configuration management across all Slimy.ai applications, including:
- Environment variable parsing and validation
- Configuration schema definition (with Zod)
- Multi-environment support (dev, staging, prod)
- Feature flags management
- Type-safe configuration access
- Configuration validation at startup

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Code needs to be extracted from:
- `apps/admin-api/src/config.js`
- Various `.env.example` files across apps
- Hardcoded configuration in apps

## Proposed Tech Stack

- **Zod** - Runtime schema validation
- **dotenv** - Environment variable loading
- **TypeScript** - Type-safe configuration
- **dotenv-expand** - Variable expansion in .env files

## Proposed API

### Basic Configuration

```typescript
import { loadConfig } from '@slimy/shared-config';

// Load and validate configuration
const config = loadConfig({
  env: process.env.NODE_ENV || 'development',
  envFile: '.env',
});

// Access configuration (type-safe)
console.log(config.database.url);
console.log(config.auth.jwtSecret);
console.log(config.features.enableNewUI);
```

### Schema Definition

```typescript
import { defineConfig } from '@slimy/shared-config';
import { z } from 'zod';

// Define configuration schema
const configSchema = z.object({
  app: z.object({
    name: z.string().default('Slimy.ai'),
    port: z.coerce.number().default(3000),
    env: z.enum(['development', 'staging', 'production']),
  }),
  database: z.object({
    url: z.string().url(),
    poolSize: z.coerce.number().default(10),
  }),
  auth: z.object({
    jwtSecret: z.string().min(32),
    sessionSecret: z.string().min(32),
  }),
  features: z.object({
    enableNewUI: z.coerce.boolean().default(false),
    enableBetaFeatures: z.coerce.boolean().default(false),
  }),
});

// Export typed configuration
export const config = defineConfig(configSchema);
```

### Environment-Specific Config

```typescript
import { loadConfig, getEnvConfig } from '@slimy/shared-config';

// Load base config
const baseConfig = loadConfig();

// Merge with environment-specific config
const config = getEnvConfig(baseConfig, {
  development: {
    database: { poolSize: 5 },
    features: { enableBetaFeatures: true },
  },
  production: {
    database: { poolSize: 20 },
    features: { enableBetaFeatures: false },
  },
});
```

### Feature Flags

```typescript
import { isFeatureEnabled, getFeatureFlags } from '@slimy/shared-config';

// Check feature flag
if (isFeatureEnabled('enableNewUI')) {
  // Show new UI
}

// Get all feature flags
const flags = getFeatureFlags();
console.log(flags); // { enableNewUI: true, enableBetaFeatures: false }
```

### Configuration Presets

```typescript
import { webConfig, apiConfig, botConfig } from '@slimy/shared-config/presets';

// Use preset for web app
const config = webConfig({
  databaseUrl: process.env.DATABASE_URL,
  adminApiBase: process.env.NEXT_PUBLIC_ADMIN_API_BASE,
});

// Use preset for API
const config = apiConfig({
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: 3080,
});
```

## Proposed Directory Structure

```
packages/shared-config/
├── src/
│   ├── index.ts              # Main exports
│   ├── loader.ts             # Configuration loader
│   ├── validator.ts          # Validation logic
│   ├── schema.ts             # Base schema definitions
│   ├── env.ts                # Environment helpers
│   ├── features.ts           # Feature flags
│   ├── presets/              # Configuration presets
│   │   ├── web.ts            # Web app preset
│   │   ├── api.ts            # API preset
│   │   └── bot.ts            # Bot preset
│   └── types/                # TypeScript types
│       ├── config.ts
│       └── features.ts
├── tests/
│   ├── loader.test.ts
│   ├── validator.test.ts
│   └── features.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Migration Checklist

### Code to Extract

1. **From `apps/admin-api/src/config.js`**:
   - Configuration loading logic
   - Environment variable parsing
   - Default values

2. **From `.env.example` files**:
   - Document all environment variables
   - Create schema from examples
   - Standardize variable names

3. **From hardcoded values**:
   - Feature flags
   - API endpoints
   - Timeouts and limits

### Configuration Schema

Create a unified schema for all services:

```typescript
import { z } from 'zod';

export const baseConfigSchema = z.object({
  // Application
  app: z.object({
    name: z.string(),
    env: z.enum(['development', 'staging', 'production']),
    port: z.coerce.number(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),

  // Database
  database: z.object({
    url: z.string().url(),
    poolSize: z.coerce.number().default(10),
    ssl: z.coerce.boolean().default(false),
  }),

  // Redis
  redis: z.object({
    url: z.string().url().optional(),
    password: z.string().optional(),
  }).optional(),

  // Authentication
  auth: z.object({
    jwtSecret: z.string().min(32),
    jwtExpiresIn: z.string().default('1h'),
    sessionSecret: z.string().min(32),
    cookieDomain: z.string().optional(),
  }),

  // OAuth
  oauth: z.object({
    discord: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
      redirectUri: z.string().url(),
    }).optional(),
    google: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
      redirectUri: z.string().url(),
    }).optional(),
  }).optional(),

  // CORS
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string())]),
    credentials: z.coerce.boolean().default(true),
  }),

  // Rate Limiting
  rateLimit: z.object({
    windowMs: z.coerce.number().default(60000), // 1 minute
    max: z.coerce.number().default(100),
  }).optional(),

  // External Services
  external: z.object({
    openaiApiKey: z.string().optional(),
    cdnUrl: z.string().url().optional(),
  }).optional(),

  // Features
  features: z.record(z.coerce.boolean()).default({}),
});
```

### Dependencies to Install

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "dotenv": "^16.3.0",
    "dotenv-expand": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "vitest": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

### Integration Steps

1. Create package structure
2. Define base configuration schema with Zod
3. Create configuration loader
4. Add validation logic
5. Create presets for each app type
6. Add feature flag support
7. Write unit tests
8. Update all apps to use `@slimy/shared-config`
9. Remove duplicate config code from apps
10. Consolidate `.env.example` files

## Environment Variable Naming Convention

Use consistent naming across all services:

### Prefixes
- `DATABASE_*` - Database configuration
- `REDIS_*` - Redis configuration
- `JWT_*` - JWT configuration
- `SESSION_*` - Session configuration
- `DISCORD_*` - Discord OAuth
- `GOOGLE_*` - Google OAuth
- `CORS_*` - CORS configuration
- `NEXT_PUBLIC_*` - Public client-side variables (Next.js)

### Examples
```env
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=mysql://user:pass@localhost:3306/slimy
DATABASE_POOL_SIZE=10
DATABASE_SSL=false

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRES_IN=1h
SESSION_SECRET=your-session-secret-min-32-chars
COOKIE_DOMAIN=.slimyai.xyz

# OAuth
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://slimyai.xyz/auth/discord/callback

# CORS
CORS_ORIGIN=https://slimyai.xyz,https://panel.slimyai.xyz
CORS_CREDENTIALS=true

# Features
FEATURE_ENABLE_NEW_UI=false
FEATURE_ENABLE_BETA=false
```

## Configuration Validation

Validate configuration at startup to fail fast:

```typescript
import { loadConfig } from '@slimy/shared-config';

try {
  const config = loadConfig();
  console.log('✓ Configuration loaded successfully');
} catch (error) {
  console.error('✗ Configuration validation failed:');
  console.error(error.message);
  process.exit(1);
}
```

### Validation Errors

Zod provides detailed validation errors:

```
Configuration validation failed:
- database.url: Required
- auth.jwtSecret: String must contain at least 32 character(s)
- app.port: Expected number, received string
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with different env files
ENV_FILE=.env.test pnpm test
```

### Mock Configuration

```typescript
import { createMockConfig } from '@slimy/shared-config/test';

// Create mock configuration for tests
const config = createMockConfig({
  database: { url: 'sqlite::memory:' },
  auth: { jwtSecret: 'test-secret-32-characters-long' },
});
```

## Used By

- `@slimy/web` - Web app configuration
- `@slimy/admin-api` - API configuration
- `@slimy/admin-ui` - Admin UI configuration
- `@slimy/bot` - Bot configuration
- All other shared packages that need configuration

## Related Packages

- `@slimy/shared-db` - Uses config for database connection
- `@slimy/shared-auth` - Uses config for JWT/session settings

## Best Practices

### 1. Never Commit Secrets
- Use `.env.example` as template
- Never commit `.env` files with real secrets
- Use environment variables in production

### 2. Validate Early
- Validate configuration at app startup
- Fail fast if configuration is invalid
- Provide clear error messages

### 3. Type Safety
- Use Zod schemas for runtime validation
- Export TypeScript types from schemas
- Ensure compile-time and runtime type safety

### 4. Environment-Specific Config
- Use different `.env` files for each environment
- Override values for production/staging
- Document environment-specific requirements

### 5. Feature Flags
- Use feature flags for gradual rollouts
- Document all feature flags
- Remove flags after full rollout

## Configuration Hierarchy

Configuration is loaded in the following order (later overrides earlier):

1. **Default values** - Defined in schema
2. **Base config file** - `.env`
3. **Environment-specific file** - `.env.development`, `.env.production`
4. **Environment variables** - `process.env.*`
5. **Runtime overrides** - Passed to `loadConfig()`

## Future Enhancements

- **Remote Configuration**: Load config from remote service (e.g., AWS Parameter Store)
- **Hot Reload**: Reload configuration without restarting
- **Configuration UI**: Web interface for managing feature flags
- **Encryption**: Encrypt sensitive values in config files
- **Audit Logging**: Track configuration changes
- **Secrets Management**: Integration with HashiCorp Vault or AWS Secrets Manager

## License

Proprietary - Slimy.ai
