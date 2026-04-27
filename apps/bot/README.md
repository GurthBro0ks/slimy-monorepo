# Slimy Discord Bot

Discord bot for Slimy.ai club analytics and user interactions.

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## Structure

```
apps/bot/
├── src/
│   ├── index.ts          # Entry point (scaffold)
│   └── utils/
│       ├── parsing.ts    # Number parsing and Discord mention extraction
│       └── stats.ts      # Basic statistics calculations
├── tests/
│   └── utils/            # Unit tests for utilities
├── dist/                 # Compiled JavaScript (generated)
└── package.json
```

## Commands

### `/read-channel`

Exports a Discord text channel or thread to an Obsidian-friendly Markdown file
under `/home/slimy/kb/raw/discord-exports/YYYY-MM-DD/`.

Options:

- `channel` - optional channel or thread, defaults to the current channel.
- `limit` - optional max message count. `0` means all available history up to `10000`.
- `include_attachments` - optional, defaults to `true`.
- `include_embeds` - optional, defaults to `true`.

Access is limited to members with **Manage Channels** or the role configured by
`READ_CHANNEL_ROLE_ID`. After writing the local Markdown file, the command runs
`bash /home/slimy/kb/tools/kb-sync.sh push` and reports whether the KB sync
succeeded.

Parent channel exports do not recurse into threads. Select a specific thread to
export thread history.

### `/read-thread`

Exports a Discord thread to an Obsidian-friendly Markdown file. Same options as
`/read-channel` except:

- `thread` - optional thread, defaults to the current thread.
- If invoked outside a thread without specifying one, replies with an error.

Thread exports include additional frontmatter:

- `is_thread: true`
- `parent_channel` and `parent_channel_id`
- `thread/<slug>` tag

### `/read-channel-who`

Exports messages from a specific user in a channel to an Obsidian-friendly
Markdown file.

Options:

- `user` (**required**) - the Discord user whose messages to export.
- `channel` - optional channel, defaults to the current channel.
- `limit` - optional max messages to **scan** (not filtered output). `0` means all.
- `include_attachments` - optional, defaults to `true`.
- `include_embeds` - optional, defaults to `true`.

The command scans messages and filters in-memory because Discord API does not
support per-user filtering. The reply reports both scanned and filtered counts.

User-filtered exports include additional frontmatter:

- `filtered_user` and `filtered_user_id`
- `user/<slug>` tag

## Environment Variables

- `DISCORD_TOKEN` - Discord bot token.
- `DISCORD_CLIENT_ID` - Discord application client ID.
- `KB_EXPORT_ROOT` - root directory for `/read-channel` exports. Defaults to `/home/slimy/kb/raw/discord-exports`.
- `READ_CHANNEL_ROLE_ID` - optional role allowed to run `/read-channel` without Manage Channels.

## Development

This bot is part of the Slimy monorepo. See the root README for overall workspace setup.

## TODO

- [ ] Migrate Discord.js client setup from existing services
- [ ] Add command handlers for club analytics
- [ ] Integrate database connection
- [ ] Implement weekly analytics logic
- [ ] Add error handling and logging
- [ ] Set up production deployment configuration
