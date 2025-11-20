/**
 * User history and analytics types for tracking opportunity interactions.
 */

/**
 * Actions a user can take on an opportunity
 */
export type UserOpportunityAction = "shown" | "accepted" | "completed" | "ignored";

/**
 * A single event representing a user's interaction with an opportunity
 */
export interface UserOpportunityEvent {
  /** Unique event identifier */
  id: string;
  /** User who performed the action */
  userId: string;
  /** Opportunity that was interacted with */
  opportunityId: string;
  /** Type of action taken */
  action: UserOpportunityAction;
  /** ISO timestamp when the event occurred */
  createdAt: string;
  /** Optional additional data about the event */
  metadata?: Record<string, unknown>;
}

/**
 * A snapshot of a user's complete interaction history
 */
export interface UserHistorySnapshot {
  /** User identifier */
  userId: string;
  /** All events for this user, ordered by createdAt */
  events: UserOpportunityEvent[];
  /** ISO timestamp of the first event, or null if no events */
  firstEventAt?: string | null;
  /** ISO timestamp of the most recent event, or null if no events */
  lastEventAt?: string | null;
}
