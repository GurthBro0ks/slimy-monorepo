/**
 * @slimy/opps-runtime
 *
 * Runtime utilities for the Opportunity Radar system.
 */

// Re-export core types for convenience
export * from "@slimy/opps-core";

// History and analytics exports
export * from "./history/types";
export { InMemoryUserHistoryStore } from "./history/inMemoryHistoryStore";
export type { UserHistoryStore } from "./history/inMemoryHistoryStore";
export * from "./history/analytics";
export * from "./history/factories";
