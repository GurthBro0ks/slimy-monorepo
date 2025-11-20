/**
 * Market signals collector (stub implementation)
 *
 * TODO: Wire actual API integrations for:
 * - Stock price feeds (Alpha Vantage, Polygon, etc.)
 * - Crypto price feeds (CoinGecko, CoinMarketCap, etc.)
 * - On-chain providers (Alchemy, Infura for DeFi signals)
 * - Options flow / unusual activity
 */

import type { Opportunity } from '../../../opps-core/src/types.js';

/**
 * Collect real-time market movement signals
 *
 * Current implementation: Returns hard-coded fake opportunities
 * Future: Poll price feeds, detect significant movements, generate opportunities
 */
export async function collectMarketSignalsNow(): Promise<Opportunity[]> {
  // Simulated delay for async operation
  await new Promise((resolve) => setTimeout(resolve, 10));

  const now = new Date().toISOString();

  // Hard-coded fake market opportunities
  const fakeOpportunities: Opportunity[] = [
    {
      id: 'market-stock-001',
      type: 'market_move',
      domain: 'stocks',
      freshnessTier: 'realtime',
      title: 'NVDA up 5% on AI chip announcement',
      description: 'NVIDIA surged after announcing new AI accelerator chips',
      detectedAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 min expiry
      actionUrl: 'https://finance.yahoo.com/quote/NVDA',
      metadata: {
        ticker: 'NVDA',
        percentChange: 5.2,
        sector: 'technology',
      },
      tags: ['stocks', 'tech', 'nvidia', 'ai'],
      score: 0.85,
    },
    {
      id: 'market-crypto-001',
      type: 'market_move',
      domain: 'crypto',
      freshnessTier: 'realtime',
      title: 'BTC breaks $45k resistance',
      description: 'Bitcoin broke through key resistance level with strong volume',
      detectedAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      actionUrl: 'https://www.coinbase.com/price/bitcoin',
      metadata: {
        symbol: 'BTC',
        priceUSD: 45234,
        percentChange24h: 3.8,
      },
      tags: ['crypto', 'bitcoin', 'breakout'],
      score: 0.78,
    },
  ];

  return fakeOpportunities;
}
