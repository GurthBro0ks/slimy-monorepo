import { NextRequest, NextResponse } from 'next/server';

/**
 * MOCK API ENDPOINT FOR DEVELOPMENT
 *
 * This is a temporary mock implementation of the opps-api radar endpoint.
 * In production, this should proxy to the actual opps-api service.
 *
 * TODO: Replace with actual opps-api integration
 */

const MOCK_OPPORTUNITIES = {
  stocks: [
    {
      id: 'stock-1',
      title: 'Tech Stock Dip Opportunity',
      shortSummary: 'Major tech stocks showing oversold conditions with strong fundamentals.',
      domain: 'stocks' as const,
      riskLevel: 'medium' as const,
      estimatedReward: '$500-2000',
      estimatedTime: '2-4 weeks',
      confidence: 0.72,
      source: 'Market Analysis AI',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'stock-2',
      title: 'Dividend Aristocrat Alert',
      shortSummary: 'High-yield dividend stock at 52-week low with consistent payout history.',
      domain: 'stocks' as const,
      riskLevel: 'low' as const,
      estimatedReward: '$200-500/year',
      estimatedTime: 'Long-term',
      confidence: 0.85,
      source: 'Dividend Tracker',
    },
  ],
  crypto: [
    {
      id: 'crypto-1',
      title: 'Layer 2 Scaling Solution',
      shortSummary: 'New L2 network launching with early adopter incentives and airdrops.',
      domain: 'crypto' as const,
      riskLevel: 'high' as const,
      estimatedReward: '$100-1000',
      estimatedTime: '1-3 months',
      confidence: 0.55,
      source: 'Crypto Scanner',
    },
    {
      id: 'crypto-2',
      title: 'Staking Yield Opportunity',
      shortSummary: 'Established protocol offering 12% APY with strong security record.',
      domain: 'crypto' as const,
      riskLevel: 'medium' as const,
      estimatedReward: '12% APY',
      estimatedTime: 'Ongoing',
      confidence: 0.78,
      source: 'DeFi Monitor',
    },
  ],
  video: [
    {
      id: 'video-1',
      title: 'Viral Content Format Trend',
      shortSummary: 'New short-form video style gaining 300% engagement, low competition.',
      domain: 'video' as const,
      riskLevel: 'medium' as const,
      estimatedReward: '50k-500k views',
      estimatedTime: '1-2 weeks',
      confidence: 0.68,
      source: 'Trend Analyzer',
    },
  ],
  search: [
    {
      id: 'search-1',
      title: 'Emerging Search Query Spike',
      shortSummary: 'Low-competition keyword showing 500% search volume increase this week.',
      domain: 'search' as const,
      riskLevel: 'low' as const,
      estimatedReward: '10k-50k impressions',
      estimatedTime: '3-7 days',
      confidence: 0.82,
      source: 'SEO Tracker',
    },
  ],
  legal: [
    {
      id: 'legal-1',
      title: 'Data Privacy Settlement',
      shortSummary: 'Class action settlement for users affected by 2019-2023 data breach.',
      domain: 'legal' as const,
      riskLevel: 'low' as const,
      estimatedReward: '$50-200',
      estimatedTime: '5 min to file',
      confidence: 0.95,
      source: 'Class Action Monitor',
    },
    {
      id: 'legal-2',
      title: 'Consumer Protection Claim',
      shortSummary: 'Settlement for overcharged subscription fees, no proof of purchase needed.',
      domain: 'legal' as const,
      riskLevel: 'low' as const,
      estimatedReward: '$25-75',
      estimatedTime: '10 min',
      confidence: 0.88,
      source: 'Settlement Tracker',
    },
  ],
  promo: [
    {
      id: 'promo-1',
      title: 'Free Premium Software Trial',
      shortSummary: 'Extended 90-day trial of $299/year productivity suite, no credit card.',
      domain: 'promo' as const,
      riskLevel: 'low' as const,
      estimatedReward: '$299 value',
      estimatedTime: '2 min signup',
      confidence: 0.92,
      source: 'Promo Hunter',
    },
    {
      id: 'promo-2',
      title: 'Cashback Sign-up Bonus',
      shortSummary: 'New cashback app offering $50 bonus for first purchase (min $10).',
      domain: 'promo' as const,
      riskLevel: 'low' as const,
      estimatedReward: '$50',
      estimatedTime: '15 min',
      confidence: 0.90,
      source: 'Deal Aggregator',
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'quick';
    const maxPerDomain = parseInt(searchParams.get('maxPerDomain') || '5', 10);

    // Validate parameters
    if (!['quick', 'daily'].includes(mode)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid mode. Must be "quick" or "daily".',
        },
        { status: 400 }
      );
    }

    // Simulate mode difference (daily returns more opportunities)
    const limitPerDomain = mode === 'quick' ? Math.min(maxPerDomain, 3) : maxPerDomain;

    // Build response
    const topByCategory: Record<string, any[]> = {};
    let totalCount = 0;

    Object.entries(MOCK_OPPORTUNITIES).forEach(([domain, opportunities]) => {
      const limited = opportunities.slice(0, limitPerDomain);
      if (limited.length > 0) {
        topByCategory[domain] = limited;
        totalCount += limited.length;
      }
    });

    const response = {
      ok: true,
      timestamp: new Date().toISOString(),
      mode,
      totalCount,
      topByCategory,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in radar API:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
