"use strict";

/**
 * Club Analytics v2: Badge Assignment Service
 *
 * This service assigns badges to club members based on their performance
 * and activity patterns. Badges are simple rule-based identifiers.
 *
 * Available badges:
 * - top_gainer: Top 3 members by power delta (positive only)
 * - biggest_drop: Top 3 members by power delta (negative only)
 * - most_powerful: Top 3 members by total power
 * - rising_star: Gained >50% power during the week
 * - consistent: Power delta within +/- 5% of current power
 * - whale: In Tier I
 * - new_member: No previous data (appeared in current snapshot only)
 */

/**
 * Assign badges to an array of member delta data
 *
 * @param {Array<object>} deltaData - Array of member delta objects
 * @returns {Array<object>} Delta data with badges assigned
 */
function assignBadges(deltaData) {
  if (!deltaData || deltaData.length === 0) {
    return [];
  }

  // Sort by power delta (descending) for gainers
  const sortedByGain = [...deltaData]
    .filter(m => m.powerDelta > 0n)
    .sort((a, b) => {
      const diff = b.powerDelta - a.powerDelta;
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    });

  // Sort by power delta (ascending) for drops
  const sortedByDrop = [...deltaData]
    .filter(m => m.powerDelta < 0n)
    .sort((a, b) => {
      const diff = a.powerDelta - b.powerDelta;
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    });

  // Sort by total power (descending)
  const sortedByPower = [...deltaData]
    .sort((a, b) => {
      const diff = b.currentPower - a.currentPower;
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    });

  // Assign badges to each member
  const membersWithBadges = deltaData.map(member => {
    const badges = [];

    // Top gainer
    const gainRank = sortedByGain.findIndex(m => m.memberKey === member.memberKey);
    if (gainRank >= 0 && gainRank < 3) {
      badges.push("top_gainer");
    }

    // Biggest drop
    const dropRank = sortedByDrop.findIndex(m => m.memberKey === member.memberKey);
    if (dropRank >= 0 && dropRank < 3) {
      badges.push("biggest_drop");
    }

    // Most powerful
    const powerRank = sortedByPower.findIndex(m => m.memberKey === member.memberKey);
    if (powerRank >= 0 && powerRank < 3) {
      badges.push("most_powerful");
    }

    // Rising star (gained >50% power)
    if (member.powerDelta > 0n && member.currentPower > 0n) {
      const percentGain = (Number(member.powerDelta) / Number(member.currentPower)) * 100;
      if (percentGain > 50) {
        badges.push("rising_star");
      }
    }

    // Consistent (delta within +/- 5% of current power)
    if (member.currentPower > 0n) {
      const percentChange = Math.abs((Number(member.powerDelta) / Number(member.currentPower)) * 100);
      if (percentChange <= 5) {
        badges.push("consistent");
      }
    }

    // Whale (Tier I)
    if (member.tier === "I") {
      badges.push("whale");
    }

    // New member (power delta equals current power, meaning they started from 0)
    if (member.powerDelta === member.currentPower && member.powerDelta > 0n) {
      badges.push("new_member");
    }

    return {
      ...member,
      badges,
    };
  });

  return membersWithBadges;
}

/**
 * Get badge metadata (for UI display)
 *
 * @param {string} badgeId - Badge identifier
 * @returns {object} Badge metadata
 */
function getBadgeMetadata(badgeId) {
  const metadata = {
    top_gainer: {
      id: "top_gainer",
      label: "Top Gainer",
      description: "One of the top 3 members by power increase this week",
      color: "green",
      emoji: "📈",
    },
    biggest_drop: {
      id: "biggest_drop",
      label: "Biggest Drop",
      description: "One of the top 3 members by power decrease this week",
      color: "red",
      emoji: "📉",
    },
    most_powerful: {
      id: "most_powerful",
      label: "Most Powerful",
      description: "One of the top 3 most powerful members",
      color: "gold",
      emoji: "⭐",
    },
    rising_star: {
      id: "rising_star",
      label: "Rising Star",
      description: "Gained more than 50% power this week",
      color: "purple",
      emoji: "🌟",
    },
    consistent: {
      id: "consistent",
      label: "Consistent",
      description: "Power remained stable (within +/- 5%)",
      color: "blue",
      emoji: "🎯",
    },
    whale: {
      id: "whale",
      label: "Whale",
      description: "Member of the prestigious Tier I",
      color: "platinum",
      emoji: "🐋",
    },
    new_member: {
      id: "new_member",
      label: "New Member",
      description: "Just joined the club this week",
      color: "cyan",
      emoji: "🆕",
    },
  };

  return metadata[badgeId] || {
    id: badgeId,
    label: badgeId,
    description: "Unknown badge",
    color: "gray",
    emoji: "❓",
  };
}

/**
 * Get all available badge metadata
 *
 * @returns {Array<object>} Array of badge metadata objects
 */
function getAllBadgeMetadata() {
  return [
    "top_gainer",
    "biggest_drop",
    "most_powerful",
    "rising_star",
    "consistent",
    "whale",
    "new_member",
  ].map(getBadgeMetadata);
}

module.exports = {
  assignBadges,
  getBadgeMetadata,
  getAllBadgeMetadata,
};
