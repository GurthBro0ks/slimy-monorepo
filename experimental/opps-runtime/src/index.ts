/**
 * opps-runtime package exports
 * Runtime implementations and storage adapters for the Opportunities system
 */

// Storage interfaces
export type { OpportunityStore, UserHistoryStore } from "./storage/interfaces";

// History types
export type {
  UserOpportunityEvent,
  UserOpportunityEventType,
  UserHistorySnapshot,
} from "./history/types";

// In-memory implementations
export { InMemoryOpportunityStore } from "./storage/inMemoryStore";
export { InMemoryUserHistoryStore } from "./history/inMemoryHistoryStore";

// Stub database implementations (not yet functional)
export { PrismaOpportunityStore } from "./storage/prismaOpportunityStore";
export { PostgresUserHistoryStore } from "./storage/postgresUserHistoryStore";

// Factory functions
export { createDefaultStores } from "./storage/factories";
