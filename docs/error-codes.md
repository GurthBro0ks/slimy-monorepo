# Slimy.ai Error Code Catalog

This document defines a standardized error code system for all Slimy.ai services. Each error code follows a consistent naming scheme and includes metadata to support future error handling improvements.

## Naming Scheme

Error codes follow the format: `SLIMY_{DOMAIN}_{NUMBER}`

- **SLIMY**: Constant prefix for all Slimy.ai error codes
- **DOMAIN**: Service domain (AUTH, DISCORD, SNAIL, MINECRAFT, INFRA, WEB, CHAT)
- **NUMBER**: Zero-padded 3-digit sequential number (001-999)

**Examples**: `SLIMY_AUTH_001`, `SLIMY_DISCORD_010`, `SLIMY_SNAIL_005`

## Error Code Structure

Each error code includes:

1. **Code**: Unique identifier (e.g., `SLIMY_AUTH_001`)
2. **Title**: Short descriptive name
3. **Description**: Detailed explanation of when this error occurs
4. **HTTP Status**: Recommended HTTP status code
5. **User Message**: End-user friendly error message
6. **Internal**: Whether error details should be hidden from users

---

## Domain: Authentication & Authorization (AUTH)

### SLIMY_AUTH_001
- **Title**: Missing Authentication Token
- **Description**: Request lacks required authentication credentials (session cookie, bearer token, or API key)
- **HTTP Status**: 401
- **User Message**: "Authentication required. Please log in to continue."
- **Internal**: false

### SLIMY_AUTH_002
- **Title**: Invalid Authentication Token
- **Description**: Provided authentication token is malformed or cryptographically invalid
- **HTTP Status**: 401
- **User Message**: "Invalid authentication credentials. Please log in again."
- **Internal**: false

### SLIMY_AUTH_003
- **Title**: Expired Authentication Token
- **Description**: Authentication token has passed its expiration time
- **HTTP Status**: 401
- **User Message**: "Your session has expired. Please log in again."
- **Internal**: false

### SLIMY_AUTH_004
- **Title**: Insufficient Permissions
- **Description**: User lacks required role or permission for the requested operation
- **HTTP Status**: 403
- **User Message**: "You don't have permission to perform this action."
- **Internal**: false

### SLIMY_AUTH_005
- **Title**: Discord OAuth Failed
- **Description**: Discord OAuth flow failed (invalid code, network error, or Discord API unavailable)
- **HTTP Status**: 502
- **User Message**: "Failed to authenticate with Discord. Please try again."
- **Internal**: false

### SLIMY_AUTH_006
- **Title**: Session Creation Failed
- **Description**: Unable to create user session (database error, Redis unavailable)
- **HTTP Status**: 500
- **User Message**: "Unable to establish session. Please try again."
- **Internal**: true

### SLIMY_AUTH_007
- **Title**: Invalid OAuth State
- **Description**: OAuth state parameter mismatch (potential CSRF attack or session issue)
- **HTTP Status**: 400
- **User Message**: "Authentication request invalid. Please try logging in again."
- **Internal**: false

### SLIMY_AUTH_008
- **Title**: Account Suspended
- **Description**: User account has been suspended by an administrator
- **HTTP Status**: 403
- **User Message**: "Your account has been suspended. Contact support for assistance."
- **Internal**: false

### SLIMY_AUTH_009
- **Title**: Invalid API Key
- **Description**: Provided API key is invalid or has been revoked
- **HTTP Status**: 401
- **User Message**: "Invalid API key. Please check your credentials."
- **Internal**: false

### SLIMY_AUTH_010
- **Title**: Rate Limited - Authentication
- **Description**: Too many authentication attempts from this IP or user
- **HTTP Status**: 429
- **User Message**: "Too many login attempts. Please try again later."
- **Internal**: false

---

## Domain: Discord Integration (DISCORD)

### SLIMY_DISCORD_001
- **Title**: Guild Not Found
- **Description**: Requested Discord guild/server does not exist or bot is not a member
- **HTTP Status**: 404
- **User Message**: "Server not found or bot not connected."
- **Internal**: false

