"use strict";

const slimyCore = require("@slimy/core");

const usageLib = slimyCore.usage;

async function getUsage(guildId, { window = "7d", startDate = null, endDate = null } = {}) {
  if (!usageLib) {
    throw new Error("Usage module not available");
  }

  const { startDate: start, endDate: end } = usageLib.parseWindow(
    window,
    startDate,
    endDate,
  );

  const [apiData, localImageStats] = await Promise.all([
    usageLib.fetchOpenAIUsage(start, end),
    usageLib.fetchLocalImageStats(guildId, start, end),
  ]);

  const aggregated = usageLib.aggregateUsage(apiData, localImageStats);

  return {
    window,
    startDate: start,
    endDate: end,
    apiRaw: apiData,
    localImageStats,
    aggregated,
  };
}

/**
 * Get global usage summary for the entire platform
 * Returns aggregated metrics suitable for the /usage dashboard
 *
 * TODO: Future enhancement - aggregate across all guilds instead of using a single primary guild
 * TODO: Consider caching this data as it may be expensive to compute frequently
 *
 * @param {Object} options - Query options
 * @param {string} options.window - Time window (default: "7d")
 * @param {string} options.startDate - Optional start date
 * @param {string} options.endDate - Optional end date
 * @returns {Promise<Object>} Usage summary with totalTokens, totalCostUsd, totalImages, totalRequests
 */
async function getGlobalUsageSummary({ window = "7d", startDate = null, endDate = null } = {}) {
  if (!usageLib) {
    throw new Error("Usage module not available");
  }

  // TODO: For now, we use a primary guild ID from environment or a default.
  // In the future, this should aggregate across all guilds in the system.
  const primaryGuildId = process.env.PRIMARY_GUILD_ID || process.env.DEFAULT_GUILD_ID;

  if (!primaryGuildId) {
    // If no guild is configured, return zero values rather than failing
    // This allows the endpoint to work even without full configuration
    return {
      totalTokens: 0,
      totalCostUsd: 0,
      totalImages: 0,
      totalRequests: 0,
    };
  }

  try {
    // Fetch usage data for the primary guild
    const usageData = await getUsage(primaryGuildId, { window, startDate, endDate });

    // Transform the aggregated data into the UsageSummary format
    const summary = transformToUsageSummary(usageData.aggregated);

    return summary;
  } catch (error) {
    // Log the error but return zero values to prevent breaking the frontend
    console.error('[usage-service] Error fetching global usage summary:', error);
    return {
      totalTokens: 0,
      totalCostUsd: 0,
      totalImages: 0,
      totalRequests: 0,
    };
  }
}

/**
 * Transform aggregated usage data into UsageSummary format
 *
 * @param {Object} aggregated - Aggregated usage data from usageLib
 * @returns {Object} Summary with totalTokens, totalCostUsd, totalImages, totalRequests
 */
function transformToUsageSummary(aggregated) {
  if (!aggregated || !Array.isArray(aggregated.byModel)) {
    return {
      totalTokens: 0,
      totalCostUsd: 0,
      totalImages: 0,
      totalRequests: 0,
    };
  }

  // Sum up metrics across all models
  const summary = aggregated.byModel.reduce(
    (acc, entry) => {
      acc.totalTokens += (entry.inputTokens || 0) + (entry.outputTokens || 0);
      acc.totalCostUsd += Number(entry.cost || 0);
      acc.totalImages += entry.images || 0;
      acc.totalRequests += entry.requests || 0;
      return acc;
    },
    {
      totalTokens: 0,
      totalCostUsd: 0,
      totalImages: 0,
      totalRequests: 0,
    }
  );

  return summary;
}

module.exports = {
  getUsage,
  getGlobalUsageSummary,
};
