/**
 * @slimy/discord-mocks
 *
 * Mock Discord guild/channel/member data for testing and development.
 * This package provides TypeScript types and pre-built mock data for Discord entities.
 *
 * Usage:
 * ```typescript
 * import { SMALL_TEST_GUILD, GENERAL_TEXT_CHANNEL, OWNER_MEMBER } from '@slimy/discord-mocks';
 * import { makeGuild, makeChannel, makeMember } from '@slimy/discord-mocks';
 *
 * // Use pre-built mocks
 * const guild = SMALL_TEST_GUILD;
 *
 * // Or create custom mocks
 * const customGuild = makeGuild({ name: 'My Custom Server', member_count: 100 });
 * ```
 */

// Re-export all guild types and mocks
export type { GuildMock } from './guilds';
export {
  makeGuild,
  SMALL_TEST_GUILD,
  LARGE_TEST_GUILD,
  MINIMAL_GUILD,
} from './guilds';

// Re-export all channel types and mocks
export type { ChannelMock, PermissionOverwrite } from './channels';
export {
  ChannelType,
  makeChannel,
  GENERAL_TEXT_CHANNEL,
  ANNOUNCEMENTS_CHANNEL,
  VOICE_CHANNEL,
  CATEGORY_CHANNEL,
  COMMUNITY_TEXT_CHANNEL,
  NSFW_CHANNEL,
  THREAD_CHANNEL,
  FORUM_CHANNEL,
  STAGE_CHANNEL,
  DM_CHANNEL,
  COMMON_CHANNELS,
} from './channels';

// Re-export all member types and mocks
export type { MemberMock, UserMock } from './members';
export {
  makeUser,
  makeMember,
  OWNER_MEMBER,
  MODERATOR_MEMBER,
  VIP_MEMBER,
  REGULAR_MEMBER,
  NEW_MEMBER,
  BOT_MEMBER,
  MUTED_MEMBER,
  TIMED_OUT_MEMBER,
  CUSTOM_AVATAR_MEMBER,
  COMMON_MEMBERS,
  ALL_TEST_MEMBERS,
} from './members';
