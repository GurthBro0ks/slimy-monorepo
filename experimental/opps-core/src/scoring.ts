import { Opportunity, ScoredOpportunity, UserProfile } from "./types";

/**
 * Score a single opportunity based on user profile
 * Higher scores are better opportunities for the user
 */
export function scoreOpportunity(
  opp: Opportunity,
  profile?: UserProfile
): ScoredOpportunity {
  // Base score starts at 50
  let baseScore = 50;

  // Reward factor: higher rewards increase score
  const rewardFactor = Math.min(opp.expectedRewardEstimate / 100, 30);

  // Time factor: lower time costs increase score (inverse relationship)
  const timeFactor = Math.max(0, 20 - opp.timeCostMinutesEstimate / 30);

  // Risk factor: penalize higher risk
  const riskPenalty = {
    low: 0,
    medium: -5,
    high: -15,
  }[opp.riskLevel];
  const riskFactor = riskPenalty;

  // Metadata bonus: check for special flags
  let metadataBonus = 0;
  if (opp.metadata) {
    // Bonus for reusable micro-services
    if (opp.metadata.reusable === true) {
      metadataBonus += 10;
    }
    // Bonus for easy difficulty
    if (opp.metadata.difficulty === "easy") {
      metadataBonus += 5;
    }
    // Small penalty for hard difficulty
    if (opp.metadata.difficulty === "hard") {
      metadataBonus -= 5;
    }
  }

  // Profile-based adjustments
  if (profile) {
    // Check if user has required skills
    if (profile.skills && opp.metadata?.skillTags) {
      const matchingSkills = opp.metadata.skillTags.filter((skill: string) =>
        profile.skills!.some((userSkill) =>
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      metadataBonus += matchingSkills.length * 3;
    }

    // Check risk tolerance
    if (profile.maxRiskLevel) {
      const riskLevels = ["low", "medium", "high"];
      const oppRiskIndex = riskLevels.indexOf(opp.riskLevel);
      const maxRiskIndex = riskLevels.indexOf(profile.maxRiskLevel);
      if (oppRiskIndex > maxRiskIndex) {
        // Opportunity exceeds user's risk tolerance
        baseScore -= 20;
      }
    }

    // Check reward threshold
    if (
      profile.minReward &&
      opp.expectedRewardEstimate < profile.minReward
    ) {
      baseScore -= 15;
    }

    // Check time constraints
    if (
      profile.maxTimeMinutes &&
      opp.timeCostMinutesEstimate > profile.maxTimeMinutes
    ) {
      baseScore -= 15;
    }
  }

  const totalScore = Math.max(
    0,
    baseScore + rewardFactor + timeFactor + riskFactor + metadataBonus
  );

  return {
    ...opp,
    score: Math.round(totalScore * 10) / 10, // Round to 1 decimal
    scoreBreakdown: {
      baseScore,
      rewardFactor: Math.round(rewardFactor * 10) / 10,
      timeFactor: Math.round(timeFactor * 10) / 10,
      riskFactor,
      metadataBonus,
    },
  };
}

/**
 * Score and rank a list of opportunities
 */
export function scoreOpportunities(
  opportunities: Opportunity[],
  profile?: UserProfile
): ScoredOpportunity[] {
  return opportunities
    .map((opp) => scoreOpportunity(opp, profile))
    .sort((a, b) => b.score - a.score); // Sort by score descending
}

/**
 * Get top N opportunities by score
 */
export function getTopOpportunities(
  opportunities: Opportunity[],
  n: number,
  profile?: UserProfile
): ScoredOpportunity[] {
  const scored = scoreOpportunities(opportunities, profile);
  return scored.slice(0, n);
}
