# @slimy/discord-mocks

Mock Discord guild/channel/member data for local testing, storybooks, and unit tests.

## Overview

This package provides TypeScript types and pre-built mock data for Discord entities including guilds, channels, and members. It is designed for use in development, testing, and UI component demonstrations.

**IMPORTANT:** This package is for **local testing only**. It does not make any external API calls and is not automatically included in any production code. You must explicitly import and use these mocks where needed.

## Installation

Since this is a monorepo package, it's available as:

```bash
# In another package's package.json
{
  "dependencies": {
    "@slimy/discord-mocks": "workspace:*"
  }
}
```

## Usage

### Guilds

```typescript
import { SMALL_TEST_GUILD, LARGE_TEST_GUILD, makeGuild } from '@slimy/discord-mocks';

// Use pre-built guild mocks
const guild = SMALL_TEST_GUILD;
console.log(guild.name); // "Small Test Server"

// Create a custom guild
const customGuild = makeGuild({
  name: 'My Custom Server',
  member_count: 100,
  features: ['COMMUNITY', 'DISCOVERABLE'],
});
```

**Available Guild Mocks:**
- `SMALL_TEST_GUILD` - A small server with 15 members, minimal features
- `LARGE_TEST_GUILD` - A large community server with 5432 members, extensive features
- `MINIMAL_GUILD` - Bare-bones guild with no extra features

### Channels

```typescript
import {
  GENERAL_TEXT_CHANNEL,
  VOICE_CHANNEL,
  CATEGORY_CHANNEL,
  makeChannel,
  ChannelType
} from '@slimy/discord-mocks';

// Use pre-built channel mocks
const channel = GENERAL_TEXT_CHANNEL;

// Create a custom channel
const customChannel = makeChannel({
  name: 'custom-chat',
  type: ChannelType.GUILD_TEXT,
  topic: 'Custom discussion channel',
  rate_limit_per_user: 5,
});
```

**Available Channel Mocks:**
- `GENERAL_TEXT_CHANNEL` - Standard text channel
- `ANNOUNCEMENTS_CHANNEL` - News/announcement channel with restricted permissions
- `VOICE_CHANNEL` - Voice chat channel
- `CATEGORY_CHANNEL` - Category for organizing channels
- `COMMUNITY_TEXT_CHANNEL` - Text channel under a category
- `NSFW_CHANNEL` - Age-restricted channel
- `THREAD_CHANNEL` - Public thread
- `FORUM_CHANNEL` - Forum channel
- `STAGE_CHANNEL` - Stage for events
- `DM_CHANNEL` - Direct message channel
- `COMMON_CHANNELS` - Array of commonly used channels

### Members

```typescript
import {
  OWNER_MEMBER,
  MODERATOR_MEMBER,
  REGULAR_MEMBER,
  BOT_MEMBER,
  makeMember,
  makeUser
} from '@slimy/discord-mocks';

// Use pre-built member mocks
const member = OWNER_MEMBER;

// Create a custom member
const customMember = makeMember({
  user: makeUser({
    username: 'TestUser123',
    discriminator: '4567',
  }),
  nick: 'Test Nickname',
  roles: ['900000000000000001', '900000000000000005'],
});
```

**Available Member Mocks:**
- `OWNER_MEMBER` - Server owner with admin permissions
- `MODERATOR_MEMBER` - Moderator with moderation permissions
- `VIP_MEMBER` - VIP member with premium status
- `REGULAR_MEMBER` - Standard member
- `NEW_MEMBER` - New member (pending verification)
- `BOT_MEMBER` - Bot user
- `MUTED_MEMBER` - Member with server mute
- `TIMED_OUT_MEMBER` - Member with timeout/communication disabled
- `CUSTOM_AVATAR_MEMBER` - Member with server-specific avatar
- `COMMON_MEMBERS` - Array of common member types
- `ALL_TEST_MEMBERS` - Array of all available member mocks

## Use Cases

### Unit Tests

```typescript
import { SMALL_TEST_GUILD, GENERAL_TEXT_CHANNEL } from '@slimy/discord-mocks';

describe('Guild Service', () => {
  it('should process guild data', () => {
    const result = processGuild(SMALL_TEST_GUILD);
    expect(result.memberCount).toBe(15);
  });
});
```

### Storybook Stories

```typescript
import { MODERATOR_MEMBER, REGULAR_MEMBER } from '@slimy/discord-mocks';

export default {
  title: 'Components/MemberCard',
  component: MemberCard,
};

export const Moderator = () => <MemberCard member={MODERATOR_MEMBER} />;
export const RegularUser = () => <MemberCard member={REGULAR_MEMBER} />;
```

### Development/Prototyping

```typescript
import { LARGE_TEST_GUILD, COMMON_CHANNELS, COMMON_MEMBERS } from '@slimy/discord-mocks';

// Mock a full server setup for UI development
const mockServer = {
  guild: LARGE_TEST_GUILD,
  channels: COMMON_CHANNELS,
  members: COMMON_MEMBERS,
};
```

## TypeScript Types

All mocks are fully typed with TypeScript:

```typescript
import type { GuildMock, ChannelMock, MemberMock, UserMock } from '@slimy/discord-mocks';

function processGuild(guild: GuildMock): void {
  // TypeScript knows the shape of the guild object
}
```

## Factory Functions

Each entity type has a factory function for creating custom mocks:

- `makeGuild(overrides?: Partial<GuildMock>): GuildMock`
- `makeChannel(overrides?: Partial<ChannelMock>): ChannelMock`
- `makeMember(overrides?: Partial<MemberMock>): MemberMock`
- `makeUser(overrides?: Partial<UserMock>): UserMock`

These functions create a default mock and merge in your custom overrides.

## Important Notes

1. **Not for Production**: These mocks are for development and testing only
2. **No External Calls**: This package makes no API calls or external requests
3. **Not Auto-Included**: You must explicitly import these mocks where you need them
4. **TypeScript First**: All types match Discord's API structure
5. **Extensible**: Use factory functions to create custom variations

## Contributing

To add new mock data:

1. Add your mock constant to the appropriate file (`guilds.ts`, `channels.ts`, or `members.ts`)
2. Export it from that file
3. Re-export it from `index.ts`
4. Update this README with documentation

## License

MIT
