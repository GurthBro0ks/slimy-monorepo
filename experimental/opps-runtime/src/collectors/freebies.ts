/**
 * Freebies and promotional offers collector (stub implementation)
 *
 * TODO: Wire actual API integrations for:
 * - Reddit /r/freebies scraper
 * - Slickdeals API/scraper
 * - Epic Games free games API
 * - Steam free games scraper
 * - Brand promotional campaign APIs
 */

import type { Opportunity } from '../../../opps-core/src/types.js';

/**
 * Collect freebie and promotional opportunities
 *
 * Current implementation: Returns hard-coded fake opportunities
 * Future: Scrape freebie aggregators, game stores, match user interests
 */
export async function collectFreebieOpportunitiesNow(): Promise<Opportunity[]> {
  // Simulated delay for async operation
  await new Promise((resolve) => setTimeout(resolve, 10));

  const now = new Date().toISOString();

  // Hard-coded fake freebie opportunities
  const fakeOpportunities: Opportunity[] = [
    {
      id: 'freebie-001',
      type: 'freebie',
      domain: 'promo',
      freshnessTier: 'slow_batch',
      title: 'Free premium game on Epic Games Store',
      description: 'AAA title "Cyberpunk 2077" free to claim this week',
      detectedAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days
      actionUrl: 'https://store.epicgames.com/free-games',
      metadata: {
        platform: 'Epic Games',
        game: 'Cyberpunk 2077',
        retailValue: 59.99,
        category: 'gaming',
        requirements: 'Epic account required',
      },
      tags: ['freebie', 'gaming', 'epic-games', 'aaa-title'],
      score: 0.88,
    },
    {
      id: 'freebie-002',
      type: 'freebie',
      domain: 'promo',
      freshnessTier: 'slow_batch',
      title: 'Free 6-month Spotify Premium trial',
      description: 'New users: Get 6 months of Spotify Premium free with eligible credit card',
      detectedAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
      actionUrl: 'https://www.spotify.com/premium-trial',
      metadata: {
        platform: 'Spotify',
        offer: '6 months Premium',
        retailValue: 59.94,
        category: 'streaming',
        requirements: 'Eligible credit card, new users only',
      },
      tags: ['freebie', 'music', 'streaming', 'trial'],
      score: 0.75,
    },
    {
      id: 'freebie-003',
      type: 'freebie',
      domain: 'promo',
      freshnessTier: 'slow_batch',
      title: 'Free sample box from beauty brand',
      description: 'Claim free sample box with 5 premium beauty products',
      detectedAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days
      actionUrl: 'https://www.example-beauty.com/free-samples',
      metadata: {
        platform: 'BeautyBrand',
        contents: '5 product samples',
        retailValue: 35,
        category: 'beauty',
        requirements: 'Email signup, US only',
      },
      tags: ['freebie', 'beauty', 'samples', 'skincare'],
      score: 0.62,
    },
  ];

  return fakeOpportunities;
}
