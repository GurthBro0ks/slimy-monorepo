# Bot Logging & Error Handling

This document describes the logging and error handling infrastructure for the Discord bot.

## Overview

The bot includes:
- Centralized logging utilities with structured context
- Crash safety wrappers for event handlers
- A health/debug command for monitoring bot status

## Logging System

### Logger Module (`src/lib/logger.ts`)

The logger wraps standard console methods with structured logging capabilities.

#### Basic Usage

```typescript
import { logInfo, logWarn, logError, logDebug } from './lib/logger.js';

// Simple logging
logInfo('Bot started');
logWarn('Rate limit approaching');
logError('Failed to send message', error);
logDebug('Debug information');
```

#### Logging with Context

All log functions accept an optional context object:

```typescript
logInfo('User joined guild', {
  context: 'member-join',
  guildId: '123456789',
  userId: '987654321',
  channelId: '111222333',
});
```

#### Log Format

Logs are formatted as:
```
[2025-11-22T12:34:56.789Z] [LEVEL] Message {context=value guildId=123}
```

Example output:
```
[2025-11-22T12:34:56.789Z] [INFO] User joined guild {context=member-join guildId=123456789 userId=987654321}
[2025-11-22T12:35:12.456Z] [ERROR] Failed to send message {context=message-handler error=NetworkError stack=Error: NetworkError}
```

#### Context Logger

Create a child logger with default context:

```typescript
import { createLogger } from './lib/logger.js';

const logger = createLogger({ context: 'command-handler', guildId: '123' });

logger.info('Processing command');  // Includes default context
logger.error('Command failed', error, { userId: '456' });  // Merges contexts
```

### Log Levels

- **INFO**: General informational messages (startup, events)
- **WARN**: Warning messages (non-critical issues)
- **ERROR**: Error messages (exceptions, failures)
- **DEBUG**: Debug messages (only logged in development)

## Error Handling

### Safe Handler Wrapper (`src/lib/errorHandler.ts`)

The `safeHandler` function wraps async event handlers to prevent crashes from unhandled errors.

#### Usage

```typescript
import { safeHandler } from './lib/errorHandler.js';

// Wrap an async handler
const handleReady = safeHandler(async () => {
  // Your handler code
  throw new Error('This will be caught and logged');
}, 'ready-event');

client.on(Events.ClientReady, handleReady);
```

#### Features

- Catches all errors in wrapped handlers
- Logs errors with context and stack traces
- Extracts Discord-specific context (guild ID, user ID, channel ID)
- Prevents bot crashes from unhandled errors
- Returns undefined on error (allows bot to continue)

#### Context Extraction

The safe handler automatically extracts context from Discord.js objects:

**Interactions:**
```typescript
const handleInteraction = safeHandler(async (interaction) => {
  // Automatically logs: guildId, userId, channelId
  throw new Error('Error');
}, 'interaction-handler');
```

**Messages:**
```typescript
const handleMessage = safeHandler(async (message) => {
  // Automatically logs: guildId, userId, channelId
  throw new Error('Error');
}, 'message-handler');
```

**Guilds:**
```typescript
const handleGuildCreate = safeHandler(async (guild) => {
  // Automatically logs: guildId
  throw new Error('Error');
}, 'guild-create-handler');
```

### Sync Handler Wrapper

For synchronous handlers, use `safeSyncHandler`:

```typescript
import { safeSyncHandler } from './lib/errorHandler.js';

const syncHandler = safeSyncHandler((data) => {
  // Synchronous code
}, 'sync-handler');
```

## Event Handlers

The main bot file (`src/index.ts`) demonstrates how to use safe handlers:

```typescript
import { safeHandler } from './lib/errorHandler.js';

const handleReady = safeHandler(async () => {
  logInfo('Bot is ready');
}, 'ready-event');

const handleMessageCreate = safeHandler(async (message: Message) => {
  // Handle message
}, 'message-create-event');

client.on(Events.ClientReady, handleReady);
client.on(Events.MessageCreate, handleMessageCreate);
```

## Health Command

The bot includes a `!bothealth` command for monitoring and debugging.

### Usage

In any channel where the bot has access:
```
!bothealth
```

or

```
!health
```

### Response

The command responds with an embed containing:
- **Status**: Bot online status
- **Uptime**: How long the bot has been running
- **Version**: Bot version from package.json
- **Environment**: Current NODE_ENV
- **Memory Usage**: Heap memory usage in MB
- **Node.js**: Node.js version
- **Guilds**: Number of guilds the bot is in
- **Ping**: WebSocket ping to Discord

### Implementation

The health command is located in `src/commands/health.ts`:

```typescript
import { handleHealthCommand, isHealthCommand } from './commands/health.js';

const handleMessageCreate = safeHandler(async (message: Message) => {
  if (isHealthCommand(message)) {
    await handleHealthCommand(message, client);
    return;
  }
  // Other commands...
}, 'message-create-event');
```

### TODO: Admin-Only Access

Currently, the health command is accessible to all users. Future enhancement:
- Add permission check (guild admin only)
- Integrate with role-based access control when implemented

## Running Tests

The bot includes unit tests for logging and error handling.

### Run All Tests

```bash
pnpm --filter @slimy/bot run test
```

### Run Tests in Watch Mode

```bash
pnpm --filter @slimy/bot run test:watch
```

### Test Coverage

Tests cover:
- Logger formatting and context handling
- Error handler crash safety
- Context extraction from Discord objects
- Debug logging conditional behavior
- Child logger context merging

## Best Practices

1. **Always use safe handlers** for event handlers to prevent crashes
2. **Include context** in log messages for easier debugging
3. **Use appropriate log levels** (don't use ERROR for warnings)
4. **Create child loggers** for components with consistent context
5. **Test error paths** to ensure handlers catch all errors

## Environment Variables

Required environment variables:

```bash
DISCORD_BOT_TOKEN=your_bot_token_here
NODE_ENV=development  # or production
```

See `.env.example` for a template.

## Process-Level Error Handling

The bot also handles process-level errors:

- **Unhandled Promise Rejections**: Logged but don't crash the bot
- **Uncaught Exceptions**: Logged and bot exits gracefully
- **SIGINT/SIGTERM**: Graceful shutdown with cleanup

## Adding New Commands

When adding new commands:

1. Create command handler in `src/commands/`
2. Export handler and checker function
3. Add to message handler in `src/index.ts`
4. Use safe handler wrapper for crash safety
5. Include appropriate logging with context

Example:

```typescript
// src/commands/mycommand.ts
export async function handleMyCommand(message: Message) {
  logInfo('My command executed', {
    context: 'my-command',
    guildId: message.guild?.id,
    userId: message.author.id,
  });
  // Command logic
}

export function isMyCommand(message: Message): boolean {
  return message.content.trim().toLowerCase() === '!mycommand';
}

// src/index.ts
const handleMessageCreate = safeHandler(async (message: Message) => {
  if (isHealthCommand(message)) {
    await handleHealthCommand(message, client);
    return;
  }
  if (isMyCommand(message)) {
    await handleMyCommand(message);
    return;
  }
}, 'message-create-event');
```

## Future Enhancements

- External logging service integration (e.g., Sentry, LogDNA)
- Structured JSON logging for production
- Log rotation and archiving
- Metrics and monitoring dashboards
- Command framework with automatic safe handler wrapping
