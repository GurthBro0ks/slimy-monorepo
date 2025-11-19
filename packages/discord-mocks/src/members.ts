/**
 * Mock Discord Member data for testing and development
 */

export interface UserMock {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export interface MemberMock {
  user: UserMock;
  nick: string | null;
  avatar?: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf: boolean;
  mute: boolean;
  pending?: boolean;
  permissions?: string;
  communication_disabled_until?: string | null;
}

/**
 * Create a custom user mock with optional overrides
 */
export function makeUser(overrides?: Partial<UserMock>): UserMock {
  const defaults: UserMock = {
    id: `${Date.now()}`,
    username: 'TestUser',
    discriminator: '0001',
    avatar: null,
    bot: false,
    system: false,
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a custom member mock with optional overrides
 */
export function makeMember(overrides?: Partial<MemberMock>): MemberMock {
  const defaults: MemberMock = {
    user: makeUser(),
    nick: null,
    roles: ['900000000000000001'], // @everyone role
    joined_at: new Date().toISOString(),
    premium_since: null,
    deaf: false,
    mute: false,
    pending: false,
  };

  return { ...defaults, ...overrides };
}

/**
 * Server owner member
 */
export const OWNER_MEMBER: MemberMock = {
  user: {
    id: '100000000000000001',
    username: 'ServerOwner',
    discriminator: '0001',
    avatar: 'a1b2c3d4e5f6a7b8c9d0e1f2',
    bot: false,
  },
  nick: 'The Boss',
  roles: ['900000000000000001', '900000000000000003'], // @everyone + Admin
  joined_at: '2020-01-01T00:00:00.000Z',
  premium_since: '2020-02-01T00:00:00.000Z',
  deaf: false,
  mute: false,
  pending: false,
  permissions: '8', // Administrator
};

/**
 * Moderator member
 */
export const MODERATOR_MEMBER: MemberMock = {
  user: {
    id: '100000000000000002',
    username: 'ModeratorUser',
    discriminator: '0002',
    avatar: 'b2c3d4e5f6a7b8c9d0e1f2a3',
    bot: false,
  },
  nick: 'Mod Squad',
  roles: ['900000000000000001', '900000000000000004'], // @everyone + Moderator
  joined_at: '2020-03-15T00:00:00.000Z',
  premium_since: null,
  deaf: false,
  mute: false,
  pending: false,
  permissions: '268446806', // Moderator permissions
};

/**
 * VIP member
 */
export const VIP_MEMBER: MemberMock = {
  user: {
    id: '100000000000000003',
    username: 'VIPUser',
    discriminator: '0003',
    avatar: 'c3d4e5f6a7b8c9d0e1f2a3b4',
    bot: false,
  },
  nick: 'VIP Person',
  roles: ['900000000000000001', '900000000000000005'], // @everyone + VIP
  joined_at: '2021-06-20T00:00:00.000Z',
  premium_since: '2022-01-01T00:00:00.000Z',
  deaf: false,
  mute: false,
  pending: false,
};

/**
 * Regular member
 */
export const REGULAR_MEMBER: MemberMock = {
  user: {
    id: '100000000000000004',
    username: 'RegularUser',
    discriminator: '0004',
    avatar: 'd4e5f6a7b8c9d0e1f2a3b4c5',
    bot: false,
  },
  nick: null,
  roles: ['900000000000000001', '900000000000000006'], // @everyone + Member
  joined_at: '2023-01-10T00:00:00.000Z',
  premium_since: null,
  deaf: false,
  mute: false,
  pending: false,
};

/**
 * New member (pending)
 */
export const NEW_MEMBER: MemberMock = {
  user: {
    id: '100000000000000005',
    username: 'NewUser',
    discriminator: '0005',
    avatar: null,
    bot: false,
  },
  nick: null,
  roles: ['900000000000000001'], // @everyone only
  joined_at: new Date().toISOString(),
  premium_since: null,
  deaf: false,
  mute: false,
  pending: true,
};

/**
 * Bot member
 */
export const BOT_MEMBER: MemberMock = {
  user: {
    id: '100000000000000006',
    username: 'TestBot',
    discriminator: '0000',
    avatar: 'e5f6a7b8c9d0e1f2a3b4c5d6',
    bot: true,
    verified: true,
  },
  nick: 'Helper Bot',
  roles: ['900000000000000001'],
  joined_at: '2020-05-01T00:00:00.000Z',
  premium_since: null,
  deaf: false,
  mute: false,
  pending: false,
};

/**
 * Muted member
 */
export const MUTED_MEMBER: MemberMock = {
  user: {
    id: '100000000000000007',
    username: 'MutedUser',
    discriminator: '0007',
    avatar: null,
    bot: false,
  },
  nick: null,
  roles: ['900000000000000001'],
  joined_at: '2022-08-15T00:00:00.000Z',
  premium_since: null,
  deaf: false,
  mute: true,
  pending: false,
  communication_disabled_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Muted for 24h
};

/**
 * Timed out member
 */
export const TIMED_OUT_MEMBER: MemberMock = {
  user: {
    id: '100000000000000008',
    username: 'TimedOutUser',
    discriminator: '0008',
    avatar: 'f6a7b8c9d0e1f2a3b4c5d6e7',
    bot: false,
  },
  nick: null,
  roles: ['900000000000000001'],
  joined_at: '2021-11-20T00:00:00.000Z',
  premium_since: null,
  deaf: false,
  mute: false,
  pending: false,
  communication_disabled_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Timed out for 7 days
};

/**
 * Member with custom avatar
 */
export const CUSTOM_AVATAR_MEMBER: MemberMock = {
  user: {
    id: '100000000000000009',
    username: 'CustomUser',
    discriminator: '0009',
    avatar: 'a1a2a3a4a5a6a7a8a9a0b1b2',
    bot: false,
  },
  nick: 'Cool Nickname',
  avatar: 'c1c2c3c4c5c6c7c8c9c0d1d2', // Server-specific avatar
  roles: ['900000000000000001', '900000000000000005'],
  joined_at: '2023-03-15T00:00:00.000Z',
  premium_since: null,
  deaf: false,
  mute: false,
  pending: false,
};

/**
 * Collection of common test members
 */
export const COMMON_MEMBERS: MemberMock[] = [
  OWNER_MEMBER,
  MODERATOR_MEMBER,
  VIP_MEMBER,
  REGULAR_MEMBER,
  BOT_MEMBER,
];

/**
 * Collection of all test members
 */
export const ALL_TEST_MEMBERS: MemberMock[] = [
  OWNER_MEMBER,
  MODERATOR_MEMBER,
  VIP_MEMBER,
  REGULAR_MEMBER,
  NEW_MEMBER,
  BOT_MEMBER,
  MUTED_MEMBER,
  TIMED_OUT_MEMBER,
  CUSTOM_AVATAR_MEMBER,
];
