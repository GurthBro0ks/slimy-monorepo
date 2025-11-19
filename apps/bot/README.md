# @slimy/bot

Conversational bot service for Slimy.ai (Discord/Telegram/Multi-platform)

## Purpose

The bot app serves as the primary conversational interface for Slimy.ai users, providing:
- Discord bot integration for guild management
- Real-time snail game interactions
- Command routing and event handling
- Integration with admin-api for data persistence
- Multi-platform support (future)

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Implementation is pending.

## Proposed Tech Stack

### Core Framework
- **Discord.js** (or **discord.js v14+**) for Discord bot functionality
- **Node.js 20+** for runtime
- **TypeScript** for type safety

### State & Caching
- **Redis** for distributed state management
- **Event-driven architecture** for command handling
- **WebSocket** for real-time communication

### Database & Backend Integration
- Integrates with **Admin API** for data operations
- Uses shared packages for domain logic

### Deployment
- Docker containerized service
- Systemd service for production
- Auto-restart and logging

## Proposed Directory Structure

```
apps/bot/
├── src/
│   ├── index.ts              # Bot entry point
│   ├── client.ts             # Discord client setup
│   ├── commands/             # Command handlers
│   │   ├── ping.ts
│   │   ├── snail/            # Snail-related commands
│   │   ├── guild/            # Guild management commands
│   │   └── admin/            # Admin-only commands
│   ├── events/               # Event listeners
│   │   ├── ready.ts
│   │   ├── messageCreate.ts
│   │   └── interactionCreate.ts
│   ├── middleware/           # Command middleware
│   │   ├── auth.ts           # Permission checking
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── logging.ts        # Command logging
│   ├── services/             # Business logic
│   │   ├── snailService.ts   # Snail game logic
│   │   ├── guildService.ts   # Guild management
│   │   └── apiClient.ts      # Admin API client
│   ├── lib/                  # Utilities
│   │   ├── logger.ts
│   │   ├── cache.ts
│   │   └── validators.ts
│   └── types/                # TypeScript types
│       ├── commands.ts
│       └── events.ts
├── config/                   # Configuration files
│   └── commands.json         # Command definitions
├── tests/                    # Test suites
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── README.md                 # This file
```

## Proposed Features

### Command System
- **Slash Commands**: Modern Discord interaction model
- **Prefix Commands**: Traditional `!command` syntax (optional)
- **Command Aliases**: Multiple names for same command
- **Auto-complete**: Suggestions for command parameters

### Snail Game Integration
- `/snail status` - Check snail stats
- `/snail feed` - Feed your snail
- `/snail battle` - Battle mechanics
- `/snail inventory` - View items

### Guild Management
- `/guild info` - Guild statistics
- `/guild settings` - Configure bot behavior
- `/guild members` - Member management

### Admin Commands
- `/admin broadcast` - Send announcements
- `/admin stats` - Bot-wide statistics
- `/admin reload` - Reload commands without restart

### Event Handling
- **Message Events**: React to messages
- **Member Events**: Join/leave tracking
- **Guild Events**: Server updates
- **Custom Events**: Game-specific events

## Dependencies on Shared Packages

### Required
- `@slimy/shared-snail` - Core snail domain logic and game mechanics
- `@slimy/shared-db` - Database client (if direct DB access needed)
- `@slimy/shared-codes` - Error codes and enums
- `@slimy/shared-config` - Configuration management
- `@slimy/shared-types` - Shared TypeScript types

### Optional
- `@slimy/shared-auth` - If OAuth or token validation needed
- `@slimy/shared-utils` - Common utility functions

## Environment Variables

Proposed environment variables:

```env
# Discord Bot
DISCORD_BOT_TOKEN="your-bot-token"
DISCORD_CLIENT_ID="your-client-id"
DISCORD_GUILD_ID="your-test-guild-id"  # For development

# Admin API Integration
ADMIN_API_BASE_URL="http://localhost:3080"
ADMIN_API_KEY="your-api-key"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# Bot Configuration
BOT_PREFIX="!"
BOT_OWNER_ID="discord-user-id"
COMMAND_COOLDOWN_MS="3000"

# Logging
LOG_LEVEL="info"  # debug, info, warn, error
LOG_FILE="/var/log/slimy/bot.log"

# Environment
NODE_ENV="development"  # development, production
```

