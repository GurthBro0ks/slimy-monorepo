/**
 * Type-Safe Configuration Module for Admin API
 *
 * This module provides a single source of truth for all environment variables
 * with compile-time type safety and runtime validation using Zod.
 *
 * Usage:
 *   import { config } from './lib/config/typed-config';
 *   const port = config.server.port;
 */

import { z } from 'zod';

// =============================================================================
// Zod Schema Helpers
// =============================================================================

/**
 * Parse a comma-separated list from environment variable
 */
const commaSeparatedList = z
  .string()
  .transform((val) =>
    val.split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
  .default('');

/**
 * Parse a boolean from environment variable (handles various formats)
 */
const booleanFromString = z
  .string()
  .transform((val) => {
    const normalized = val.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on'].includes(normalized);
  })
  .pipe(z.boolean())
  .or(z.boolean())
  .default('false');

/**
 * Parse a number from environment variable with default
 */
const numberFromString = (defaultValue: number) =>
  z.string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? defaultValue : num;
    })
    .or(z.number())
    .default(String(defaultValue));

/**
 * Discord snowflake ID validation (17-19 digit string)
 */
const discordSnowflake = z.string().regex(/^\d{17,19}$/, 'Invalid Discord ID format');

/**
 * Optional Discord snowflake with empty string allowed
 */
const optionalDiscordId = z.string().trim().optional();

// =============================================================================
// Environment Variable Schema
// =============================================================================

/**
 * Complete schema for all admin-api environment variables
 */
const envSchema = z.object({
  // =============================================================================
  // Server Configuration
  // =============================================================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: numberFromString(3080),
  HOST: z.string().default('127.0.0.1'),
  ADMIN_API_SERVICE_NAME: z.string().default('slimy-admin-api'),
  ADMIN_API_VERSION: z.string().default('dev'),

  // =============================================================================
  // Authentication & Secrets (REQUIRED)
  // =============================================================================
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .describe('Required: JWT signing secret'),

  SESSION_SECRET: z.string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .describe('Required: Session signing secret'),

  // =============================================================================
  // Discord OAuth (REQUIRED)
  // =============================================================================
  DISCORD_CLIENT_ID: z.string()
    .regex(/^\d+$/, 'DISCORD_CLIENT_ID must be numeric')
    .describe('Required: Discord OAuth application ID'),

  DISCORD_CLIENT_SECRET: z.string()
    .min(1, 'DISCORD_CLIENT_SECRET is required')
    .describe('Required: Discord OAuth client secret'),

  DISCORD_REDIRECT_URI: z.string()
    .url()
    .default('https://admin.slimyai.xyz/api/auth/callback'),

  DISCORD_OAUTH_SCOPES: z.string().default('identify guilds'),

  DISCORD_BOT_TOKEN: z.string().optional(),

  // =============================================================================
  // Database (REQUIRED)
  // =============================================================================
  DATABASE_URL: z.string()
    .refine(
      (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    )
    .describe('Required: PostgreSQL connection string'),

  // Legacy DB_URL support
  DB_URL: z.string().optional(),

  // =============================================================================
  // CORS & Security
  // =============================================================================
  CORS_ALLOW_ORIGIN: commaSeparatedList
    .transform((list) =>
      list.length > 0
        ? list
        : ['https://admin.slimyai.xyz', 'http://127.0.0.1:3000', 'http://localhost:3000']
    ),

  CORS_ENABLED: booleanFromString,
  ALLOWED_ORIGIN: z.string().optional(),
  ADMIN_ALLOWED_ORIGIN: z.string().optional(),
  ADMIN_ALLOWED_ORIGINS: commaSeparatedList,

  TRUST_PROXY: booleanFromString.default('true'),
  ADMIN_TRUST_PROXY: booleanFromString.default('true'),

  // =============================================================================
  // Cookies & Session
  // =============================================================================
  COOKIE_DOMAIN: z.string().default('.slimyai.xyz'),
  ADMIN_COOKIE_DOMAIN: z.string().optional(),

  COOKIE_SECURE: booleanFromString,
  ADMIN_COOKIE_SECURE: booleanFromString,

  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  ADMIN_COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).optional(),

  ADMIN_TOKEN_COOKIE: z.string().default('slimy_admin_token'),

  // =============================================================================
  // JWT Configuration
  // =============================================================================
  JWT_EXPIRES_IN: z.string().default('12h'),
  JWT_MAX_AGE_SECONDS: numberFromString(43200), // 12 hours

  // =============================================================================
  // User & Permission Management
  // =============================================================================
  ADMIN_OWNER_IDS: commaSeparatedList,
  ADMIN_GUILD_IDS: commaSeparatedList,
  ADMIN_USER_IDS: commaSeparatedList,
  CLUB_USER_IDS: commaSeparatedList,
  ROLE_ADMIN_IDS: commaSeparatedList,
  ROLE_CLUB_IDS: commaSeparatedList,

  // =============================================================================
  // Admin UI Redirects
  // =============================================================================
  ADMIN_REDIRECT_SUCCESS: z.string().url().default('http://localhost:3081'),
  ADMIN_REDIRECT_FAILURE: z.string().url().default('http://localhost:3081/login'),
  ADMIN_BASE_URL: z.string().url().default('http://localhost:3081'),

  // =============================================================================
  // Security
  // =============================================================================
  HSTS_MAX_AGE: numberFromString(31536000), // 1 year

  // =============================================================================
  // File Upload & Backup
  // =============================================================================
  UPLOAD_MAX_MB: numberFromString(10),
  MAX_UPLOAD_MB: numberFromString(10),
  UPLOADS_DIR: z.string().optional(),

  BACKUP_ROOT: z.string().default('/var/backups/slimy'),
  BACKUP_MYSQL_DIR: z.string().default('/var/backups/slimy/mysql'),
  BACKUP_DATA_DIR: z.string().default('/var/backups/slimy/data'),
  BACKUP_RETENTION_DAYS: numberFromString(14),

  // =============================================================================
  // External Services
  // =============================================================================
  OPENAI_API_KEY: z.string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('sk-'),
      'OPENAI_API_KEY should start with "sk-"'
    ),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_ORG_ID: z.string().optional(),

  // Google Sheets
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),
  STATS_SHEET_ID: z.string().optional(),
  STATS_BASELINE_TITLE: z.string().default('Baseline (10-24-25)'),

  // External URLs
  SNELP_CODES_URL: z.string().url().default('https://snelp.com/api/codes'),
  BOT_RESCAN_URL: z.string().url().optional(),

  // =============================================================================
  // Cache & Redis
  // =============================================================================
  REDIS_URL: z.string().optional(),

  // =============================================================================
  // Monitoring & Logging
  // =============================================================================
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // =============================================================================
  // CDN & Static Assets
  // =============================================================================
  CDN_ENABLED: booleanFromString,
  CDN_URL: z.string().url().optional(),
  STATIC_MAX_AGE: numberFromString(31536000), // 1 year
  UPLOADS_MAX_AGE: numberFromString(86400), // 1 day

  // =============================================================================
  // Rate Limiting & Tasks
  // =============================================================================
  ADMIN_TASK_LIMIT_WINDOW_MS: numberFromString(60_000), // 1 minute
  ADMIN_TASK_LIMIT_MAX: numberFromString(5),
  ADMIN_TASK_TTL_MS: numberFromString(300_000), // 5 minutes

  // =============================================================================
  // Feature Flags
  // =============================================================================
  ADMIN_AUDIT_DISABLED: booleanFromString,
});

