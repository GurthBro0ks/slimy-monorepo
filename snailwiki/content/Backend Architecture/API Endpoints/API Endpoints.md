# API Endpoints

<cite>
**Referenced Files in This Document**   
- [auth.js](file://apps/admin-api/src/routes/auth.js)
- [guilds.js](file://apps/admin-api/src/routes/guilds.js)
- [club.js](file://apps/admin-api/src/routes/club.js)
- [chat.js](file://apps/admin-api/src/routes/chat.js)
- [diag.js](file://apps/admin-api/src/routes/diag.js)
- [config.js](file://apps/admin-api/src/config.js)
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [rate-limit.js](file://apps/admin-api/src/middleware/rate-limit.js)
- [schemas.js](file://apps/admin-api/src/lib/validation/schemas.js)
- [rbac.js](file://apps/admin-api/src/services/rbac.js)
- [index.js](file://apps/admin-api/src/routes/index.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Guild Management Endpoints](#guild-management-endpoints)
4. [Club Analytics Endpoints](#club-analytics-endpoints)
5. [Chat Service Endpoints](#chat-service-endpoints)
6. [Diagnostics Endpoints](#diagnostics-endpoints)
7. [Security and Authentication](#security-and-authentication)
8. [Request Validation](#request-validation)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Versioning and Deprecation](#versioning-and-deprecation)

## Introduction

The admin-api service provides a comprehensive REST API for managing guild configurations, club analytics, chat interactions, and system diagnostics. The API is organized into logical endpoint groups that correspond to specific functional areas of the application. All endpoints follow consistent patterns for authentication, error handling, and response formatting.

The API is built on Express.js and follows RESTful principles with JSON request and response payloads. Endpoints are grouped by functionality and accessible under the `/api` prefix. The service implements robust security measures including JWT-based authentication, role-based access control, CSRF protection, and rate limiting.

This documentation covers all public API endpoints in the admin-api service, detailing HTTP methods, URL patterns, request/response schemas, authentication requirements, and usage examples for each endpoint group.

**Section sources**
- [index.js](file://apps/admin-api/src/routes/index.js#L5-L75)

## Authentication Endpoints

The authentication endpoints handle user login, session management, and profile retrieval. These endpoints implement OAuth 2.0 with Discord as the identity provider, using JWT tokens for session management.

### Login Endpoint

Initiates the OAuth 2.0 authentication flow with Discord.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/auth/login`  
**Authentication Required**: No  
**CSRF Protection**: No  

**Request Parameters**:
- None

**Response**:
- Status: 302 Found
- Location: Discord OAuth 2.0 authorization URL with appropriate parameters

When a client accesses this endpoint, they are redirected to Discord's authorization page where they can grant the application access to their profile and guild information. The application requests the "identify" and "guilds" scopes to retrieve basic user information and guild membership.

**Usage Example**:
```bash
curl -X GET https://api.slimyai.xyz/api/auth/login
```

**Section sources**
- [auth.js](file://apps/admin-api/src/routes/auth.js#L108-L119)

### Callback Endpoint

Handles the OAuth 2.0 callback from Discord after user authorization.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/auth/callback`  
**Authentication Required**: No  
**CSRF Protection**: Yes (via state parameter)  

**Request Query Parameters**:
- `code` (string, required): Authorization code provided by Discord
- `state` (string, required): State parameter for CSRF protection

**Response**:
- Success: 302 Redirect to appropriate UI route based on user role
- Error: 302 Redirect to error page with error parameter

This endpoint exchanges the authorization code for an access token, retrieves the user's profile and guild information from Discord, determines the user's role based on their guild permissions, creates a session, and sets an authentication cookie.

**Security Considerations**:
- Validates the state parameter against a nonce stored in a secure cookie
- Uses secure, HTTP-only cookies for session storage
- Implements role-based redirection to appropriate UI sections

**Section sources**
- [auth.js](file://apps/admin-api/src/routes/auth.js#L121-L374)

### Current User Endpoint

Retrieves information about the currently authenticated user.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/auth/me`  
**Authentication Required**: Yes  
**CSRF Protection**: No  

**Request Headers**:
- `Cookie`: Contains the authentication token

**Response Schema**:
```json
{
  "id": "string",
  "username": "string",
  "globalName": "string",
  "avatar": "string|null",
  "role": "string",
  "guilds": [
    {
      "id": "string",
      "name": "string",
      "icon": "string|null",
      "role": "string",
      "installed": "boolean",
      "permissions": "string"
    }
  ],
  "sessionGuilds": "array"
}
```

**Success Response**:
- Status: 200 OK
- Body: User profile and guild membership information

**Error Response**:
- Status: 401 Unauthorized
- Body: `{ "error": "unauthorized" }`

This endpoint returns the authenticated user's profile information along with their guild memberships and roles within each guild. It's used by client applications to initialize the user interface with the appropriate data.

**Usage Example**:
```bash
curl -X GET https://api.slimyai.xyz/api/auth/me \
  -H "Cookie: slimy_admin_token=your-jwt-token"
```

**Section sources**
- [auth.js](file://apps/admin-api/src/routes/auth.js#L376-L390)

### Logout Endpoint

Terminates the current user session.

**HTTP Method**: `POST`  
**URL Pattern**: `/api/auth/logout`  
**Authentication Required**: Yes  
**CSRF Protection**: Yes  

**Request Headers**:
- `Cookie`: Contains the authentication token
- `x-csrf-token`: CSRF token

**Request Body**: None

**Response**:
- Status: 200 OK
- Body: `{ "ok": true }`

This endpoint clears the user's session from the server-side store and removes the authentication cookie from the client. It requires CSRF protection to prevent unauthorized session termination.

**Usage Example**:
```bash
curl -X POST https://api.slimyai.xyz/api/auth/logout \
  -H "Cookie: slimy_admin_token=your-jwt-token" \
  -H "x-csrf-token: your-csrf-token"
```

**Section sources**
- [auth.js](file://apps/admin-api/src/routes/auth.js#L392-L398)

## Guild Management Endpoints

The guild management endpoints provide functionality for retrieving and updating guild configurations, including settings, personality profiles, channel configurations, corrections, and usage statistics.

### List User Guilds

Retrieves a list of guilds the authenticated user has access to.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/guilds`  
**Authentication Required**: Yes  
**CSRF Protection**: No  

**Response Schema**:
```json
{
  "guilds": [
    {
      "id": "string",
      "name": "string",
      "icon": "string|null",
      "role": "string",
      "installed": "boolean",
      "permissions": "string"
    }
  ]
}
```

**Success Response**:
- Status: 200 OK
- Body: Array of guild objects the user is a member of

This endpoint returns all guilds the authenticated user belongs to, along with their role and permission level in each guild. It's typically used to populate the guild selection interface in the admin UI.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L90-L92)

### Get Guild Settings

Retrieves the configuration settings for a specific guild.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/guilds/:guildId/settings`  
**Authentication Required**: Yes (guild member)  
**CSRF Protection**: No  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Query Parameters**:
- `test` (boolean, optional): If true, includes test settings

**Response Schema**:
```json
{
  "sheetUrl": "string|null",
  "weekWindowDays": "number|null",
  "thresholds": {
    "warnLow": "number|null",
    "warnHigh": "number|null"
  },
  "tokensPerMinute": "number|null",
  "testSheet": "boolean"
}
```

**Success Response**:
- Status: 200 OK
- Body: Guild settings object

**Error Responses**:
- 403 Forbidden: User is not a member of the specified guild
- 404 Not Found: Guild does not exist

This endpoint returns the current configuration for a guild, including the Google Sheet URL, week window settings, thresholds, and rate limiting configuration.

**Usage Example**:
```bash
curl -X GET https://api.slimyai.xyz/api/guilds/1234567890/settings \
  -H "Authorization: Bearer your-token"
```

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L94-L107)

### Update Guild Settings

Updates the configuration settings for a specific guild.

**HTTP Method**: `PUT`  
**URL Pattern**: `/api/guilds/:guildId/settings`  
**Authentication Required**: Yes (editor role or higher)  
**CSRF Protection**: Yes  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Request Body Schema**:
```json
{
  "sheetUrl": "string|null",
  "weekWindowDays": "number|null",
  "thresholds": {
    "warnLow": "number|null",
    "warnHigh": "number|null"
  },
  "tokensPerMinute": "number|null",
  "testSheet": "boolean"
}
```

**Response**:
- Status: 200 OK
- Body: Updated guild settings object

This endpoint allows users with editor privileges or higher to modify a guild's configuration. It validates the input against the defined schema and updates the settings in the database. An audit log entry is created for this action.

**Input Validation Rules**:
- `weekWindowDays` must be an integer between 1 and 14
- `tokensPerMinute` must be a positive integer
- `thresholds.warnLow` and `thresholds.warnHigh` must be numbers

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L109-L132)

### Get Guild Personality

Retrieves the personality profile for a specific guild.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/guilds/:guildId/personality`  
**Authentication Required**: Yes (guild member)  
**CSRF Protection**: No  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Response Schema**:
```json
{
  "profile": "object"
}
```

**Success Response**:
- Status: 200 OK
- Body: Personality profile object

This endpoint returns the current personality configuration for a guild, which defines how the AI bot should behave when interacting in that guild.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L134-L147)

### Update Guild Personality

Updates the personality profile for a specific guild.

**HTTP Method**: `PUT`  
**URL Pattern**: `/api/guilds/:guildId/personality`  
**Authentication Required**: Yes (editor role or higher)  
**CSRF Protection**: Yes  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Request Body Schema**:
```json
{
  "profile": "object"
}
```

**Response**:
- Status: 200 OK
- Body: Updated personality record

This endpoint allows privileged users to modify a guild's personality profile. The profile can include various attributes that influence the AI's behavior, tone, and response patterns.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L149-L172)

### List Corrections

Retrieves the correction records for a specific guild.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/guilds/:guildId/corrections`  
**Authentication Required**: Yes (guild member)  
**CSRF Protection**: No  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Query Parameters**:
- `weekId` (string, optional): Filter corrections by week ID

**Response Schema**:
```json
{
  "corrections": [
    {
      "weekId": "string",
      "memberKey": "string",
      "displayName": "string",
      "memberInput": "string",
      "metric": "string",
      "value": "number|string",
      "reason": "string",
      "createdAt": "string"
    }
  ]
}
```

**Success Response**:
- Status: 200 OK
- Body: Array of correction objects

This endpoint returns all corrections applied to member metrics in the specified guild, optionally filtered by week.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L215-L230)

### Create Correction

Adds a new correction record for a guild member's metrics.

**HTTP Method**: `POST`  
**URL Pattern**: `/api/guilds/:guildId/corrections`  
**Authentication Required**: Yes (editor role or higher)  
**CSRF Protection**: Yes  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Request Body Schema**:
```json
{
  "weekId": "string",
  "memberKey": "string",
  "displayName": "string",
  "memberInput": "string",
  "metric": "string",
  "value": "number|string",
  "reason": "string"
}
```

**Validation Rules**:
- Either `memberKey`, `displayName`, or `memberInput` must be provided
- `metric` must be either "total" or "sim"
- `value` must be a number or string

**Response**:
- Status: 201 Created
- Body: Created correction object

This endpoint allows administrators to manually adjust member metrics for a specific week, with an optional reason for the correction.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L232-L256)

### Delete Correction

Removes a correction record by ID.

**HTTP Method**: `DELETE`  
**URL Pattern**: `/api/guilds/:guildId/corrections/:correctionId`  
**Authentication Required**: Yes (editor role or higher)  
**CSRF Protection**: Yes  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID
- `correctionId` (number, required): ID of the correction to delete

**Response**:
- Status: 204 No Content (success)
- Status: 400 Bad Request (invalid correction ID)
- Status: 404 Not Found (correction not found)

This endpoint permanently removes a correction record from the database.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L258-L288)

### Rescan Member

Triggers a rescan of a specific member's data from an uploaded file.

**HTTP Method**: `POST`  
**URL Pattern**: `/api/guilds/:guildId/rescan-user`  
**Authentication Required**: Yes (editor role or higher)  
**CSRF Protection**: Yes  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Request Body**:
- Form data with file upload and additional fields

**Form Fields**:
- `file` (file, required): The uploaded file containing member data
- `member` or `memberInput` (string, required): Identifier for the member to rescan
- `metric` (string, required): The metric to rescan ("total" or "sim")
- `weekId` (string, optional): The week to rescan

**Response Schema**:
```json
{
  "success": "boolean",
  "message": "string",
  "metric": "string",
  "value": "number",
  "previousValue": "number|null"
}
```

**Response**:
- Status: 200 OK
- Body: Result of the rescan operation

This endpoint processes an uploaded file to extract updated metrics for a specific guild member, allowing administrators to correct data without waiting for the regular scanning process.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L290-L327)

### Export Corrections (CSV)

Exports correction records as a CSV file.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/guilds/:guildId/export/corrections.csv`  
**Authentication Required**: Yes (admin role)  
**CSRF Protection**: No  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Response**:
- Status: 200 OK
- Content-Type: text/csv
- Content-Disposition: attachment with filename
- Body: CSV formatted data

This endpoint generates a CSV file containing all correction records for the specified guild, which can be downloaded and opened in spreadsheet applications.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L360-L389)

### Export Corrections (JSON)

Exports correction records as a JSON file.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/guilds/:guildId/export/corrections.json`  
**Authentication Required**: Yes (admin role)  
**CSRF Protection**: No  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Response**:
- Status: 200 OK
- Content-Type: application/json
- Content-Disposition: attachment with filename
- Body: JSON array of correction objects

This endpoint provides the same data as the CSV export but in JSON format, which is more suitable for programmatic processing.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L391-L413)

### Export Personality (JSON)

Exports the guild's personality profile as a JSON file.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/guilds/:guildId/export/personality.json`  
**Authentication Required**: Yes (admin role)  
**CSRF Protection**: No  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Response**:
- Status: 200 OK
- Content-Type: application/json
- Content-Disposition: attachment with filename
- Body: JSON object containing the personality profile

This endpoint allows administrators to backup or transfer a guild's personality configuration.

**Section sources**
- [guilds.js](file://apps/admin-api/src/routes/guilds.js#L415-L437)

## Club Analytics Endpoints

The club analytics endpoints provide functionality for retrieving and managing club member metrics and power rankings.

### Get Latest Club Metrics

Retrieves the most recent club member metrics for a guild.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/guilds/:guildId/club/latest`  
**Authentication Required**: Yes (guild member)  
**CSRF Protection**: No  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Response Schema**:
```json
{
  "ok": "boolean",
  "guildId": "string",
  "members": [
    {
      "memberKey": "string",
      "name": "string",
      "simPower": "number",
      "totalPower": "number",
      "changePercent": "number|null",
      "lastSeenAt": "string"
    }
  ]
}
```

**Success Response**:
- Status: 200 OK
- Body: Object containing guild ID and array of member metrics

**Error Response**:
- Status: 500 Internal Server Error
- Body: Error details

This endpoint returns the latest calculated metrics for all club members in the specified guild, including their SIM power, total power, and last seen timestamp.

**Usage Example**:
```bash
curl -X GET https://api.slimyai.xyz/api/guilds/1234567890/club/latest \
  -H "Authorization: Bearer your-token"
```

**Section sources**
- [club.js](file://apps/admin-api/src/routes/club.js#L22-L46)

### Trigger Club Metrics Rescan

Initiates a complete recalculation of club metrics for a guild.

**HTTP Method**: `POST`  
**URL Pattern**: `/api/guilds/:guildId/club/rescan`  
**Authentication Required**: Yes (admin role)  
**CSRF Protection**: Yes  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID

**Request Body**: None

**Response Schema**:
```json
{
  "ok": "boolean",
  "message": "string",
  "guildId": "string",
  "recomputedAt": "string"
}
```

**Response**:
- Status: 202 Accepted
- Body: Confirmation of rescan initiation

This endpoint triggers a background job to recalculate all club metrics for the specified guild. This is typically used when there are concerns about data accuracy or after significant changes to the underlying data.

**Section sources**
- [club.js](file://apps/admin-api/src/routes/club.js#L62-L76)

## Chat Service Endpoints

The chat service endpoints provide functionality for interacting with the AI chat bot, managing conversations, and retrieving chat history.

### Submit Chat Bot Interaction

Submits a user message for processing by the AI chat bot.

**HTTP Method**: `POST`  
**URL Pattern**: `/api/chat/bot`  
**Authentication Required**: Yes (member role or higher)  
**CSRF Protection**: Yes  

**Request Body Schema**:
```json
{
  "prompt": "string",
  "guildId": "string"
}
```

**Validation Rules**:
- `prompt` is required and must be a non-empty string
- `prompt` cannot exceed 2000 characters
- `guildId` is required

**Response Schema**:
```json
{
  "ok": "boolean",
  "jobId": "string",
  "status": "string",
  "estimatedWaitTime": "string"
}
```

**Success Response**:
- Status: 200 OK
- Body: Job tracking information

**Error Responses**:
- 400 Bad Request: Missing or invalid prompt
- 503 Service Unavailable: Job queues not available

This endpoint accepts a user message and submits it as a job to the chat processing queue. It returns a job ID that can be used to track the progress and retrieve the response.

**Usage Example**:
```bash
curl -X POST https://api.slimyai.xyz/api/chat/bot \
  -H "Authorization: Bearer your-token" \
  -H "x-csrf-token: your-csrf-token" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?", "guildId": "1234567890"}'
```

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L53-L102)

### Check Chat Job Status

Retrieves the status and result of a chat bot interaction job.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/chat/jobs/:jobId`  
**Authentication Required**: Yes (member role or higher)  
**CSRF Protection**: No  

**Path Parameters**:
- `jobId` (string, required): ID of the job to check

**Response Schema**:
```json
{
  "ok": "boolean",
  "status": "string",
  "jobId": "string",
  "createdAt": "number",
  "result": {
    "reply": "string",
    "usedFallback": "boolean"
  },
  "error": "string",
  "completedAt": "number",
  "failedAt": "number",
  "progress": "object"
}
```

**Status Values**:
- `queued`: Job is waiting in the queue
- `active`: Job is currently being processed
- `completed`: Job finished successfully
- `failed`: Job failed to complete

**Success Response**:
- Status: 200 OK
- Body: Job status and result (if completed)

**Error Responses**:
- 403 Forbidden: User does not own this job
- 404 Not Found: Job does not exist

This endpoint allows clients to poll for the status of a chat bot interaction job and retrieve the AI-generated response when available.

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L127-L181)

### Retrieve Chat History

Gets the chat history for a specific guild or the admin room.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/chat/:guildId/history`  
**Authentication Required**: Yes (member role or higher)  
**CSRF Protection**: No  

**Path Parameters**:
- `guildId` (string, required): Discord guild ID or "admin-global" for admin room

**Query Parameters**:
- `limit` (number, optional): Maximum number of messages to return (default: 50)

**Response Schema**:
```json
{
  "ok": "boolean",
  "messages": [
    {
      "messageId": "string",
      "guildId": "string",
      "userId": "string",
      "username": "string",
      "from": {
        "id": "string",
        "name": "string",
        "role": "string",
        "color": "string"
      },
      "text": "string",
      "adminOnly": "boolean",
      "ts": "string"
    }
  ]
}
```

**Access Control**:
- Admin room (admin-global): Admin role required
- Regular guilds: Must be a member of the guild or have admin role
- Regular members: Can only view non-admin-only messages

This endpoint returns recent chat messages for the specified context, with appropriate access controls based on user roles.

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L279-L342)

### Create Conversation

Creates a new chat conversation for the authenticated user.

**HTTP Method**: `POST`  
**URL Pattern**: `/api/chat/conversations`  
**Authentication Required**: Yes  
**CSRF Protection**: Yes  

**Request Body Schema**:
```json
{
  "title": "string",
  "personalityMode": "string"
}
```

**Validation Rules**:
- `title` cannot exceed 200 characters
- `personalityMode` must be one of: "helpful", "creative", "professional", "casual"

**Response Schema**:
```json
{
  "ok": "boolean",
  "jobId": "string",
  "status": "string",
  "estimatedWaitTime": "string"
}
```

This endpoint creates a new conversation record in the database and returns a job ID for tracking the operation.

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L364-L394)

### List Conversations

Retrieves a list of conversations for the authenticated user.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/chat/conversations`  
**Authentication Required**: Yes  
**CSRF Protection**: No  

**Query Parameters**:
- `limit` (number, optional): Maximum number of conversations to return (default: 20)

**Response Schema**:
```json
{
  "ok": "boolean",
  "conversations": [
    {
      "id": "string",
      "title": "string",
      "personalityMode": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "messageCount": "number"
    }
  ]
}
```

This endpoint returns all conversations belonging to the authenticated user, with metadata including message count.

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L410-L439)

### Get Conversation

Retrieves a specific conversation with all its messages.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/chat/conversations/:conversationId`  
**Authentication Required**: Yes (conversation owner)  
**CSRF Protection**: No  

**Path Parameters**:
- `conversationId` (string, required): UUID of the conversation to retrieve

**Response Schema**:
```json
{
  "ok": "boolean",
  "conversation": {
    "id": "string",
    "title": "string",
    "personalityMode": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "messages": [
      {
        "id": "string",
        "role": "string",
        "content": "string",
        "personalityMode": "string",
        "createdAt": "string"
      }
    ]
  }
}
```

**Error Response**:
- 404 Not Found: Conversation does not exist or user does not have access

This endpoint returns a complete conversation with all its messages, allowing clients to reconstruct the full chat history.

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L458-L497)

### Delete Conversation

Removes a conversation and all its messages.

**HTTP Method**: `DELETE`  
**URL Pattern**: `/api/chat/conversations/:conversationId`  
**Authentication Required**: Yes (conversation owner)  
**CSRF Protection**: Yes  

**Path Parameters**:
- `conversationId` (string, required): UUID of the conversation to delete

**Response**:
- Status: 200 OK
- Body: `{ "ok": true }`

**Error Response**:
- 404 Not Found: Conversation does not exist or user does not have access

This endpoint permanently deletes a conversation and all associated messages from the database.

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L515-L537)

### Update Conversation

Modifies a conversation's title.

**HTTP Method**: `PATCH`  
**URL Pattern**: `/api/chat/conversations/:conversationId`  
**Authentication Required**: Yes (conversation owner)  
**CSRF Protection**: Yes  

**Path Parameters**:
- `conversationId` (string, required): UUID of the conversation to update

**Request Body Schema**:
```json
{
  "title": "string"
}
```

**Response**:
- Status: 200 OK
- Body: `{ "ok": true }`

**Error Response**:
- 404 Not Found: Conversation does not exist or user does not have access

This endpoint allows users to rename their conversations for better organization.

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L558-L581)

### Add Message to Conversation

Adds a message to an existing conversation.

**HTTP Method**: `POST`  
**URL Pattern**: `/api/chat/messages`  
**Authentication Required**: Yes  
**CSRF Protection**: Yes  

**Request Body Schema**:
```json
{
  "conversationId": "string",
  "message": {
    "role": "string",
    "content": "string",
    "personalityMode": "string"
  }
}
```

**Validation Rules**:
- `role` must be either "user" or "assistant"
- `content` is required and cannot exceed 4000 characters

**Response Schema**:
```json
{
  "ok": "boolean",
  "jobId": "string",
  "status": "string",
  "estimatedWaitTime": "string"
}
```

This endpoint adds a message to a conversation and returns a job ID for tracking the database operation.

**Section sources**
- [chat.js](file://apps/admin-api/src/routes/chat.js#L605-L637)

## Diagnostics Endpoints

The diagnostics endpoints provide system health information and operational metrics for monitoring and troubleshooting.

### Get Diagnostics

Retrieves system diagnostics and operational metrics.

**HTTP Method**: `GET`  
**URL Pattern**: `/api/diag`  
**Authentication Required**: No (but provides more information if authenticated)  
**CSRF Protection**: No  

**Response Schema**:
```json
{
  "ok": "boolean",
  "authenticated": "boolean",
  "admin": {
    "uptimeSec": "number",
    "memory": {
      "rssMb": "number",
      "heapUsedMb": "number"
    },
    "node": "string",
    "pid": "number",
    "hostname": "string"
  },
  "uploads": {
    "total": "number",
    "today": "number",
    "byGuild": "object"
  }
}
```

**Success Response**:
- Status: 200 OK
- Body: Diagnostics information

**Error Response**:
- Status: 500 Internal Server Error
- Body: `{ "error": "diag_failed" }`

This endpoint returns system-level information including process uptime, memory usage, Node.js version, and upload statistics. When accessed by an authenticated user, it includes additional upload metrics.

**Usage Example**:
```bash
curl -X GET https://api.slimyai.xyz/api/diag
```

**Section sources**
- [diag.js](file://apps/admin-api/src/routes/diag.js#L22-L54)

## Security and Authentication

The admin-api service implements a comprehensive security model that includes authentication, authorization, and various protection mechanisms.

### Authentication Mechanism

The API uses JWT (JSON Web Tokens) for authentication, with tokens stored in HTTP-only, secure cookies. The authentication flow follows the OAuth 2.0 authorization code grant type with Discord as the identity provider.

When a user logs in:
1. They are redirected to Discord's authorization endpoint
2. After granting permission, Discord redirects back with an authorization code
3. The server exchanges the code for an access token
4. The server retrieves the user's profile and guild information
5. A JWT is created and stored in a secure cookie

The JWT contains the user's ID, username, role, and guild memberships. The token is signed with a secret key to prevent tampering.

**Configuration**:
- Token expiration: Configurable via `JWT_EXPIRES_IN` environment variable (default: 12 hours)
- Cookie name: Configurable via `ADMIN_TOKEN_COOKIE` environment variable
- Cookie security: Secure flag enabled in production environments

**Section sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js#L3-L231)
- [config.js](file://apps/admin-api/src/config.js#L39-L56)

### Role-Based Access Control (RBAC)

The API implements a role-based access control system with the following roles in order of increasing privilege:

1. **member**: Basic access to view data
2. **club**: Additional access to club analytics
3. **editor**: Can modify configurations and settings
4. **admin**: Full administrative privileges
5. **owner**: System owner with highest privileges

Roles are determined based on Discord guild permissions:
- Users with "Manage Guild" or "Administrator" permissions are assigned the "admin" role
- Other guild members receive the "member" role
- Special roles like "club" may be assigned based on specific criteria

The `requireRole` middleware function enforces role requirements for endpoints, ensuring that users can only perform actions appropriate to their privilege level.

**Section sources**
- [rbac.js](file://apps/admin-api/src/services/rbac.js#L50-L58)
- [auth.js](file://apps/admin-api/src/middleware/auth.js#L162-L173)

### CSRF Protection

The API implements CSRF (Cross-Site Request Forgery) protection for state-changing operations using the synchronizer token pattern.

CSRF protection is implemented through:
- A CSRF token stored in a secure cookie
- The `x-csrf-token` header required for POST, PUT, PATCH, and DELETE requests
- Token validation middleware that compares the header value with the cookie value

Endpoints that modify data (e.g., updating settings, creating corrections) require CSRF protection to prevent unauthorized actions initiated from other sites.

**Configuration**:
- CSRF header name: Configurable via configuration (default: `x-csrf-token`)
- Token lifetime: 5 minutes

**Section sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js#L57-L59)
- [chat.js](file://apps/admin-api/src/routes/chat.js#L17)

## Request Validation

The API implements comprehensive request validation using Zod schemas to ensure data integrity and prevent malformed requests.

### Validation Approach

All endpoints that accept request data (query parameters, path parameters, or request body) implement validation using Zod, a TypeScript-first schema declaration and validation library.

Validation is performed at multiple levels:
- **Type validation**: Ensures data is of the correct type (string, number, boolean, etc.)
- **Format validation**: Checks for proper formatting (e.g., valid UUIDs, Discord IDs)
- **Range validation**: Enforces minimum and maximum values
- **Length validation**: Limits string and array lengths
- **Business rule validation**: Enforces application-specific rules

### Error Response Format

When validation fails, the API returns a standardized error response:

```json
{
  "error": "validation-error",
  "details": [
    {
      "path": ["field", "nested"],
      "message": "Field cannot be empty"
    }
  ]
}
```

The response includes the validation error code and an array of detailed error objects, each containing the field path and specific error message.

### Schema Examples

**Guild ID Validation**:
```javascript
const guildIdSchema = z.string().regex(/^\d{17,19}$/, "Invalid Discord guild ID");
```

**Positive Integer Validation**:
```javascript
const positiveInteger = z.number().int().positive();
```

**Chat Message Validation**:
```javascript
const chatMessageSchema = z.object({
  text: nonEmptyString.max(2000, "Message too long (max 2000 characters)"),
  adminOnly: z.boolean().optional().default(false),
}).strict();
```

**Section sources**
- [schemas.js](file://apps/admin-api/src/lib/validation/schemas.js#L1-L476)
- [validate.js](file://apps/admin-api/src/middleware/validate.js#L1-L45)

## Error Handling

The API implements a comprehensive error handling system that provides consistent error responses while protecting sensitive information.

### Error Response Format

All errors follow a consistent JSON format:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "requestId": "unique-request-identifier"
  }
}
```

In development mode, additional error details including stack traces may be included.

### Error Types

The API distinguishes between operational and programmer errors:

**Operational Errors** (expected, safe to expose):
- Authentication failures
- Authorization failures
- Validation errors
- Resource not found
- Rate limiting

**Programmer Errors** (unexpected, should not expose details):
- Database connection failures
- Internal server errors
- Third-party service failures

Operational errors return appropriate HTTP status codes and descriptive messages. Programmer errors are logged for debugging but return generic 500 responses to clients.

### Error Middleware

The error handling middleware:
1. Logs the error with contextual information
2. Determines if the error is operational
3. Wraps non-operational errors in a generic InternalServerError
4. Formats the error response
5. Sends the response with appropriate status code

**Section sources**
- [error-handler.js](file://apps/admin-api/src/middleware/error-handler.js#L1-L82)

## Rate Limiting

The API implements rate limiting to prevent abuse and ensure fair usage of resources.

### Rate Limiting Strategy

The service uses express-rate-limit with a custom key generator that combines the user ID (or IP address for unauthenticated users) with the guild ID. This creates separate rate limit counters for each user-guild combination.

**Configuration**:
- Window: Configurable via `ADMIN_TASK_LIMIT_WINDOW_MS` (default: 60,000 ms = 1 minute)
- Maximum requests: Configurable via `ADMIN_TASK_LIMIT_MAX` (default: 5 requests per window)

### Rate Limited Endpoints

All endpoints that perform state-changing operations are subject to rate limiting, including:
- Authentication endpoints (login, callback)
- Guild settings updates
- Correction creation and deletion
- Chat bot interactions
- Conversation management

Read-only endpoints are generally not rate limited, except for those that are computationally expensive.

### Rate Limit Headers

The API includes standard rate limiting headers in responses:
- `RateLimit-Limit`: The maximum number of requests in the current window
- `RateLimit-Remaining`: The number of requests remaining in the current window
- `RateLimit-Reset`: The time when the rate limit resets

### Rate Limit Response

When a client exceeds the rate limit:
- Status: 429 Too Many Requests
- Body: `{ "error": "rate-limit" }`

**Section sources**
- [rate-limit.js](file://apps/admin-api/src/middleware/rate-limit.js#L1-L23)
- [config.js](file://apps/admin-api/src/config.js#L80-L85)

## Versioning and Deprecation

The admin-api service currently uses a simple versioning strategy with plans for more sophisticated versioning in the future.

### Current Versioning

The API does not currently implement versioning in the URL path. All endpoints are served under the `/api` prefix without a version identifier. This approach is suitable for the current stage of development but will be revisited as the API matures.

### Deprecation Policy

When endpoints need to be deprecated:
1. A deprecation notice will be added to the endpoint documentation
2. The endpoint will continue to function for a minimum of 3 months
3. Clients will be encouraged to migrate to the replacement endpoint
4. After the deprecation period, the endpoint will be removed

### Future Versioning Plans

The team plans to implement URL-based versioning with the following format:
- `/api/v1/endpoint` - Current stable version
- `/api/v2/endpoint` - New version with breaking changes
- `/api/latest/endpoint` - Alias for the most recent version

This will allow for backward compatibility while enabling the introduction of improved APIs.

**Section sources**
- [index.js](file://apps/admin-api/src/routes/index.js#L21-L36)