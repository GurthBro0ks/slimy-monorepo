/**
 * Configuration for the opps-api HTTP service
 */

export interface Config {
  port: number;
}

/**
 * Get configuration from environment variables with fallback defaults
 */
export function getConfig(): Config {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4010;

  return {
    port,
  };
}
