/**
 * In-memory storage for opportunities.
 * This is a simple runtime scaffold with no persistence.
 */

// Import types from opps-core via relative path
// Assumes experimental/opps-core exists as a sibling directory
import type { Opportunity, OpportunityDomain } from '../../../opps-core/src/types.js';

/**
 * Interface for opportunity storage operations
 */
export interface OpportunityStore {
  /**
   * Insert or update a single opportunity
   */
  upsert(opportunity: Opportunity): void;

  /**
   * Insert or update multiple opportunities
   */
  upsertMany(opportunities: Opportunity[]): void;

  /**
   * Get all stored opportunities
   */
  getAll(): Opportunity[];

  /**
   * Get opportunities filtered by domain
   */
  getByDomain(domain: OpportunityDomain): Opportunity[];

  /**
   * Clear all stored opportunities
   */
  clear(): void;
}

/**
 * Simple in-memory implementation of OpportunityStore
 * Uses a Map keyed by opportunity ID for fast upserts
 */
export class InMemoryOpportunityStore implements OpportunityStore {
  private opportunities: Map<string, Opportunity>;

  constructor() {
    this.opportunities = new Map();
  }

  upsert(opportunity: Opportunity): void {
    this.opportunities.set(opportunity.id, opportunity);
  }

  upsertMany(opportunities: Opportunity[]): void {
    for (const opp of opportunities) {
      this.opportunities.set(opp.id, opp);
    }
  }

  getAll(): Opportunity[] {
    return Array.from(this.opportunities.values());
  }

  getByDomain(domain: OpportunityDomain): Opportunity[] {
    return this.getAll().filter((opp) => opp.domain === domain);
  }

  clear(): void {
    this.opportunities.clear();
  }
}
