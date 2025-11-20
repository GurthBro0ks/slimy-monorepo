"use strict";

const database = require("../../lib/database");

class SeasonAggregationService {
  /**
   * Recalculate season stats by aggregating data from snapshots/analyses
   * This is idempotent and can be re-run multiple times
   * @param {number} seasonId - The season ID to recalculate stats for
   * @returns {Promise<void>}
   */
  async recalculateSeasonStats(seasonId) {
    const prisma = database.getClient();

    // Get the season details
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
    });

    if (!season) {
      throw new Error("Season not found");
    }

    const { guildId, startDate, endDate } = season;

    // Fetch all club analyses within the season date range for this guild
    const analyses = await prisma.clubAnalysis.findMany({
      where: {
        guildId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        metrics: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (analyses.length === 0) {
      console.log(`[seasons] No analyses found for season ${seasonId}`);
      return;
    }

    // Aggregate member stats from analyses
    const memberStatsMap = new Map();

    for (const analysis of analyses) {
      // Extract member data from metrics
      for (const metric of analysis.metrics) {
        // Look for member-specific metrics
        // Adjust this logic based on your actual metric structure
        if (metric.category === 'member' || metric.name.includes('member')) {
          const memberData = this.extractMemberDataFromMetric(metric);

          if (memberData && memberData.memberKey) {
            const key = memberData.memberKey;

            if (!memberStatsMap.has(key)) {
              memberStatsMap.set(key, {
                memberKey: key,
                totalPowerGain: 0,
                bestTier: null,
                participationCount: 0,
                firstPower: null,
                lastPower: null,
              });
            }

            const stats = memberStatsMap.get(key);
            stats.participationCount++;

            // Track power progression
            if (memberData.power !== undefined) {
              if (stats.firstPower === null) {
                stats.firstPower = memberData.power;
              }
              stats.lastPower = memberData.power;
            }

            // Track best tier
            if (memberData.tier && this.isBetterTier(memberData.tier, stats.bestTier)) {
              stats.bestTier = memberData.tier;
            }
          }
        }
      }
    }

    // Calculate final power gains
    for (const stats of memberStatsMap.values()) {
      if (stats.firstPower !== null && stats.lastPower !== null) {
        stats.totalPowerGain = stats.lastPower - stats.firstPower;
      }
    }

    // Delete existing stats for this season and insert new ones (idempotent)
    await prisma.seasonMemberStats.deleteMany({
      where: { seasonId },
    });

    // Insert aggregated stats
    const statsToInsert = Array.from(memberStatsMap.values()).map(stats => ({
      seasonId,
      memberKey: stats.memberKey,
      totalPowerGain: BigInt(Math.max(0, stats.totalPowerGain || 0)),
      bestTier: stats.bestTier,
      participationCount: stats.participationCount,
    }));

    if (statsToInsert.length > 0) {
      await prisma.seasonMemberStats.createMany({
        data: statsToInsert,
      });

      console.log(`[seasons] Recalculated stats for ${statsToInsert.length} members in season ${seasonId}`);
    }
  }

  /**
   * Extract member data from a metric
   * This is a helper method that should be customized based on your metric structure
   * @param {Object} metric - The metric object
   * @returns {Object|null} Extracted member data
   */
  extractMemberDataFromMetric(metric) {
    try {
      // Parse the metric value if it's JSON
      const value = typeof metric.value === 'string' ? JSON.parse(metric.value) : metric.value;

      // Example structure - adjust based on your actual data
      if (value && typeof value === 'object') {
        return {
          memberKey: value.memberKey || value.memberId || value.id,
          power: value.power || value.totalPower || value.powerLevel,
          tier: value.tier || value.rank || value.level,
        };
      }

      return null;
    } catch (error) {
      console.warn(`[seasons] Failed to parse metric: ${error.message}`);
      return null;
    }
  }

  /**
   * Compare two tiers to determine which is better
   * Customize this based on your tier system
   * @param {string} tier1 - First tier
   * @param {string|null} tier2 - Second tier
   * @returns {boolean} True if tier1 is better than tier2
   */
  isBetterTier(tier1, tier2) {
    if (!tier2) return true;
    if (!tier1) return false;

    // Example tier hierarchy (customize based on your system)
    const tierRanking = {
      'platinum': 5,
      'gold': 4,
      'silver': 3,
      'bronze': 2,
      'unranked': 1,
    };

    const tier1Lower = tier1.toLowerCase();
    const tier2Lower = tier2.toLowerCase();

    const rank1 = tierRanking[tier1Lower] || 0;
    const rank2 = tierRanking[tier2Lower] || 0;

    return rank1 > rank2;
  }

  /**
   * Get aggregated stats for a season
   * @param {number} seasonId - The season ID
   * @returns {Promise<Array>} List of member stats
   */
  async getSeasonStats(seasonId) {
    const stats = await database.getClient().seasonMemberStats.findMany({
      where: { seasonId },
      orderBy: {
        totalPowerGain: 'desc',
      },
    });

    return stats;
  }

  /**
   * Get top performers for a season
   * @param {number} seasonId - The season ID
   * @param {number} limit - Number of top performers to return
   * @returns {Promise<Array>} Top performers
   */
  async getTopPerformers(seasonId, limit = 10) {
    const stats = await database.getClient().seasonMemberStats.findMany({
      where: { seasonId },
      orderBy: {
        totalPowerGain: 'desc',
      },
      take: limit,
    });

    return stats;
  }
}

module.exports = new SeasonAggregationService();
