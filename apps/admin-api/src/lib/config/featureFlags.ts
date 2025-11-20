/**
 * Feature Flags for Database Migration
 * Allows gradual migration from MySQL to Prisma by toggling features on/off
 */

interface FeatureFlags {
  // Guild Settings: Use Prisma for guild settings instead of MySQL
  ENABLE_PRISMA_GUILD_SETTINGS: boolean;

  // Guild Personality: Use Prisma for guild personality instead of files
  ENABLE_PRISMA_GUILD_PERSONALITY: boolean;

  // Club Corrections: Use Prisma for corrections instead of in-memory
  ENABLE_PRISMA_CORRECTIONS: boolean;

  // Webhooks: Use Prisma (already enabled by default)
  ENABLE_PRISMA_WEBHOOKS: boolean;
}

/**
 * Parse boolean from environment variable
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
}

/**
 * Get feature flags from environment
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    ENABLE_PRISMA_GUILD_SETTINGS: parseEnvBoolean(
      process.env.ENABLE_PRISMA_GUILD_SETTINGS,
      false  // Default: OFF, use MySQL
    ),
    ENABLE_PRISMA_GUILD_PERSONALITY: parseEnvBoolean(
      process.env.ENABLE_PRISMA_GUILD_PERSONALITY,
      false  // Default: OFF, use files
    ),
    ENABLE_PRISMA_CORRECTIONS: parseEnvBoolean(
      process.env.ENABLE_PRISMA_CORRECTIONS,
      false  // Default: OFF, use in-memory
    ),
    ENABLE_PRISMA_WEBHOOKS: parseEnvBoolean(
      process.env.ENABLE_PRISMA_WEBHOOKS,
      true   // Default: ON, already proven to work
    ),
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flagName];
}

/**
 * Log current feature flag status
 */
export function logFeatureFlags(): void {
  const flags = getFeatureFlags();
  console.log('📋 Feature Flags:');
  Object.entries(flags).forEach(([key, value]) => {
    const status = value ? '✓ ON' : '✗ OFF';
    console.log(`  ${status} - ${key}`);
  });
}
