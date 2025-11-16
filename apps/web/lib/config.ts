/**
 * Application Configuration
 *
 * Centralized configuration for hardcoded values used throughout the application.
 * This makes it easier to adjust settings without searching through the codebase.
 */

import { env } from './env';

/**
 * Cache Configuration
 */
export const cacheConfig = {
  // Cache TTLs (in seconds)
  codes: {
    ttl: 60, // 60 seconds
    staleWhileRevalidate: 120, // 2 minutes
  },
  guilds: {
    ttl: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
  },
  guildDetails: {
    ttl: 180, // 3 minutes
    staleWhileRevalidate: 360, // 6 minutes
  },
  health: {
    ttl: 60, // 60 seconds
    staleWhileRevalidate: 120, // 2 minutes
  },
  diagnostics: {
    ttl: 60, // 60 seconds
    staleWhileRevalidate: 120, // 2 minutes
  },
} as const;

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  chat: {
    maxRequests: 10,
    windowSeconds: 60, // 1 minute
  },
  codeReports: {
    maxRequests: 5,
    windowSeconds: 300, // 5 minutes
  },
  api: {
    maxRequests: 100,
    windowSeconds: 60, // 1 minute
  },
  screenshot: {
    maxRequests: 10,
    windowSeconds: 60, // 1 minute
  },
} as const;

/**
 * API Client Configuration
 */
export const apiClientConfig = {
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 30000, // 30 seconds
    backoffMultiplier: 2,
  },
  timeout: {
    defaultMs: 30000, // 30 seconds
    longRunningMs: 120000, // 2 minutes (for AI/vision operations)
  },
} as const;

/**
 * Codes Aggregator Configuration
 */
export const codesConfig = {
  sources: {
    snelp: {
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      cacheTtl: 60, // 60 seconds
      enabled: true,
    },
    reddit: {
      timeout: 15000, // 15 seconds
      retries: 2,
      retryDelay: 2000, // 2 seconds
      cacheTtl: 120, // 2 minutes
      enabled: true,
    },
  },
  deduplication: {
    strategy: 'newest' as const, // 'newest' | 'oldest' | 'priority'
    compareFields: ['code', 'source', 'expires'] as const,
  },
  scopes: {
    active: 'active',
    past7: 'past7',
    all: 'all',
  } as const,
} as const;

/**
 * Chat Configuration
 */
export const chatConfig = {
  maxHistoryMessages: 10, // Number of previous messages to include for context
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

/**
 * OpenAI Configuration
 */
export const openAIConfig = {
  chat: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 500,
    temperature: 0.7,
  },
  vision: {
    model: 'gpt-4-vision-preview',
    maxTokens: 1000,
    detail: 'high' as const, // 'low' | 'high' | 'auto'
  },
  apiBase: env.OPENAI_API_BASE || 'https://api.openai.com/v1',
} as const;

/**
 * Club Analytics Configuration
 */
export const clubConfig = {
  upload: {
    maxFileSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 5,
  },
  analysis: {
    timeoutMs: 60000, // 1 minute
    confidenceThreshold: 0.7,
  },
} as const;

/**
 * Feature Flags Configuration
 */
export const featureFlagsConfig = {
  defaults: {
    theme: {
      colorPrimary: '#00ff9d', // Neon green
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

/**
 * Pagination Configuration
 */
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

/**
 * File Storage Configuration
 */
export const storageConfig = {
  rateLimits: {
    directory: 'data/rate-limits',
    cleanupIntervalMs: 3600000, // 1 hour
  },
  codes: {
    directory: 'data/codes',
  },
  guildFlags: {
    directory: 'data/guild-flags',
  },
} as const;

/**
 * Monitoring Configuration
 */
export const monitoringConfig = {
  healthCheck: {
    intervalMs: 60000, // 1 minute
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

/**
 * Security Configuration
 */
export const securityConfig = {
  cors: {
    allowedOrigins: env.NODE_ENV === 'production'
      ? [env.NEXT_PUBLIC_APP_URL]
      : ['http://localhost:3000', 'http://localhost:3080'],
  },
  headers: {
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    referrerPolicy: 'origin-when-cross-origin',
  },
  rateLimiting: {
    enabled: true,
    failOpen: true, // Allow requests if rate limiter fails
  },
} as const;

/**
 * Build Configuration
 */
export const buildConfig = {
  analyze: process.env.ANALYZE === 'true',
  sourceMaps: env.NODE_ENV !== 'production',
  bundleSize: {
    maxFrameworkMB: 2.0,
    maxUIMB: 0.5,
    maxVendorMB: 1.5,
    maxCommonMB: 0.5,
  },
} as const;

/**
 * Helper to get all configuration
 */
export const config = {
  cache: cacheConfig,
  rateLimit: rateLimitConfig,
  apiClient: apiClientConfig,
  codes: codesConfig,
  chat: chatConfig,
  openai: openAIConfig,
  club: clubConfig,
  featureFlags: featureFlagsConfig,
  pagination: paginationConfig,
  storage: storageConfig,
  monitoring: monitoringConfig,
  security: securityConfig,
  build: buildConfig,
} as const;

export type Config = typeof config;
