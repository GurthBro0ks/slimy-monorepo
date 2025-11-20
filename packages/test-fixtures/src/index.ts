/**
 * @slimy-monorepo/test-fixtures
 *
 * Reusable test data and fixture library for snails, guilds, users, and minecraft stats.
 *
 * This package provides strongly-typed factory functions and canned constants
 * for testing purposes. All fixtures are pure and deterministic (no network calls).
 *
 * @example
 * import { makeUser, DEMO_USER_PREMIUM, makeGuild } from '@slimy-monorepo/test-fixtures';
 *
 * const user = makeUser({ username: 'custom_user' });
 * const premiumUser = DEMO_USER_PREMIUM;
 * const guild = makeGuild({ name: 'My Test Guild' });
 */

// Re-export all snail fixtures
export * from './snails';

// Re-export all guild fixtures
export * from './guilds';

// Re-export all user fixtures
export * from './users';

// Re-export all minecraft/stats fixtures
export * from './minecraft';
