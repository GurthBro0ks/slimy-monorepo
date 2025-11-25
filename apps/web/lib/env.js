"use strict";
/**
 * Environment Variable Validation
 *
 * This file validates all environment variables used in the application
 * using Zod schemas. It provides type-safe access to environment variables
 * and ensures all required variables are present at runtime.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasDocsImport = exports.hasRedis = exports.hasMCP = exports.hasOpenAI = exports.getAppUrl = exports.isTest = exports.isDevelopment = exports.isProduction = exports.env = void 0;
const zod_1 = require("zod");
const isInvalidTypeIssue = (issue) => {
    return issue.code === 'invalid_type';
};
// Define the schema for server-side environment variables
const serverEnvSchema = zod_1.z.object({
    // Node environment
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    // OpenAI Configuration
    OPENAI_API_KEY: zod_1.z.string().optional(),
    OPENAI_API_BASE: zod_1.z.string().url().optional().default('https://api.openai.com/v1'),
    // MCP Integration
    MCP_BASE_URL: zod_1.z.string().url().optional(),
    MCP_API_KEY: zod_1.z.string().optional(),
    // Documentation
    DOCS_SOURCE_REPO: zod_1.z.string().optional(),
    GITHUB_TOKEN: zod_1.z.string().optional(),
    // Redis (optional)
    REDIS_URL: zod_1.z.string().url().optional(),
    REDIS_HOST: zod_1.z.string().optional(),
    REDIS_PORT: zod_1.z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    // CI/CD
    CI: zod_1.z.string().optional().transform((val) => val === 'true'),
    // Playwright
    PLAYWRIGHT_DEBUG: zod_1.z.string().optional().transform((val) => val === 'true'),
});
// Define the schema for client-side (public) environment variables
const clientEnvSchema = zod_1.z.object({
    // App Configuration
    NEXT_PUBLIC_APP_URL: zod_1.z.string().url().optional().default('http://localhost:3000'),
    // API Configuration
    NEXT_PUBLIC_ADMIN_API_BASE: zod_1.z.string().url(),
    NEXT_PUBLIC_SNELP_CODES_URL: zod_1.z.string().url(),
    // Analytics
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: zod_1.z.string().optional(),
    // CDN (optional)
    NEXT_PUBLIC_CDN_DOMAIN: zod_1.z.string().url().optional(),
});
/**
 * Validate and parse server environment variables
 * Only call this on the server side
 */
function validateServerEnv() {
    try {
        return serverEnvSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.issues
                .filter((err) => isInvalidTypeIssue(err) && err.received === 'undefined')
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
    const clientEnv = {};
    // Extract only NEXT_PUBLIC_ variables
    Object.keys(process.env).forEach((key) => {
        if (key.startsWith('NEXT_PUBLIC_')) {
            clientEnv[key] = process.env[key];
        }
    });
    try {
        return clientEnvSchema.parse(clientEnv);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.issues
                .filter((err) => isInvalidTypeIssue(err) && err.received === 'undefined')
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
const serverEnv = typeof window === 'undefined' ? validateServerEnv() : {};
const clientEnv = validateClientEnv();
/**
 * Type-safe access to server environment variables
 * Only available on the server side
 */
exports.env = {
    ...serverEnv,
    ...clientEnv,
};
/**
 * Helper to check if we're in production
 */
exports.isProduction = exports.env.NODE_ENV === 'production';
/**
 * Helper to check if we're in development
 */
exports.isDevelopment = exports.env.NODE_ENV === 'development';
/**
 * Helper to check if we're in test
 */
exports.isTest = exports.env.NODE_ENV === 'test';
/**
 * Helper to get the app URL
 */
const getAppUrl = () => {
    if (exports.env.NEXT_PUBLIC_APP_URL) {
        return exports.env.NEXT_PUBLIC_APP_URL;
    }
    // Vercel deployment
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // Default
    return 'http://localhost:3000';
};
exports.getAppUrl = getAppUrl;
/**
 * Helper to check if OpenAI is configured
 */
const hasOpenAI = () => {
    return !!exports.env.OPENAI_API_KEY;
};
exports.hasOpenAI = hasOpenAI;
/**
 * Helper to check if MCP is configured
 */
const hasMCP = () => {
    return !!exports.env.MCP_BASE_URL && !!exports.env.MCP_API_KEY;
};
exports.hasMCP = hasMCP;
/**
 * Helper to check if Redis is configured
 */
const hasRedis = () => {
    return !!exports.env.REDIS_URL || (!!exports.env.REDIS_HOST && !!exports.env.REDIS_PORT);
};
exports.hasRedis = hasRedis;
/**
 * Helper to check if docs auto-import is configured
 */
const hasDocsImport = () => {
    return !!exports.env.DOCS_SOURCE_REPO && !!exports.env.GITHUB_TOKEN;
};
exports.hasDocsImport = hasDocsImport;
