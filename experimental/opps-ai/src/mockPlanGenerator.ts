import {
  RadarSnapshot,
  UserProfile,
  WeeklyPlanDraft,
  PlanGenerator,
  ScoredOpportunity,
  PlanBucket,
  Opportunity,
} from './types';

/**
 * Mock implementation of PlanGenerator that creates weekly plans
 * without calling any external AI APIs.
 *
 * Uses deterministic rules to categorize opportunities:
 * - Quick Wins: Low risk, low time cost, slow_batch freshness (class actions, freebies)
 * - Medium-term: Trending or market-moving opportunities with medium risk
 * - Exploratory: High risk or novel domain opportunities
 */
export class MockPlanGenerator implements PlanGenerator {
  async generatePlan(
    snapshot: RadarSnapshot,
    profile: UserProfile,
    options?: { horizonDays?: number }
  ): Promise<WeeklyPlanDraft> {
    const horizonDays = options?.horizonDays || 7;
    const { opportunities } = snapshot;

    // Categorize opportunities into buckets
    const quickWins: ScoredOpportunity[] = [];
    const mediumTerm: ScoredOpportunity[] = [];
    const exploratory: ScoredOpportunity[] = [];

    for (const opp of opportunities) {
      const scored = this.scoreOpportunity(opp, profile);

      // Categorization logic
      if (this.isQuickWin(opp)) {
        quickWins.push(scored);
      } else if (this.isMediumTerm(opp)) {
        mediumTerm.push(scored);
      } else {
        exploratory.push(scored);
      }
    }

    // Sort each bucket by score (descending)
    quickWins.sort((a, b) => b.score - a.score);
    mediumTerm.sort((a, b) => b.score - a.score);
    exploratory.sort((a, b) => b.score - a.score);

    // Create buckets with commentary
    const buckets: PlanBucket[] = [];

    if (quickWins.length > 0) {
      buckets.push({
        name: 'Quick Wins',
        description: 'Low-risk, low-effort opportunities for immediate action',
        opportunities: quickWins.slice(0, 5), // Top 5
        commentary: this.generateQuickWinCommentary(quickWins, profile),
      });
    }

    if (mediumTerm.length > 0) {
      buckets.push({
        name: 'Medium-term Opportunities',
        description: 'Trending and market-moving opportunities worth planning for',
        opportunities: mediumTerm.slice(0, 5), // Top 5
        commentary: this.generateMediumTermCommentary(mediumTerm, profile),
      });
    }

    if (exploratory.length > 0) {
      buckets.push({
        name: 'Exploratory',
        description: 'High-risk or novel opportunities for the adventurous',
        opportunities: exploratory.slice(0, 3), // Top 3
        commentary: this.generateExploratoryCommentary(exploratory, profile),
      });
    }

    return {
      generatedAt: new Date(),
      horizonDays,
      buckets,
      summary: this.generatePlanSummary(buckets, profile),
      metadata: {
        totalOpportunities: opportunities.length,
        categorized: quickWins.length + mediumTerm.length + exploratory.length,
      },
    };
  }

  private scoreOpportunity(
    opp: Opportunity,
    profile: UserProfile
  ): ScoredOpportunity {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Freshness scoring
    const freshnessScores: Record<string, number> = {
      breaking: 30,
      trend_narrative: 20,
      market_move: 15,
      slow_batch: 5,
    };
    score += freshnessScores[opp.freshnessTier] || 0;
    reasons.push(`Freshness: ${opp.freshnessTier}`);

    // Risk scoring (inverse - lower risk = higher score for most users)
    const riskTolerance = profile.preferences?.riskTolerance || 'medium';
    if (riskTolerance === 'low' && opp.riskLevel === 'low') {
      score += 15;
      reasons.push('Matches low-risk preference');
    } else if (riskTolerance === 'high' && opp.riskLevel === 'high') {
      score += 20;
      reasons.push('Matches high-risk preference');
    } else if (opp.riskLevel === 'medium') {
      score += 10;
      reasons.push('Moderate risk');
    }

    // Time cost scoring
    const timeAvailability = profile.preferences?.timeAvailability || 'medium';
    if (timeAvailability === 'low' && opp.timeCost === 'low') {
      score += 10;
      reasons.push('Low time investment');
    } else if (timeAvailability === 'high' && opp.timeCost === 'high') {
      score += 5;
      reasons.push('High time investment matches availability');
    }

    // Domain preference
    const favoriteDomains = profile.preferences?.favoriteDomains || [];
    const matchesFavorite = opp.domains.some(d => favoriteDomains.includes(d));
    if (matchesFavorite) {
      score += 25;
      reasons.push('Matches favorite domain');
    }

    return {
      opportunity: opp,
      score,
      reasons,
    };
  }

  private isQuickWin(opp: Opportunity): boolean {
    return (
      opp.riskLevel === 'low' &&
      (opp.timeCost === 'low' || opp.freshnessTier === 'slow_batch')
    );
  }

  private isMediumTerm(opp: Opportunity): boolean {
    return (
      (opp.freshnessTier === 'trend_narrative' ||
        opp.freshnessTier === 'market_move') &&
      opp.riskLevel !== 'high'
    );
  }

  private generateQuickWinCommentary(
    opportunities: ScoredOpportunity[],
    profile: UserProfile
  ): string {
    const count = opportunities.length;
    const lowRiskCount = opportunities.filter(
      o => o.opportunity.riskLevel === 'low'
    ).length;

    return `[Mock AI] Identified ${count} quick-win opportunities. ${lowRiskCount} are low-risk and suitable for immediate action. These require minimal time investment and offer predictable outcomes.`;
  }

  private generateMediumTermCommentary(
    opportunities: ScoredOpportunity[],
    profile: UserProfile
  ): string {
    const count = opportunities.length;
    const trendingCount = opportunities.filter(
      o => o.opportunity.freshnessTier === 'trend_narrative'
    ).length;

    return `[Mock AI] Found ${count} medium-term opportunities. ${trendingCount} are following current trends. These opportunities benefit from market momentum and require moderate planning.`;
  }

  private generateExploratoryCommentary(
    opportunities: ScoredOpportunity[],
    profile: UserProfile
  ): string {
    const count = opportunities.length;
    const highRiskCount = opportunities.filter(
      o => o.opportunity.riskLevel === 'high'
    ).length;

    return `[Mock AI] Detected ${count} exploratory opportunities. ${highRiskCount} carry higher risk but may offer unique insights or early-mover advantages. Recommended for users with time and risk tolerance.`;
  }

  private generatePlanSummary(
    buckets: PlanBucket[],
    profile: UserProfile
  ): string {
    const totalOpps = buckets.reduce(
      (sum, bucket) => sum + bucket.opportunities.length,
      0
    );
    const bucketNames = buckets.map(b => b.name).join(', ');

    return `[Mock AI] Generated weekly plan with ${totalOpps} prioritized opportunities across ${buckets.length} categories: ${bucketNames}. Plan is tailored to your preferences and current market conditions.`;
  }
}
