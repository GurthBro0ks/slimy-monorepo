/**
 * Environment Variable Validation
 *
 * This file validates all environment variables used in the application
 * using Zod schemas. It provides type-safe access to environment variables
 * and ensures all required variables are present at runtime.
 */

import { z, type ZodIssue } from 'zod';

type InvalidTypeIssue = ZodIssue & { code: 'invalid_type'; received?: string };

const isInvalidTypeIssue = (issue: ZodIssue): issue is InvalidTypeIssue => {
  return issue.code === 'invalid_type';
};

// Define the schema for server-side environment variables
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_BASE: z.string().url().optional().default('https://api.openai.com/v1'),

  // MCP Integration
  MCP_BASE_URL: z.string().url().optional(),
  MCP_API_KEY: z.string().optional(),

  // Documentation
  DOCS_SOURCE_REPO: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  REDIS_PASSWORD: z.string().optional(),

  // CI/CD
  CI: z.string().optional().transform((val) => val === 'true'),

  // Playwright
  PLAYWRIGHT_DEBUG: z.string().optional().transform((val) => val === 'true'),
});

// Define the schema for client-side (public) environment variables
const clientEnvSchema = z.object({
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),

  // API Configuration
  NEXT_PUBLIC_ADMIN_API_BASE: z.string().url(),
  NEXT_PUBLIC_SNELP_CODES_URL: z.string().url(),

  // Analytics
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),

  // CDN (optional)
  NEXT_PUBLIC_CDN_DOMAIN: z.string().url().optional(),
});

/**
 * Validate and parse server environment variables
 * Only call this on the server side
 */
function validateServerEnv() {
  try {
    return serverEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter((err): err is InvalidTypeIssue => isInvalidTypeIssue(err) && err.received === 'undefined')
        .map((err) => err.path.join('.'));

      const invalidVars = error.issues
        .filter((err) => {
          if (isInvalidTypeIssue(err)) {
            return err.received !== 'undefined';
          }
          return true;
        })
        .map((err) => `${err.path.join('.')}: ${err.message}`);

      console.error('❌ Invalid server environment variables:');
      if (missingVars.length > 0) {
        console.error('  Missing:', missingVars.join(', '));
      }
      if (invalidVars.length > 0) {
        console.error('  Invalid:', invalidVars.join(', '));
      }

      throw new Error('Invalid server environment variables');
    }
    throw error;
  }
}

/**
 * Validate and parse client environment variables
 * Can be called on both client and server
 */
function validateClientEnv() {
  const clientEnv: Record<string, string | undefined> = {};

  // Extract only NEXT_PUBLIC_ variables
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      clientEnv[key] = process.env[key];
    }
  });

  try {
    return clientEnvSchema.parse(clientEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter((err): err is InvalidTypeIssue => isInvalidTypeIssue(err) && err.received === 'undefined')
        .map((err) => err.path.join('.'));

      const invalidVars = error.issues
        .filter((err) => {
          if (isInvalidTypeIssue(err)) {
            return err.received !== 'undefined';
          }
          return true;
        })
        .map((err) => `${err.path.join('.')}: ${err.message}`);

      console.error('❌ Invalid client environment variables:');
      if (missingVars.length > 0) {
        console.error('  Missing:', missingVars.join(', '));
      }
      if (invalidVars.length > 0) {
        console.error('  Invalid:', invalidVars.join(', '));
      }

      throw new Error('Invalid client environment variables');
    }
    throw error;
  }
}

// Validate environment variables at module load time
const serverEnv = typeof window === 'undefined' ? validateServerEnv() : ({} as z.infer<typeof serverEnvSchema>);
const clientEnv = validateClientEnv();

/**
 * Type-safe access to server environment variables
 * Only available on the server side
 */
export const env = {
  ...serverEnv,
  ...clientEnv,
} as const;

/**
 * Type for the complete environment
 */
export type Env = typeof env;

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if we're in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Helper to get the app URL
 */
export const getAppUrl = () => {
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  // Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Default
  return 'http://localhost:3000';
};

/**
 * Helper to check if OpenAI is configured
 */
export const hasOpenAI = () => {
  return !!env.OPENAI_API_KEY;
};

/**
 * Helper to check if MCP is configured
 */
export const hasMCP = () => {
  return !!env.MCP_BASE_URL && !!env.MCP_API_KEY;
};

/**
 * Helper to check if Redis is configured
 */
export const hasRedis = () => {
  return !!env.REDIS_URL || (!!env.REDIS_HOST && !!env.REDIS_PORT);
};

/**
 * Helper to check if docs auto-import is configured
 */
export const hasDocsImport = () => {
  return !!env.DOCS_SOURCE_REPO && !!env.GITHUB_TOKEN;
};
