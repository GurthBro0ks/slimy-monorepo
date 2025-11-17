"use strict";

/**
 * Club Analytics v2: Delta Calculation Service
 *
 * This service computes weekly power deltas and assigns tiers for club members
 * based on snapshots taken over time.
 *
 * Tier thresholds are hard-coded here but can be moved to a config file later:
 * - Tier I: >= 10,000,000,000 (10 billion)
 * - Tier II: >= 1,000,000,000 (1 billion)
 * - Tier III: >= 100,000,000 (100 million)
 * - Tier IV: < 100,000,000
 */

const database = require("../../lib/database");
const { assignBadges } = require("./badges");

// Tier thresholds (can be moved to config later)
const TIER_THRESHOLDS = {
  I: 10_000_000_000n,    // 10 billion
  II: 1_000_000_000n,    // 1 billion
  III: 100_000_000n,     // 100 million
  IV: 0n,                // Everything else
};

/**
 * Determine tier based on total power
 * @param {BigInt} totalPower - Member's total power
 * @returns {string} Tier designation (I, II, III, or IV)
 */
function determineTier(totalPower) {
  if (!totalPower) return "IV";

  const power = BigInt(totalPower);

  if (power >= TIER_THRESHOLDS.I) return "I";
  if (power >= TIER_THRESHOLDS.II) return "II";
  if (power >= TIER_THRESHOLDS.III) return "III";
  return "IV";
}

/**
 * Get the start of the ISO week (Monday) for a given date
 * @param {Date} date - Input date
 * @returns {Date} Start of the week
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the ISO week (Sunday) for a given date
 * @param {Date} weekStart - Week start date
 * @returns {Date} End of the week
 */
function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Compute weekly deltas for all members in a guild
 *
 * @param {string} guildId - Guild ID (internal database ID)
 * @param {object} options - Options
 * @param {Date} options.weekStart - Optional: specific week start date (defaults to current week)
 * @param {boolean} options.saveToDb - Whether to save computed deltas to database (default: true)
 * @returns {Promise<Array>} Array of computed delta objects
 */
async function computeWeeklyDeltasForGuild(guildId, options = {}) {
  const { weekStart: inputWeekStart, saveToDb = true } = options;
  const prisma = database.getClient();

  // Determine the week we're analyzing
  const weekStart = inputWeekStart ? getWeekStart(new Date(inputWeekStart)) : getWeekStart(new Date());
  const weekEnd = getWeekEnd(weekStart);

  // Find the two most recent snapshots for this guild within the week range
  // We want the latest snapshot and the one before it to compute deltas
  const snapshots = await prisma.clubSnapshot.findMany({
    where: {
      guildId,
      snapshotDate: {
        lte: weekEnd,
      },
    },
    orderBy: {
      snapshotDate: 'desc',
    },
    take: 2,
    include: {
      memberSnapshots: true,
    },
  });

  if (snapshots.length === 0) {
    console.log(`[deltas] No snapshots found for guild ${guildId}`);
    return [];
  }

  // Latest snapshot is the current state
  const currentSnapshot = snapshots[0];
  const previousSnapshot = snapshots.length > 1 ? snapshots[1] : null;

  // Create maps for quick lookup
  const currentMembers = new Map();
  currentSnapshot.memberSnapshots.forEach(member => {
    currentMembers.set(member.memberKey, member);
  });

  const previousMembers = new Map();
  if (previousSnapshot) {
    previousSnapshot.memberSnapshots.forEach(member => {
      previousMembers.set(member.memberKey, member);
    });
  }

  // Compute deltas for all members in current snapshot
  const deltaData = [];
  for (const currentMember of currentSnapshot.memberSnapshots) {
    const previousMember = previousMembers.get(currentMember.memberKey);

    const currentPower = BigInt(currentMember.totalPower);
    const previousPower = previousMember ? BigInt(previousMember.totalPower) : 0n;
    const powerDelta = currentPower - previousPower;

    const currentSim = currentMember.simBalance ? BigInt(currentMember.simBalance) : null;
    const previousSim = previousMember?.simBalance ? BigInt(previousMember.simBalance) : null;
    const simDelta = (currentSim !== null && previousSim !== null) ? currentSim - previousSim : null;

    const tier = determineTier(currentPower);

    deltaData.push({
      guildId,
      memberKey: currentMember.memberKey,
      displayName: currentMember.displayName,
      rank: currentMember.rank,
      currentPower,
      currentSimBalance: currentSim,
      powerDelta,
      simDelta,
      tier,
    });
  }

  // Assign badges based on rankings
  const deltasWithBadges = assignBadges(deltaData);

  // Save to database if requested
  if (saveToDb) {
    const results = [];
    for (const delta of deltasWithBadges) {
      try {
        const saved = await prisma.clubWeeklyDelta.upsert({
          where: {
            guildId_memberKey_weekStart: {
              guildId: delta.guildId,
              memberKey: delta.memberKey,
              weekStart,
            },
          },
          update: {
            weekEnd,
            currentPower: delta.currentPower,
            currentSimBalance: delta.currentSimBalance,
            powerDelta: delta.powerDelta,
            simDelta: delta.simDelta,
            tier: delta.tier,
            badges: delta.badges || [],
            displayName: delta.displayName,
            rank: delta.rank,
            updatedAt: new Date(),
          },
          create: {
            guildId: delta.guildId,
            memberKey: delta.memberKey,
            weekStart,
            weekEnd,
            currentPower: delta.currentPower,
            currentSimBalance: delta.currentSimBalance,
            powerDelta: delta.powerDelta,
            simDelta: delta.simDelta,
            tier: delta.tier,
            badges: delta.badges || [],
            displayName: delta.displayName,
            rank: delta.rank,
          },
        });
        results.push(saved);
      } catch (error) {
        console.error(`[deltas] Error saving delta for member ${delta.memberKey}:`, error.message);
      }
    }
    return results;
  }

  return deltasWithBadges;
}

/**
 * Get stored weekly deltas for a guild
 *
 * @param {string} guildId - Guild ID
 * @param {object} options - Options
 * @param {Date} options.weekStart - Optional: specific week to query
 * @returns {Promise<Array>} Array of weekly delta records
 */
async function getWeeklyDeltasForGuild(guildId, options = {}) {
  const { weekStart: inputWeekStart } = options;
  const prisma = database.getClient();

  const where = { guildId };

  if (inputWeekStart) {
    const weekStart = getWeekStart(new Date(inputWeekStart));
    where.weekStart = weekStart;
  } else {
    // Get the most recent week
    const latestDelta = await prisma.clubWeeklyDelta.findFirst({
      where: { guildId },
      orderBy: { weekStart: 'desc' },
      select: { weekStart: true },
    });

    if (latestDelta) {
      where.weekStart = latestDelta.weekStart;
    }
  }

  const deltas = await prisma.clubWeeklyDelta.findMany({
    where,
    orderBy: [
      { powerDelta: 'desc' },
      { currentPower: 'desc' },
    ],
  });

  // Convert BigInt to strings for JSON serialization
  return deltas.map(delta => ({
    ...delta,
    currentPower: delta.currentPower.toString(),
    currentSimBalance: delta.currentSimBalance?.toString() || null,
    powerDelta: delta.powerDelta.toString(),
    simDelta: delta.simDelta?.toString() || null,
  }));
}

module.exports = {
  computeWeeklyDeltasForGuild,
  getWeeklyDeltasForGuild,
  determineTier,
  getWeekStart,
  getWeekEnd,
  TIER_THRESHOLDS,
};
