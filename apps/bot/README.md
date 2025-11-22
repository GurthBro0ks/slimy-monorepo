# Discord Bot

A Discord bot with centralized logging and crash safety features.

## Features

- ✅ Centralized structured logging
- ✅ Crash safety for event handlers
- ✅ Health/debug command (`!bothealth`)
- ✅ Automatic context extraction
- ✅ Comprehensive test coverage
- ✅ TypeScript support

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Discord Bot Token

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env and add your bot token
```

### Development

```bash
# Run in development mode with hot reload
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build for production
pnpm build

# Run production build
pnpm start
```

## Configuration

Create a `.env` file with:

```bash
DISCORD_BOT_TOKEN=your_discord_bot_token_here
NODE_ENV=development
```

## Usage

### Health Command

Check bot status with:
```
!bothealth
```

This displays:
- Uptime
- Version
- Environment
- Memory usage
- Guild count
- Ping

## Documentation

- [Logging & Error Handling](./docs/BOT_LOGGING.md) - Detailed guide on logging system and crash safety

## Project Structure

```
apps/bot/
├── src/
│   ├── lib/
│   │   ├── logger.ts          # Centralized logging utility
│   │   └── errorHandler.ts    # Crash safety wrappers
│   ├── commands/
│   │   └── health.ts          # Health/debug command
│   └── index.ts               # Bot entry point
├── tests/
│   ├── logger.test.ts         # Logger tests
│   └── errorHandler.test.ts   # Error handler tests
├── docs/
│   └── BOT_LOGGING.md         # Logging documentation
└── package.json
```

## Development

### Adding New Commands

1. Create command file in `src/commands/`
2. Export handler and checker functions
3. Register in `src/index.ts` message handler
4. Use `safeHandler` wrapper for crash safety
5. Add tests

Example:

```typescript
// src/commands/mycommand.ts
export async function handleMyCommand(message: Message) {
  logInfo('Command executed', { context: 'my-command' });
  await message.reply('Hello!');
}

export function isMyCommand(message: Message): boolean {
  return message.content.trim().toLowerCase() === '!mycommand';
}
```

### Logging

```typescript
import { logInfo, logError } from './lib/logger.js';

// Basic logging
logInfo('Something happened');

// With context
logInfo('User action', {
  context: 'user-handler',
  guildId: '123',
  userId: '456',
});

// Error logging
logError('Failed to process', error, { context: 'processor' });
```

### Error Handling

```typescript
import { safeHandler } from './lib/errorHandler.js';

// Wrap async handlers
const handleEvent = safeHandler(async (data) => {
  // Your code - errors will be caught and logged
}, 'event-name');
```

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test -- --coverage
```

## License

Private - Part of slimy-monorepo
