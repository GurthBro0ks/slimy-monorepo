/**
 * Found Money collectors: Rebates and Unclaimed Property nudges
 *
 * All data is synthetic/mock - no external API calls.
 */

import type { Opportunity } from "../../../opps-core/src/types";

/**
 * Collects synthetic rebate opportunities (energy, device trade-ins, bill credits)
 */
export async function collectRebateOpportunitiesNow(): Promise<Opportunity[]> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "rebate-energy-insulation-001",
      title: "Home Insulation Energy Efficiency Rebate",
      description:
        "Get up to $500 back on qualifying home insulation improvements. Valid for homeowners who complete installation by end of quarter.",
      type: "other",
      domain: "promo",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 500,
      timeCostMinutesEstimate: 45,
      metadata: {
        category: "rebate",
        programType: "energy",
        region: "US",
        requiresPaperwork: true,
      },
      createdAt: now,
      expiresAt: thirtyDaysFromNow,
    },
    {
      id: "rebate-device-smart-thermostat-002",
      title: "Smart Thermostat Utility Rebate",
      description:
        "Your local utility offers $75 rebates on ENERGY STAR certified smart thermostats. Simple online form submission.",
      type: "other",
      domain: "promo",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 75,
      timeCostMinutesEstimate: 20,
      metadata: {
        category: "rebate",
        programType: "energy",
        region: "US",
        requiresPaperwork: false,
      },
      createdAt: now,
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
    {
      id: "rebate-device-trade-in-003",
      title: "Electronics Trade-In Program",
      description:
        "Trade in your old smartphone or tablet for up to $200 credit. Multiple retailers participating in environmental recycling program.",
      type: "other",
      domain: "promo",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 150,
      timeCostMinutesEstimate: 30,
      metadata: {
        category: "rebate",
        programType: "device-trade-in",
        region: "global",
        requiresPaperwork: false,
      },
      createdAt: now,
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
    {
      id: "rebate-isp-bill-credit-004",
      title: "ISP Bill Credit for Referrals",
      description:
        "Refer friends to your internet service provider and receive $50 bill credit per successful referral (up to 3 referrals).",
      type: "other",
      domain: "promo",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 150,
      timeCostMinutesEstimate: 15,
      metadata: {
        category: "rebate",
        programType: "bill-credit",
        region: "US",
        requiresPaperwork: false,
      },
      createdAt: now,
      expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days
    },
    {
      id: "rebate-mobile-carrier-credit-005",
      title: "Mobile Carrier Loyalty Credit",
      description:
        "Long-term customers eligible for one-time $25 bill credit. Check your account dashboard for personalized offer code.",
      type: "other",
      domain: "legal",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 25,
      timeCostMinutesEstimate: 10,
      metadata: {
        category: "rebate",
        programType: "bill-credit",
        region: "EU",
        requiresPaperwork: false,
      },
      createdAt: now,
      expiresAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days
    },
  ];
}

/**
 * Collects synthetic unclaimed property nudges (meta-opportunities to check official sites)
 */
export async function collectUnclaimedPropertyNudgesNow(): Promise<Opportunity[]> {
  const now = new Date();

  return [
    {
      id: "unclaimed-nudge-state-treasury-001",
      title: "State Treasury Unclaimed Property Update",
      description:
        "Your state treasury has recently updated unclaimed property listings. Check official state site for potential matches to your name or past addresses.",
      type: "other",
      domain: "legal",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 100,
      timeCostMinutesEstimate: 10,
      metadata: {
        category: "unclaimed_property_nudge",
        region: "US",
        officialSitesHint: true,
      },
      createdAt: now,
      expiresAt: undefined, // No expiration for nudges
    },
    {
      id: "unclaimed-nudge-national-cycle-002",
      title: "National Unclaimed Funds Cycle Completed",
      description:
        "The national-level unclaimed funds database has completed its quarterly update. Search by name and verify any matches.",
      type: "other",
      domain: "legal",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 75,
      timeCostMinutesEstimate: 15,
      metadata: {
        category: "unclaimed_property_nudge",
        region: "US",
        officialSitesHint: true,
      },
      createdAt: now,
      expiresAt: undefined,
    },
    {
      id: "unclaimed-nudge-old-bank-accounts-003",
      title: "Dormant Bank Account Search Reminder",
      description:
        "Banks are required to turn over dormant accounts after 3-5 years. If you've moved or changed banks, check for unclaimed deposits.",
      type: "other",
      domain: "misc",
      riskLevel: "low",
      freshnessTier: "slow_batch",
      expectedRewardEstimate: 50,
      timeCostMinutesEstimate: 12,
      metadata: {
        category: "unclaimed_property_nudge",
        region: "global",
        officialSitesHint: true,
      },
      createdAt: now,
      expiresAt: undefined,
    },
  ];
}
