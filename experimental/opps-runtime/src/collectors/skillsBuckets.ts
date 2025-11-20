/**
 * Skill buckets helper - organizes skill opportunities by time horizon.
 */

import type { Opportunity, SkillInvestmentMetadata } from "@slimy/opps-core";

/**
 * A bucket of skill opportunities grouped by a label.
 */
export interface SkillBucket {
  /** Label for this bucket (e.g., "This Week", "This Month") */
  label: string;

  /** Opportunities in this bucket */
  opportunities: Opportunity[];
}

/**
 * Group skill opportunities into buckets based on time horizon.
 *
 * The logic adapts based on the horizon:
 * - Short horizon (<= 7 days): Show only lighter tasks
 * - Medium horizon (8-30 days): Show moderate time investment tasks
 * - Long horizon (> 30 days): Show all tasks, grouped by area
 *
 * @param horizonDays - Number of days in the planning horizon
 * @param skillOpps - Array of skill investment opportunities to categorize
 * @returns Array of SkillBucket objects
 */
export function groupSkillOpportunitiesForHorizon(
  horizonDays: number,
  skillOpps: Opportunity[]
): SkillBucket[] {
  // Short horizon: only show lighter tasks (< 4 hours)
  if (horizonDays <= 7) {
    const quickWins = skillOpps.filter(
      (opp) => opp.timeCostMinutesEstimate <= 240
    );

    return [
      {
        label: "This Week",
        opportunities: quickWins,
      },
    ];
  }

  // Medium horizon: show tasks up to 6 hours, group by intensity
  if (horizonDays <= 30) {
    const light = skillOpps.filter(
      (opp) => opp.timeCostMinutesEstimate <= 240
    );
    const moderate = skillOpps.filter(
      (opp) =>
        opp.timeCostMinutesEstimate > 240 && opp.timeCostMinutesEstimate <= 360
    );
    const intensive = skillOpps.filter(
      (opp) => opp.timeCostMinutesEstimate > 360
    );

    const buckets: SkillBucket[] = [];

    if (light.length > 0) {
      buckets.push({
        label: "Light Investment (< 4 hours)",
        opportunities: light,
      });
    }

    if (moderate.length > 0) {
      buckets.push({
        label: "Moderate Investment (4-6 hours)",
        opportunities: moderate,
      });
    }

    if (intensive.length > 0) {
      buckets.push({
        label: "Deep Dive (> 6 hours)",
        opportunities: intensive,
      });
    }

    return buckets;
  }

  // Long horizon: show everything, grouped by area
  const byArea: Record<string, Opportunity[]> = {};

  for (const opp of skillOpps) {
    const metadata = opp.metadata as SkillInvestmentMetadata | undefined;
    const area = metadata?.area ?? "other";

    if (!byArea[area]) {
      byArea[area] = [];
    }

    byArea[area].push(opp);
  }

  const areaLabels: Record<string, string> = {
    quant: "Quant & Analytics",
    automation: "Automation & Tooling",
    ai_tooling: "AI & ML Tools",
    frontend: "Frontend & Design",
    infra: "Infrastructure & DevOps",
    other: "Other Skills",
  };

  const buckets: SkillBucket[] = [];

  for (const [area, opps] of Object.entries(byArea)) {
    if (opps.length > 0) {
      buckets.push({
        label: areaLabels[area] ?? area,
        opportunities: opps,
      });
    }
  }

  // Sort buckets by total time investment (descending) for better UX
  buckets.sort((a, b) => {
    const totalA = a.opportunities.reduce(
      (sum, opp) => sum + opp.timeCostMinutesEstimate,
      0
    );
    const totalB = b.opportunities.reduce(
      (sum, opp) => sum + opp.timeCostMinutesEstimate,
      0
    );
    return totalB - totalA;
  });

  return buckets;
}
