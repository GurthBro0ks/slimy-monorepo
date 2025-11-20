import type { Opportunity } from '@slimy/opps-core';
import { createOpportunity, getExpirationDate, getRelativeDate } from './utils';

/**
 * Collects freebie and promotional opportunities
 * Returns realistic mock data with NO external API calls
 */
export async function collectFreebieOpportunitiesNow(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];

  // 1. SaaS credits - high value, no card required
  opportunities.push(
    createOpportunity({
      id: 'freebie-saas-001',
      title: 'CloudCompute - $200 free credits for new users',
      description:
        'Cloud computing platform offering $200 in free credits. No credit card required, valid for 60 days. Great for side projects or testing infrastructure.',
      type: 'promo',
      domain: 'saas',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 12,
      expectedRewardEstimate: 200,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-15),
      expiresAt: getExpirationDate(720), // 30 days
      metadata: {
        minValue: 200,
        maxValue: 200,
        requiresCardOnFile: false,
        source: 'vendor-site',
        provider: 'CloudCompute',
        category: 'Infrastructure',
        validityPeriod: '60 days',
        restrictions: ['New users only', 'Not stackable'],
        useCases: ['Hosting', 'API services', 'Database'],
      },
    })
  );

  // 2. SaaS trial - premium features, card required
  opportunities.push(
    createOpportunity({
      id: 'freebie-saas-002',
      title: 'DesignPro - 3 months free premium (normally $45/mo)',
      description:
        'Professional design tool offering extended free trial. Credit card required but can cancel anytime. Full premium features worth $135.',
      type: 'promo',
      domain: 'saas',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 10,
      expectedRewardEstimate: 135,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-8),
      expiresAt: getExpirationDate(480), // 20 days
      metadata: {
        minValue: 135,
        maxValue: 135,
        requiresCardOnFile: true,
        source: 'vendor-site',
        provider: 'DesignPro',
        category: 'Creative Tools',
        normalPrice: '$45/month',
        trialLength: '3 months',
        cancellationPolicy: 'Cancel anytime before trial ends',
        features: ['All templates', 'Unlimited exports', 'Team collaboration'],
      },
    })
  );

  // 3. Physical sample - low value, just shipping
  opportunities.push(
    createOpportunity({
      id: 'freebie-physical-001',
      title: 'GlowSkin - Free skincare sample kit',
      description:
        'Free 5-piece skincare sample set. Just pay $4.95 shipping. Good way to test products before buying full size.',
      type: 'freebie',
      domain: 'promo',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 8,
      expectedRewardEstimate: 25,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-30),
      expiresAt: getExpirationDate(240), // 10 days
      metadata: {
        minValue: 25,
        maxValue: 30,
        requiresCardOnFile: false,
        source: 'vendor-site',
        provider: 'GlowSkin',
        category: 'Beauty',
        shippingCost: 4.95,
        itemsIncluded: [
          'Face cleanser',
          'Moisturizer',
          'Serum',
          'Eye cream',
          'Sheet mask',
        ],
        expectedDelivery: '7-10 business days',
      },
    })
  );

  // 4. Developer tools - high value, education required
  opportunities.push(
    createOpportunity({
      id: 'freebie-saas-003',
      title: 'GitHost Student Pack - $400+ value in dev tools',
      description:
        'Comprehensive pack of developer tools and credits for students. Requires .edu email. Includes hosting, CI/CD, domain name, and more.',
      type: 'promo',
      domain: 'saas',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 20,
      expectedRewardEstimate: 400,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-60),
      expiresAt: getExpirationDate(8760), // 365 days (always available)
      metadata: {
        minValue: 400,
        maxValue: 500,
        requiresCardOnFile: false,
        source: 'vendor-site',
        provider: 'GitHost',
        category: 'Developer Tools',
        eligibility: 'Students with .edu email',
        validityPeriod: 'While enrolled',
        includedServices: [
          'Premium hosting',
          'CI/CD minutes',
          'Domain name',
          'SSL certificates',
          'Cloud credits',
        ],
      },
    })
  );

  // 5. Deal aggregator find - software bundle
  opportunities.push(
    createOpportunity({
      id: 'freebie-saas-004',
      title: 'AppBundler Lifetime Deal - $39 (normally $588/year)',
      description:
        'Time-limited lifetime deal on productivity suite. One-time payment instead of subscription. Historically good value but review before buying.',
      type: 'promo',
      domain: 'saas',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 25,
      expectedRewardEstimate: 549,
      riskLevel: 'medium',
      detectedAt: getRelativeDate(-3),
      expiresAt: getExpirationDate(168), // 7 days
      metadata: {
        minValue: 549,
        maxValue: 549,
        requiresCardOnFile: false,
        source: 'deal-aggregator',
        provider: 'ProductivityHub',
        category: 'Productivity',
        dealType: 'lifetime',
        normalPrice: '$588/year',
        dealPrice: 39,
        savings: 93,
        limitedQuantity: true,
        features: ['All premium features', 'Lifetime updates', 'Priority support'],
        riskNote: 'Verify company stability before lifetime purchase',
      },
    })
  );

  // 6. Free tier - always available, limited features
  opportunities.push(
    createOpportunity({
      id: 'freebie-saas-005',
      title: 'EmailFlow - Free tier with 2K emails/month',
      description:
        'Email marketing platform with generous free tier. Perfect for small projects or newsletters. Can upgrade if you grow.',
      type: 'promo',
      domain: 'saas',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 15,
      expectedRewardEstimate: 120,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-90),
      expiresAt: undefined, // No expiration, always available
      metadata: {
        minValue: 120,
        maxValue: 120,
        requiresCardOnFile: false,
        source: 'vendor-site',
        provider: 'EmailFlow',
        category: 'Marketing',
        dealType: 'free-tier',
        limits: ['2,000 emails/month', '500 subscribers', 'Basic templates'],
        upgradeOptions: true,
        permanent: true,
        bestFor: ['Newsletters', 'Small businesses', 'Side projects'],
      },
    })
  );

  // 7. Food/restaurant - quick grab
  opportunities.push(
    createOpportunity({
      id: 'freebie-food-001',
      title: 'BurgerSpot - Free burger with app download',
      description:
        'Download the BurgerSpot app and get a free burger (up to $8 value). Valid for new users only. Quick easy meal.',
      type: 'freebie',
      domain: 'promo',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 5,
      expectedRewardEstimate: 8,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-5),
      expiresAt: getExpirationDate(336), // 14 days
      metadata: {
        minValue: 6,
        maxValue: 8,
        requiresCardOnFile: false,
        source: 'deal-aggregator',
        provider: 'BurgerSpot',
        category: 'Food',
        dealType: 'first-purchase',
        redemption: 'In-app at checkout',
        locations: 'Participating locations',
        restrictions: ['New users only', 'One per account', 'Dine-in or pickup'],
      },
    })
  );

  return opportunities;
}
