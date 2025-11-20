# Logging Conventions

This document defines consistent logging conventions for all services in the slimy-monorepo.

## Table of Contents

- [Log Levels](#log-levels)
- [Structured Log Format](#structured-log-format)
- [Context Guidelines](#context-guidelines)
- [Examples by Service](#examples-by-service)
- [Migration Notes](#migration-notes)

## Log Levels

Use the following log levels consistently across all services:

### `debug`
- **Purpose**: Detailed information for debugging during development
- **When to use**: Verbose details about application state, variable values, or flow
- **Production**: Typically disabled in production environments
- **Example**: Function entry/exit, loop iterations, detailed state dumps

### `info`
- **Purpose**: General informational messages about normal application flow
- **When to use**: Successful operations, state transitions, milestone events
- **Production**: Enabled by default
- **Example**: Server started, user logged in, API request completed, job processed

### `warn`
- **Purpose**: Potentially harmful situations that don't prevent operation
- **When to use**: Recoverable errors, deprecated feature usage, configuration issues
- **Production**: Enabled by default
- **Example**: Retrying failed operation, using fallback value, rate limit approaching

### `error`
- **Purpose**: Error events that might still allow the application to continue
- **When to use**: Exceptions, failed operations, data validation errors
- **Production**: Enabled by default, should trigger monitoring alerts
- **Example**: Database query failed, external API timeout, invalid user input

## Structured Log Format

All logs should follow a structured format for consistency and parseability:

```typescript
{
  level: 'info' | 'debug' | 'warn' | 'error',
  msg: string,                    // Human-readable message
  timestamp: string,              // ISO 8601 format
  context?: {                     // Optional structured metadata
    // Service identification
    service: string,              // e.g., 'web', 'admin-api', 'bot'

    // Request correlation
    requestId?: string,           // Unique ID for the request
    correlationId?: string,       // ID that spans multiple services

    // Entity identifiers
    userId?: string,              // User performing the action
    guildId?: string,             // Discord guild/server ID
    channelId?: string,           // Discord channel ID

    // Operation details
    operation?: string,           // e.g., 'snail.analyze', 'auth.login'
    duration?: number,            // Operation duration in milliseconds

    // Error details
    error?: {
      name: string,
      message: string,
      stack?: string,
      code?: string | number
    },

    // Additional metadata
    [key: string]: any
  }
}
```

## Context Guidelines

### Always Include

1. **`service`**: Identifies which service generated the log
   - Examples: `'web'`, `'admin-api'`, `'bot'`, `'infra-script'`

2. **`operation`**: Describes what operation is being performed
   - Format: `'module.action'` or `'module/action'`
   - Examples: `'auth.login'`, `'snail.analyze'`, `'chat.message'`

### Include When Available

3. **Correlation IDs**: For tracing requests across services
   - **`requestId`**: Unique to a single HTTP request or WebSocket connection
   - **`correlationId`**: Spans multiple services (e.g., webhook → API → bot)
   - Generate at entry points, propagate through the call chain
   - Format: UUIDs or similar unique identifiers

4. **Entity Identifiers**: For filtering and debugging
   - **`userId`**: Include when the action is performed by or on behalf of a user
   - **`guildId`**: Include for Discord guild-specific operations
   - **`channelId`**: Include for channel-specific operations
   - **`messageId`**, **`roleId`**, etc.: Include as relevant

5. **Error Context**: When logging errors
   - **`error.name`**: Error class name
   - **`error.message`**: Error message
   - **`error.stack`**: Stack trace (sanitize in production if needed)
   - **`error.code`**: Error code if available

6. **Performance Metrics**: For operations that may have performance implications
   - **`duration`**: Time taken in milliseconds
   - **`retries`**: Number of retry attempts
   - **`cacheHit`**: Whether a cache was hit

## Examples by Service

### Web App (`apps/web`)

#### API Route Example
```typescript
// app/api/stats/route.ts
import { logInfo, logError } from '@slimy/shared-logging';

export async function GET(request: Request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  logInfo('Stats API request started', {
    service: 'web',
    operation: 'stats.get',
    requestId
  });

  try {
    const stats = await fetchStats();

    logInfo('Stats API request completed', {
      service: 'web',
      operation: 'stats.get',
      requestId,
      duration: performance.now()
    });

    return Response.json(stats);
  } catch (error) {
    logError('Stats API request failed', {
      service: 'web',
      operation: 'stats.get',
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });

    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

#### Client Component Example
```typescript
// app/club/page.tsx
import { logInfo, logError } from '@slimy/shared-logging';

async function loadAnalyses() {
  try {
    const response = await fetch('/api/analyses');
    const data = await response.json();

    logInfo('Analyses loaded successfully', {
      service: 'web',
      operation: 'club.loadAnalyses',
      count: data.length
    });

    return data;
  } catch (error) {
    logError('Failed to load analyses', {
      service: 'web',
      operation: 'club.loadAnalyses',
      error: {
        name: error.name,
        message: error.message
      }
    });
    throw error;
  }
}
```

### Admin API (`apps/admin-api`)

#### Route Handler Example
```typescript
// src/routes/auth.js
const { logInfo, logError } = require('@slimy/shared-logging');

router.get('/api/auth/callback', async (req, res) => {
  const requestId = req.id; // From request ID middleware

  logInfo('Auth callback started', {
    service: 'admin-api',
    operation: 'auth.callback',
    requestId,
    provider: 'discord'
  });

  try {
    const { code } = req.query;
    const user = await exchangeCodeForUser(code);

    logInfo('User authenticated successfully', {
      service: 'admin-api',
      operation: 'auth.callback',
      requestId,
      userId: user.id
    });

    res.redirect('/dashboard');
  } catch (error) {
    logError('Auth callback failed', {
      service: 'admin-api',
      operation: 'auth.callback',
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });

    res.status(500).send('Authentication failed');
  }
});
```

#### WebSocket Example
```typescript
// src/socket.js
const { logInfo, logDebug } = require('@slimy/shared-logging');

io.on('connection', (socket) => {
  const connectionId = socket.id;

  logInfo('Client connected', {
    service: 'admin-api',
    operation: 'socket.connect',
    connectionId,
    userId: socket.userId
  });

  socket.on('chat-message', (message) => {
    logDebug('Chat message received', {
      service: 'admin-api',
      operation: 'chat.message',
      connectionId,
      userId: socket.userId,
      guildId: message.guildId,
      channelId: message.channelId
    });
  });
});
```

### Bot Operations

#### Command Handler Example
```typescript
import { logInfo, logWarn, logError } from '@slimy/shared-logging';

async function handleSnailCommand(interaction) {
  const correlationId = crypto.randomUUID();

  logInfo('Snail command invoked', {
    service: 'bot',
    operation: 'snail.command',
    correlationId,
    userId: interaction.user.id,
    guildId: interaction.guild?.id,
    channelId: interaction.channel?.id
  });

  try {
    const result = await analyzeSnailCode(interaction.options.getString('code'));

    if (result.warnings.length > 0) {
      logWarn('Snail analysis completed with warnings', {
        service: 'bot',
        operation: 'snail.analyze',
        correlationId,
        userId: interaction.user.id,
        warningCount: result.warnings.length
      });
    } else {
      logInfo('Snail analysis completed successfully', {
        service: 'bot',
        operation: 'snail.analyze',
        correlationId,
        userId: interaction.user.id
      });
    }

    return result;
  } catch (error) {
    logError('Snail analysis failed', {
      service: 'bot',
      operation: 'snail.analyze',
      correlationId,
      userId: interaction.user.id,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });

    throw error;
  }
}
```

### Infrastructure Scripts

#### Build Script Example
```typescript
// scripts/check-bundle-size.ts
import { logInfo, logWarn, logError } from '@slimy/shared-logging';

async function checkBundleSize() {
  logInfo('Bundle size check started', {
    service: 'infra-script',
    operation: 'build.checkSize'
  });

  const size = await getBundleSize();
  const limit = 500_000; // 500KB

  if (size > limit) {
    logWarn('Bundle size exceeds limit', {
      service: 'infra-script',
      operation: 'build.checkSize',
      bundleSize: size,
      limit,
      exceededBy: size - limit
    });
  } else {
    logInfo('Bundle size within limit', {
      service: 'infra-script',
      operation: 'build.checkSize',
      bundleSize: size,
      limit
    });
  }
}
```

## Migration Notes

### Current State (Not Yet Migrated)

This logging convention is **aspirational**. The existing codebase currently uses:

- **Admin API**: Mix of raw `console.*` and Pino logger (see `apps/admin-api/src/lib/logger.js`)
- **Web**: Raw `console.error` and `console.info` statements
- **Scripts**: Raw `console.log` with ad-hoc formatting

The `@slimy/shared-logging` package has been created but **not yet wired into any existing code**.

### Migration Strategy (Future Work)

When migrating existing code:

1. **Start with new features**: Use the logger for all new code
2. **Gradual migration**: Replace existing logs one module at a time
3. **Test thoroughly**: Ensure log output is as expected
4. **Monitor production**: Watch for any logging-related performance impacts
5. **Update documentation**: Keep this document updated as patterns evolve

### Compatibility Notes

- The shared-logging package uses TypeScript and can be imported in both TS and JS files
- No global state or side effects - safe to use across services
- Lightweight wrapper around `console.*` - minimal performance overhead
- Compatible with existing logging infrastructure (can be used alongside Pino, Winston, etc.)

## Best Practices

1. **Be Specific**: Use descriptive operation names (`'auth.login'` not `'auth'`)
2. **Be Consistent**: Follow the naming patterns in this document
3. **Be Judicious**: Don't log sensitive data (passwords, tokens, etc.)
4. **Be Contextual**: Include enough context to debug issues without the code
5. **Be Performance-Aware**: Avoid logging in tight loops or hot paths
6. **Be Forward-Thinking**: Include correlation IDs for future distributed tracing

## Related Resources

- `packages/shared-logging/README.md`: Package documentation and usage examples
- `apps/admin-api/src/lib/logger.js`: Existing Pino logger (admin-api only)
- Package: `@slimy/shared-logging`: Shared logging helper package
