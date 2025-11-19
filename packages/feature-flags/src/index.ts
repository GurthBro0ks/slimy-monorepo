/**
 * Feature Flags Module
 *
 * Provides type-safe feature flag evaluation with support for:
 * - Environment variable loading
 * - JSON configuration
 * - Percentage-based rollouts
 * - Allowlist/blocklist strategies
 * - User/guild/context-based targeting
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Type-safe feature flag names
 * Add new flags here for compile-time safety
 */
export type FeatureFlag =
  | 'FF_SNAIL_NEW_UI'
  | 'FF_SNAIL_PREMIUM_GUILDS'
  | 'FF_SNAIL_ANALYTICS_V2'
  | 'FF_CODES_BATCH_IMPORT'
  | 'FF_ADMIN_DASHBOARD_V2';

/**
 * Context object for flag evaluation
 * Provides user/guild/session identifiers for targeted rollouts
 */
export type FlagContext = {
  userId?: string;
  guildId?: string;
  sessionId?: string;
  environment?: 'development' | 'staging' | 'production';
  [key: string]: any;
};

/**
 * Flag configuration with rollout strategy
 */
export type FlagConfig = {
  /** Whether the flag is globally enabled */
  enabled: boolean;

  /** Percentage rollout (0-100). Only applies if enabled=true */
  rollout?: number;

  /** Explicit allowlist of user/guild IDs */
  allowlist?: string[];

  /** Explicit blocklist of user/guild IDs */
  blocklist?: string[];

  /** Optional description for documentation */
  description?: string;
};

/**
 * Flag store configuration object
 */
export type FlagStore = {
  [K in FeatureFlag]?: FlagConfig | boolean;
};

// ============================================================================
// In-Memory Store
// ============================================================================

let flagStore: Map<FeatureFlag, FlagConfig> = new Map();

/**
 * Normalize a flag value to FlagConfig
 */
function normalizeFlagConfig(value: FlagConfig | boolean): FlagConfig {
  if (typeof value === 'boolean') {
    return { enabled: value };
  }
  return {
    enabled: value.enabled,
    rollout: value.rollout ?? 100,
    allowlist: value.allowlist,
    blocklist: value.blocklist,
    description: value.description,
  };
}

/**
 * Initialize flag store from JSON configuration
 *
 * @param config - Object mapping flag names to configurations
 *
 * @example
 * ```typescript
 * initializeFlags({
 *   FF_SNAIL_NEW_UI: { enabled: true, rollout: 50 },
 *   FF_SNAIL_PREMIUM_GUILDS: { enabled: true, allowlist: ['guild_123'] }
 * });
 * ```
 */
export function initializeFlags(config: FlagStore): void {
  flagStore.clear();

  for (const [flagName, flagValue] of Object.entries(config)) {
    if (flagValue !== undefined) {
      flagStore.set(flagName as FeatureFlag, normalizeFlagConfig(flagValue));
    }
  }
}

/**
 * Load flags from environment variables
 * Environment variables should be prefixed with FF_
 *
 * @param env - Environment object (defaults to process.env)
 * @param override - Whether to override existing flags (default: true)
 *
 * @example
 * ```bash
 * FF_SNAIL_NEW_UI=true node app.js
 * ```
 */
export function loadFlagsFromEnv(
  env: Record<string, string | undefined> = process.env,
  override: boolean = true
): void {
  const flagPrefix = 'FF_';

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(flagPrefix) && value !== undefined) {
      const flagName = key as FeatureFlag;

      // Skip if flag already exists and override is false
      if (!override && flagStore.has(flagName)) {
        continue;
      }

      // Parse boolean-like values
      let enabled: boolean;
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
        enabled = true;
      } else if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
        enabled = false;
      } else {
        // Try parsing as JSON for complex configs
        try {
          const parsed = JSON.parse(value);
          flagStore.set(flagName, normalizeFlagConfig(parsed));
          continue;
        } catch {
          // Default to truthy check
          enabled = Boolean(value);
        }
      }

      flagStore.set(flagName, { enabled });
    }
  }
}

/**
 * Set a single flag configuration
 * Useful for testing or dynamic updates
 *
 * @param flagName - The flag to set
 * @param config - The flag configuration
 */
export function setFlag(flagName: FeatureFlag, config: FlagConfig | boolean): void {
  flagStore.set(flagName, normalizeFlagConfig(config));
}

/**
 * Get the current configuration for a flag
 * Returns undefined if flag not configured
 */
export function getFlag(flagName: FeatureFlag): FlagConfig | undefined {
  return flagStore.get(flagName);
}

/**
 * Get all configured flags
 */
export function getAllFlags(): Map<FeatureFlag, FlagConfig> {
  return new Map(flagStore);
}

/**
 * Clear all flags from the store
 */
export function clearFlags(): void {
  flagStore.clear();
}

// ============================================================================
// Flag Evaluation
// ============================================================================

/**
 * Simple hash function for deterministic percentage rollouts
 * Uses a basic string hash algorithm
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if an entity passes percentage rollout
 *
 * @param identifier - Unique identifier (userId, guildId, etc.)
 * @param percentage - Target percentage (0-100)
 * @returns true if entity is in the rollout percentage
 */
function passesRollout(identifier: string, percentage: number): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  const hash = hashString(identifier);
  return (hash % 100) < percentage;
}

