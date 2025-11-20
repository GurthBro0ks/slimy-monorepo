import { Opportunity, OpportunityStore } from "./types";

/**
 * Simple in-memory opportunity store
 */
export class InMemoryOpportunityStore implements OpportunityStore {
  public opportunities: Opportunity[] = [];

  addOpportunity(opp: Opportunity): void {
    this.opportunities.push(opp);
  }

  addOpportunities(opps: Opportunity[]): void {
    this.opportunities.push(...opps);
  }

  getAll(): Opportunity[] {
    return [...this.opportunities];
  }

  filter(predicate: (opp: Opportunity) => boolean): Opportunity[] {
    return this.opportunities.filter(predicate);
  }

  clear(): void {
    this.opportunities = [];
  }
}

/**
 * Create a new opportunity store
 */
export function createOpportunityStore(): OpportunityStore {
  return new InMemoryOpportunityStore();
}