### SLIMY_DISCORD_002
- **Title**: Member Not Found
- **Description**: Discord user is not a member of the specified guild
- **HTTP Status**: 404
- **User Message**: "User not found in this server."
- **Internal**: false

### SLIMY_DISCORD_003
- **Title**: Discord API Rate Limited
- **Description**: Discord API rate limit exceeded
- **HTTP Status**: 429
- **User Message**: "Discord service is busy. Please try again in a moment."
- **Internal**: false

### SLIMY_DISCORD_004
- **Title**: Insufficient Bot Permissions
- **Description**: Bot lacks required Discord permissions for the operation
- **HTTP Status**: 403
- **User Message**: "Bot lacks necessary permissions. Contact server administrator."
- **Internal**: false

### SLIMY_DISCORD_005
- **Title**: Discord API Unavailable
- **Description**: Discord API is unreachable or returning errors
- **HTTP Status**: 502
- **User Message**: "Discord service temporarily unavailable. Please try again later."
- **Internal**: false

### SLIMY_DISCORD_006
- **Title**: Invalid Discord ID
- **Description**: Provided Discord ID (guild, user, channel) is malformed
- **HTTP Status**: 400
- **User Message**: "Invalid Discord ID format."
- **Internal**: false

### SLIMY_DISCORD_007
- **Title**: Channel Not Found
- **Description**: Specified Discord channel does not exist or bot cannot access it
- **HTTP Status**: 404
- **User Message**: "Channel not found or inaccessible."
- **Internal**: false

### SLIMY_DISCORD_008
- **Title**: Role Not Found
- **Description**: Specified Discord role does not exist in the guild
- **HTTP Status**: 404
- **User Message**: "Role not found in this server."
- **Internal**: false

### SLIMY_DISCORD_009
- **Title**: Webhook Creation Failed
- **Description**: Failed to create Discord webhook for notifications
- **HTTP Status**: 500
- **User Message**: "Failed to set up Discord notifications."
- **Internal**: true

### SLIMY_DISCORD_010
- **Title**: Message Send Failed
- **Description**: Failed to send message to Discord channel
- **HTTP Status**: 500
- **User Message**: "Failed to send Discord message."
- **Internal**: true

### SLIMY_DISCORD_011
- **Title**: Guild Sync Failed
- **Description**: Failed to synchronize guild data from Discord API
- **HTTP Status**: 502
- **User Message**: "Failed to sync server data. Please try again."
- **Internal**: false

### SLIMY_DISCORD_012
- **Title**: Interaction Failed
- **Description**: Discord slash command or button interaction failed
- **HTTP Status**: 500
- **User Message**: "Discord interaction failed. Please try again."
- **Internal**: true

---

## Domain: Snail Tools (SNAIL)

### SLIMY_SNAIL_001
- **Title**: Snail Event Not Found
- **Description**: Requested snail event does not exist
- **HTTP Status**: 404
- **User Message**: "Snail event not found."
- **Internal**: false

### SLIMY_SNAIL_002
- **Title**: Invalid Snail Action
- **Description**: Attempted snail action is invalid or not allowed in current state
- **HTTP Status**: 400
- **User Message**: "Invalid snail action."
- **Internal**: false

### SLIMY_SNAIL_003
- **Title**: Snail History Fetch Failed
- **Description**: Failed to retrieve snail event history from storage
- **HTTP Status**: 500
- **User Message**: "Failed to load snail history. Please try again."
- **Internal**: true

### SLIMY_SNAIL_004
- **Title**: Snail Limit Exceeded
- **Description**: User has exceeded maximum number of concurrent snail operations
- **HTTP Status**: 429
- **User Message**: "Too many active snail operations. Please wait for some to complete."
- **Internal**: false

### SLIMY_SNAIL_005
- **Title**: Snail State Invalid
- **Description**: Snail is in an invalid state for the requested operation
- **HTTP Status**: 409
- **User Message**: "Snail cannot perform this action in its current state."
- **Internal**: false

### SLIMY_SNAIL_006
- **Title**: Snail Configuration Error
- **Description**: Snail tool configuration is invalid or missing
- **HTTP Status**: 500
- **User Message**: "Snail tool misconfigured. Contact support."
- **Internal**: true

