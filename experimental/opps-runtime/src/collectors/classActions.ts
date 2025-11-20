import type { Opportunity } from '@slimy/opps-core';
import { createOpportunity, getExpirationDate, getRelativeDate } from './utils';

/**
 * Collects class action lawsuit opportunities
 * Returns realistic mock data with NO external API calls
 */
export async function collectClassActionOpportunitiesNow(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];

  // 1. Tech company data breach - medium payout, simple claim
  opportunities.push(
    createOpportunity({
      id: 'legal-class-001',
      title: 'TechCorp Data Breach Settlement - $125-$250 per claim',
      description:
        'Class action settlement for 2023 data breach affecting 8M users. Simple online claim form, no proof of purchase required. Just need to confirm you had an account.',
      type: 'class-action',
      domain: 'legal',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 8,
      expectedRewardEstimate: 187,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-240),
      expiresAt: getExpirationDate(720), // 30 days
      metadata: {
        requiresProofOfPurchase: false,
        estimatedPayoutRange: [125, 250],
        deadline: getExpirationDate(720),
        claimDifficulty: 'easy',
        affectedTimeframe: '2022-01-01 to 2023-06-30',
        settlementAmount: '$45M total',
        estimatedClaimants: 240000,
        claimUrl: 'https://example.settlement.com/techcorp',
      },
    })
  );

  // 2. Consumer product - higher payout, requires receipt
  opportunities.push(
    createOpportunity({
      id: 'legal-class-002',
      title: 'SmartHome Device Defect Settlement - Up to $400',
      description:
        'Settlement for defective smart home devices sold 2021-2023. Higher payout but requires proof of purchase. Good if you kept receipts or have order history.',
      type: 'class-action',
      domain: 'legal',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 15,
      expectedRewardEstimate: 350,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-180),
      expiresAt: getExpirationDate(1440), // 60 days
      metadata: {
        requiresProofOfPurchase: true,
        estimatedPayoutRange: [200, 400],
        deadline: getExpirationDate(1440),
        claimDifficulty: 'moderate',
        affectedProducts: ['Model SH-100', 'Model SH-200', 'Model SH-300'],
        affectedTimeframe: '2021-03-15 to 2023-08-31',
        settlementAmount: '$28M total',
        estimatedClaimants: 85000,
        proofOptions: ['Receipt', 'Credit card statement', 'Email confirmation'],
      },
    })
  );

  // 3. Privacy violation - moderate payout, no proof needed
  opportunities.push(
    createOpportunity({
      id: 'legal-class-003',
      title: 'SocialApp Privacy Violations - $75-$150 estimated',
      description:
        'Settlement for unauthorized data sharing with advertisers. Open to all users who had an account during 2020-2022. Simple claim, just need to verify account.',
      type: 'class-action',
      domain: 'legal',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 10,
      expectedRewardEstimate: 112,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-360),
      expiresAt: getExpirationDate(2160), // 90 days
      metadata: {
        requiresProofOfPurchase: false,
        estimatedPayoutRange: [75, 150],
        deadline: getExpirationDate(2160),
        claimDifficulty: 'easy',
        affectedTimeframe: '2020-01-01 to 2022-12-31',
        settlementAmount: '$18.5M total',
        estimatedClaimants: 150000,
        verificationMethod: 'Email or username confirmation',
      },
    })
  );

  // 4. Subscription service - lower payout, quick claim
  opportunities.push(
    createOpportunity({
      id: 'legal-class-004',
      title: 'StreamFlix Auto-Renewal Lawsuit - $45-$90',
      description:
        'Settlement for allegedly deceptive auto-renewal practices. If you were charged after canceling or had trouble canceling, you may qualify. Quick 5-minute claim.',
      type: 'class-action',
      domain: 'legal',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 5,
      expectedRewardEstimate: 67,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-120),
      expiresAt: getExpirationDate(1200), // 50 days
      metadata: {
        requiresProofOfPurchase: false,
        estimatedPayoutRange: [45, 90],
        deadline: getExpirationDate(1200),
        claimDifficulty: 'very-easy',
        affectedTimeframe: '2021-06-01 to 2023-12-31',
        settlementAmount: '$12M total',
        estimatedClaimants: 175000,
        qualificationNote: 'Must have had active or cancelled subscription',
      },
    })
  );

  // 5. Healthcare/pharmaceutical - highest payout, complex claim
  opportunities.push(
    createOpportunity({
      id: 'legal-class-005',
      title: 'MediDevice Hip Implant Settlement - $2,500-$8,000',
      description:
        'Major settlement for defective hip implant devices. High payout but requires medical records and documentation. Time-intensive but significant reward if you qualify.',
      type: 'class-action',
      domain: 'legal',
      freshnessTier: 'slow_batch',
      timeCostMinutesEstimate: 120,
      expectedRewardEstimate: 4800,
      riskLevel: 'low',
      detectedAt: getRelativeDate(-480),
      expiresAt: getExpirationDate(4320), // 180 days
      metadata: {
        requiresProofOfPurchase: true,
        estimatedPayoutRange: [2500, 8000],
        deadline: getExpirationDate(4320),
        claimDifficulty: 'complex',
        affectedProducts: ['MediHip Pro Series', 'MediHip Advanced'],
        affectedTimeframe: '2018-01-01 to 2022-06-30',
        settlementAmount: '$340M total',
        estimatedClaimants: 52000,
        requiredDocuments: [
          'Medical records',
          'Surgical documentation',
          'Device serial number',
        ],
        injuryRequired: true,
      },
    })
  );

  return opportunities;
}
