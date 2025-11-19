/**
 * Snail Event Test Fixtures
 *
 * Factory functions and canned constants for SnailEvent testing.
 */

export interface SnailEvent {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  details: string;
}

/**
 * Creates a SnailEvent with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 *
 * @example
 * const event = makeSnailEvent({ title: 'Custom Event' });
 */
export function makeSnailEvent(overrides?: Partial<SnailEvent>): SnailEvent {
  const defaults: SnailEvent = {
    id: 'snail-evt-1',
    timestamp: '2025-01-15T10:00:00Z',
    type: 'race',
    title: 'Sample Snail Race',
    details: 'A thrilling race event for snails.',
  };

  return { ...defaults, ...overrides };
}

/**
 * A maxed-out snail event with high stats.
 */
export const DEMO_SNAIL_MAXED: SnailEvent = {
  id: 'snail-evt-maxed',
  timestamp: '2025-01-20T14:30:00Z',
  type: 'championship',
  title: 'Snail Championship Finals',
  details: 'The ultimate championship event for elite snails. Maximum difficulty and prestige.',
};

/**
 * A beginner-level snail event.
 */
export const DEMO_SNAIL_BEGINNER: SnailEvent = {
  id: 'snail-evt-beginner',
  timestamp: '2025-01-10T08:00:00Z',
  type: 'tutorial',
  title: 'Snail Training Session',
  details: 'A gentle introduction to snail racing for newcomers.',
};

/**
 * A special event for rare snails.
 */
export const DEMO_SNAIL_RARE_EVENT: SnailEvent = {
  id: 'snail-evt-rare',
  timestamp: '2025-01-25T18:00:00Z',
  type: 'special',
  title: 'Midnight Snail Festival',
  details: 'A rare festival celebrating the most extraordinary snails in the realm.',
};
