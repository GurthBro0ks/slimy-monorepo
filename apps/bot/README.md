# Slimy Discord Bot

Discord bot for Slimy.ai club analytics and user interactions.

## Status

🚧 **This is currently a scaffold implementation.** The actual Discord bot logic needs to be migrated from existing services.

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

## Environment Variables

- `DISCORD_BOT_TOKEN` - Discord bot token (required for actual bot operation)

## Development

This bot is part of the Slimy monorepo. See the root README for overall workspace setup.

## TODO

- [ ] Migrate Discord.js client setup from existing services
- [ ] Add command handlers for club analytics
- [ ] Integrate database connection
- [ ] Implement weekly analytics logic
- [ ] Add error handling and logging
- [ ] Set up production deployment configuration