### SLIMY_SNAIL_007
- **Title**: Snail Event Creation Failed
- **Description**: Failed to create new snail event in database
- **HTTP Status**: 500
- **User Message**: "Failed to create snail event. Please try again."
- **Internal**: true

### SLIMY_SNAIL_008
- **Title**: Snail User Not Authorized
- **Description**: User not authorized to perform snail operations
- **HTTP Status**: 403
- **User Message**: "You don't have access to snail tools."
- **Internal**: false

---

## Domain: Minecraft Integration (MINECRAFT)

### SLIMY_MINECRAFT_001
- **Title**: Server Not Found
- **Description**: Minecraft server not found in database or unavailable
- **HTTP Status**: 404
- **User Message**: "Minecraft server not found."
- **Internal**: false

### SLIMY_MINECRAFT_002
- **Title**: Server Connection Failed
- **Description**: Cannot establish connection to Minecraft server
- **HTTP Status**: 502
- **User Message**: "Unable to connect to Minecraft server."
- **Internal**: false

### SLIMY_MINECRAFT_003
- **Title**: Player Not Found
- **Description**: Minecraft player not found on server or in database
- **HTTP Status**: 404
- **User Message**: "Player not found."
- **Internal**: false

### SLIMY_MINECRAFT_004
- **Title**: RCON Authentication Failed
- **Description**: Failed to authenticate with Minecraft server RCON
- **HTTP Status**: 401
- **User Message**: "Failed to authenticate with Minecraft server."
- **Internal**: true

### SLIMY_MINECRAFT_005
- **Title**: Command Execution Failed
- **Description**: Minecraft server command execution failed
- **HTTP Status**: 500
- **User Message**: "Failed to execute server command."
- **Internal**: true

### SLIMY_MINECRAFT_006
- **Title**: Server Offline
- **Description**: Minecraft server is offline or not responding
- **HTTP Status**: 503
- **User Message**: "Minecraft server is currently offline."
- **Internal**: false

### SLIMY_MINECRAFT_007
- **Title**: Invalid Minecraft Username
- **Description**: Provided Minecraft username format is invalid
- **HTTP Status**: 400
- **User Message**: "Invalid Minecraft username."
- **Internal**: false

### SLIMY_MINECRAFT_008
- **Title**: Whitelist Operation Failed
- **Description**: Failed to add/remove player from server whitelist
- **HTTP Status**: 500
- **User Message**: "Failed to update server whitelist."
- **Internal**: true

### SLIMY_MINECRAFT_009
- **Title**: Server Full
- **Description**: Minecraft server has reached maximum player capacity
- **HTTP Status**: 503
- **User Message**: "Server is full. Please try again later."
- **Internal**: false

### SLIMY_MINECRAFT_010
- **Title**: World Data Unavailable
- **Description**: Unable to retrieve Minecraft world data
- **HTTP Status**: 500
- **User Message**: "Failed to load world data."
- **Internal**: true

---

## Domain: Infrastructure (INFRA)

### SLIMY_INFRA_001
- **Title**: Database Connection Failed
- **Description**: Cannot establish connection to database
- **HTTP Status**: 503
- **User Message**: "Service temporarily unavailable. Please try again later."
- **Internal**: true

### SLIMY_INFRA_002
- **Title**: Database Query Failed
- **Description**: Database query execution failed
- **HTTP Status**: 500
- **User Message**: "An error occurred. Please try again."
- **Internal**: true

### SLIMY_INFRA_003
- **Title**: Redis Connection Failed
- **Description**: Cannot establish connection to Redis cache
- **HTTP Status**: 503
- **User Message**: "Service temporarily unavailable. Please try again later."
- **Internal**: true

### SLIMY_INFRA_004
- **Title**: Cache Read Failed
- **Description**: Failed to read data from cache
- **HTTP Status**: 500
- **User Message**: "An error occurred. Please try again."
- **Internal**: true

### SLIMY_INFRA_005
- **Title**: Cache Write Failed
- **Description**: Failed to write data to cache
- **HTTP Status**: 500
- **User Message**: "An error occurred. Please try again."
- **Internal**: true