// =============================================================================
// Type Exports
// =============================================================================

/**
 * TypeScript type inferred from the schema
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parsed and validated environment variables
 */
type ParsedEnv = z.output<typeof envSchema>;

// =============================================================================
// Configuration Builder
// =============================================================================

/**
 * Build structured config object from validated environment variables
 */
function buildConfig(env: ParsedEnv) {
  return {
    // Server configuration
    server: {
      port: env.PORT,
      host: env.HOST,
      serviceName: env.ADMIN_API_SERVICE_NAME,
      version: env.ADMIN_API_VERSION,
      nodeEnv: env.NODE_ENV,
      corsOrigins: env.CORS_ALLOW_ORIGIN,
    },

    // Session configuration
    session: {
      secret: env.SESSION_SECRET,
      cookieDomain: env.ADMIN_COOKIE_DOMAIN || env.COOKIE_DOMAIN,
      cookieName: 'slimy_admin',
      maxAgeSec: 60 * 60 * 2, // 2 hours
    },

    // JWT configuration
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      maxAgeSeconds: env.JWT_MAX_AGE_SECONDS,
      cookieName: env.ADMIN_TOKEN_COOKIE,
      cookieDomain: env.ADMIN_COOKIE_DOMAIN || env.COOKIE_DOMAIN,
      cookieSecure: env.ADMIN_COOKIE_SECURE || env.COOKIE_SECURE || env.NODE_ENV === 'production',
      cookieSameSite: (env.ADMIN_COOKIE_SAMESITE || env.COOKIE_SAMESITE) as 'strict' | 'lax' | 'none',
    },

    // Discord OAuth configuration
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      botToken: env.DISCORD_BOT_TOKEN || '',
      redirectUri: env.DISCORD_REDIRECT_URI,
      scopes: env.DISCORD_OAUTH_SCOPES.split(' '),
      apiBaseUrl: 'https://discord.com/api/v10',
      tokenUrl: 'https://discord.com/api/oauth2/token',
    },

    // Database configuration
    database: {
      url: env.DATABASE_URL,
      logLevel: env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn'] as const
        : ['error'] as const,
    },

    // OpenAI configuration
    openai: {
      apiKey: env.OPENAI_API_KEY || '',
      model: env.OPENAI_MODEL,
      orgId: env.OPENAI_ORG_ID,
    },

    // Google Sheets configuration
    google: {
      credentialsJson: env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS,
      sheetsScopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      statsSheetId: env.STATS_SHEET_ID || '',
      statsBaselineTitle: env.STATS_BASELINE_TITLE,
    },

    // Redis/Cache configuration
    cache: {
      redisUrl: env.REDIS_URL || '',
      enabled: Boolean(env.REDIS_URL),
      ttl: 300, // 5 minutes
      staleTtl: 600, // 10 minutes
      keyPrefix: 'admin:',
      retryAttempts: 3,
      retryDelay: 1000,
    },

    // Redis/Queue configuration
    redis: {
      url: env.REDIS_URL || '',
      enabled: Boolean(env.REDIS_URL),
    },

    // CDN/Static Assets configuration
    cdn: {
      enabled: env.CDN_ENABLED || Boolean(env.CDN_URL),
      url: env.CDN_URL || '',
      staticMaxAge: env.STATIC_MAX_AGE,
      uploadsMaxAge: env.UPLOADS_MAX_AGE,
    },

    // Sentry configuration
    sentry: {
      dsn: env.SENTRY_DSN || '',
      enabled: Boolean(env.SENTRY_DSN),
      environment: env.NODE_ENV,
      release: env.ADMIN_API_VERSION,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    },

    // User role configuration
    roles: {
      adminUserIds: env.ADMIN_USER_IDS,
      clubUserIds: env.CLUB_USER_IDS,
      ownerIds: new Set(env.ADMIN_OWNER_IDS),
      order: ['viewer', 'editor', 'admin', 'owner'] as const,
    },

    // Guilds configuration
    guilds: {
      allowedIds: new Set(env.ADMIN_GUILD_IDS),
    },

    // Permission flags
    permissions: {
      administrator: 0x8n,
      manageGuild: 0x20n,
    },

    // UI/Frontend configuration
    ui: {
      origins: env.ADMIN_ALLOWED_ORIGINS.length > 0
        ? env.ADMIN_ALLOWED_ORIGINS
        : ['http://localhost:3081'],
      successRedirect: env.ADMIN_REDIRECT_SUCCESS,
      failureRedirect: env.ADMIN_REDIRECT_FAILURE,
    },

    // Rate limiting
    rateLimit: {
      tasks: {
        windowMs: env.ADMIN_TASK_LIMIT_WINDOW_MS,
        max: env.ADMIN_TASK_LIMIT_MAX,
      },
    },

    // Feature flags
    audit: {
      enabled: !env.ADMIN_AUDIT_DISABLED,
    },

    // CORS configuration
    cors: {
      enabled: env.CORS_ENABLED,
      allowedOrigin: env.ADMIN_ALLOWED_ORIGIN || env.ALLOWED_ORIGIN || null,
    },

    // Security
    security: {
      hstsMaxAge: env.HSTS_MAX_AGE,
      trustProxy: env.ADMIN_TRUST_PROXY || env.TRUST_PROXY,
    },

    // Backup configuration
    backup: {
      root: env.BACKUP_ROOT,
      mysqlDir: env.BACKUP_MYSQL_DIR,
      dataDir: env.BACKUP_DATA_DIR,
      retentionDays: env.BACKUP_RETENTION_DAYS,
    },

    // URLs
    baseUrl: env.ADMIN_BASE_URL,
    snelpCodesUrl: env.SNELP_CODES_URL,
    botRescanUrl: env.BOT_RESCAN_URL,

    // CSRF
    csrf: {
      headerName: 'x-csrf-token',
    },

    // Logging
    logging: {
      level: env.LOG_LEVEL,
    },
  } as const;
}

