import type { Opportunity } from '@slimy/opps-core';
import { createOpportunity, getExpirationDate, getRelativeDate } from './utils';

/**
 * Collects trend signal opportunities (video, search, social)
 * Returns realistic mock data with NO external API calls
 */
export async function collectTrendSignalsNow(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];

  // ===== VIDEO CONTENT TRENDS =====

  // 1. Gaming niche - cozy survival base building
  opportunities.push(
    createOpportunity({
      id: 'trend-video-001',
      title: 'Cozy survival base building - emerging gaming niche',
      description:
        'Low-competition gaming niche showing 340% growth in views over 30 days. "Cozy" + "survival" + "base building" combo gaining traction. Good for tutorial content or streaming.',
      type: 'trend-signal',
      domain: 'video',
      freshnessTier: 'fast_batch',
      timeCostMinutesEstimate: 45,
      expectedRewardEstimate: 280,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-30),
      expiresAt: getExpirationDate(72),
      metadata: {
        trendScore: 87,
        searchVolumeIndex: 3400,
        competitionLevel: 'low',
        platforms: ['youtube', 'twitch'],
        relatedGames: ['Valheim', 'The Forest', 'Minecraft'],
        avgViewsPerVideo: 42000,
        contentAngles: [
          'Beginner base tour',
          'Resource efficiency tips',
          'Aesthetic builds',
        ],
      },
    })
  );

  // 2. Tech niche - AI coding assistants
  opportunities.push(
    createOpportunity({
      id: 'trend-video-002',
      title: 'AI copilots for coding - high search intent',
      description:
        'Exploding interest in AI-powered development tools. High-value audience (developers) with strong monetization potential. Competitive but growing fast.',
      type: 'trend-signal',
      domain: 'video',
      freshnessTier: 'fast_batch',
      timeCostMinutesEstimate: 60,
      expectedRewardEstimate: 650,
      riskLevel: 'medium',
      detectedAt: getRelativeDate(-15),
      expiresAt: getExpirationDate(48),
      metadata: {
        trendScore: 94,
        searchVolumeIndex: 12800,
        competitionLevel: 'medium',
        platforms: ['youtube', 'twitter'],
        keywords: ['cursor ai', 'github copilot', 'claude code', 'windsurf'],
        avgViewsPerVideo: 85000,
        monetizationPotential: 'high',
        contentAngles: [
          'Tool comparison',
          'Real-world workflow',
          'Beginner setup guide',
        ],
      },
    })
  );

  // 3. Easter egg - Minecraft slime.craft server
  opportunities.push(
    createOpportunity({
      id: 'trend-video-003',
      title: 'Minecraft slime.craft server - niche community growth',
      description:
        'Small but engaged Minecraft server community ("slime.craft") showing organic growth. Good for targeted streaming or tutorial content. Low competition.',
      type: 'trend-signal',
      domain: 'video',
      freshnessTier: 'fast_batch',
      timeCostMinutesEstimate: 30,
      expectedRewardEstimate: 120,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-10),
      expiresAt: getExpirationDate(120),
      metadata: {
        trendScore: 62,
        searchVolumeIndex: 890,
        competitionLevel: 'very-low',
        platforms: ['youtube', 'reddit'],
        serverType: 'survival',
        communitySize: 'small',
        engagement: 'high',
        contentAngles: ['Server tour', 'Community events', 'Build showcases'],
      },
    })
  );

  // ===== SEARCH TRENDS =====

  // 4. Budget consumer electronics
  opportunities.push(
    createOpportunity({
      id: 'trend-search-001',
      title: 'Budget iPhone deals - seasonal shopping intent',
      description:
        'Search volume spiking for "budget iPhone" and "refurbished iPhone deals". Affiliate opportunity with strong buyer intent. Seasonal but recurring.',
      type: 'trend-signal',
      domain: 'search',
      freshnessTier: 'fast_batch',
      timeCostMinutesEstimate: 40,
      expectedRewardEstimate: 380,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-5),
      expiresAt: getExpirationDate(168),
      metadata: {
        trendScore: 79,
        searchVolumeIndex: 8900,
        competitionLevel: 'medium',
        platforms: ['google', 'youtube'],
        keywords: [
          'budget iPhone 2025',
          'refurbished iPhone deals',
          'cheap iPhone 13',
        ],
        buyerIntent: 'high',
        affiliatePotential: true,
        avgCommission: '$25-50',
      },
    })
  );

  // 5. SaaS/productivity tools
  opportunities.push(
    createOpportunity({
      id: 'trend-search-002',
      title: 'Notion alternatives - productivity tool switchers',
      description:
        'Growing search interest in Notion alternatives as users look for lighter/cheaper options. Good for comparison content and affiliate links.',
      type: 'trend-signal',
      domain: 'search',
      freshnessTier: 'fast_batch',
      timeCostMinutesEstimate: 50,
      expectedRewardEstimate: 420,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-20),
      expiresAt: getExpirationDate(96),
      metadata: {
        trendScore: 82,
        searchVolumeIndex: 6700,
        competitionLevel: 'low',
        platforms: ['google', 'reddit'],
        keywords: [
          'notion alternative free',
          'lightweight notion',
          'obsidian vs notion',
        ],
        contentType: 'comparison-review',
        affiliatePrograms: ['AppSumo', 'direct'],
      },
    })
  );

  // 6. Fitness/health micro-niche
  opportunities.push(
    createOpportunity({
      id: 'trend-search-003',
      title: 'Standing desk exercises for remote workers',
      description:
        'Emerging micro-niche around "standing desk exercises" and "remote work fitness". Low competition, high engagement potential.',
      type: 'trend-signal',
      domain: 'search',
      freshnessTier: 'fast_batch',
      timeCostMinutesEstimate: 35,
      expectedRewardEstimate: 190,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-12),
      expiresAt: getExpirationDate(240),
      metadata: {
        trendScore: 71,
        searchVolumeIndex: 2100,
        competitionLevel: 'very-low',
        platforms: ['google', 'youtube', 'pinterest'],
        keywords: [
          'standing desk stretches',
          'wfh fitness routine',
          'desk exercises quick',
        ],
        contentFormat: 'tutorial',
        monetization: ['ads', 'fitness-gear-affiliate'],
      },
    })
  );

  return opportunities;
}
