# Webhooks & Outbound Integrations

This directory contains the implementation of the Slimy.ai webhooks system, which allows external services to receive real-time notifications when events occur in the system.

## Overview

The webhook system enables guild administrators to configure HTTP endpoints that will receive POST requests whenever specific events happen (e.g., club snapshot created, season closed, codes updated).

## Components

### 1. Database Models (Prisma Schema)

**Webhook**
- Stores webhook configurations per guild
- Fields: `id`, `guildId`, `name`, `targetUrl`, `secret`, `enabled`, `eventTypes`, timestamps
- Event types are stored as comma-separated strings

**WebhookDelivery**
- Logs each webhook delivery attempt for debugging and monitoring
- Fields: `id`, `webhookId`, `eventType`, `payload`, `status`, `responseCode`, `errorMessage`, `retryCount`, `createdAt`

### 2. Sender Service (`sender.js`)

The core service responsible for dispatching events to configured webhooks.

**Main Functions:**
- `dispatchEventToWebhooks(eventType, payload, guildId)` - Dispatches an event to all relevant webhooks
- `isValidWebhookUrl(url)` - Validates webhook URLs

**Features:**
- Automatic retry on network errors and 5xx responses (up to 2 retries)
- 10-second timeout per request
- Best-effort delivery (failures don't break main application flow)
- Delivery logging to database
- No retry on 4xx client errors

**TODO:**
- Add HMAC signature using webhook.secret for request signing
- Add signature header (e.g., `X-Webhook-Signature`)

### 3. Subscriber Module (`subscriber.js`)

Provides helper functions for dispatching events throughout the application.

**Event Types:**
- `CLUB_SNAPSHOT_CREATED`, `CLUB_SNAPSHOT_UPDATED`, `CLUB_ANALYSIS_COMPLETED`
- `SEASON_CREATED`, `SEASON_UPDATED`, `SEASON_CLOSED`
- `CODES_UPDATED`, `CODES_REFRESH_STARTED`, `CODES_REFRESH_COMPLETED`
- `GUILD_SETTINGS_UPDATED`
- `SCREENSHOT_ANALYZED`, `SCREENSHOT_COMPARISON_CREATED`
- `CHAT_MESSAGE_CREATED`, `CONVERSATION_CREATED`
- `STATS_GENERATED`, `LEADERBOARD_UPDATED`

**Helper Functions:**
- `notifyClubSnapshotCreated({ snapshotId, guildId, metadata })`
- `notifySeasonEvent(eventType, { seasonId, guildId, metadata })`
- `notifyCodesUpdated({ guildId, codesData })`
- `notifyGuildSettingsUpdated({ guildId, settings })`
- And more...

**TODO:**
- When a centralized event bus is implemented, convert this module to subscribe to bus events

### 4. API Routes (`../routes/webhooks.js`)

REST API for webhook management:

- `GET /api/webhooks?guildId=X` - List webhooks for a guild
- `GET /api/webhooks/:id` - Get specific webhook details
- `POST /api/webhooks` - Create a new webhook
- `PATCH /api/webhooks/:id` - Update a webhook
- `DELETE /api/webhooks/:id` - Delete a webhook
- `GET /api/webhooks/:id/deliveries` - Get delivery history

**Security:**
- Requires authentication (`requireAuth` middleware)
- Secrets are never exposed in API responses (only `hasSecret` boolean)
- URL validation to prevent invalid endpoints

**TODO:**
- Add RBAC checks to verify user has access to the guild

## Usage

### 1. Creating a Webhook (via API)

```javascript
POST /api/webhooks
{
  "guildId": "guild_123",
  "name": "Discord Notifications",
  "targetUrl": "https://discord.com/api/webhooks/...",
  "eventTypes": "CLUB_SNAPSHOT_CREATED,SEASON_CLOSED",
  "enabled": true,
  "secret": "optional_secret_for_signing"
}
```

### 2. Dispatching Events (in code)

```javascript
const { notifyClubSnapshotCreated } = require('../services/webhooks/subscriber');

// After creating a club snapshot
await notifyClubSnapshotCreated({
  snapshotId: 'snapshot_123',
  guildId: 'guild_456',
  metadata: { clubName: 'Example Club' }
});
```

### 3. Webhook Payload Format

When an event is triggered, the webhook endpoint receives:

```json
{
  "eventType": "CLUB_SNAPSHOT_CREATED",
  "payload": {
    "snapshotId": "snapshot_123",
    "clubName": "Example Club"
  },
  "guildId": "guild_456",
  "timestamp": "2025-11-17T05:00:00.000Z"
}
```

## Frontend

Webhook management UI is available at:
- `/guilds/[id]/webhooks` - Manage webhooks for a specific guild

Features:
- List all webhooks for a guild
- Create new webhooks with event type selection
- Edit existing webhooks
- Enable/disable webhooks
- Delete webhooks
- View delivery count

## Event Wiring Examples

Events are currently wired using direct function calls. Example integration:

```javascript
// In guild-settings.js
const { notifyGuildSettingsUpdated } = require('../services/webhooks/subscriber');

// After saving settings
await saveSettings(guildId, settings);

// TODO: Move to centralized event bus when available
notifyGuildSettingsUpdated({ guildId, settings }).catch(err => {
  console.error('Failed to dispatch webhook:', err);
});
```

## Future Improvements

1. **HMAC Signatures**: Implement request signing using webhook.secret
2. **Event Bus**: Move from direct calls to a centralized event bus/pub-sub system
3. **RBAC**: Add role-based access control checks
4. **Advanced Retry**: Implement exponential backoff for retries
5. **Rate Limiting**: Add per-webhook rate limiting to prevent abuse
6. **Webhook Testing**: Add endpoint to test webhook delivery
7. **Webhook Templates**: Pre-configured templates for popular services (Discord, Slack, etc.)
8. **Delivery Analytics**: Dashboard showing delivery success rates, latency, etc.

## Security Considerations

- Webhook URLs are validated to ensure they're valid HTTP/HTTPS URLs
- Secrets are stored in the database but never exposed in API responses
- Webhook failures are logged but don't expose sensitive information
- All webhook endpoints require authentication
- Best-effort delivery ensures main application flow is never blocked by webhook failures

## Troubleshooting

### Webhooks not being delivered

1. Check if webhook is enabled in the database/UI
2. Verify the eventType matches what the webhook is subscribed to
3. Check webhook_deliveries table for error messages
4. Verify target URL is accessible and accepts POST requests
5. Check server logs for dispatch errors

### Webhook delivery failures

- Check the `webhook_deliveries` table for specific error messages
- Verify the target endpoint returns 2xx status codes
- Ensure the endpoint can handle JSON payloads
- Check network connectivity and firewall rules
