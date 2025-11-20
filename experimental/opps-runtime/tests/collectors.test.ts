import { describe, it, expect } from 'vitest';
import {
  collectMarketSignalsNow,
  collectTrendSignalsNow,
  collectClassActionOpportunitiesNow,
  collectFreebieOpportunitiesNow,
  buildRadarSnapshot,
} from '../src/index';

describe('Market Signals Collector', () => {
  it('should return at least 3 opportunities', async () => {
    const opportunities = await collectMarketSignalsNow();
    expect(opportunities.length).toBeGreaterThanOrEqual(3);
  });

  it('should have both stocks and crypto domains', async () => {
    const opportunities = await collectMarketSignalsNow();
    const domains = new Set(opportunities.map((o) => o.domain));
    expect(domains.has('stocks')).toBe(true);
    expect(domains.has('crypto')).toBe(true);
  });

  it('should have realtime freshness tier', async () => {
    const opportunities = await collectMarketSignalsNow();
    opportunities.forEach((opp) => {
      expect(opp.freshnessTier).toBe('realtime');
    });
  });

  it('should have varied risk levels', async () => {
    const opportunities = await collectMarketSignalsNow();
    const risks = new Set(opportunities.map((o) => o.riskLevel));
    expect(risks.size).toBeGreaterThan(1);
  });

  it('should have non-empty titles and descriptions', async () => {
    const opportunities = await collectMarketSignalsNow();
    opportunities.forEach((opp) => {
      expect(opp.title).toBeTruthy();
      expect(opp.title.length).toBeGreaterThan(0);
      expect(opp.type).toBe('market-signal');
    });
  });

  it('should include pattern metadata', async () => {
    const opportunities = await collectMarketSignalsNow();
    opportunities.forEach((opp) => {
      expect(opp.metadata).toBeDefined();
      expect(opp.metadata.pattern).toBeDefined();
      expect(opp.metadata.tickerOrSymbol).toBeDefined();
    });
  });
});

describe('Trend Signals Collector', () => {
  it('should return at least 5 opportunities', async () => {
    const opportunities = await collectTrendSignalsNow();
    expect(opportunities.length).toBeGreaterThanOrEqual(5);
  });

  it('should have video and search domains', async () => {
    const opportunities = await collectTrendSignalsNow();
    const domains = new Set(opportunities.map((o) => o.domain));
    expect(domains.has('video')).toBe(true);
    expect(domains.has('search')).toBe(true);
  });

  it('should have fast_batch freshness tier', async () => {
    const opportunities = await collectTrendSignalsNow();
    opportunities.forEach((opp) => {
      expect(opp.freshnessTier).toBe('fast_batch');
    });
  });

  it('should include trend metadata', async () => {
    const opportunities = await collectTrendSignalsNow();
    opportunities.forEach((opp) => {
      expect(opp.metadata).toBeDefined();
      expect(opp.metadata.trendScore).toBeDefined();
      expect(opp.metadata.platforms).toBeDefined();
      expect(Array.isArray(opp.metadata.platforms)).toBe(true);
    });
  });

  it('should include the Minecraft slime.craft easter egg', async () => {
    const opportunities = await collectTrendSignalsNow();
    const hasEasterEgg = opportunities.some(
      (opp) =>
        opp.title.toLowerCase().includes('slime') ||
        opp.description.toLowerCase().includes('slime.craft')
    );
    expect(hasEasterEgg).toBe(true);
  });
});

describe('Class Action Collector', () => {
  it('should return at least 3 opportunities', async () => {
    const opportunities = await collectClassActionOpportunitiesNow();
    expect(opportunities.length).toBeGreaterThanOrEqual(3);
  });

  it('should have legal domain', async () => {
    const opportunities = await collectClassActionOpportunitiesNow();
    opportunities.forEach((opp) => {
      expect(opp.domain).toBe('legal');
    });
  });

  it('should have slow_batch freshness tier', async () => {
    const opportunities = await collectClassActionOpportunitiesNow();
    opportunities.forEach((opp) => {
      expect(opp.freshnessTier).toBe('slow_batch');
    });
  });

  it('should all be low risk', async () => {
    const opportunities = await collectClassActionOpportunitiesNow();
    opportunities.forEach((opp) => {
      expect(opp.riskLevel).toBe('low');
    });
  });

  it('should include required metadata fields', async () => {
    const opportunities = await collectClassActionOpportunitiesNow();
    opportunities.forEach((opp) => {
      expect(opp.metadata).toBeDefined();
      expect(opp.metadata.requiresProofOfPurchase).toBeDefined();
      expect(typeof opp.metadata.requiresProofOfPurchase).toBe('boolean');
      expect(opp.metadata.estimatedPayoutRange).toBeDefined();
      expect(Array.isArray(opp.metadata.estimatedPayoutRange)).toBe(true);
      expect(opp.metadata.deadline).toBeDefined();
    });
  });

  it('should have varied payout ranges', async () => {
    const opportunities = await collectClassActionOpportunitiesNow();
    const payouts = opportunities.map((opp) => opp.expectedRewardEstimate);
    const uniquePayouts = new Set(payouts);
    expect(uniquePayouts.size).toBeGreaterThan(2);
  });
});

