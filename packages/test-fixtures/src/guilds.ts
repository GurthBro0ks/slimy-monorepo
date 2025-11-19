/**
 * Guild Test Fixtures
 *
 * Factory functions and canned constants for Guild testing.
 * Based on the Prisma Guild model.
 */

export interface Guild {
  id: string;
  discordId: string;
  name: string;
  settings: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a Guild with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 *
 * @example
 * const guild = makeGuild({ name: 'Custom Guild' });
 */
export function makeGuild(overrides?: Partial<Guild>): Guild {
  const now = new Date('2025-01-15T10:00:00Z');
  const defaults: Guild = {
    id: 'guild-1',
    discordId: '123456789012345678',
    name: 'Test Guild',
    settings: {
      prefix: '!',
      language: 'en',
      timezone: 'UTC',
    },
    createdAt: now,
    updatedAt: now,
  };

  return { ...defaults, ...overrides };
}

/**
 * A small guild with minimal settings.
 */
export const DEMO_GUILD_SMALL: Guild = {
  id: 'guild-small',
  discordId: '111111111111111111',
  name: 'Snail Enthusiasts',
  settings: {
    prefix: '!',
    welcomeMessage: 'Welcome to our small community!',
  },
  createdAt: new Date('2024-06-01T00:00:00Z'),
  updatedAt: new Date('2024-06-01T00:00:00Z'),
};

/**
 * A large guild with comprehensive settings.
 */
export const DEMO_GUILD_LARGE: Guild = {
  id: 'guild-large',
  discordId: '999999999999999999',
  name: 'Elite Snail Racing League',
  settings: {
    prefix: '$',
    language: 'en',
    timezone: 'America/New_York',
    moderationLevel: 'strict',
    welcomeMessage: 'Welcome to the premier snail racing community!',
    autoRole: 'member',
    loggingChannel: '777777777777777777',
    features: ['tournaments', 'leaderboards', 'analytics'],
  },
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-15T12:00:00Z'),
};

/**
 * A guild with no custom settings (null).
 */
export const DEMO_GUILD_NO_SETTINGS: Guild = {
  id: 'guild-no-settings',
  discordId: '222222222222222222',
  name: 'Default Guild',
  settings: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

/**
 * A newly created guild.
 */
export const DEMO_GUILD_NEW: Guild = {
  id: 'guild-new',
  discordId: '333333333333333333',
  name: 'Fresh Start',
  settings: {
    prefix: '/',
  },
  createdAt: new Date('2025-01-19T00:00:00Z'),
  updatedAt: new Date('2025-01-19T00:00:00Z'),
};
