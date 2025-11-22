import { z, type ZodIssue } from 'zod';

type EnvTarget = 'server' | 'client';
type InvalidTypeIssue = ZodIssue & { code: 'invalid_type'; received?: string };

const isMissingIssue = (issue: ZodIssue): issue is InvalidTypeIssue => {
  return issue.code === 'invalid_type' && (issue as InvalidTypeIssue).received === 'undefined';
};

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_BASE: z.string().url().default('https://api.openai.com/v1'),
  REQUEST_SIGNING_SECRET: z.string().min(1).default('change-me-in-production'),
  MCP_BASE_URL: z.string().url().optional(),
  MCP_API_KEY: z.string().optional(),
  DOCS_SOURCE_REPO: z.string().optional(),
  DOCS_SOURCE_PATH: z.string().default('docs'),
  GITHUB_TOKEN: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
  ALERT_WEBHOOK_URL: z.string().url().optional(),
  ALERT_EMAIL_RECIPIENTS: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  ANALYZE: z.coerce.boolean().optional().default(false),
  CI: z.coerce.boolean().optional().default(false),
  PLAYWRIGHT_DEBUG: z.coerce.boolean().optional().default(false),
  MAX_INITIAL_BUNDLE_KB: z.coerce.number().default(1000),
  MAX_ROUTE_CHUNK_KB: z.coerce.number().default(500),
  MAX_TOTAL_BUNDLE_KB: z.coerce.number().default(3000),
  BUNDLE_WARN_THRESHOLD: z.coerce.number().default(0.8),
  FIRECRAWL_API_KEY: z.string().optional(),
  DISCORD_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  VERCEL_URL: z.string().optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_ADMIN_API_BASE: z.string().url(),
  NEXT_PUBLIC_SNELP_CODES_URL: z.string().url(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_CDN_URL: z.string().optional(),
  NEXT_PUBLIC_CDN_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_CDN_DOMAINS: z.string().optional(),
});

