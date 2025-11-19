# Safe Debug Mode

## Overview

The slimy-monorepo implements a "safe debug mode" for increased logging detail in development and staging environments without leaking secrets or overwhelming production logs.

## How It Works

### Environment Variables

Debug mode is enabled when **either** of the following conditions is true:

1. `NODE_ENV=development`
2. `DEBUG_MODE=true`

This allows you to enable verbose logging in staging environments without changing the NODE_ENV.

### Security Features

- **Automatic Secret Redaction**: Sensitive fields (tokens, passwords, API keys, etc.) are automatically redacted from debug logs
- **Opt-in Only**: Debug logs only appear when debug mode is explicitly enabled
- **Production Safe**: By default, production environments (`NODE_ENV=production`) will not log debug information unless `DEBUG_MODE=true` is explicitly set

## Usage

### Admin API

The admin-api logger (`apps/admin-api/src/lib/logger.js`) provides several helper functions:

#### isDebug()

Check if debug mode is enabled:

```javascript
const { isDebug } = require("./lib/logger");

if (isDebug()) {
  // This code only runs in debug mode
}
```

#### logDebug()

Log debug information with automatic secret redaction:

```javascript
const { logger, logDebug } = require("./lib/logger");

logDebug(logger, {
  userId: user.id,
  accessToken: "secret123", // Automatically redacted to [REDACTED]
  requestData: someObject,
}, "[DEBUG] Processing user request");
```

#### redactSecrets()

Manually redact secrets from an object:

```javascript
const { redactSecrets } = require("./lib/logger");

const safeData = redactSecrets({
  username: "john",
  password: "secret", // Will be [REDACTED]
  apiKey: "key123",   // Will be [REDACTED]
});
```

#### Request Logger Enhancements

The request logger middleware automatically logs additional details in debug mode:

**Normal Mode:**
```json
{
  "method": "POST",
  "path": "/api/users",
  "statusCode": 200,
  "duration": 45
}
```

**Debug Mode:**
```json
{
  "method": "POST",
  "path": "/api/users",
  "statusCode": 200,
  "duration": 45,
  "headers": {
    "user-agent": "...",
    "content-type": "application/json"
  },
  "userId": "12345",
  "sessionExists": true,
  "bodySize": "256",
  "contentType": "application/json",
  "timing": {
    "total": 45,
    "perSecond": "22.22"
  }
}
```

### Discord Bot

The bot logger (`apps/bot/lib/logger.js`) provides the same functionality as admin-api:

#### Command Execution Logging

```javascript
const { createLogger, isDebug, logDebug } = require("../lib/logger");

async function handleCommand(interaction) {
  const logger = createLogger({
    interactionId: interaction.id,
    command: interaction.commandName,
  });

  // Debug: Log full interaction payload
  if (isDebug()) {
    logDebug(logger, {
      interactionType: interaction.type,
      commandName: interaction.commandName,
      userId: interaction.user?.id,
      guildId: interaction.guildId,
      options: interaction.options?.data || [],
    }, "[DEBUG] Received command interaction");
  }

  logger.info("Processing command");
  // ... command logic
}
```

## Examples

### Example 1: OAuth Token Exchange (admin-api)

**File:** `apps/admin-api/src/services/oauth.js:31`

```javascript
async function exchangeCode(code) {
  const startTime = Date.now();

  // Debug: Log token exchange attempt
  if (isDebug()) {
    logDebug(logger, {
      codePrefix: code.substring(0, 10) + "...",
      endpoint: `${DISCORD_API_BASE}/oauth2/token`,
    }, "[DEBUG] Exchanging OAuth code for access token");
  }

  // ... token exchange logic

  const duration = Date.now() - startTime;

  // Debug: Log successful exchange (tokens are redacted)
  if (isDebug()) {
    logDebug(logger, {
      duration,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      hasAccessToken: !!tokenData.access_token,  // Boolean, not the actual token
      hasRefreshToken: !!tokenData.refresh_token,
    }, "[DEBUG] Token exchange successful");
  }

  return tokenData;
}
```

**What it logs in debug mode:**
- Token exchange timing
- Token metadata (type, expiration, scope)
- Presence of tokens (boolean) without actual token values

### Example 2: Request Middleware (admin-api)

**File:** `apps/admin-api/src/lib/logger.js:116`

```javascript
function requestLogger(req, res, next) {
  // ... request ID setup

  // Enhanced request log in debug mode
  if (isDebug()) {
    const debugData = {
      method: req.method,
      path: req.path,
      headers: redactSecrets({
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"],
        "accept": req.headers["accept"],
      }),
      userId: req.user?.id || req.session?.userId,
      sessionExists: !!req.session,
      bodySize: req.headers["content-length"],
    };
    req.logger.debug(debugData, "[DEBUG] Incoming request details");
  }

  // ... response logging
}
```

**What it logs in debug mode:**
- Request headers (with authorization redacted)
- User ID from session
- Session existence
- Request body size
- Response timing and performance metrics

## Sensitive Data Protection

The following field names are automatically redacted:

- `password`
- `token` (and variations: `accessToken`, `refreshToken`, `botToken`, etc.)
- `secret` (and variations: `apiSecret`, `clientSecret`, etc.)
- `apiKey`, `api_key`
- `authorization`
- `cookie`
- `sessionId`, `session_id`
- `privateKey`, `private_key`

The redaction is **case-insensitive** and checks for **partial matches**, so a field named `userPassword` or `USER_TOKEN` will also be redacted.

## Best Practices

1. **Always use `logDebug()` for debug information** - It automatically redacts secrets
2. **Use boolean flags for sensitive data** - Instead of logging the actual token, log `hasToken: !!token`
3. **Log partial identifiers** - Use `id.substring(0, 8) + "..."` for debugging without exposing full values
4. **Gate expensive operations** - Wrap expensive debug operations in `if (isDebug())` to avoid overhead in production
5. **Add timing information** - Include `duration` and timing metrics in debug logs for performance analysis

## Enabling Debug Mode

### Local Development

```bash
# Set in your .env file
NODE_ENV=development
# or
DEBUG_MODE=true
```

### Staging Environment

```bash
# Keep production NODE_ENV but enable debug logging
NODE_ENV=production
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Production

```bash
# Recommended: No debug mode in production
NODE_ENV=production
# DEBUG_MODE is not set
LOG_LEVEL=info  # or 'warn'
```

## Verifying Debug Mode

Check the startup logs to verify debug mode status:

**Admin API:**
```json
{
  "service": "slimy-admin-api",
  "level": "INFO",
  "msg": "[admin-api] Booting in non-production mode"
}
```

**Discord Bot:**
```json
{
  "service": "slimy-discord-bot",
  "debugMode": true,
  "msg": "Starting Discord bot"
}
```

## Related Files

- `apps/admin-api/src/lib/logger.js` - Admin API logger with isDebug()
- `apps/admin-api/src/services/oauth.js` - Example OAuth debug logging
- `apps/bot/lib/logger.js` - Discord bot logger with isDebug()
- `apps/bot/src/commands/example-command.js` - Example command debug logging
- `apps/bot/src/index.js` - Bot initialization with debug logging