### SLIMY_INFRA_006
- **Title**: Configuration Missing
- **Description**: Required environment variable or configuration value is missing
- **HTTP Status**: 500
- **User Message**: "Service misconfigured. Contact support."
- **Internal**: true

### SLIMY_INFRA_007
- **Title**: Rate Limit Exceeded - Global
- **Description**: Global rate limit exceeded for this endpoint
- **HTTP Status**: 429
- **User Message**: "Too many requests. Please slow down and try again later."
- **Internal**: false

### SLIMY_INFRA_008
- **Title**: External API Unavailable
- **Description**: External API dependency is unavailable
- **HTTP Status**: 502
- **User Message**: "External service unavailable. Please try again later."
- **Internal**: false

### SLIMY_INFRA_009
- **Title**: Network Timeout
- **Description**: Network request timed out
- **HTTP Status**: 504
- **User Message**: "Request timed out. Please try again."
- **Internal**: false

### SLIMY_INFRA_010
- **Title**: Storage Full
- **Description**: Storage capacity exceeded
- **HTTP Status**: 507
- **User Message**: "Storage capacity reached. Contact support."
- **Internal**: true

### SLIMY_INFRA_011
- **Title**: Migration Pending
- **Description**: Database migration is pending or in progress
- **HTTP Status**: 503
- **User Message**: "Service maintenance in progress. Please try again later."
- **Internal**: true

### SLIMY_INFRA_012
- **Title**: Health Check Failed
- **Description**: Service health check failed
- **HTTP Status**: 503
- **User Message**: "Service temporarily unavailable."
- **Internal**: true

---

## Domain: Web Application (WEB)

### SLIMY_WEB_001
- **Title**: Resource Not Found
- **Description**: Requested web resource does not exist
- **HTTP Status**: 404
- **User Message**: "Page not found."
- **Internal**: false

### SLIMY_WEB_002
- **Title**: Validation Failed
- **Description**: Form or request validation failed
- **HTTP Status**: 400
- **User Message**: "Please check your input and try again."
- **Internal**: false

### SLIMY_WEB_003
- **Title**: File Upload Failed
- **Description**: File upload operation failed
- **HTTP Status**: 500
- **User Message**: "Failed to upload file. Please try again."
- **Internal**: true

### SLIMY_WEB_004
- **Title**: File Too Large
- **Description**: Uploaded file exceeds size limit
- **HTTP Status**: 413
- **User Message**: "File is too large. Maximum size is {limit}."
- **Internal**: false

### SLIMY_WEB_005
- **Title**: Invalid File Type
- **Description**: Uploaded file type is not allowed
- **HTTP Status**: 400
- **User Message**: "File type not supported. Allowed types: {types}."
- **Internal**: false

### SLIMY_WEB_006
- **Title**: Session Expired
- **Description**: User session has expired
- **HTTP Status**: 401
- **User Message**: "Your session has expired. Please refresh the page."
- **Internal**: false

### SLIMY_WEB_007
- **Title**: CSRF Token Invalid
- **Description**: CSRF token validation failed
- **HTTP Status**: 403
- **User Message**: "Security validation failed. Please refresh and try again."
- **Internal**: false

### SLIMY_WEB_008
- **Title**: Concurrent Modification
- **Description**: Resource was modified by another user
- **HTTP Status**: 409
- **User Message**: "This item was modified by another user. Please refresh and try again."
- **Internal**: false

### SLIMY_WEB_009
- **Title**: SSR Hydration Failed
- **Description**: Server-side rendering hydration mismatch
- **HTTP Status**: 500
- **User Message**: "Page loading error. Please refresh."
- **Internal**: true

### SLIMY_WEB_010
- **Title**: API Client Error
- **Description**: Internal API client request failed
- **HTTP Status**: 500
- **User Message**: "An error occurred. Please try again."
- **Internal**: true

---

## Domain: Chat/AI (CHAT)

### SLIMY_CHAT_001
- **Title**: Conversation Not Found
- **Description**: Requested chat conversation does not exist
- **HTTP Status**: 404
- **User Message**: "Conversation not found."
- **Internal**: false

