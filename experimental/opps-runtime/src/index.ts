/**
 * @slimy/opps-runtime
 *
 * Runtime system for collecting and managing opportunities.
 */

// Re-export core types for convenience
export * from "@slimy/opps-core";

// Export radar functionality
export { buildRadarSnapshot } from "./radar.js";

// Export collectors
export { collectSkillInvestmentOpportunitiesNow } from "./collectors/skills.js";
export {
  groupSkillOpportunitiesForHorizon,
  type SkillBucket,
} from "./collectors/skillsBuckets.js";
