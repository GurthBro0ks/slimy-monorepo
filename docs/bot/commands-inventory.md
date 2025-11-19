# Discord Bot Commands Inventory

**Generated:** 2025-11-19
**Repository:** slimy-monorepo
**Purpose:** Complete catalog of all existing Discord bot commands and API endpoints

---

## Table of Contents

1. [Snail Commands](#snail-commands)
2. [Club Commands](#club-commands)
3. [Codes Commands](#codes-commands)
4. [Chat/Bot Commands](#chatbot-commands)
5. [Guild Management Commands](#guild-management-commands)
6. [Personality Commands](#personality-commands)
7. [Stats & Analytics Commands](#stats--analytics-commands)
8. [Admin Commands](#admin-commands)

---

## Snail Commands

Commands related to Super Snail game analysis and tools.

### `/snail analyze`

**Description:** Analyze Super Snail game screenshots using AI vision to extract stats, loadouts, and game data.

**Inputs:**
- `images`: File uploads (1-8 images, max 10MB each, multipart/form-data)
- `prompt`: Optional string - Additional context for analysis (e.g., "compare rush vs last week")
- `guildId`: Required - Discord guild ID for context

**Outputs:**
- Analysis results for each uploaded image
- Extracted stats (Pentagon stats, loadout details)
- Saved record with timestamp
- Public URLs for uploaded images
- Confidence scores and metadata

**Dependencies:**
- OpenAI Vision API (OPENAI_API_KEY required)
- File storage system (uploads/snail/:guildId)
- Database for storing analysis results

**Rate Limits:**
- File size: 10MB per file
- Max files: 8 per request

**Implementation:**
- Route: `POST /api/snail/:guildId/analyze`
- File: `apps/admin-api/src/routes/snail.js:117`

---

### `/snail stats`

**Description:** Retrieve user's latest stats analysis for the current guild.

**Inputs:**
- `guildId`: Required - Discord guild ID

**Outputs:**
- Latest analysis record with full details
- Upload timestamp
- Image URLs
- Analysis results
- Returns `{ empty: true }` if no stats found

**Dependencies:**
- File system (data/snail/:guildId/:userId/latest.json)

**Cache:**
- 300-600 seconds per guild data

**Implementation:**
- Route: `GET /api/snail/:guildId/stats`
- File: `apps/admin-api/src/routes/snail.js:218`

---

### `/snail analyze_help`

**Description:** Get help text and tips for screenshot analysis.

**Inputs:** None

**Outputs:**
- Array of help tips including:
  - Portrait screenshot recommendations
  - Cropping advice
  - Upload limits
  - Prompt suggestions
  - Quality guidelines

**Dependencies:** None (static content)

**Cache:**
- 3600-7200 seconds (1-2 hours)

**Implementation:**
- Route: `GET /api/snail/:guildId/analyze_help`
- File: `apps/admin-api/src/routes/snail.js:245`

---

### `/snail calc`

**Description:** Calculate tier cost percentage for Super Snail game mechanics.

**Inputs:**
- `sim`: Number (required) - SIM value
- `total`: Number (required) - Total value

**Outputs:**
- `sim`: Echoed SIM value
- `total`: Echoed total value
- `simPct`: Calculated percentage (sim / total)

**Dependencies:** None (simple calculation)

**Implementation:**
- Route: `POST /api/snail/:guildId/calc`
- File: `apps/admin-api/src/routes/snail.js:274`

---

### `/snail codes`

**Description:** Get secret redemption codes for Super Snail game.

**Inputs:**
- `scope`: Optional string - Filter scope: "active", "past7", or "all" (default: "active")

**Outputs:**
- Array of code objects with:
  - Code string
  - Title and description
  - Rewards
  - Region
  - Expiration dates
  - Sources and verification status
- Source indicator (remote or local)

**Dependencies:**
- Remote: Snelp API (SNELP_CODES_URL)
- Fallback: Local cache (data/codes/:guildId.json)
- Discord channel scraping (channel ID: 1118010099974287370)

**Cache:**
- 1800-3600 seconds (30-60 minutes)

**Implementation:**
- Route: `GET /api/snail/:guildId/codes`
- File: `apps/admin-api/src/routes/snail.js:304`
- Aggregator: `apps/web/lib/codes-aggregator.ts`
- Discord adapter: `apps/web/lib/adapters/discord.ts`

---

## Club Commands

Commands for club/guild analytics and management.

### `/club analyze`

**Description:** Analyze club/guild screenshots using AI vision to extract member stats, performance metrics, and analytics.

**Inputs:**
- `imageUrls`: Array of strings (required) - URLs to club screenshot images
- `guildId`: String (required) - Discord guild ID
- `userId`: String (required) - User ID
- `options`: Object (optional) - Analysis options

**Outputs:**
- Analysis results for each image with:
  - Parsed member data
  - Performance metrics
  - Confidence scores
  - Image URLs
- Summary statistics:
  - Total images processed
  - Valid/invalid image counts
  - Average confidence
  - Stored results count
- Warnings for any failed images

**Dependencies:**
- OpenAI Vision API
- Club database (Prisma)
- Image validation service

**Implementation:**
- Route: `POST /api/club/analyze`
- File: `apps/web/app/api/club/analyze/route.ts`
- Also: `GET /api/club/analyze` for retrieving stored results

---

### `/club upload`

**Description:** Upload club screenshots for storage and optional AI analysis.

**Inputs:**
- `screenshots`: File[] (required) - Image files (multipart/form-data)
- `guildId`: String (required) - Discord guild ID
- `analyze`: Boolean (optional) - Trigger immediate analysis (default: false)

**Outputs:**
- Upload status for each file
- Public URLs for uploaded images
- File metadata (name, size, stored name)
- Optional analysis results if `analyze=true`

**Dependencies:**
- File system (public/uploads/club/:guildId)
- Optional: OpenAI Vision API (if analyze=true)

**Implementation:**
- Route: `POST /api/club/upload`
- File: `apps/web/app/api/club/upload/route.ts`

---

### `/club export`

**Description:** Export club analytics to Google Sheets.

**Inputs:**
- `guildId`: String (required) - Discord guild ID
- `includeAnalysis`: Boolean (optional) - Include analysis data (default: true)
- `dateRange`: Object (optional) - Date range filter

**Outputs:**
- Spreadsheet ID and URL
- Export summary:
  - Members count
  - Stats count
  - History entries
  - Analyses count
- Structured export data with columns:
  - Analysis ID, Title, Date
  - Summary, Confidence
  - Total/Active Members
  - Performance Score, Win Rate, Participation Rate

**Dependencies:**
- Club database
- TODO: MCP Google Sheets integration (planned, not yet implemented)

**Implementation:**
- Route: `POST /api/club/export`
- File: `apps/web/app/api/club/export/route.ts`

---

## Codes Commands

Commands for managing and accessing game redemption codes.

### `/codes list`

**Description:** List all available redemption codes with filtering and search.

**Inputs:**
- `scope`: Optional string - Filter by "active", "past7", or "all" (default: "active")
- `q`: Optional string - Search query
- `metadata`: Optional boolean - Include metadata (default: false)
- `health`: Optional boolean - Health check mode (default: false)

**Outputs:**
- Array of code objects
- Source metadata (Discord, Reddit, Snelp, Wiki, etc.)
- Count and timestamp
- Cache status and freshness indicators
- Processing time

**Dependencies:**
- Multiple sources:
  - Discord channels
  - Reddit (r/SuperSnailRPG)
  - Snelp.com API
  - Wiki
  - PocketGamer
- Redis cache (60s TTL)
- Fallback to local cache

**Rate Limits:**
- Cached for 60 seconds
- Stale-while-revalidate: 120 seconds

**Implementation:**
- Route: `GET /api/codes`
- File: `apps/web/app/api/codes/route.ts`
- Aggregator: `apps/web/lib/codes-aggregator.ts`

---

### `/codes health`

**Description:** Check health status of all code sources.

**Inputs:** None (use `?health=true` query parameter on `/codes` endpoint)

**Outputs:**
- Overall health status
- Status per source (Discord, Reddit, Snelp, Wiki, etc.)
- Last successful fetch times
- Error messages if any

**Dependencies:**
- All code source adapters

**Implementation:**
- Route: `GET /api/codes?health=true`
- File: `apps/web/app/api/codes/route.ts`

---

### `/codes report`

**Description:** Report issues with codes (expired, invalid, etc.).

**Inputs:**
- Code information
- Issue type
- User context

**Outputs:**
- Confirmation of report submission
- Tracking information

**Dependencies:**
- Database for storing reports
- TODO: May need moderation queue

**Implementation:**
- Route: `POST /api/codes/report`
- File: `apps/web/app/api/codes/report/route.ts`

---

## Chat/Bot Commands

Commands for interacting with the AI chatbot.

### `/chat` or `/ask`

**Description:** Submit a question or prompt to the AI chatbot for processing.

**Inputs:**
- `prompt`: String (required) - User's message/question
- `guildId`: String (required) - Discord guild ID for context

**Outputs:**
- Job ID for tracking
- Initial status ("queued")
- Estimated wait time (10-30 seconds)

**Dependencies:**
- OpenAI API
- Job queue system (Bull/BullMQ)
- Chat processor
- Session storage

**Rate Limits:**
- 5 requests per minute per IP
- Member role required

**Implementation:**
- Route: `POST /api/chat/bot`
- File: `apps/admin-api/src/routes/chat.js:53`
- Proxy: `apps/web/app/api/chat/bot/route.ts`

---

### `/chat status`

**Description:** Check status of a chat bot job.

**Inputs:**
- `jobId`: String (required) - Job ID from chat submission

**Outputs:**
- Job status: "queued", "active", "completed", or "failed"
- Result (when completed):
  - AI reply
  - Whether fallback was used
- Progress updates (when active)
- Error details (when failed)
- Timestamps

**Dependencies:**
- Job queue system
- Job ownership verification

**Implementation:**
- Route: `GET /api/chat/jobs/:jobId`
- File: `apps/admin-api/src/routes/chat.js:127`

---

### `/chat history`

**Description:** Retrieve chat history for a guild.

**Inputs:**
- `guildId`: String (required) - Guild ID or "admin-global" for admin room
- `limit`: Number (optional) - Max messages to return (default: 50)

**Outputs:**
- Array of chat messages with:
  - Message ID, text, timestamp
  - User info (id, name, role, color)
  - Admin-only flag
  - Guild context

**Dependencies:**
- Database (PostgreSQL)
- Session storage for access control

**Access Control:**
- Admin room: Admin role required
- Regular guilds: Must be guild member or admin
- Guild admins/club members: Can view all messages
- Regular members: Can view non-admin-only messages

**Implementation:**
- Route: `GET /api/chat/:guildId/history`
- File: `apps/admin-api/src/routes/chat.js:279`

---

### `/conversation create`

**Description:** Create a new chat conversation.

**Inputs:**
- `title`: String (optional) - Conversation title
- `personalityMode`: String (optional) - Personality mode (default: "helpful")

**Outputs:**
- Job ID for tracking
- Status: "queued"
- Estimated wait time (2-5 seconds)

**Dependencies:**
- Database queue
- Conversation storage

**Implementation:**
- Route: `POST /api/chat/conversations`
- File: `apps/admin-api/src/routes/chat.js:364`

---

### `/conversation list`

**Description:** List all conversations for authenticated user.

**Inputs:**
- `limit`: Number (optional) - Max conversations to return

**Outputs:**
- Array of conversation objects:
  - ID, title, personality mode
  - Created/updated timestamps
  - Message count

**Dependencies:**
- Database (conversations table)

**Implementation:**
- Route: `GET /api/chat/conversations`
- File: `apps/admin-api/src/routes/chat.js:410`

---

### `/conversation view`

**Description:** Get specific conversation with all messages.

**Inputs:**
- `conversationId`: String (required) - Conversation ID

**Outputs:**
- Conversation details
- Full message history with:
  - Role (user/assistant)
  - Content
  - Personality mode
  - Timestamps

**Dependencies:**
- Database
- Ownership verification

**Implementation:**
- Route: `GET /api/chat/conversations/:conversationId`
- File: `apps/admin-api/src/routes/chat.js:458`

---

### `/conversation delete`

**Description:** Delete a conversation (owner only).

**Inputs:**
- `conversationId`: String (required) - Conversation ID to delete

**Outputs:**
- Success confirmation

**Dependencies:**
- Database
- CSRF protection

**Implementation:**
- Route: `DELETE /api/chat/conversations/:conversationId`
- File: `apps/admin-api/src/routes/chat.js:515`

---

### `/conversation update`

**Description:** Update conversation title.

**Inputs:**
- `conversationId`: String (required) - Conversation ID
- `title`: String (optional) - New title

**Outputs:**
- Success confirmation

**Dependencies:**
- Database
- CSRF protection
- Ownership verification

**Implementation:**
- Route: `PATCH /api/chat/conversations/:conversationId`
- File: `apps/admin-api/src/routes/chat.js:558`

---

### `/message add`

**Description:** Add a message to a conversation.

**Inputs:**
- `conversationId`: String (required) - Conversation ID
- `message`: Object (required):
  - `role`: "user" or "assistant"
  - `content`: Message text
  - `personalityMode`: Optional string

**Outputs:**
- Job ID for tracking
- Status: "queued"
- Estimated wait time (1-3 seconds)

**Dependencies:**
- Database queue
- Message storage

**Implementation:**
- Route: `POST /api/chat/messages`
- File: `apps/admin-api/src/routes/chat.js:605`

---

## Guild Management Commands

Commands for managing guild settings and configurations.

### `/guild settings view`

**Description:** View guild settings.

**Inputs:**
- `guildId`: String (required)
- `test`: Boolean (optional) - Include test settings

**Outputs:**
- Guild settings object:
  - Sheet URL
  - Week window days
  - Thresholds (warn low/high)
  - Tokens per minute
  - Test settings (if requested)

**Dependencies:**
- Database
- Settings service

**Access Control:**
- Must have guild access

**Implementation:**
- Route: `GET /api/guilds/:guildId/settings`
- File: `apps/admin-api/src/routes/guilds.js:94`

---

### `/guild settings update`

**Description:** Update guild settings.

**Inputs:**
- `guildId`: String (required)
- Settings object with optional fields:
  - `sheetUrl`: String or null
  - `weekWindowDays`: Number (1-14) or null
  - `thresholds`: Object { warnLow, warnHigh }
  - `tokensPerMinute`: Number or null
  - `testSheet`: Boolean

**Outputs:**
- Updated settings object

**Dependencies:**
- Database
- CSRF protection
- Settings service

**Access Control:**
- Guild access required

**Implementation:**
- Route: `PUT /api/guilds/:guildId/settings`
- File: `apps/admin-api/src/routes/guilds.js:109`

---

### `/guild channels list`

**Description:** List configured channels for guild.

**Inputs:**
- `guildId`: String (required)

**Outputs:**
- Array of channel configurations:
  - Channel ID and name
  - Modes
  - Allowlist

**Dependencies:**
- Settings service

**Implementation:**
- Route: `GET /api/guilds/:guildId/channels`
- File: `apps/admin-api/src/routes/guild-channels.js:45`

---

### `/guild channels live`

**Description:** Fetch live channel data from Discord API.

**Inputs:**
- `guildId`: String (required)

**Outputs:**
- Live channel data from Discord
- Channel names and IDs
- Channel types

**Dependencies:**
- Discord API
- DISCORD_TOKEN

**Implementation:**
- Route: `GET /api/guilds/:guildId/channels/live`
- File: `apps/admin-api/src/routes/guild-channels.js:19`

---

### `/guild channels update`

**Description:** Update channel configurations.

**Inputs:**
- `guildId`: String (required)
- `channels`: Array of channel configurations

**Outputs:**
- Updated channel list

**Dependencies:**
- Database
- CSRF protection
- Channel service

**Implementation:**
- Route: `POST /api/guilds/:guildId/channels`
- File: `apps/admin-api/src/routes/guild-channels.js:54`

---

## Personality Commands

Commands for managing bot personality per guild.

### `/personality presets`

**Description:** List available personality presets.

**Inputs:**
- `guildId`: String (required)

**Outputs:**
- Array of preset objects:
  - Key
  - Label
  - Description

**Dependencies:** None (static data)

**Cache:**
- 3600-7200 seconds (1-2 hours)

**Implementation:**
- Route: `GET /api/guilds/:guildId/personality/presets`
- File: `apps/admin-api/src/routes/personality.js:20`

---

### `/personality view`

**Description:** Get current personality settings for guild.

**Inputs:**
- `guildId`: String (required)

**Outputs:**
- Personality object:
  - System prompt
  - Temperature
  - Top P
  - Tone
  - Other personality settings

**Dependencies:**
- Database (guild_personas table)

**Cache:**
- 600-1200 seconds (10-20 minutes)

**Access Control:**
- Admin role required
- Guild membership required

**Implementation:**
- Route: `GET /api/guilds/:guildId/personality`
- File: `apps/admin-api/src/routes/personality.js:32`

---

### `/personality update`

**Description:** Update bot personality settings.

**Inputs:**
- `guildId`: String (required)
- Personality configuration object

**Outputs:**
- Updated personality object

**Dependencies:**
- Database
- CSRF protection
- Cache invalidation

**Access Control:**
- Admin role required
- Guild membership required

**Implementation:**
- Route: `PUT /api/guilds/:guildId/personality`
- File: `apps/admin-api/src/routes/personality.js:48`

---

### `/personality reset`

**Description:** Reset personality to default or specific preset.

**Inputs:**
- `guildId`: String (required)
- `preset`: String (optional) - Preset key to apply

**Outputs:**
- Reset personality object

**Dependencies:**
- Database
- CSRF protection
- Cache invalidation

**Access Control:**
- Admin role required
- Guild membership required

**Implementation:**
- Route: `POST /api/guilds/:guildId/personality/reset`
- File: `apps/admin-api/src/routes/personality.js:69`

---

### `/personality test`

**Description:** Test personality settings with sample prompt.

**Inputs:**
- `guildId`: String (required)
- `prompt`: String (optional) - Test prompt (default: "What's a fun fact about gaming?")

**Outputs:**
- AI-generated test response
- Used prompt
- Settings applied:
  - Temperature
  - Top P
  - Tone
  - Model

**Dependencies:**
- OpenAI API (OPENAI_API_KEY required)
- Database for personality settings

**Access Control:**
- Admin role required
- Guild membership required

**Implementation:**
- Route: `POST /api/guilds/:guildId/personality/test`
- File: `apps/admin-api/src/routes/personality.js:93`

---

## Stats & Analytics Commands

Commands for tracking and querying usage statistics.

### `/stats summary`

**Description:** Get summary statistics.

**Inputs:**
- Query filters (optional):
  - `eventType`
  - `eventCategory`
  - `userId`
  - `guildId`
  - `startDate`
  - `endDate`

**Outputs:**
- Summary statistics object

**Dependencies:**
- Stats tracker database
- Google Sheets (optional, STATS_SHEET_ID)

**Cache:**
- 600 seconds (10 minutes)

**Implementation:**
- Route: `GET /api/stats/summary`
- File: `apps/admin-api/src/routes/stats.js:19`

---

### `/stats events`

**Description:** Query detailed event data.

**Inputs:**
- `action=events` (query parameter)
- Filters: eventType, eventCategory, userId, guildId, date range
- `limit`: Number (default: 1000)
- `offset`: Number (default: 0)

**Outputs:**
- Array of event records

**Dependencies:**
- Stats tracker database

**Implementation:**
- Route: `GET /api/stats?action=events`
- File: `apps/admin-api/src/routes/stats-tracker.js:47`

---

### `/stats aggregates`

**Description:** Get aggregated statistics.

**Inputs:**
- `action=aggregates` (query parameter)
- `groupBy`: "day", "week", or "month" (default: "day")
- Standard filters

**Outputs:**
- Aggregated data grouped by time period

**Dependencies:**
- Stats tracker database

**Implementation:**
- Route: `GET /api/stats?action=aggregates`
- File: `apps/admin-api/src/routes/stats-tracker.js:55`

---

### `/stats user-activity`

**Description:** Get user activity metrics.

**Inputs:**
- `action=user-activity` (query parameter)
- `userId`: String (required)
- `days`: Number (default: 30)

**Outputs:**
- User activity data for specified period

**Dependencies:**
- Stats tracker database

**Implementation:**
- Route: `GET /api/stats?action=user-activity`
- File: `apps/admin-api/src/routes/stats-tracker.js:62`

---

### `/stats system-metrics`

**Description:** Get system-wide metrics.

**Inputs:**
- `action=system-metrics` (query parameter)
- `days`: Number (default: 7)

**Outputs:**
- System metrics for specified period

**Dependencies:**
- Stats tracker database

**Implementation:**
- Route: `GET /api/stats?action=system-metrics`
- File: `apps/admin-api/src/routes/stats-tracker.js:73`

---

### `/stats track`

**Description:** Record statistics events.

**Inputs:**
- Single event object, OR
- Batch events array, OR
- Action-specific tracking:
  - `action=track-command`: Track command usage
  - `action=track-chat`: Track chat message
  - `action=track-image`: Track image generation
  - And more...

**Outputs:**
- Confirmation message
- Count of recorded events

**Dependencies:**
- Stats tracker database
- CSRF protection

**Implementation:**
- Route: `POST /api/stats`
- File: `apps/admin-api/src/routes/stats-tracker.js:90`

---

### `/stats stream`

**Description:** Server-Sent Events stream for real-time stats.

**Inputs:** None

**Outputs:**
- SSE stream of stats updates
- Heartbeat every 30 seconds

**Dependencies:**
- Stats tracker database
- EventSource/SSE support

**Implementation:**
- Route: `GET /api/stats/events/stream`
- File: `apps/admin-api/src/routes/stats-tracker.js:239`

---

## Admin Commands

Administrative commands for system management.

### `/admin rescan`

**Description:** Trigger a rescan operation (proxies to external bot service).

**Inputs:**
- Request body (passed to bot service)

**Outputs:**
- Response from bot service

**Dependencies:**
- BOT_RESCAN_URL environment variable
- External bot service

**Access Control:**
- Authentication required
- CSRF protection

**Implementation:**
- Route: `POST /api/bot/rescan`
- File: `apps/admin-api/src/routes/bot.js:11`

---

### `/admin guilds list`

**Description:** List all guilds for authenticated user.

**Inputs:** None

**Outputs:**
- Array of guild objects from user session

**Dependencies:**
- Session storage

**Access Control:**
- Authentication required

**Implementation:**
- Route: `GET /api/guilds`
- File: `apps/admin-api/src/routes/guilds.js:90`

---

### `/admin diagnostics`

**Description:** Run system diagnostics.

**Inputs:** None

**Outputs:**
- Diagnostic information:
  - Database status
  - API connectivity
  - Service health
  - Configuration status

**Dependencies:**
- Various system services

**Access Control:**
- Authentication required

**Implementation:**
- Route: `GET /api/diag/diagnostics`
- File: `apps/admin-api/src/routes/diagnostics.js:39`

---

### `/admin health`

**Description:** Basic health check.

**Inputs:** None

**Outputs:**
- Service name
- Environment
- Timestamp
- OK status

**Dependencies:** None

**Implementation:**
- Route: `GET /api/health`
- File: `apps/admin-api/src/routes/index.js:18`

---

## Authentication & Authorization

### Role Hierarchy

1. **member** - Basic authenticated user
2. **club** - Club member with elevated permissions
3. **admin** - Full administrative access

### Access Patterns

- Most commands require authentication
- Snail/Club commands require member role + guild membership
- Personality/Settings commands require admin role
- Chat commands require member role with rate limiting
- Some endpoints have guild-specific role overrides

### Rate Limiting

- Chat commands: 5 requests per minute per IP
- File uploads: Size and count limits enforced
- API responses: Cached at various TTLs

---

## Error Handling

All commands use consistent error codes:

- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (resource doesn't exist)
- `413` - Payload too large (file size exceeded)
- `429` - Rate limited
- `500` - Internal server error
- `501` - Not implemented (feature not configured)
- `502` - Bad gateway (upstream service unavailable)
- `503` - Service unavailable (dependency not available)

---

## Technical Architecture

### API Structure

- **Admin API** (`apps/admin-api`): Main backend service
  - Express.js REST API
  - PostgreSQL database
  - Bull queue system
  - Redis caching

- **Web App** (`apps/web`): Next.js frontend with API routes
  - Server-side rendering
  - API route handlers
  - Static file serving

### Data Flow

1. User sends command via Discord or web interface
2. Request authenticated and validated
3. Queued for async processing (if applicable)
4. External APIs called (OpenAI, Discord, etc.)
5. Results stored in database
6. Response returned to user
7. Cache updated for future requests

### External Dependencies

- **OpenAI API**: Vision and chat completions
- **Discord API**: Guild/channel data, message fetching
- **Redis**: Caching and queue management
- **PostgreSQL**: Primary data storage
- **Google Sheets**: Stats export (planned)

---

## Notes

- Many commands are asynchronous and return job IDs for status tracking
- CSRF protection required for all mutating operations
- Most endpoints support caching to reduce load
- File uploads have strict size and type validation
- The bot supports multiple personalities per guild
- Stats tracking is comprehensive and can track any event type
