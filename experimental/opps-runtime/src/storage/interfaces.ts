/**
 * Storage interfaces for opportunity and user history persistence
 */

import { Opportunity, OpportunityDomain } from "../../../opps-core/src/types";
import { UserOpportunityEvent, UserHistorySnapshot } from "../history/types";

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
   * Retrieve all opportunities
   */
  getAll(): Opportunity[];

  /**
   * Retrieve opportunities filtered by domain
   */
  getByDomain(domain: OpportunityDomain): Opportunity[];

  /**
   * Clear all opportunities from storage
   */
  clear(): void;
}

/**
 * Interface for user history storage operations
 */
export interface UserHistoryStore {
  /**
   * Log a single user-opportunity event
   */
  logEvent(event: UserOpportunityEvent): void;

  /**
   * Log multiple user-opportunity events
   */
  logEvents(events: UserOpportunityEvent[]): void;

  /**
   * Retrieve complete history for a specific user
   */
  getHistoryForUser(userId: string): UserHistorySnapshot;

  /**
   * Clear history for a specific user
   */
  clearUser(userId: string): void;

  /**
   * Clear all user history
   */
  clearAll(): void;
}
