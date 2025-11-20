/**
 * Postgres-backed implementation of UserHistoryStore (STUB)
 * This is a placeholder for future database integration
 */

import { UserHistoryStore } from "./interfaces";
import { UserOpportunityEvent, UserHistorySnapshot } from "../history/types";

/**
 * Database-backed user history store using PostgreSQL
 * NOT IMPLEMENTED - throws errors when methods are called
 *
 * This is a placeholder to establish the interface contract
 * for future database integration without affecting current
 * in-memory runtime behavior.
 */
export class PostgresUserHistoryStore implements UserHistoryStore {
  private dbClient: any;

  /**
   * @param dbClient - A Postgres client or pool instance (any type for now)
   */
  constructor(dbClient: any) {
    this.dbClient = dbClient;
  }

  logEvent(_event: UserOpportunityEvent): void {
    throw new Error("PostgresUserHistoryStore not implemented in experimental build");
  }

  logEvents(_events: UserOpportunityEvent[]): void {
    throw new Error("PostgresUserHistoryStore not implemented in experimental build");
  }

  getHistoryForUser(_userId: string): UserHistorySnapshot {
    throw new Error("PostgresUserHistoryStore not implemented in experimental build");
  }

  clearUser(_userId: string): void {
    throw new Error("PostgresUserHistoryStore not implemented in experimental build");
  }

  clearAll(): void {
    throw new Error("PostgresUserHistoryStore not implemented in experimental build");
  }
}
