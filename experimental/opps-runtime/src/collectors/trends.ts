/**
 * Trends and narrative collector (stub implementation)
 *
 * TODO: Wire actual API integrations for:
 * - YouTube trending API
 * - Google Trends API
 * - Reddit trending topics
 * - Twitter/X trending hashtags
 * - TikTok trending sounds/challenges
 */

import type { Opportunity } from '../../../opps-core/src/types.js';

/**
 * Collect trending narratives and content signals
 *
 * Current implementation: Returns hard-coded fake opportunities
 * Future: Poll trend APIs, detect emerging topics, generate opportunities
 */
export async function collectTrendSignalsNow(): Promise<Opportunity[]> {
  // Simulated delay for async operation
  await new Promise((resolve) => setTimeout(resolve, 10));

  const now = new Date().toISOString();

  // Hard-coded fake trend opportunities
  const fakeOpportunities: Opportunity[] = [
    {
      id: 'trend-video-001',
      type: 'trend_narrative',
      domain: 'video',
      freshnessTier: 'fast_batch',
      title: 'AI productivity tools exploding on YouTube',
      description: 'Tutorial videos about ChatGPT alternatives trending across tech channels',
      detectedAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(), // 6 hour expiry
      actionUrl: 'https://www.youtube.com/results?search_query=ai+productivity+tools',
      metadata: {
        platform: 'youtube',
        category: 'technology',
        viewGrowth: '250%',
        topChannels: ['TechLinked', 'Fireship', 'NetworkChuck'],
      },
      tags: ['youtube', 'ai', 'productivity', 'trending'],
      score: 0.72,
    },
    {
      id: 'trend-search-001',
      type: 'trend_narrative',
      domain: 'search',
      freshnessTier: 'fast_batch',
      title: 'Searches for "tax refund 2024" spiking',
      description: 'Google searches for tax refund tracking up 400% week-over-week',
      detectedAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hour expiry
      actionUrl: 'https://trends.google.com/trends/explore?q=tax+refund+2024',
      metadata: {
        platform: 'google',
        searchVolume: 'breakout',
        relatedQueries: ['where is my tax refund', 'irs refund status', 'tax refund schedule'],
        region: 'US',
      },
      tags: ['google-trends', 'tax', 'finance', 'seasonal'],
      score: 0.68,
    },
    {
      id: 'trend-video-002',
      type: 'trend_narrative',
      domain: 'video',
      freshnessTier: 'fast_batch',
      title: 'Meal prep Sunday challenge viral on TikTok',
      description: 'Users sharing weekly meal preparation routines, 2M+ videos',
      detectedAt: now,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      actionUrl: 'https://www.tiktok.com/tag/mealprepsunday',
      metadata: {
        platform: 'tiktok',
        hashtag: 'mealprepsunday',
        videoCount: '2.1M',
        avgEngagement: 'high',
      },
      tags: ['tiktok', 'food', 'health', 'challenge'],
      score: 0.65,
    },
  ];

  return fakeOpportunities;
}
