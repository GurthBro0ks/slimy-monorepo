import { z } from 'zod';

/**
 * Admin API configuration schema
 */
export const AdminApiConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  port: z.coerce.number().int().positive().optional(),
  apiKey: z.string().optional(),
  enableAuth: z.coerce.boolean().default(true),
});

/**
 * Web application configuration schema
 */
export const WebConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  port: z.coerce.number().int().positive().optional(),
  sessionSecret: z.string().optional(),
  apiEndpoint: z.string().url().optional(),
});

/**
 * Discord bot configuration schema
 */
export const DiscordBotConfigSchema = z.object({
  botToken: z.string().optional(),
  clientId: z.string().optional(),
  guildId: z.string().optional(),
  commandPrefix: z.string().default('!'),
  enableLogging: z.coerce.boolean().default(true),
});

/**
 * Minecraft server configuration schema
 */
export const MinecraftConfigSchema = z.object({
  serverHost: z.string().optional(),
  serverPort: z.coerce.number().int().positive().optional(),
  rconPassword: z.string().optional(),
  rconPort: z.coerce.number().int().positive().optional(),
  enableRcon: z.coerce.boolean().default(false),
});

/**
 * Infrastructure configuration schema
 */
export const InfraConfigSchema = z.object({
  databaseUrl: z.string().optional(),
  redisUrl: z.string().optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Complete application configuration schema
 */
export const AppConfigSchema = z.object({
  adminApi: AdminApiConfigSchema,
  web: WebConfigSchema,
  discordBot: DiscordBotConfigSchema,
  minecraft: MinecraftConfigSchema,
  infra: InfraConfigSchema,
});

/**
 * Inferred TypeScript types from schemas
 */
export type AdminApiConfig = z.infer<typeof AdminApiConfigSchema>;
export type WebConfig = z.infer<typeof WebConfigSchema>;
export type DiscordBotConfig = z.infer<typeof DiscordBotConfigSchema>;
export type MinecraftConfig = z.infer<typeof MinecraftConfigSchema>;
export type InfraConfig = z.infer<typeof InfraConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