/**
 * TypeScript type for the complete configuration object
 */
export type Config = ReturnType<typeof buildConfig>;

// =============================================================================
// Configuration Loading & Validation
// =============================================================================

/**
 * Load and validate configuration from environment variables
 * @throws {z.ZodError} If validation fails
 */
export function loadConfig(): Config {
  try {
    // Parse and validate environment variables
    const env = envSchema.parse(process.env);

    // Build structured config
    const config = buildConfig(env);

    // Log successful validation (if logger is available)
    if (env.NODE_ENV !== 'test') {
      console.log('[typed-config] Configuration validated successfully');
    }

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[typed-config] Configuration validation failed:');

      for (const issue of error.errors) {
        const path = issue.path.join('.');
        console.error(`  - ${path}: ${issue.message}`);
      }

      throw new Error(
        `Configuration validation failed. Please check your environment variables.\n` +
        `Missing or invalid: ${error.errors.map(e => e.path.join('.')).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Validated configuration object - single source of truth
 */
export const config = loadConfig();

/**
 * Get a summary of the configuration (for debugging, without sensitive values)
 */
export function getConfigSummary() {
  return {
    server: {
      port: config.server.port,
      nodeEnv: config.server.nodeEnv,
      serviceName: config.server.serviceName,
      version: config.server.version,
    },
    database: {
      configured: config.database.url ? 'YES' : 'NO',
    },
    discord: {
      configured: config.discord.clientId && config.discord.clientSecret ? 'YES' : 'NO',
    },
    openai: {
      configured: config.openai.apiKey ? 'YES' : 'NO',
    },
    redis: {
      enabled: config.redis.enabled,
    },
    sentry: {
      enabled: config.sentry.enabled,
    },
  };
}
