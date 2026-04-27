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