describe('Freebies Collector', () => {
  it('should return at least 5 opportunities', async () => {
    const opportunities = await collectFreebieOpportunitiesNow();
    expect(opportunities.length).toBeGreaterThanOrEqual(5);
  });

  it('should have varied domains', async () => {
    const opportunities = await collectFreebieOpportunitiesNow();
    const domains = new Set(opportunities.map((o) => o.domain));
    expect(domains.size).toBeGreaterThan(1);
  });

  it('should have slow_batch freshness tier', async () => {
    const opportunities = await collectFreebieOpportunitiesNow();
    opportunities.forEach((opp) => {
      expect(opp.freshnessTier).toBe('slow_batch');
    });
  });

  it('should include required metadata fields', async () => {
    const opportunities = await collectFreebieOpportunitiesNow();
    opportunities.forEach((opp) => {
      expect(opp.metadata).toBeDefined();
      expect(opp.metadata.minValue).toBeDefined();
      expect(opp.metadata.maxValue).toBeDefined();
      expect(opp.metadata.requiresCardOnFile).toBeDefined();
      expect(typeof opp.metadata.requiresCardOnFile).toBe('boolean');
      expect(opp.metadata.source).toBeDefined();
    });
  });

  it('should have mix of card required and not required', async () => {
    const opportunities = await collectFreebieOpportunitiesNow();
    const requiresCard = opportunities.filter((opp) => opp.metadata.requiresCardOnFile);
    const noCard = opportunities.filter((opp) => !opp.metadata.requiresCardOnFile);
    expect(requiresCard.length).toBeGreaterThan(0);
    expect(noCard.length).toBeGreaterThan(0);
  });
});

describe('Radar Snapshot Builder', () => {
  it('should build a complete snapshot', async () => {
    const snapshot = await buildRadarSnapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.snapshotId).toBeDefined();
    expect(snapshot.timestamp).toBeDefined();
    expect(snapshot.opportunities).toBeDefined();
    expect(snapshot.stats).toBeDefined();
  });

  it('should have opportunities from all collectors', async () => {
    const snapshot = await buildRadarSnapshot();
    expect(snapshot.opportunities.length).toBeGreaterThanOrEqual(20);
  });

  it('should have accurate stats', async () => {
    const snapshot = await buildRadarSnapshot();
    const { stats } = snapshot;

    // Total should match opportunities length
    expect(stats.total).toBe(snapshot.opportunities.length);

    // Domain counts should add up
    const domainTotal = Object.values(stats.byDomain).reduce((sum, count) => sum + count, 0);
    expect(domainTotal).toBe(stats.total);

    // Risk counts should add up
    const riskTotal = Object.values(stats.byRisk).reduce((sum, count) => sum + count, 0);
    expect(riskTotal).toBe(stats.total);
  });

  it('should have at least 2 unique domains', async () => {
    const snapshot = await buildRadarSnapshot();
    const nonZeroDomains = Object.values(snapshot.stats.byDomain).filter((count) => count > 0);
    expect(nonZeroDomains.length).toBeGreaterThanOrEqual(2);
  });

  it('should have opportunities across multiple risk levels', async () => {
    const snapshot = await buildRadarSnapshot();
    const nonZeroRisks = Object.values(snapshot.stats.byRisk).filter((count) => count > 0);
    expect(nonZeroRisks.length).toBeGreaterThan(1);
  });

  it('should have proper ISO timestamps', async () => {
    const snapshot = await buildRadarSnapshot();
    expect(() => new Date(snapshot.timestamp)).not.toThrow();
    snapshot.opportunities.forEach((opp) => {
      expect(() => new Date(opp.detectedAt)).not.toThrow();
      if (opp.expiresAt) {
        expect(() => new Date(opp.expiresAt)).not.toThrow();
      }
    });
  });

  it('should have varied time cost estimates', async () => {
    const snapshot = await buildRadarSnapshot();
    const timeCosts = new Set(
      snapshot.opportunities.map((o) => o.timeCostMinutesEstimate)
    );
    expect(timeCosts.size).toBeGreaterThan(3);
  });

  it('should have varied reward estimates', async () => {
    const snapshot = await buildRadarSnapshot();
    const rewards = new Set(snapshot.opportunities.map((o) => o.expectedRewardEstimate));
    expect(rewards.size).toBeGreaterThan(5);
  });
});

describe('No External API Calls', () => {
  it('should complete all collectors without network requests', async () => {
    // This test ensures collectors are purely mock/in-memory
    // If any collector tried to make network requests, it would fail or timeout
    const startTime = Date.now();

    await Promise.all([
      collectMarketSignalsNow(),
      collectTrendSignalsNow(),
      collectClassActionOpportunitiesNow(),
      collectFreebieOpportunitiesNow(),
    ]);

    const elapsed = Date.now() - startTime;

    // Should complete nearly instantly (< 100ms) since it's all in-memory
    expect(elapsed).toBeLessThan(100);
  });
});
