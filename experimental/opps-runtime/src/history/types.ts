/**
 * Types for user opportunity history tracking
 */

/**
 * Event types for user-opportunity interactions
 */
export type UserOpportunityEventType =
  | "viewed"
  | "saved"
  | "dismissed"
  | "applied"
  | "completed"
  | "archived";

/**
 * A single event in user-opportunity history
 */
export interface UserOpportunityEvent {
  id: string;
  userId: string;
  opportunityId: string;
  eventType: UserOpportunityEventType;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Snapshot of a user's opportunity history
 */
export interface UserHistorySnapshot {
  userId: string;
  events: UserOpportunityEvent[];
  totalEvents: number;
  lastEventAt?: Date;
}
