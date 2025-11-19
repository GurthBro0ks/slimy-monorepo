# @slimy/shared-logging

A lightweight, structured logging utility for the slimy-monorepo. Provides consistent log formatting across all services with zero dependencies.

## Features

- **Structured logs**: JSON output with level, message, timestamp, and context
- **Type-safe**: Full TypeScript support with detailed type definitions
- **Lightweight**: Simple wrapper around `console.*` with no dependencies
- **Stateless**: No global configuration or side effects
- **Flexible**: Works in Node.js, browsers, and edge runtimes

## Installation

This package is part of the slimy-monorepo and uses internal workspace references:

```json
{
  "dependencies": {
    "@slimy/shared-logging": "workspace:*"
  }
}
```

## Quick Start

### Basic Usage

```typescript
import { logInfo, logError, logWarn, logDebug } from '@slimy/shared-logging';

// Simple info log
logInfo('Server started', {
  service: 'admin-api',
  port: 3000
});

// Error with context
try {
  await fetchData();
} catch (error) {
  logError('Failed to fetch data', {
    service: 'web',
    operation: 'data.fetch',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
}

// Warning with metadata
logWarn('Rate limit approaching', {
  service: 'bot',
  operation: 'discord.api',
  remaining: 5,
  limit: 100
});

// Debug logs for development
logDebug('Cache hit', {
  service: 'admin-api',
  operation: 'cache.get',
  key: 'user:12345'
});
```

### Output Format

All logs are output as JSON strings:

```json
{
  "level": "info",
  "msg": "Server started",
  "timestamp": "2025-11-19T04:30:15.123Z",
  "context": {
    "service": "admin-api",
    "port": 3000
  }
}
```

## API Reference

### Log Functions

#### `logDebug(msg, context?)`

Logs a debug-level message. Typically used for detailed diagnostic information during development.

```typescript
logDebug('Processing item', {
  service: 'web',
  operation: 'batch.process',
  itemId: '123',
  index: 5
});
```

#### `logInfo(msg, context?)`

Logs an informational message about normal application flow.

```typescript
logInfo('User logged in', {
  service: 'admin-api',
  operation: 'auth.login',
  userId: 'user_123',
  requestId: 'req_456'
});
```

#### `logWarn(msg, context?)`

Logs a warning for potentially harmful situations that don't prevent operation.

```typescript
logWarn('Deprecated API used', {
  service: 'web',
  operation: 'api.call',
  endpoint: '/v1/stats',
  replacement: '/v2/stats'
});
```

#### `logError(msg, context?)`

Logs an error that might still allow the application to continue.

```typescript
logError('Database query failed', {
  service: 'admin-api',
  operation: 'db.query',
  error: {
    name: 'QueryError',
    message: 'Connection timeout',
    code: 'ETIMEDOUT'
  }
});
```

### Utility Functions

#### `serializeError(error)`

Converts an Error object or any value into a structured error context.

```typescript
import { logError, serializeError } from '@slimy/shared-logging';

try {
  await riskyOperation();
} catch (error) {
  logError('Operation failed', {
    service: 'web',
    operation: 'risky.operation',
    error: serializeError(error)
  });
}
```

#### `createLogger(baseContext)`

Creates a logger instance with pre-bound context. Useful for reducing repetition.

```typescript
import { createLogger } from '@slimy/shared-logging';

const logger = createLogger({
  service: 'admin-api',
  operation: 'auth.callback',
  requestId: 'req_789'
});

logger.info('Callback started');
logger.info('Token exchanged', { userId: 'user_123' });
logger.error('Callback failed', {
  error: {
    name: 'OAuthError',
    message: 'Invalid code'
  }
});
```

## Context Guidelines

### Required Fields (Recommended)

- **`service`**: Which service generated the log (`'web'`, `'admin-api'`, `'bot'`, etc.)
- **`operation`**: What operation is being performed (e.g., `'auth.login'`, `'snail.analyze'`)

### Optional Fields (When Available)

- **`requestId`**: Unique ID for a single HTTP request or WebSocket connection
- **`correlationId`**: ID that spans multiple services
- **`userId`**: User performing or affected by the action
- **`guildId`**: Discord guild/server ID
- **`channelId`**: Discord channel ID
- **`duration`**: Operation duration in milliseconds
- **`error`**: Structured error information

See `docs/logging-conventions.md` for complete guidelines.

## Usage Examples

### Express.js Route (Admin API)