/**
 * Check if a feature flag is enabled
 *
 * Evaluation order:
 * 1. Is flag configured? If not, return false
 * 2. Is flag globally enabled? If not, return false
 * 3. Is entity in blocklist? If yes, return false
 * 4. Is entity in allowlist? If yes, return true
 * 5. Does entity pass rollout percentage? Return result
 * 6. If no context provided, return global enabled state
 *
 * @param flagName - The feature flag to check
 * @param context - Optional context for targeted evaluation
 * @returns true if flag is enabled for the given context
 *
 * @example
 * ```typescript
 * // Simple check
 * if (isEnabled('FF_SNAIL_NEW_UI')) {
 *   console.log('New UI enabled');
 * }
 *
 * // User-specific rollout
 * if (isEnabled('FF_SNAIL_NEW_UI', { userId: 'user_123' })) {
 *   return <NewUI />;
 * }
 *
 * // Guild allowlist
 * if (isEnabled('FF_SNAIL_PREMIUM_GUILDS', { guildId: 'guild_abc' })) {
 *   return <PremiumFeatures />;
 * }
 * ```
 */
export function isEnabled(flagName: FeatureFlag, context?: FlagContext): boolean {
  const config = flagStore.get(flagName);

  // Flag not configured, default to disabled
  if (!config) {
    return false;
  }

  // Flag globally disabled
  if (!config.enabled) {
    return false;
  }

  // No context provided, return global enabled state
  if (!context) {
    return config.enabled;
  }

  // Extract identifiers from context
  const identifiers = [
    context.userId,
    context.guildId,
    context.sessionId,
  ].filter((id): id is string => id !== undefined);

  // Check blocklist - if any identifier is blocked, return false
  if (config.blocklist && config.blocklist.length > 0) {
    for (const id of identifiers) {
      if (config.blocklist.includes(id)) {
        return false;
      }
    }
  }

  // Check allowlist - if any identifier is allowed, return true
  if (config.allowlist && config.allowlist.length > 0) {
    for (const id of identifiers) {
      if (config.allowlist.includes(id)) {
        return true;
      }
    }
    // If allowlist exists but no match, check rollout
  }

  // Check percentage rollout
  if (config.rollout !== undefined && identifiers.length > 0) {
    // Use first available identifier for rollout
    const primaryId = identifiers[0];
    return passesRollout(primaryId, config.rollout);
  }

  // Default to enabled state if no targeting rules matched
  return config.enabled;
}

/**
 * Check if a feature flag is disabled
 * Convenience function, inverse of isEnabled
 */
export function isDisabled(flagName: FeatureFlag, context?: FlagContext): boolean {
  return !isEnabled(flagName, context);
}

/**
 * Get flag value with fallback
 * Returns the flag state or a default value if not configured
 */
export function getFlagWithDefault(
  flagName: FeatureFlag,
  context: FlagContext | undefined,
  defaultValue: boolean
): boolean {
  const config = flagStore.get(flagName);
  if (!config) {
    return defaultValue;
  }
  return isEnabled(flagName, context);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a flag checker function bound to a specific context
 * Useful for passing flag checks to child components
 *
 * @example
 * ```typescript
 * const userFlags = createFlagChecker({ userId: 'user_123' });
 * if (userFlags('FF_SNAIL_NEW_UI')) {
 *   // ...
 * }
 * ```
 */
export function createFlagChecker(context: FlagContext): (flagName: FeatureFlag) => boolean {
  return (flagName: FeatureFlag) => isEnabled(flagName, context);
}

/**
 * Get debug information about a flag evaluation
 * Useful for troubleshooting flag behavior
 */
export function debugFlag(flagName: FeatureFlag, context?: FlagContext): {
  configured: boolean;
  config?: FlagConfig;
  result: boolean;
  reason: string;
} {
  const config = flagStore.get(flagName);

  if (!config) {
    return {
      configured: false,
      result: false,
      reason: 'Flag not configured',
    };
  }

  if (!config.enabled) {
    return {
      configured: true,
      config,
      result: false,
      reason: 'Flag globally disabled',
    };
  }

  if (!context) {
    return {
      configured: true,
      config,
      result: true,
      reason: 'No context provided, using global enabled state',
    };
  }

  const identifiers = [context.userId, context.guildId, context.sessionId]
    .filter((id): id is string => id !== undefined);

  if (config.blocklist && config.blocklist.length > 0) {
    for (const id of identifiers) {
      if (config.blocklist.includes(id)) {
        return {
          configured: true,
          config,
          result: false,
          reason: `Identifier ${id} in blocklist`,
        };
      }
    }
  }

  if (config.allowlist && config.allowlist.length > 0) {
    for (const id of identifiers) {
      if (config.allowlist.includes(id)) {
        return {
          configured: true,
          config,
          result: true,
          reason: `Identifier ${id} in allowlist`,
        };
      }
    }
  }

  if (config.rollout !== undefined && identifiers.length > 0) {
    const primaryId = identifiers[0];
    const passes = passesRollout(primaryId, config.rollout);
    return {
      configured: true,
      config,
      result: passes,
      reason: `Rollout ${config.rollout}%, identifier ${primaryId} ${passes ? 'passes' : 'fails'}`,
    };
  }

  return {
    configured: true,
    config,
    result: true,
    reason: 'No targeting rules matched, using global enabled state',
  };
}
