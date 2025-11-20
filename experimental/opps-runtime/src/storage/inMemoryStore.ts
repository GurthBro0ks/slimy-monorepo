/**
 * In-memory implementation of OpportunityStore
 */

import { Opportunity, OpportunityDomain } from "../../../opps-core/src/types";
import { OpportunityStore } from "./interfaces";

/**
 * Simple in-memory storage for opportunities using a Map
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
    for (const opportunity of opportunities) {
      this.opportunities.set(opportunity.id, opportunity);
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
