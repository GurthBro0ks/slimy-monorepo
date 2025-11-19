import { ZodError } from 'zod';
import {
  AppConfig,
  AppConfigSchema,
  AdminApiConfig,
  WebConfig,
  DiscordBotConfig,
  MinecraftConfig,
  InfraConfig,
} from './schema';

/**
 * Configuration loading error with helpful context
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly validationErrors?: ZodError
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

/**
 * Loads and validates application configuration from environment variables
 *
 * @throws {ConfigLoadError} If required configuration is missing or invalid
 * @returns {AppConfig} Validated configuration object
 *
 * @example
 * ```typescript
 * const config = loadConfigFromEnv();
 * console.log(config.infra.nodeEnv);
 * console.log(config.web.baseUrl);
 * ```
 */
export function loadConfigFromEnv(): AppConfig {
  try {
    const rawConfig = {
      adminApi: {
        baseUrl: process.env.ADMIN_API_BASE_URL,
        port: process.env.ADMIN_API_PORT,
        apiKey: process.env.ADMIN_API_KEY,
        enableAuth: process.env.ADMIN_API_ENABLE_AUTH,
      },
      web: {
        baseUrl: process.env.WEB_BASE_URL,
        port: process.env.WEB_PORT,
        sessionSecret: process.env.WEB_SESSION_SECRET,
        apiEndpoint: process.env.WEB_API_ENDPOINT,
      },
      discordBot: {
        botToken: process.env.DISCORD_BOT_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        guildId: process.env.DISCORD_GUILD_ID,
        commandPrefix: process.env.DISCORD_COMMAND_PREFIX,
        enableLogging: process.env.DISCORD_ENABLE_LOGGING,
      },
      minecraft: {
        serverHost: process.env.MINECRAFT_SERVER_HOST,
        serverPort: process.env.MINECRAFT_SERVER_PORT,
        rconPassword: process.env.MINECRAFT_RCON_PASSWORD,
        rconPort: process.env.MINECRAFT_RCON_PORT,
        enableRcon: process.env.MINECRAFT_ENABLE_RCON,
      },
      infra: {
        databaseUrl: process.env.DATABASE_URL,
        redisUrl: process.env.REDIS_URL,
        logLevel: process.env.LOG_LEVEL,
        nodeEnv: process.env.NODE_ENV,
      },
    };

    const validatedConfig = AppConfigSchema.parse(rawConfig);
    return validatedConfig;
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map(
        (err) => `  - ${err.path.join('.')}: ${err.message}`
      );

      throw new ConfigLoadError(
        `Configuration validation failed:\n${errorMessages.join('\n')}\n\n` +
        `Please check your environment variables and ensure all required values are set.`,
        error
      );
    }

    throw new ConfigLoadError(
      `Unexpected error while loading configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validates a partial configuration object
 * Useful for testing or when you only need to validate a subset of config
 */
export function validateConfig(config: unknown): AppConfig {
  try {
    return AppConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ConfigLoadError(
        'Configuration validation failed',
        error
      );
    }
    throw error;
  }
}

// Re-export types and schemas for convenience
export type {
  AppConfig,
  AdminApiConfig,
  WebConfig,
  DiscordBotConfig,
  MinecraftConfig,
  InfraConfig,
};

export {
  AppConfigSchema,
  AdminApiConfigSchema,
  WebConfigSchema,
  DiscordBotConfigSchema,
  MinecraftConfigSchema,
  InfraConfigSchema,
} from './schema';
