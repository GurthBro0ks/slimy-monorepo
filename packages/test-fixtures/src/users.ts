/**
 * User Test Fixtures
 *
 * Factory functions and canned constants for User testing.
 * Based on the Prisma User model.
 */

export interface User {
  id: string;
  discordId: string;
  username: string | null;
  globalName: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a User with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 *
 * @example
 * const user = makeUser({ username: 'testuser123' });
 */
export function makeUser(overrides?: Partial<User>): User {
  const now = new Date('2025-01-15T10:00:00Z');
  const defaults: User = {
    id: 'user-1',
    discordId: '987654321098765432',
    username: 'testuser',
    globalName: 'Test User',
    avatar: 'avatar-hash-123',
    createdAt: now,
    updatedAt: now,
  };

  return { ...defaults, ...overrides };
}

/**
 * A premium user with full profile.
 */
export const DEMO_USER_PREMIUM: User = {
  id: 'user-premium',
  discordId: '100000000000000001',
  username: 'snailmaster',
  globalName: 'Snail Master',
  avatar: 'premium-avatar-hash',
  createdAt: new Date('2023-03-15T08:30:00Z'),
  updatedAt: new Date('2025-01-15T14:20:00Z'),
};

/**
 * A new user with minimal profile.
 */
export const DEMO_USER_NEW: User = {
  id: 'user-new',
  discordId: '100000000000000002',
  username: 'newbie',
  globalName: 'New Player',
  avatar: null,
  createdAt: new Date('2025-01-18T20:00:00Z'),
  updatedAt: new Date('2025-01-18T20:00:00Z'),
};

/**
 * A user with no username set (only Discord ID).
 */
export const DEMO_USER_NO_USERNAME: User = {
  id: 'user-no-username',
  discordId: '100000000000000003',
  username: null,
  globalName: null,
  avatar: null,
  createdAt: new Date('2025-01-10T12:00:00Z'),
  updatedAt: new Date('2025-01-10T12:00:00Z'),
};

/**
 * A moderator user.
 */
export const DEMO_USER_MODERATOR: User = {
  id: 'user-mod',
  discordId: '100000000000000004',
  username: 'mod_snailguard',
  globalName: 'SnailGuard Moderator',
  avatar: 'mod-shield-avatar',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-15T10:00:00Z'),
};

/**
 * An admin user.
 */
export const DEMO_USER_ADMIN: User = {
  id: 'user-admin',
  discordId: '100000000000000005',
  username: 'admin_supreme',
  globalName: 'Supreme Admin',
  avatar: 'admin-crown-avatar',
  createdAt: new Date('2022-06-01T00:00:00Z'),
  updatedAt: new Date('2025-01-15T10:00:00Z'),
};
