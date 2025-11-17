"use strict";

const database = require("../lib/database");

/**
 * Default feature flags for guilds
 */
const DEFAULT_FEATURES = {
  clubAnalytics: true,
  seasons: false,
  codesV2: true,
  notifications: true,
};

/**
 * Get guild configuration with defaults applied
 * @param {string} guildId - Guild ID (internal database ID)
 * @returns {Promise<Object>} Guild configuration with features object
 */
async function getGuildConfig(guildId) {
  const guild = await database.findGuildById(guildId);

  const rawConfig = (guild && guild.config) || {};
  const features = {
    ...DEFAULT_FEATURES,
    ...(rawConfig.features || {}),
  };

  return {
    ...rawConfig,
    features,
  };
}

/**
 * Update guild configuration (merges with existing config)
 * @param {string} guildId - Guild ID (internal database ID)
 * @param {Object} patch - Partial configuration to merge
 * @returns {Promise<Object>} Updated guild configuration
 */
async function updateGuildConfig(guildId, patch) {
  const current = await getGuildConfig(guildId);

  const merged = {
    ...current,
    ...patch,
    features: {
      ...current.features,
      ...(patch.features || {}),
    },
  };

  const updated = await database.updateGuild(guildId, {
    config: merged,
  });

  // Ensure defaults remain applied when returning
  const rawConfig = updated.config || {};
  const features = {
    ...DEFAULT_FEATURES,
    ...(rawConfig.features || {}),
  };

  return {
    ...rawConfig,
    features,
  };
}

/**
 * Check if a feature is enabled for a guild
 * @param {Object} config - Guild configuration object
 * @param {string} feature - Feature name to check
 * @returns {boolean} Whether the feature is enabled
 */
function isFeatureEnabled(config, feature) {
  const value = config.features?.[feature];
  if (typeof value === "boolean") return value;
  // Default to DEFAULT_FEATURES if missing
  return !!DEFAULT_FEATURES[feature];
}

module.exports = {
  getGuildConfig,
  updateGuildConfig,
  isFeatureEnabled,
  DEFAULT_FEATURES,
};
