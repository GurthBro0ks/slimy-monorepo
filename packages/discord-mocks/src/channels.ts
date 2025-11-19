/**
 * Mock Discord Channel data for testing and development
 */

export enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_NEWS = 5,
  GUILD_STORE = 6,
  GUILD_NEWS_THREAD = 10,
  GUILD_PUBLIC_THREAD = 11,
  GUILD_PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_DIRECTORY = 14,
  GUILD_FORUM = 15,
}

export interface PermissionOverwrite {
  id: string;
  type: number; // 0 = role, 1 = member
  allow: string;
  deny: string;
}

export interface ChannelMock {
  id: string;
  type: ChannelType;
  guild_id?: string;
  position?: number;
  permission_overwrites?: PermissionOverwrite[];
  name?: string;
  topic?: string | null;
  nsfw?: boolean;
  last_message_id?: string | null;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  recipients?: Array<{ id: string; username: string; discriminator: string; avatar: string | null }>;
  icon?: string | null;
  owner_id?: string;
  application_id?: string;
  parent_id?: string | null;
  last_pin_timestamp?: string | null;
}

/**
 * Create a custom channel mock with optional overrides
 */
export function makeChannel(overrides?: Partial<ChannelMock>): ChannelMock {
  const defaults: ChannelMock = {
    id: `${Date.now()}`,
    type: ChannelType.GUILD_TEXT,
    guild_id: '900000000000000001',
    position: 0,
    permission_overwrites: [],
    name: 'test-channel',
    topic: null,
    nsfw: false,
    last_message_id: null,
    rate_limit_per_user: 0,
    parent_id: null,
    last_pin_timestamp: null,
  };

  return { ...defaults, ...overrides };
}

/**
 * General text channel
 */
export const GENERAL_TEXT_CHANNEL: ChannelMock = {
  id: '900000000000000100',
  type: ChannelType.GUILD_TEXT,
  guild_id: '900000000000000001',
  position: 0,
  permission_overwrites: [],
  name: 'general',
  topic: 'General discussion and announcements',
  nsfw: false,
  last_message_id: '900000000000001000',
  rate_limit_per_user: 0,
  parent_id: null,
  last_pin_timestamp: '2024-01-15T10:30:00.000Z',
};

/**
 * Announcements channel
 */
export const ANNOUNCEMENTS_CHANNEL: ChannelMock = {
  id: '900000000000000101',
  type: ChannelType.GUILD_NEWS,
  guild_id: '900000000000000001',
  position: 1,
  permission_overwrites: [
    {
      id: '900000000000000001', // @everyone role
      type: 0,
      allow: '1024', // VIEW_CHANNEL
      deny: '2048', // SEND_MESSAGES
    },
    {
      id: '900000000000000002', // Moderator role
      type: 0,
      allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
      deny: '0',
    },
  ],
  name: 'announcements',
  topic: 'Important server announcements',
  nsfw: false,
  last_message_id: '900000000000001001',
  rate_limit_per_user: 0,
  parent_id: null,
  last_pin_timestamp: null,
};

/**
 * Voice channel
 */
export const VOICE_CHANNEL: ChannelMock = {
  id: '900000000000000102',
  type: ChannelType.GUILD_VOICE,
  guild_id: '900000000000000001',
  position: 2,
  permission_overwrites: [],
  name: 'Voice Chat',
  topic: null,
  nsfw: false,
  bitrate: 64000,
  user_limit: 10,
  parent_id: null,
};

/**
 * Category channel
 */
export const CATEGORY_CHANNEL: ChannelMock = {
  id: '900000000000000103',
  type: ChannelType.GUILD_CATEGORY,
  guild_id: '900000000000000001',
  position: 3,
  permission_overwrites: [],
  name: 'Community',
  nsfw: false,
};

/**
 * Text channel under category
 */
export const COMMUNITY_TEXT_CHANNEL: ChannelMock = {
  id: '900000000000000104',
  type: ChannelType.GUILD_TEXT,
  guild_id: '900000000000000001',
  position: 4,
  permission_overwrites: [],
  name: 'community-chat',
  topic: 'Community discussions',
  nsfw: false,
  last_message_id: null,
  rate_limit_per_user: 5,
  parent_id: '900000000000000103',
  last_pin_timestamp: null,
};

/**
 * NSFW channel
 */
export const NSFW_CHANNEL: ChannelMock = {
  id: '900000000000000105',
  type: ChannelType.GUILD_TEXT,
  guild_id: '900000000000000001',
  position: 5,
  permission_overwrites: [
    {
      id: '900000000000000001', // @everyone role
      type: 0,
      allow: '0',
      deny: '1024', // VIEW_CHANNEL
    },
    {
      id: '900000000000000006', // Member role
      type: 0,
      allow: '1024', // VIEW_CHANNEL
      deny: '0',
    },
  ],
  name: 'nsfw-content',
  topic: 'Age-restricted content',
  nsfw: true,
  last_message_id: null,
  rate_limit_per_user: 0,
  parent_id: null,
  last_pin_timestamp: null,
};

/**
 * Thread channel
 */
export const THREAD_CHANNEL: ChannelMock = {
  id: '900000000000000106',
  type: ChannelType.GUILD_PUBLIC_THREAD,
  guild_id: '900000000000000001',
  name: 'Discussion Thread',
  last_message_id: '900000000000001002',
  rate_limit_per_user: 0,
  parent_id: '900000000000000100',
  owner_id: '100000000000000001',
};

/**
 * Forum channel
 */
export const FORUM_CHANNEL: ChannelMock = {
  id: '900000000000000107',
  type: ChannelType.GUILD_FORUM,
  guild_id: '900000000000000002',
  position: 6,
  permission_overwrites: [],
  name: 'help-forum',
  topic: 'Ask questions and get help',
  nsfw: false,
  rate_limit_per_user: 10,
  parent_id: null,
};

/**
 * Stage channel
 */
export const STAGE_CHANNEL: ChannelMock = {
  id: '900000000000000108',
  type: ChannelType.GUILD_STAGE_VOICE,
  guild_id: '900000000000000002',
  position: 7,
  permission_overwrites: [],
  name: 'Community Events',
  topic: 'Stage for community events',
  nsfw: false,
  bitrate: 96000,
  parent_id: null,
};

/**
 * DM channel
 */
export const DM_CHANNEL: ChannelMock = {
  id: '900000000000000109',
  type: ChannelType.DM,
  last_message_id: '900000000000001003',
  recipients: [
    {
      id: '100000000000000001',
      username: 'TestUser',
      discriminator: '1234',
      avatar: 'abc123def456',
    },
  ],
};

/**
 * Collection of common test channels
 */
export const COMMON_CHANNELS: ChannelMock[] = [
  GENERAL_TEXT_CHANNEL,
  ANNOUNCEMENTS_CHANNEL,
  VOICE_CHANNEL,
  CATEGORY_CHANNEL,
  COMMUNITY_TEXT_CHANNEL,
];