### SLIMY_CHAT_002
- **Title**: Message Send Failed
- **Description**: Failed to send chat message
- **HTTP Status**: 500
- **User Message**: "Failed to send message. Please try again."
- **Internal**: true

### SLIMY_CHAT_003
- **Title**: AI Service Unavailable
- **Description**: AI/LLM service is unavailable or returning errors
- **HTTP Status**: 502
- **User Message**: "AI service temporarily unavailable. Please try again later."
- **Internal**: false

### SLIMY_CHAT_004
- **Title**: Context Length Exceeded
- **Description**: Chat context exceeds maximum token limit
- **HTTP Status**: 400
- **User Message**: "Conversation is too long. Please start a new conversation."
- **Internal**: false

### SLIMY_CHAT_005
- **Title**: Rate Limited - Chat
- **Description**: User has exceeded chat message rate limit
- **HTTP Status**: 429
- **User Message**: "You're sending messages too quickly. Please wait a moment."
- **Internal**: false

### SLIMY_CHAT_006
- **Title**: Content Filtered
- **Description**: Message content violated content policy
- **HTTP Status**: 400
- **User Message**: "Message contains inappropriate content."
- **Internal**: false

### SLIMY_CHAT_007
- **Title**: Invalid Message Format
- **Description**: Chat message format is invalid
- **HTTP Status**: 400
- **User Message**: "Invalid message format."
- **Internal**: false

### SLIMY_CHAT_008
- **Title**: AI Response Generation Failed
- **Description**: Failed to generate AI response
- **HTTP Status**: 500
- **User Message**: "Failed to generate response. Please try again."
- **Internal**: true

### SLIMY_CHAT_009
- **Title**: Conversation Archived
- **Description**: Cannot modify archived conversation
- **HTTP Status**: 403
- **User Message**: "This conversation has been archived and cannot be modified."
- **Internal**: false

### SLIMY_CHAT_010
- **Title**: Maximum Conversations Reached
- **Description**: User has reached maximum number of concurrent conversations
- **HTTP Status**: 429
- **User Message**: "Maximum conversation limit reached. Please close some conversations."
- **Internal**: false

---

## Usage Guidelines

### For Future Integration

1. **Error Throwing**: When throwing errors, include the error code:
   ```typescript
   throw new AppError("Authentication required", "SLIMY_AUTH_001", 401);
   ```

2. **Error Mapping**: Map internal exceptions to catalog codes:
   ```typescript
   if (error instanceof PrismaClientKnownRequestError) {
     return getErrorInfo("SLIMY_INFRA_002");
   }
   ```

3. **Client Display**: Use `userMessage` for user-facing errors:
   ```typescript
   const errorInfo = getErrorInfo("SLIMY_DISCORD_001");
   return { error: errorInfo.userMessage };
   ```

4. **Logging**: Use full error code for server logs:
   ```typescript
   logger.error({ code: "SLIMY_INFRA_001", details: error.message });
   ```

### Best Practices

- **Never expose internal errors**: If `internal: true`, log details server-side but show generic message to users
- **Maintain backward compatibility**: Don't remove error codes; deprecate and add new ones
- **Document changes**: Update this file when adding new error codes
- **Group by domain**: Keep related errors together for maintainability
- **Sequential numbering**: Use next available number in domain sequence
- **Consistent naming**: Follow established naming patterns for new errors

### Adding New Error Codes

1. Identify the appropriate domain (AUTH, DISCORD, etc.)
2. Find the next available number in that domain
3. Define all required fields (title, description, HTTP status, user message)
4. Add to this document and update `packages/error-catalog/src/codes.ts`
5. Document in PR why the new error code is needed

---

## Reserved Number Ranges

To support future expansion:

- **001-050**: Core/common errors for each domain
- **051-100**: Extended/specific error cases
- **101-200**: Integration-specific errors
- **201-299**: Reserved for future use
- **300+**: Domain-specific extensions

---

**Version**: 1.0.0
**Last Updated**: 2025-11-19
**Maintained By**: Slimy.ai Platform Team
