import { RadarSnapshot, RadarSummarizer } from './types';

/**
 * Mock implementation of RadarSummarizer that generates deterministic summaries
 * without calling any external AI APIs.
 *
 * This implementation creates summaries by analyzing the snapshot data:
 * - Counts opportunities by domain
 * - Highlights freshness distribution
 * - Mentions example opportunities
 */
export class MockRadarSummarizer implements RadarSummarizer {
  async summarizeSnapshot(
    snapshot: RadarSnapshot,
    options?: { style?: 'short' | 'detailed' }
  ): Promise<string> {
    const style = options?.style || 'short';
    const { opportunities, domains } = snapshot;

    if (opportunities.length === 0) {
      return '[Mock AI Summary] No opportunities detected in this radar snapshot.';
    }

    // Count opportunities by domain
    const domainCounts = new Map<string, number>();
    for (const opp of opportunities) {
      for (const domain of opp.domains) {
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      }
    }

    // Sort domains by count
    const sortedDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 domains

    // Count by freshness tier
    const freshnessCounts = new Map<string, number>();
    for (const opp of opportunities) {
      freshnessCounts.set(
        opp.freshnessTier,
        (freshnessCounts.get(opp.freshnessTier) || 0) + 1
      );
    }

    if (style === 'short') {
      return this.generateShortSummary(
        opportunities.length,
        sortedDomains,
        freshnessCounts
      );
    } else {
      return this.generateDetailedSummary(
        snapshot,
        sortedDomains,
        freshnessCounts,
        opportunities
      );
    }
  }

  private generateShortSummary(
    totalCount: number,
    sortedDomains: [string, number][],
    freshnessCounts: Map<string, number>
  ): string {
    const lines: string[] = [
      '[Mock AI Summary]',
      `Found ${totalCount} opportunities across ${sortedDomains.length} active domains.`,
    ];

    if (sortedDomains.length > 0) {
      const topDomains = sortedDomains
        .slice(0, 3)
        .map(([domain, count]) => `${domain} (${count})`)
        .join(', ');
      lines.push(`Top domains: ${topDomains}.`);
    }

    const breaking = freshnessCounts.get('breaking') || 0;
    const trending = freshnessCounts.get('trend_narrative') || 0;
    if (breaking > 0) {
      lines.push(`${breaking} breaking opportunities require immediate attention.`);
    } else if (trending > 0) {
      lines.push(`${trending} trending opportunities are gaining momentum.`);
    }

    return lines.join(' ');
  }

  private generateDetailedSummary(
    snapshot: RadarSnapshot,
    sortedDomains: [string, number][],
    freshnessCounts: Map<string, number>,
    opportunities: any[]
  ): string {
    const lines: string[] = [
      '[Mock AI Summary - Detailed]',
      '',
      `**Overview:** Analyzed ${opportunities.length} opportunities from radar snapshot at ${snapshot.timestamp.toISOString()}.`,
      '',
    ];

    // Domain breakdown
    lines.push('**Domain Distribution:**');
    for (const [domain, count] of sortedDomains) {
      const percentage = Math.round((count / opportunities.length) * 100);
      lines.push(`- ${domain}: ${count} opportunities (${percentage}%)`);

      // Find an example from this domain
      const example = opportunities.find(opp => opp.domains.includes(domain));
      if (example) {
        lines.push(`  Example: "${example.title}"`);
      }
    }
    lines.push('');

    // Freshness breakdown
    lines.push('**Freshness Distribution:**');
    const freshnessOrder = ['breaking', 'trend_narrative', 'market_move', 'slow_batch'];
    for (const tier of freshnessOrder) {
      const count = freshnessCounts.get(tier) || 0;
      if (count > 0) {
        lines.push(`- ${tier}: ${count} opportunities`);
      }
    }
    lines.push('');

    // Risk analysis
    const riskCounts = new Map<string, number>();
    for (const opp of opportunities) {
      riskCounts.set(opp.riskLevel, (riskCounts.get(opp.riskLevel) || 0) + 1);
    }
    const lowRisk = riskCounts.get('low') || 0;
    const mediumRisk = riskCounts.get('medium') || 0;
    const highRisk = riskCounts.get('high') || 0;
    lines.push('**Risk Profile:**');
    lines.push(`Low risk: ${lowRisk}, Medium risk: ${mediumRisk}, High risk: ${highRisk}`);

    return lines.join('\n');
  }
}
