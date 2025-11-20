import {
  MockRadarSummarizer,
  MockPlanGenerator,
  RadarSnapshot,
  UserProfile,
  Opportunity,
} from '../src';

describe('MockRadarSummarizer', () => {
  let summarizer: MockRadarSummarizer;
  let testSnapshot: RadarSnapshot;

  beforeEach(() => {
    summarizer = new MockRadarSummarizer();
    testSnapshot = createTestSnapshot();
  });

  test('should return a non-empty summary', async () => {
    const summary = await summarizer.summarizeSnapshot(testSnapshot);
    expect(summary).toBeTruthy();
    expect(summary.length).toBeGreaterThan(0);
  });

  test('should mention domains from the snapshot', async () => {
    const summary = await summarizer.summarizeSnapshot(testSnapshot);
    // Should mention at least one domain
    const hasTechnology = summary.includes('technology');
    const hasFinance = summary.includes('finance');
    const hasRetail = summary.includes('retail');
    expect(hasTechnology || hasFinance || hasRetail).toBe(true);
  });

  test('should include Mock AI indicator', async () => {
    const summary = await summarizer.summarizeSnapshot(testSnapshot);
    expect(summary).toContain('[Mock AI');
  });

  test('should handle short style', async () => {
    const summary = await summarizer.summarizeSnapshot(testSnapshot, {
      style: 'short',
    });
    expect(summary).toBeTruthy();
    expect(summary.split('\n').length).toBeLessThan(10);
  });

  test('should handle detailed style', async () => {
    const summary = await summarizer.summarizeSnapshot(testSnapshot, {
      style: 'detailed',
    });
    expect(summary).toBeTruthy();
    expect(summary).toContain('**Overview:**');
    expect(summary).toContain('**Domain Distribution:**');
  });

  test('should handle empty snapshot', async () => {
    const emptySnapshot: RadarSnapshot = {
      timestamp: new Date(),
      opportunities: [],
      domains: [],
    };
    const summary = await summarizer.summarizeSnapshot(emptySnapshot);
    expect(summary).toContain('No opportunities');
  });
});

describe('MockPlanGenerator', () => {
  let generator: MockPlanGenerator;
  let testSnapshot: RadarSnapshot;
  let testProfile: UserProfile;

  beforeEach(() => {
    generator = new MockPlanGenerator();
    testSnapshot = createTestSnapshot();
    testProfile = createTestProfile();
  });

  test('should return a valid WeeklyPlanDraft', async () => {
    const plan = await generator.generatePlan(testSnapshot, testProfile);
    expect(plan).toBeTruthy();
    expect(plan.generatedAt).toBeInstanceOf(Date);
    expect(plan.horizonDays).toBe(7);
    expect(plan.buckets).toBeInstanceOf(Array);
  });

  test('should create at least one bucket', async () => {
    const plan = await generator.generatePlan(testSnapshot, testProfile);
    expect(plan.buckets.length).toBeGreaterThan(0);
  });

  test('should have opportunities in buckets', async () => {
    const plan = await generator.generatePlan(testSnapshot, testProfile);
    const hasOpportunities = plan.buckets.some(
      bucket => bucket.opportunities.length > 0
    );
    expect(hasOpportunities).toBe(true);
  });

  test('should include Quick Wins bucket for low-risk opportunities', async () => {
    const plan = await generator.generatePlan(testSnapshot, testProfile);
    const quickWinsBucket = plan.buckets.find(b => b.name === 'Quick Wins');
    expect(quickWinsBucket).toBeTruthy();
    expect(quickWinsBucket!.opportunities.length).toBeGreaterThan(0);
  });

  test('should score opportunities with reasons', async () => {
    const plan = await generator.generatePlan(testSnapshot, testProfile);
    const firstBucket = plan.buckets[0];
    const firstOpp = firstBucket.opportunities[0];
    expect(firstOpp.score).toBeGreaterThan(0);
    expect(firstOpp.reasons).toBeInstanceOf(Array);
    expect(firstOpp.reasons.length).toBeGreaterThan(0);
  });

  test('should respect horizonDays option', async () => {
    const plan = await generator.generatePlan(testSnapshot, testProfile, {
      horizonDays: 14,
    });
    expect(plan.horizonDays).toBe(14);
  });

  test('should include plan summary', async () => {
    const plan = await generator.generatePlan(testSnapshot, testProfile);
    expect(plan.summary).toBeTruthy();
    expect(plan.summary).toContain('[Mock AI]');
  });

  test('should include commentary in buckets', async () => {
    const plan = await generator.generatePlan(testSnapshot, testProfile);
    const hasCommentary = plan.buckets.some(bucket => bucket.commentary);
    expect(hasCommentary).toBe(true);
  });
});

// ============================================================================
// Test Helpers
// ============================================================================

function createTestSnapshot(): RadarSnapshot {
  const opportunities: Opportunity[] = [
    {
      id: 'opp-1',
      title: 'Class action settlement for tech users',
      description: 'Easy claim process, low effort required',
      domains: ['technology', 'legal'],
      freshnessTier: 'slow_batch',
      riskLevel: 'low',
      timeCost: 'low',
      tags: ['class-action', 'settlement'],
      discoveredAt: new Date('2025-11-15'),
    },
    {
      id: 'opp-2',
      title: 'Trending crypto staking opportunity',
      description: 'New staking pool with attractive APY',
      domains: ['finance', 'technology'],
      freshnessTier: 'trend_narrative',
      riskLevel: 'medium',
      timeCost: 'medium',
      tags: ['crypto', 'defi'],
      discoveredAt: new Date('2025-11-18'),
    },
    {
      id: 'opp-3',
      title: 'Breaking: Major retailer data breach compensation',
      description: 'Urgent claim deadline approaching',
      domains: ['retail', 'legal'],
      freshnessTier: 'breaking',
      riskLevel: 'low',
      timeCost: 'low',
      tags: ['data-breach', 'compensation'],
      discoveredAt: new Date('2025-11-20'),
    },
    {
      id: 'opp-4',
      title: 'High-risk arbitrage opportunity in emerging market',
      description: 'Significant potential but requires expertise',
      domains: ['finance'],
      freshnessTier: 'market_move',
      riskLevel: 'high',
      timeCost: 'high',
      tags: ['arbitrage', 'emerging-markets'],
      discoveredAt: new Date('2025-11-19'),
    },
    {
      id: 'opp-5',
      title: 'Free product sample program',
      description: 'Sign up for free samples from major brands',
      domains: ['retail', 'consumer'],
      freshnessTier: 'slow_batch',
      riskLevel: 'low',
      timeCost: 'low',
      tags: ['freebies', 'samples'],
      discoveredAt: new Date('2025-11-10'),
    },
  ];

  return {
    timestamp: new Date('2025-11-20T10:00:00Z'),
    opportunities,
    domains: ['technology', 'finance', 'retail', 'legal', 'consumer'],
    metadata: {
      sourceCount: 12,
      queryCount: 45,
    },
  };
}

function createTestProfile(): UserProfile {
  return {
    userId: 'test-user-123',
    preferences: {
      favoriteDomains: ['technology', 'finance'],
      riskTolerance: 'medium',
      timeAvailability: 'medium',
    },
    history: {
      completedOpportunities: ['opp-old-1', 'opp-old-2'],
      skippedOpportunities: ['opp-spam-1'],
    },
  };
}
