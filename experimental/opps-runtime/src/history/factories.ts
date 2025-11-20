/**
 * Factory functions for creating test events.
 *
 * These helpers provide a consistent way to create UserOpportunityEvent objects
 * in tests and other code.
 */

import { randomUUID } from "crypto";
import type { UserOpportunityEvent, UserOpportunityAction } from "./types";

/**
 * Parameters for creating a user event.
 * id and createdAt are optional and will be auto-generated if not provided.
 */
export type CreateUserEventParams = Partial<UserOpportunityEvent> & {
  userId: string;
  opportunityId: string;
  action: UserOpportunityAction;
};

/**
 * Create a UserOpportunityEvent with sensible defaults.
 *
 * @param params - Event parameters (userId, opportunityId, action required)
 * @returns A complete UserOpportunityEvent
 *
 * @example
 * ```typescript
 * const event = createUserEvent({
 *   userId: 'user-123',
 *   opportunityId: 'opp-456',
 *   action: 'accepted',
 *   metadata: { domain: 'crypto', type: 'investment' }
 * });
 * ```
 */
export function createUserEvent(params: CreateUserEventParams): UserOpportunityEvent {
  return {
    id: params.id ?? randomUUID(),
    userId: params.userId,
    opportunityId: params.opportunityId,
    action: params.action,
    createdAt: params.createdAt ?? new Date().toISOString(),
    metadata: params.metadata,
  };
}

/**
 * Create multiple user events with sequential timestamps.
 *
 * Useful for creating a realistic event history where events
 * are separated by a consistent time interval.
 *
 * @param baseParams - Base parameters shared by all events
 * @param count - Number of events to create
 * @param intervalMs - Milliseconds between each event (default: 1000)
 * @returns Array of UserOpportunityEvent objects
 *
 * @example
 * ```typescript
 * const events = createUserEvents(
 *   { userId: 'user-123', opportunityId: 'opp-456', action: 'shown' },
 *   5,
 *   2000 // 2 seconds apart
 * );
 * ```
 */
export function createUserEvents(
  baseParams: Omit<CreateUserEventParams, "createdAt">,
  count: number,
  intervalMs: number = 1000
): UserOpportunityEvent[] {
  const events: UserOpportunityEvent[] = [];
  const baseTime = new Date();

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(baseTime.getTime() + i * intervalMs).toISOString();
    events.push(
      createUserEvent({
        ...baseParams,
        createdAt,
      })
    );
  }

  return events;
}