## Proposed Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "deploy-commands": "tsx scripts/deploy-commands.ts",
    "clean": "rm -rf dist/"
  }
}
```

## Deployment

### Docker
The bot will be containerized for production deployment:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

### Systemd Service
For bare-metal deployment:

```ini
[Unit]
Description=Slimy.ai Discord Bot
After=network.target redis.service

[Service]
Type=simple
User=slimy
WorkingDirectory=/opt/slimy/bot
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## What Needs to Be Wired

### Implementation Tasks
1. **Discord Client Setup**: Initialize Discord.js client with proper intents
2. **Command Handler**: Implement slash command registration and handling
3. **Event System**: Set up event listeners for Discord events
4. **Admin API Client**: Create HTTP client for backend communication
5. **Redis Integration**: Implement state management and caching
6. **Error Handling**: Graceful error handling and logging
7. **Testing**: Unit and integration tests for commands and events

### Integration Tasks
1. **Shared Packages**: Wire up `@slimy/shared-snail` for game logic
2. **Configuration**: Use `@slimy/shared-config` for env management
3. **Types**: Import shared types from `@slimy/shared-types`
4. **Database**: Determine if direct DB access or API-only

### Infrastructure Tasks
1. **Docker Compose**: Add bot service to compose files
2. **Health Checks**: Implement health endpoint for monitoring
3. **Logging**: Set up structured logging with rotation
4. **Monitoring**: Add Prometheus metrics for bot status

### Documentation Tasks
1. **Command Documentation**: Document all available commands
2. **Architecture Docs**: Explain command flow and event handling
3. **Deployment Guide**: Step-by-step deployment instructions
4. **Development Guide**: Local development setup

## Multi-Platform Support (Future)

While Discord is the primary platform, the architecture should support:

### Telegram
- **node-telegram-bot-api** or **telegraf**
- Shared command logic with Discord
- Platform-specific adapters

### Slack
- **@slack/bolt** for Slack bot framework
- Similar command structure
- Different interaction model

### Web Chat (Custom)
- WebSocket-based chat interface
- Integration with admin-ui
- Shared backend with other platforms

### Abstraction Layer
Create a platform-agnostic command system:

```typescript
interface BotPlatform {
  sendMessage(channelId: string, message: string): Promise<void>;
  registerCommand(command: Command): void;
  on(event: string, handler: Function): void;
}

class DiscordPlatform implements BotPlatform { /* ... */ }
class TelegramPlatform implements BotPlatform { /* ... */ }
```

## Performance Targets

- **Command Response Time**: < 500ms for simple commands
- **API Call Latency**: < 200ms to admin-api
- **Memory Usage**: < 200MB under normal load
- **Uptime**: > 99.9% availability

## Security Considerations

1. **Permission Checks**: Validate user roles before executing commands
2. **Rate Limiting**: Prevent spam and abuse
3. **Input Validation**: Sanitize all user inputs
4. **API Key Management**: Secure storage of Discord token
5. **Error Messages**: Don't leak sensitive information in errors

## Related Services

- **Admin API** (`apps/admin-api`): Backend data source
- **Admin UI** (`apps/admin-ui`): Web dashboard for bot management
- **Web** (`apps/web`): Customer portal

## Getting Started (When Implemented)

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your Discord bot token
# Get your token from: https://discord.com/developers/applications

# Register slash commands
pnpm deploy-commands

# Start development server
pnpm dev
```

## Next Steps for Implementation

1. Initialize package with Discord.js and TypeScript
2. Set up basic bot client and event handlers
3. Implement slash command registration
4. Create command handler framework
5. Integrate with admin-api for data operations
6. Add Redis for state management
7. Write tests for command logic
8. Containerize for production deployment
9. Add monitoring and logging
10. Document all commands and features

## License

Proprietary - Slimy.ai
