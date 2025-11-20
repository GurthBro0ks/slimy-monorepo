/**
 * User profile and preference management for opportunity filtering.
 */

import type {
  Opportunity,
  OpportunityDomain,
  OpportunityType,
  RiskLevel,
} from "./types";

/**
 * User profile defining preferences and constraints for opportunity selection.
 */
export interface UserProfile {
  /** Unique identifier for the user */
  id: string;

  /** Maximum risk level the user is willing to accept */
  maxRiskLevel: RiskLevel;

  /** Maximum capital the user is willing to commit per opportunity (null = no limit) */
  maxCapitalPerOpportunity: number | null;

  /** Maximum time the user wants to spend per opportunity in minutes (null = no limit) */
  maxTimePerOpportunityMinutes: number | null;

  /** Domains the user prefers (empty/undefined = no preference) */
  prefersDomains?: OpportunityDomain[];

  /** Opportunity types the user prefers (empty/undefined = no preference) */
  prefersTypes?: OpportunityType[];

  /** Domains the user wants to avoid (empty/undefined = no avoidance) */
  avoidsDomains?: OpportunityDomain[];

  /** Opportunity types the user wants to avoid (empty/undefined = no avoidance) */
  avoidsTypes?: OpportunityType[];
}

/**
 * Risk level ordering for comparison purposes.
 */
const RISK_LEVELS: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Check if the opportunity's risk level is acceptable for the user.
 * @param opportunity The opportunity to check
 * @param profile The user profile with risk constraints
 * @returns true if risk level is acceptable
 */
function isRiskAcceptable(
  opportunity: Opportunity,
  profile: UserProfile
): boolean {
  return RISK_LEVELS[opportunity.riskLevel] <= RISK_LEVELS[profile.maxRiskLevel];
}

/**
 * Check if the opportunity's capital requirement is acceptable for the user.
 * @param opportunity The opportunity to check
 * @param profile The user profile with capital constraints
 * @returns true if capital requirement is acceptable
 */
function isCapitalAcceptable(
  opportunity: Opportunity,
  profile: UserProfile
): boolean {
  // If user has no capital limit, accept any opportunity
  if (profile.maxCapitalPerOpportunity === null) {
    return true;
  }

  // If opportunity has no capital requirement, it's acceptable
  if (opportunity.capitalRequiredEstimate === null) {
    return true;
  }

  // Check if opportunity's capital requirement is within user's limit
  return opportunity.capitalRequiredEstimate <= profile.maxCapitalPerOpportunity;
}

/**
 * Check if the opportunity's time requirement is acceptable for the user.
 * @param opportunity The opportunity to check
 * @param profile The user profile with time constraints
 * @returns true if time requirement is acceptable
 */
function isTimeAcceptable(
  opportunity: Opportunity,
  profile: UserProfile
): boolean {
  // If user has no time limit, accept any opportunity
  if (profile.maxTimePerOpportunityMinutes === null) {
    return true;
  }

  // If opportunity has no time estimate, it's acceptable (unknown time)
  if (opportunity.timeCostMinutesEstimate === null) {
    return true;
  }

  // Check if opportunity's time requirement is within user's limit
  return opportunity.timeCostMinutesEstimate <= profile.maxTimePerOpportunityMinutes;
}

/**
 * Check if the opportunity's domain is acceptable for the user.
 * @param opportunity The opportunity to check
 * @param profile The user profile with domain preferences
 * @returns true if domain is acceptable
 */
function isDomainAcceptable(
  opportunity: Opportunity,
  profile: UserProfile
): boolean {
  // If user explicitly avoids this domain, reject it
  if (profile.avoidsDomains?.includes(opportunity.domain)) {
    return false;
  }

  // Otherwise, it's acceptable (preferences are handled in scoring, not filtering)
  return true;
}

/**
 * Check if the opportunity's type is acceptable for the user.
 * @param opportunity The opportunity to check
 * @param profile The user profile with type preferences
 * @returns true if type is acceptable
 */
function isTypeAcceptable(
  opportunity: Opportunity,
  profile: UserProfile
): boolean {
  // If user explicitly avoids this type, reject it
  if (profile.avoidsTypes?.includes(opportunity.type)) {
    return false;
  }

  // Otherwise, it's acceptable (preferences are handled in scoring, not filtering)
  return true;
}

/**
 * Filter opportunities based on user profile constraints.
 * This applies hard filters (risk, capital, time, avoids).
 * Soft preferences (prefersDomains, prefersTypes) are handled in scoring.
 *
 * @param profile User profile with constraints and preferences
 * @param opportunities Array of opportunities to filter
 * @returns Filtered array of opportunities that meet user constraints
 */
export function filterOpportunitiesForUser(
  profile: UserProfile,
  opportunities: Opportunity[]
): Opportunity[] {
  return opportunities.filter((opp) => {
    // Apply all hard constraint checks
    return (
      isRiskAcceptable(opp, profile) &&
      isCapitalAcceptable(opp, profile) &&
      isTimeAcceptable(opp, profile) &&
      isDomainAcceptable(opp, profile) &&
      isTypeAcceptable(opp, profile)
    );
  });
}
