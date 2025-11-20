/**
 * In-memory storage for user opportunity interaction history.
 */

import type { UserOpportunityEvent, UserHistorySnapshot } from "./types";

/**
 * Interface for storing and retrieving user interaction history
 */
export interface UserHistoryStore {
  /** Log a single event */
  logEvent(event: UserOpportunityEvent): void;

  /** Log multiple events at once */
  logEvents(events: UserOpportunityEvent[]): void;

  /** Retrieve all history for a specific user */
  getHistoryForUser(userId: string): UserHistorySnapshot;

  /** Clear all history for a specific user */
  clearUser(userId: string): void;

  /** Clear all history for all users */
  clearAll(): void;
}

/**
 * Simple in-memory implementation of UserHistoryStore.
 *
 * Note: This is not suitable for production use as data is lost on restart.
 * For production, consider a database-backed implementation.
 */
export class InMemoryUserHistoryStore implements UserHistoryStore {
  /**
   * Internal storage: Map of userId to array of events
   */
  private store: Map<string, UserOpportunityEvent[]>;

  constructor() {
    this.store = new Map();
  }

  /**
   * Log a single event for a user
   */
  logEvent(event: UserOpportunityEvent): void {
    const userEvents = this.store.get(event.userId) || [];
    userEvents.push(event);
    this.store.set(event.userId, userEvents);
  }

  /**
   * Log multiple events at once (more efficient for bulk operations)
   */
  logEvents(events: UserOpportunityEvent[]): void {
    for (const event of events) {
      this.logEvent(event);
    }
  }

  /**
   * Get complete history for a user
   *
   * @param userId - The user to retrieve history for
   * @returns A snapshot of the user's interaction history
   */
  getHistoryForUser(userId: string): UserHistorySnapshot {
    const events = this.store.get(userId) || [];

    // Sort events by timestamp (oldest first)
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate first and last event timestamps
    const firstEventAt = sortedEvents.length > 0
      ? sortedEvents[0].createdAt
      : null;
    const lastEventAt = sortedEvents.length > 0
      ? sortedEvents[sortedEvents.length - 1].createdAt
      : null;

    return {
      userId,
      events: sortedEvents,
      firstEventAt,
      lastEventAt,
    };
  }

  /**
   * Clear all history for a specific user
   */
  clearUser(userId: string): void {
    this.store.delete(userId);
  }

  /**
   * Clear all history for all users
   */
  clearAll(): void {
    this.store.clear();
  }
}