```typescript
import { createLogger, serializeError } from '@slimy/shared-logging';

app.get('/api/stats', async (req, res) => {
  const logger = createLogger({
    service: 'admin-api',
    operation: 'stats.get',
    requestId: req.id
  });

  logger.info('Stats request started');

  try {
    const stats = await fetchStats();
    logger.info('Stats request completed', { count: stats.length });
    res.json(stats);
  } catch (error) {
    logger.error('Stats request failed', {
      error: serializeError(error)
    });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
```

### Next.js API Route (Web App)

```typescript
import { logInfo, logError, serializeError } from '@slimy/shared-logging';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();

  logInfo('Analyses request started', {
    service: 'web',
    operation: 'analyses.get',
    requestId
  });

  try {
    const analyses = await prisma.analysis.findMany();

    logInfo('Analyses request completed', {
      service: 'web',
      operation: 'analyses.get',
      requestId,
      count: analyses.length
    });

    return Response.json(analyses);
  } catch (error) {
    logError('Analyses request failed', {
      service: 'web',
      operation: 'analyses.get',
      requestId,
      error: serializeError(error)
    });

    return Response.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}
```

### Discord Bot Command

```typescript
import { createLogger, serializeError } from '@slimy/shared-logging';

async function handleSnailCommand(interaction) {
  const logger = createLogger({
    service: 'bot',
    operation: 'snail.command',
    correlationId: crypto.randomUUID(),
    userId: interaction.user.id,
    guildId: interaction.guild?.id
  });

  logger.info('Snail command invoked');

  try {
    const code = interaction.options.getString('code');
    const result = await analyzeSnailCode(code);

    logger.info('Snail analysis completed', {
      success: result.valid,
      warningCount: result.warnings.length
    });

    await interaction.reply(formatAnalysisResult(result));
  } catch (error) {
    logger.error('Snail command failed', {
      error: serializeError(error)
    });

    await interaction.reply('Failed to analyze snail code. Please try again.');
  }
}
```

### Infrastructure Script

```typescript
import { logInfo, logWarn } from '@slimy/shared-logging';

async function checkBundleSize() {
  logInfo('Bundle size check started', {
    service: 'infra-script',
    operation: 'build.checkSize'
  });

  const size = await getBundleSize();
  const limit = 500_000;

  if (size > limit) {
    logWarn('Bundle size exceeds limit', {
      service: 'infra-script',
      operation: 'build.checkSize',
      bundleSize: size,
      limit,
      exceededBy: size - limit
    });
    process.exit(1);
  }

  logInfo('Bundle size check passed', {
    service: 'infra-script',
    operation: 'build.checkSize',
    bundleSize: size,
    limit
  });
}
```

## Migration Status

⚠️ **This package is not yet wired into any existing code.**

The slimy-monorepo currently uses:
- **Admin API**: Mix of raw `console.*` and Pino logger
- **Web**: Raw `console.error` and `console.info` statements
- **Scripts**: Raw `console.log` with ad-hoc formatting

### Future Migration Plan

When ready to adopt this logger:

1. **Start with new features**: Use `@slimy/shared-logging` for all new code
2. **Gradual migration**: Replace existing logs one module at a time
3. **Update imports**: Change from `console.*` to logger functions
4. **Add context**: Include structured context (service, operation, etc.)
5. **Test output**: Verify logs appear correctly in development and production

Example migration:

```typescript
// Before
console.log('[admin-api] /api/auth/callback start', { provider: 'discord' });

// After
import { logInfo } from '@slimy/shared-logging';

logInfo('Auth callback started', {
  service: 'admin-api',
  operation: 'auth.callback',
  provider: 'discord',
  requestId: req.id
});
```

## TypeScript Types

The package exports the following types:

```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ErrorContext {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  [key: string]: any;
}

export interface LogContext {
  service?: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  guildId?: string;
  channelId?: string;
  operation?: string;
  duration?: number;
  error?: ErrorContext;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  msg: string;
  timestamp: string;
  context?: LogContext;
}
```

## Best Practices

1. **Always include `service` and `operation`** in your context
2. **Use `requestId` and `correlationId`** for request tracing
3. **Include entity IDs** (`userId`, `guildId`, etc.) when available
4. **Use `serializeError`** for proper error logging
5. **Create logger instances** with `createLogger` to reduce repetition
6. **Don't log sensitive data** (passwords, tokens, API keys, etc.)
7. **Be judicious** - don't log in tight loops or hot paths

## Related Documentation

- `docs/logging-conventions.md`: Complete logging conventions and guidelines
- `apps/admin-api/src/lib/logger.js`: Existing Pino logger (admin-api only)

## License

ISC