function formatEnvErrors(target: EnvTarget, error: z.ZodError): never {
  const missingVars = error.issues
    .filter(isMissingIssue)
    .map((issue) => issue.path.join('.'));

  const invalidVars = error.issues
    .filter((issue) => !isMissingIssue(issue))
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`);

  const lines = [`Invalid ${target} environment variables:`];
  if (missingVars.length) {
    lines.push(`  Missing: ${missingVars.join(', ')}`);
  }
  if (invalidVars.length) {
    lines.push(`  Invalid: ${invalidVars.join(', ')}`);
  }

  throw new Error(lines.join('\n'));
}

function validateEnv<T extends z.ZodTypeAny>(schema: T, target: EnvTarget): z.infer<T> {
  try {
    return schema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      formatEnvErrors(target, error);
    }
    throw error;
  }
}

const serverEnv = validateEnv(serverEnvSchema, 'server');
const clientEnv = validateEnv(clientEnvSchema, 'client');

export const publicEnv = clientEnv;
export const env = { ...serverEnv, ...clientEnv } as const;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

export const getAppUrl = () => {
  if (publicEnv.NEXT_PUBLIC_APP_URL) {
    return publicEnv.NEXT_PUBLIC_APP_URL;
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
};

export const hasOpenAI = () => !!env.OPENAI_API_KEY;
export const hasMCP = () => !!env.MCP_BASE_URL && !!env.MCP_API_KEY;
export const hasRedis = () => !!env.REDIS_URL || (!!env.REDIS_HOST && !!env.REDIS_PORT);
export const hasDocsImport = () => !!env.DOCS_SOURCE_REPO && !!env.GITHUB_TOKEN;

const adminApiConfig = {
  baseUrl: publicEnv.NEXT_PUBLIC_ADMIN_API_BASE,
} as const;

const codesRuntimeConfig = {
  snelpUrl: publicEnv.NEXT_PUBLIC_SNELP_CODES_URL,
} as const;

const cdnConfig = {
  enabled: !!publicEnv.NEXT_PUBLIC_CDN_URL,
  baseUrl: publicEnv.NEXT_PUBLIC_CDN_URL || '',
  domain: publicEnv.NEXT_PUBLIC_CDN_DOMAIN || '',
  domains: (publicEnv.NEXT_PUBLIC_CDN_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean),
  cacheBusting: env.NODE_ENV === 'production',
} as const;

const openAIConfig = {
  apiKey: env.OPENAI_API_KEY,
  apiBase: env.OPENAI_API_BASE,
  chat: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 500,
    temperature: 0.7,
  },
  vision: {
    model: 'gpt-4-vision-preview',
    maxTokens: 1000,
    detail: 'high' as const,
  },
} as const;

const redisConfig = {
  enabled: hasRedis(),
  url: env.REDIS_URL,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
} as const;

const docsConfig = {
  sourceRepo: env.DOCS_SOURCE_REPO,
  sourcePath: env.DOCS_SOURCE_PATH,
  githubToken: env.GITHUB_TOKEN,
} as const;

const alertingConfig = {
  webhookUrl: env.ALERT_WEBHOOK_URL,
  emailRecipients: env.ALERT_EMAIL_RECIPIENTS
    ? env.ALERT_EMAIL_RECIPIENTS.split(',').map((email) => email.trim()).filter(Boolean)
    : [],
} as const;

const requestSigningConfig = {
  secret: env.REQUEST_SIGNING_SECRET,
} as const;

const loggingConfig = {
  level: (env.LOG_LEVEL as 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent') ||
    (isProduction ? 'info' : 'debug'),
  enableFile: isProduction,
  prettyPrint: !isProduction,
} as const;

const bundleCheckConfig = {
  maxInitialBundleKB: env.MAX_INITIAL_BUNDLE_KB,
  maxRouteChunkKB: env.MAX_ROUTE_CHUNK_KB,
  maxTotalBundleKB: env.MAX_TOTAL_BUNDLE_KB,
  warnThreshold: env.BUNDLE_WARN_THRESHOLD,
} as const;

const firecrawlConfig = {
  apiKey: env.FIRECRAWL_API_KEY,
} as const;

const discordConfig = {
  token: env.DISCORD_TOKEN,
  clientId: env.DISCORD_CLIENT_ID,
} as const;

const mcpConfig = {
  baseUrl: env.MCP_BASE_URL,
  apiKey: env.MCP_API_KEY,
} as const;

const analyticsConfig = {
  plausibleDomain: publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '',
} as const;

const appConfig = {
  url: getAppUrl(),
  env: env.NODE_ENV,
} as const;

export const clientConfig = {
  appUrl: appConfig.url,
  adminApiBase: adminApiConfig.baseUrl,
  codes: codesRuntimeConfig,
  cdn: cdnConfig,
  analytics: analyticsConfig,
} as const;

export const cacheConfig = {
  codes: {
    ttl: 60,
    staleWhileRevalidate: 120,
  },
  guilds: {
    ttl: 300,
    staleWhileRevalidate: 600,
  },
  guildDetails: {
    ttl: 180,
    staleWhileRevalidate: 360,
  },
  health: {
    ttl: 60,
    staleWhileRevalidate: 120,
  },
  diagnostics: {
    ttl: 60,
    staleWhileRevalidate: 120,
  },
} as const;

export const rateLimitConfig = {
  chat: {
    maxRequests: 10,
    windowSeconds: 60,
  },
  codeReports: {
    maxRequests: 5,
    windowSeconds: 300,
  },
  api: {
    maxRequests: 100,
    windowSeconds: 60,
  },
  screenshot: {
    maxRequests: 10,
    windowSeconds: 60,
  },
} as const;

export const apiClientConfig = {
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
  timeout: {
    defaultMs: 30000,
    longRunningMs: 120000,
  },
} as const;

export const codesConfig = {
  sources: {
    snelp: {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      cacheTtl: 60,
      enabled: true,
      baseUrl: codesRuntimeConfig.snelpUrl,
    },
    reddit: {
      timeout: 15000,
      retries: 2,
      retryDelay: 2000,
      cacheTtl: 120,
      enabled: true,
    },
  },
  deduplication: {
    strategy: 'newest' as const,
    compareFields: ['code', 'source', 'expires'] as const,
  },
  scopes: {
    active: 'active',
    past7: 'past7',
    all: 'all',
  } as const,
} as const;

export const chatConfig = {
  maxHistoryMessages: 10,
  defaultPersonality: 'helpful' as const,
  streamingEnabled: true,
  personalities: {
    helpful: {
      temperature: 0.7,
      maxTokens: 500,
    },
    sarcastic: {
      temperature: 0.9,
      maxTokens: 500,
    },
    professional: {
      temperature: 0.5,
      maxTokens: 600,
    },
    creative: {
      temperature: 1.0,
      maxTokens: 700,
    },
    technical: {
      temperature: 0.6,
      maxTokens: 800,
    },
  },
} as const;

export const clubConfig = {
  upload: {
    maxFileSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 5,
  },
  analysis: {
    timeoutMs: 60000,
    confidenceThreshold: 0.7,
  },
} as const;

export const featureFlagsConfig = {
  defaults: {
    theme: {
      colorPrimary: '#00ff9d',
      badgeStyle: 'rounded' as const,
    },
    experiments: {
      ensembleOCR: false,
      secondApprover: false,
      askManus: false,
      publicStats: true,
    },
  },
  storage: {
    directory: 'data/guild-flags',
  },
} as const;

export const paginationConfig = {
  guilds: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  members: {
    defaultLimit: 50,
    maxLimit: 200,
  },
  messages: {
    defaultLimit: 50,
    maxLimit: 100,
  },
} as const;

export const storageConfig = {
  rateLimits: {
    directory: 'data/rate-limits',
    cleanupIntervalMs: 3600000,
  },
  codes: {
    directory: 'data/codes',
  },
  guildFlags: {
    directory: 'data/guild-flags',
  },
} as const;

export const monitoringConfig = {
  healthCheck: {
    intervalMs: 60000,
  },
  metrics: {
    enabled: env.NODE_ENV === 'production',
    port: 9090,
  },
  logging: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableRequestLogging: true,
    enableErrorStacks: env.NODE_ENV !== 'production',
  },
} as const;

export const securityConfig = {
  cors: {
    allowedOrigins: env.NODE_ENV === 'production'
      ? [getAppUrl()]
      : ['http://localhost:3000', 'http://localhost:3080'],
  },
  headers: {
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    referrerPolicy: 'origin-when-cross-origin',
  },
  rateLimiting: {
    enabled: true,
    failOpen: true,
  },
} as const;

export const buildConfig = {
  analyze: env.ANALYZE,
  sourceMaps: env.NODE_ENV !== 'production',
  bundleSize: {
    maxFrameworkMB: 2.0,
    maxUIMB: 0.5,
    maxVendorMB: 1.5,
    maxCommonMB: 0.5,
  },
} as const;

export const config = {
  env,
  publicEnv,
  app: appConfig,
  adminApi: adminApiConfig,
  analytics: analyticsConfig,
  cdn: cdnConfig,
  openai: openAIConfig,
  redis: redisConfig,
  docs: docsConfig,
  alerting: alertingConfig,
  requestSigning: requestSigningConfig,
  logging: loggingConfig,
  bundleChecks: bundleCheckConfig,
  firecrawl: firecrawlConfig,
  discord: discordConfig,
  mcp: mcpConfig,
  cache: cacheConfig,
  rateLimit: rateLimitConfig,
  apiClient: apiClientConfig,
  codes: codesConfig,
  chat: chatConfig,
  club: clubConfig,
  featureFlags: featureFlagsConfig,
  pagination: paginationConfig,
  storage: storageConfig,
  monitoring: monitoringConfig,
  security: securityConfig,
  build: buildConfig,
} as const;

export type Config = typeof config;
