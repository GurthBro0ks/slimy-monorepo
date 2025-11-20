/**
 * Configuration for the opps-api HTTP service
 */

export interface Config {
  /** Port to listen on */
  port: number;
}

/**
 * Get configuration from environment variables with defaults
 */
export function getConfig(): Config {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4010;

  return {
    port,
  };
}
