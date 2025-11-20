/**
 * In-memory implementation of UserHistoryStore
 */

import { UserHistoryStore } from "../storage/interfaces";
import { UserOpportunityEvent, UserHistorySnapshot } from "./types";

/**
 * Simple in-memory storage for user opportunity history
 * Events are stored per-user in a Map
 */
export class InMemoryUserHistoryStore implements UserHistoryStore {
  private eventsByUser: Map<string, UserOpportunityEvent[]>;

  constructor() {
    this.eventsByUser = new Map();
  }

  logEvent(event: UserOpportunityEvent): void {
    const userEvents = this.eventsByUser.get(event.userId) || [];
    userEvents.push(event);
    this.eventsByUser.set(event.userId, userEvents);
  }

  logEvents(events: UserOpportunityEvent[]): void {
    for (const event of events) {
      this.logEvent(event);
    }
  }

  getHistoryForUser(userId: string): UserHistorySnapshot {
    const events = this.eventsByUser.get(userId) || [];
    const lastEventAt = events.length > 0
      ? events[events.length - 1].timestamp
      : undefined;

    return {
      userId,
      events,
      totalEvents: events.length,
      lastEventAt,
    };
  }

  clearUser(userId: string): void {
    this.eventsByUser.delete(userId);
  }

  clearAll(): void {
    this.eventsByUser.clear();
  }
}
