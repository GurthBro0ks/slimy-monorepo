/**
 * Mock Discord Guild data for testing and development
 */

export interface GuildMock {
  id: string;
  name: string;
  icon: string | null;
  splash: string | null;
  owner_id: string;
  region: string;
  afk_channel_id: string | null;
  afk_timeout: number;
  verification_level: number;
  default_message_notifications: number;
  explicit_content_filter: number;
  roles: Array<{
    id: string;
    name: string;
    color: number;
    hoist: boolean;
    position: number;
    permissions: string;
    managed: boolean;
    mentionable: boolean;
  }>;
  emojis: Array<{
    id: string;
    name: string;
    roles: string[];
    require_colons: boolean;
    managed: boolean;
    animated: boolean;
  }>;
  features: string[];
  mfa_level: number;
  application_id: string | null;
  system_channel_id: string | null;
  member_count?: number;
  premium_tier: number;
  premium_subscription_count?: number;
  preferred_locale: string;
  description: string | null;
}

/**
 * Create a custom guild mock with optional overrides
 */
export function makeGuild(overrides?: Partial<GuildMock>): GuildMock {
  const defaults: GuildMock = {
    id: `${Date.now()}`,
    name: 'Test Guild',
    icon: null,
    splash: null,
    owner_id: '123456789012345678',
    region: 'us-west',
    afk_channel_id: null,
    afk_timeout: 300,
    verification_level: 1,
    default_message_notifications: 0,
    explicit_content_filter: 0,
    roles: [
      {
        id: '1',
        name: '@everyone',
        color: 0,
        hoist: false,
        position: 0,
        permissions: '104324097',
        managed: false,
        mentionable: false,
      },
    ],
    emojis: [],
    features: [],
    mfa_level: 0,
    application_id: null,
    system_channel_id: null,
    member_count: 1,
    premium_tier: 0,
    premium_subscription_count: 0,
    preferred_locale: 'en-US',
    description: null,
  };

  return { ...defaults, ...overrides };
}

/**
 * Small test guild with minimal setup
 */
export const SMALL_TEST_GUILD: GuildMock = {
  id: '900000000000000001',
  name: 'Small Test Server',
  icon: '5a3b6c8d9e0f1a2b3c4d5e6f',
  splash: null,
  owner_id: '100000000000000001',
  region: 'us-east',
  afk_channel_id: null,
  afk_timeout: 300,
  verification_level: 1,
  default_message_notifications: 0,
  explicit_content_filter: 0,
  roles: [
    {
      id: '900000000000000001',
      name: '@everyone',
      color: 0,
      hoist: false,
      position: 0,
      permissions: '104324097',
      managed: false,
      mentionable: false,
    },
    {
      id: '900000000000000002',
      name: 'Moderator',
      color: 3447003,
      hoist: true,
      position: 1,
      permissions: '8',
      managed: false,
      mentionable: true,
    },
  ],
  emojis: [
    {
      id: '900000000000000010',
      name: 'poggers',
      roles: [],
      require_colons: true,
      managed: false,
      animated: false,
    },
  ],
  features: ['COMMUNITY', 'NEWS'],
  mfa_level: 0,
  application_id: null,
  system_channel_id: '900000000000000100',
  member_count: 15,
  premium_tier: 1,
  premium_subscription_count: 2,
  preferred_locale: 'en-US',
  description: 'A small test server for development',
};

/**
 * Large test guild with extensive features
 */
export const LARGE_TEST_GUILD: GuildMock = {
  id: '900000000000000002',
  name: 'Large Community Server',
  icon: 'a1b2c3d4e5f6a7b8c9d0e1f2',
  splash: 'b2c3d4e5f6a7b8c9d0e1f2a3',
  owner_id: '100000000000000002',
  region: 'us-west',
  afk_channel_id: '900000000000000250',
  afk_timeout: 600,
  verification_level: 2,
  default_message_notifications: 1,
  explicit_content_filter: 2,
  roles: [
    {
      id: '900000000000000002',
      name: '@everyone',
      color: 0,
      hoist: false,
      position: 0,
      permissions: '104324097',
      managed: false,
      mentionable: false,
    },
    {
      id: '900000000000000003',
      name: 'Admin',
      color: 15158332,
      hoist: true,
      position: 5,
      permissions: '8',
      managed: false,
      mentionable: false,
    },
    {
      id: '900000000000000004',
      name: 'Moderator',
      color: 3447003,
      hoist: true,
      position: 4,
      permissions: '268446806',
      managed: false,
      mentionable: true,
    },
    {
      id: '900000000000000005',
      name: 'VIP',
      color: 15844367,
      hoist: true,
      position: 3,
      permissions: '104324161',
      managed: false,
      mentionable: true,
    },
    {
      id: '900000000000000006',
      name: 'Member',
      color: 9807270,
      hoist: false,
      position: 1,
      permissions: '104324097',
      managed: false,
      mentionable: false,
    },
  ],
  emojis: [
    {
      id: '900000000000000020',
      name: 'pepe',
      roles: [],
      require_colons: true,
      managed: false,
      animated: false,
    },
    {
      id: '900000000000000021',
      name: 'dancing',
      roles: [],
      require_colons: true,
      managed: false,
      animated: true,
    },
    {
      id: '900000000000000022',
      name: 'party',
      roles: ['900000000000000005'],
      require_colons: true,
      managed: false,
      animated: true,
    },
  ],
  features: [
    'COMMUNITY',
    'NEWS',
    'DISCOVERABLE',
    'WELCOME_SCREEN_ENABLED',
    'BANNER',
    'ANIMATED_ICON',
  ],
  mfa_level: 1,
  application_id: null,
  system_channel_id: '900000000000000200',
  member_count: 5432,
  premium_tier: 3,
  premium_subscription_count: 25,
  preferred_locale: 'en-US',
  description: 'A large community server with many members and features',
};

/**
 * Minimal guild for basic testing
 */
export const MINIMAL_GUILD: GuildMock = {
  id: '900000000000000003',
  name: 'Minimal Server',
  icon: null,
  splash: null,
  owner_id: '100000000000000003',
  region: 'europe',
  afk_channel_id: null,
  afk_timeout: 300,
  verification_level: 0,
  default_message_notifications: 0,
  explicit_content_filter: 0,
  roles: [
    {
      id: '900000000000000003',
      name: '@everyone',
      color: 0,
      hoist: false,
      position: 0,
      permissions: '104324097',
      managed: false,
      mentionable: false,
    },
  ],
  emojis: [],
  features: [],
  mfa_level: 0,
  application_id: null,
  system_channel_id: null,
  member_count: 1,
  premium_tier: 0,
  premium_subscription_count: 0,
  preferred_locale: 'en-GB',
  description: null,
};
