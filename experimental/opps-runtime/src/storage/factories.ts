/**
 * Factory functions for creating storage instances
 */

import { OpportunityStore, UserHistoryStore } from "./interfaces";
import { InMemoryOpportunityStore } from "./inMemoryStore";
import { InMemoryUserHistoryStore } from "../history/inMemoryHistoryStore";

/**
 * Creates default store instances using in-memory implementations
 *
 * This is the recommended way to instantiate stores for the runtime.
 * Currently returns in-memory stores, but can be updated in the future
 * to return database-backed stores based on configuration.
 *
 * @returns Object containing opportunityStore and userHistoryStore instances
 */
export function createDefaultStores(): {
  opportunityStore: OpportunityStore;
  userHistoryStore: UserHistoryStore;
} {
  return {
    opportunityStore: new InMemoryOpportunityStore(),
    userHistoryStore: new InMemoryUserHistoryStore(),
  };
}
