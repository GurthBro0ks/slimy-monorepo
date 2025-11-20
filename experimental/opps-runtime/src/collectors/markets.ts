import type { Opportunity } from '@slimy/opps-core';
import { createOpportunity, getExpirationDate, getRelativeDate } from './utils';

/**
 * Collects market signal opportunities (stocks, crypto)
 * Returns realistic mock data with NO external API calls
 */
export async function collectMarketSignalsNow(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];

  // ===== STOCKS OPPORTUNITIES =====

  // 1. Low-risk swing trade - breakout pattern
  opportunities.push(
    createOpportunity({
      id: 'mkt-stocks-001',
      title: 'TSLA breakout above resistance at $242',
      description:
        'Tesla stock showing strong momentum with volume spike, breaking key resistance level. Historical pattern suggests 5-8% upside in 2-5 days.',
      type: 'market-signal',
      domain: 'stocks',
      freshnessTier: 'realtime',
      timeCostMinutesEstimate: 15,
      expectedRewardEstimate: 350,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-2),
      expiresAt: getExpirationDate(6),
      metadata: {
        pattern: 'breakout',
        tickerOrSymbol: 'TSLA',
        entryPrice: 242,
        targetPrice: 258,
        stopLoss: 238,
        confidence: 0.72,
        volumeRatio: 2.3,
        sector: 'Technology',
      },
    })
  );

  // 2. Medium-risk momentum play
  opportunities.push(
    createOpportunity({
      id: 'mkt-stocks-002',
      title: 'NVDA momentum continuation - AI chip demand',
      description:
        'NVIDIA riding strong AI demand narrative. Short-term momentum play with elevated volatility. Target 3-5% gain within 1-3 trading sessions.',
      type: 'market-signal',
      domain: 'stocks',
      freshnessTier: 'realtime',
      timeCostMinutesEstimate: 20,
      expectedRewardEstimate: 520,
      riskLevel: 'medium',
      detectedAt: getRelativeDate(-5),
      expiresAt: getExpirationDate(4),
      metadata: {
        pattern: 'momentum',
        tickerOrSymbol: 'NVDA',
        entryPrice: 485,
        targetPrice: 500,
        stopLoss: 475,
        confidence: 0.65,
        volumeRatio: 1.8,
        sector: 'Semiconductors',
        catalysts: ['Earnings beat', 'AI demand surge'],
      },
    })
  );

  // 3. Low-risk mean reversion
  opportunities.push(
    createOpportunity({
      id: 'mkt-stocks-003',
      title: 'AAPL oversold bounce opportunity',
      description:
        'Apple pulled back to key support at $178. RSI oversold, strong fundamental support. Conservative play for 2-4% bounce.',
      type: 'market-signal',
      domain: 'stocks',
      freshnessTier: 'realtime',
      timeCostMinutesEstimate: 10,
      expectedRewardEstimate: 280,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-8),
      expiresAt: getExpirationDate(12),
      metadata: {
        pattern: 'mean-reversion',
        tickerOrSymbol: 'AAPL',
        entryPrice: 178,
        targetPrice: 184,
        stopLoss: 175,
        confidence: 0.78,
        rsi: 28,
        sector: 'Technology',
      },
    })
  );

  // ===== CRYPTO OPPORTUNITIES =====

  // 4. High-risk whale accumulation
  opportunities.push(
    createOpportunity({
      id: 'mkt-crypto-001',
      title: 'ETH whale accumulation detected - 12K ETH moved to cold storage',
      description:
        'On-chain data shows multiple large wallets accumulating ETH. Historical pattern suggests potential 8-15% move in 2-7 days. High volatility expected.',
      type: 'market-signal',
      domain: 'crypto',
      freshnessTier: 'realtime',
      timeCostMinutesEstimate: 25,
      expectedRewardEstimate: 820,
      riskLevel: 'high',
      detectedAt: getRelativeDate(-3),
      expiresAt: getExpirationDate(8),
      metadata: {
        pattern: 'whale-accumulation',
        tickerOrSymbol: 'ETH',
        currentPrice: 2240,
        targetPrice: 2500,
        stopLoss: 2100,
        confidence: 0.58,
        whaleVolume: 12000,
        exchangeOutflow: true,
      },
    })
  );

  // 5. Medium-risk narrative token
  opportunities.push(
    createOpportunity({
      id: 'mkt-crypto-002',
      title: 'AI-AGENT token riding AI narrative wave',
      description:
        'Low-cap AI token showing strong social momentum. Risky but potential for 20-50% gain if narrative continues. Watch for rug pull signals.',
      type: 'market-signal',
      domain: 'crypto',
      freshnessTier: 'realtime',
      timeCostMinutesEstimate: 30,
      expectedRewardEstimate: 450,
      riskLevel: 'high',
      detectedAt: getRelativeDate(-1),
      expiresAt: getExpirationDate(3),
      metadata: {
        pattern: 'narrative-momentum',
        tickerOrSymbol: 'AI-AGENT',
        marketCap: '45M',
        socialMentions24h: 2340,
        twitterTrend: true,
        liquidityScore: 0.42,
        category: 'AI meme',
      },
    })
  );

  // 6. Low-risk BTC support level
  opportunities.push(
    createOpportunity({
      id: 'mkt-crypto-003',
      title: 'BTC bounce from strong support at $42K',
      description:
        'Bitcoin tested key support zone at $42K (previously resistance). Good R:R for swing trade targeting $45-46K.',
      type: 'market-signal',
      domain: 'crypto',
      freshnessTier: 'realtime',
      timeCostMinutesEstimate: 15,
      expectedRewardEstimate: 680,
      riskLevel: 'medium',
      detectedAt: getRelativeDate(-6),
      expiresAt: getExpirationDate(10),
      metadata: {
        pattern: 'support-bounce',
        tickerOrSymbol: 'BTC',
        currentPrice: 42200,
        targetPrice: 45500,
        stopLoss: 41000,
        confidence: 0.68,
        supportTests: 3,
        institutionalInterest: 'high',
      },
    })
  );

  return opportunities;
}
