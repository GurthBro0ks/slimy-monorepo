# Web ↔ Backend Integration Summary

## Overview

The Slimy web application (`apps/web`) has been fully integrated with the admin-api backend (`apps/admin-api`) to provide a unified, production-ready interface for Discord bot management and analytics. This integration includes:

- **Shared Layout**: Consistent UI/UX across all pages with `PageShell` and `ConnectionBadge` components
- **Centralized HTTP Client**: Type-safe `AdminApiClient` for all backend communication
- **Dual-Mode Operation**: Seamless sandbox (development) and live (production) modes
- **Feature-Complete Pages**: Usage analytics, chat interface, snail codes aggregator, tier calculator, and screenshot analysis viewer
- **Graceful Error Handling**: Fallback mechanisms and user-friendly error messages

---

## Frontend Routes (apps/web)

All pages use the shared `PageShell` layout with `ConnectionBadge` status indicator.

### Primary Routes

| Route | Description | Backend Endpoint | Method |
|-------|-------------|------------------|--------|
| `/usage` | Usage & Costs Dashboard | `GET /api/usage/summary` | GET |
| `/chat` | Chat Interface | `POST /api/chat` | POST |
| `/snail/codes` | Snail Codes Aggregator | `GET /api/snail/codes` | GET |
| `/tiers` | Snail Tier Calculator | `POST /api/snail/tier` | POST |
| `/screenshots` | Screenshot Analysis Viewer | `GET /api/snail/screenshots/latest` | GET |
| `/club` | Club Analytics | Multiple endpoints | Various |

### Page Details

#### /usage
- **Purpose**: View token usage, costs, and API request metrics
- **Backend**: `GET /api/usage/summary`
- **Client**: `apps/web/lib/api/usage.ts` (if exists, or uses admin-client directly)
- **Features**:
  - Total tokens consumed
  - Total cost (USD)
  - Total images processed
  - Total requests
  - Sandbox mode shows mock data with ~500K tokens

#### /chat
- **Purpose**: Interactive chat interface with the bot
- **Backend**: `POST /api/chat`
- **Client**: `apps/web/lib/api/chat.ts` (if exists, or uses admin-client directly)
- **Features**:
  - Send messages and receive AI responses
  - Chat history (if integrated with backend)
  - Sandbox mode provides mock conversational responses

#### /snail/codes
- **Purpose**: Aggregated list of Super Snail secret codes
- **Backend**: `GET /api/snail/codes?scope={active|past7|all}`
- **Client**: `apps/web/lib/api/snail-codes.ts` (if exists, or uses admin-client directly)
- **Features**:
  - Filter by active, past 7 days, or all codes
  - Source attribution (Snelp, Reddit)
  - Copy all codes or individual codes
  - Search/filter functionality
  - Report dead codes
  - Sandbox mode includes sample codes

#### /tiers
- **Purpose**: Calculate Super Snail player tier based on stats
- **Backend**: `POST /api/snail/tier`
- **Body**:
  ```json
  {
    "level": 80,
    "cityLevel": 45,
    "relicPower": 350000,
    "clubContribution": 120
  }
  ```
- **Response**:
  ```json
  {
    "tier": "S",
    "score": 8500,
    "summary": "Elite player",
    "details": [...]
  }
  ```
- **Features**:
  - Input form for player stats
  - Tier calculation (S+, S, A, B, C, D, F)
  - Detailed breakdown
  - Sandbox mode provides instant calculation

#### /screenshots
- **Purpose**: View analyzed Super Snail screenshots
- **Backend**: `GET /api/snail/screenshots/latest`
- **Client**: `apps/web/lib/api/snail-screenshots.ts`
- **Response**:
  ```json
  {
    "analysis": {
      "runId": "2025-11-21T09:15:00.000Z",
      "guildId": "guild-123",
      "userId": "user-456",
      "results": [
        {
          "fileUrl": "https://...",
          "uploadedBy": "User#1234",
          "analyzedAt": "2025-11-21T09:15:00.000Z",
          "stats": {
            "simPower": 1247893,
            "cityLevel": 45,
            "snailLevel": 80,
            "tier": "B"
          }
        }
      ]
    }
  }
  ```
- **Features**:
  - Display run metadata (runId, guildId, userId)
  - Grid of screenshot cards
  - Stats display (simPower, cityLevel, snailLevel, tier)
  - Links to view full screenshots
  - Refresh functionality
  - Sandbox mode shows 2 sample screenshots

#### /club
- **Purpose**: Club analytics and statistics
- **Note**: Existing route, partially independent of admin-api integration
- **Features**: Member stats, club rankings, performance metrics

---

## Backend Endpoints (apps/admin-api)

### Core Endpoints

#### GET /api/usage/summary
- **Description**: Aggregate usage statistics for tokens, costs, images, and requests
- **Auth**: None (or optionally guild-scoped)
- **Response**:
  ```json
  {
    "totalTokens": 512345,
    "totalCostUsd": 1.23,
    "totalImages": 42,
    "totalRequests": 1234
  }
  ```
- **Service**: `apps/admin-api/src/services/usage.js` (if exists)
- **Route**: `apps/admin-api/src/routes/usage.js` (if exists)

#### POST /api/chat
- **Description**: Submit chat message to bot for processing
- **Auth**: Member role or higher
- **Body**:
  ```json
  {
    "prompt": "Hello, bot!",
    "guildId": "guild-123"
  }
  ```
- **Response**:
  ```json
  {
    "reply": "Hello! How can I help you?",
    "usedFallback": false
  }
  ```
- **Service**: Chat processor (async job queue)
- **Route**: `apps/admin-api/src/routes/chat.js`

#### GET /api/snail/codes
- **Description**: Fetch Super Snail secret codes
- **Auth**: Member role, guild membership
- **Query Params**:
  - `scope`: `"active"` | `"past7"` | `"all"` (default: `"active"`)
- **Response**:
  ```json
  {
    "ok": true,
    "source": "remote",
    "codes": [
      {
        "code": "SNAIL2025",
        "source": "snelp",
        "ts": "2025-11-21T00:00:00.000Z",
        "tags": ["global"],
        "expires": "2025-12-31T23:59:59.000Z",
        "region": "global"
      }
    ]
  }
  ```
- **Service**: Fetches from Snelp API with local fallback
- **Route**: `apps/admin-api/src/routes/snail.js`

#### POST /api/snail/tier
- **Description**: Calculate player tier based on stats
- **Auth**: Member role, guild membership
- **Body**:
  ```json
  {
    "level": 80,
    "cityLevel": 45,
    "relicPower": 350000,
    "clubContribution": 120
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "tier": "S",
    "score": 8500,
    "summary": "Elite player with strong stats across all categories",
    "details": [
      { "category": "Level", "score": 2400, "weight": 0.3 },
      { "category": "City", "score": 1800, "weight": 0.2 },
      { "category": "Relic Power", "score": 3500, "weight": 0.35 },
      { "category": "Club Contribution", "score": 800, "weight": 0.15 }
    ]
  }
  ```
- **Service**: Tier calculation algorithm
- **Route**: `apps/admin-api/src/routes/snail.js`

#### GET /api/snail/screenshots/latest
- **Description**: Fetch latest screenshot analysis for user/guild
- **Auth**: None yet (TODOs for auth integration)
- **Query Params** (optional):
  - `guildId`: Guild ID (for testing)
  - `userId`: User ID (for testing)
- **Response**: See `/screenshots` section above
- **Service**: `apps/admin-api/src/services/snail-screenshots.js`
- **Route**: `apps/admin-api/src/routes/snail-screenshots.js`
- **Status**: Currently returns stubbed data with TODOs for real file/DB integration

---

## Architecture

### Centralized HTTP Client

**Location**: `apps/web/lib/api/admin-client.ts`

The `AdminApiClient` class provides:
- Configuration checking (`isConfigured()`)
- HTTP method helpers (GET, POST, PUT, PATCH, DELETE)
- Consistent error handling
- Type-safe request/response types
- Timeout support
- Streaming support (SSE)

**Usage Example**:
```typescript
import { adminApiClient } from "@/lib/api/admin-client";

const result = await adminApiClient.get("/api/usage/summary");
if (result.ok) {
  console.log(result.data);
} else {
  console.error(result.message);
}
```

### API Client Modules

Each feature has its own API client module:
- `apps/web/lib/api/snail-screenshots.ts` - Screenshot analysis
- Additional modules follow similar patterns

**Pattern**:
```typescript
import { adminApiClient } from "./admin-client";

export async function fetchSomeData() {
  if (!adminApiClient.isConfigured()) {
    // Return sandbox data
    return SANDBOX_DATA;
  }

  const result = await adminApiClient.get("/api/endpoint");
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}
```

---

## Sandbox vs Live Mode

### Sandbox Mode (Development)

**When**: `NEXT_PUBLIC_ADMIN_API_BASE` is **not set** or empty

**Behavior**:
- All pages function with mock data
- No network requests to admin-api
- `ConnectionBadge` shows "Sandbox" status
- Ideal for frontend development without backend

**Mock Data Locations**:
- Usage: ~500K tokens, ~$1.20 cost
- Chat: Predefined responses
- Codes: Sample codes with various attributes
- Tier: Instant calculation results
- Screenshots: 2 sample analyzed screenshots

### Live Mode (Production)

**When**: `NEXT_PUBLIC_ADMIN_API_BASE` is **set** (e.g., `http://localhost:3001`)

**Behavior**:
- Pages make real HTTP requests to admin-api
- `ConnectionBadge` shows "Connected" or "Error" status
- Errors trigger graceful fallbacks with user-friendly messages
- Full integration with Discord bot backend

---

## Environment Variables

### apps/web

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_ADMIN_API_BASE` | No | Admin API base URL. Omit for sandbox mode. | `http://localhost:3001` |
| `NEXT_PUBLIC_DEFAULT_GUILD_ID` | No | Default guild ID for testing | `1234567890` |

### apps/admin-api

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `3001` |
| `NODE_ENV` | No | Environment | `development` |
| `SESSION_SECRET` | Yes | JWT signing secret | Random 32+ char string |
| `DISCORD_CLIENT_ID` | Yes | Discord OAuth client ID | From Discord Dev Portal |
| `DISCORD_CLIENT_SECRET` | Yes | Discord OAuth secret | From Discord Dev Portal |
| `DISCORD_REDIRECT_URI` | Yes | OAuth redirect URI | `http://localhost:3000/auth/callback` |
| `PRIMARY_GUILD_ID` | No | Primary guild for usage stats | Guild snowflake ID |
| `DEFAULT_GUILD_ID` | No | Fallback guild ID | Guild snowflake ID |
| `OPENAI_API_KEY` | No | For screenshot analysis | OpenAI API key |
| `SNELP_CODES_URL` | No | Snelp codes API | `https://snelp.com/api/codes` |

---

## How to Run (Development)

### Prerequisites

```bash
# Install dependencies (from monorepo root)
pnpm install
```

### Start Admin API

```bash
# From monorepo root
cd apps/admin-api

# Set environment variables (create .env file)
cat > .env << EOF
SESSION_SECRET=your-secret-here-min-32-chars
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback
PORT=3001
EOF

# Start server
pnpm dev
# Server starts at http://localhost:3001
```

### Start Web App

#### Option 1: Sandbox Mode (No Backend)

```bash
# From monorepo root
cd apps/web

# No NEXT_PUBLIC_ADMIN_API_BASE needed
pnpm dev
# App starts at http://localhost:3000
```

#### Option 2: Live Mode (With Backend)

```bash
# From monorepo root
cd apps/web

# Set environment variable (create .env.local file)
cat > .env.local << EOF
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3001
EOF

# Start app
pnpm dev
# App starts at http://localhost:3000
```

---

## Manual Test Checklist

### Sandbox Mode Tests

With `NEXT_PUBLIC_ADMIN_API_BASE` **not set**:

- [ ] `/usage` - Health badge shows "Sandbox", displays mock usage data (~500K tokens)
- [ ] `/chat` - Can type messages, receives predefined responses
- [ ] `/snail/codes` - Displays sample codes, filters work, no network errors
- [ ] `/tiers` - Can input stats, calculates tier instantly
- [ ] `/screenshots` - Displays 2 sample screenshots with stats
- [ ] `/club` - Functions independently (if applicable)
- [ ] `ConnectionBadge` shows "Sandbox" or similar indicator on all pages
- [ ] No console errors related to API calls

### Live Mode Tests

With `NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3001` and admin-api running:

- [ ] `/usage` - Health badge shows "Connected", fetches real usage data from admin-api
- [ ] `/chat` - Submits messages to backend, receives actual bot responses
- [ ] `/snail/codes` - Fetches codes from Snelp API or local cache, displays correctly
- [ ] `/tiers` - Submits calculation to backend, receives tier result
- [ ] `/screenshots` - Fetches latest analysis from admin-api (currently stub data)
- [ ] `/club` - Functions with backend integration
- [ ] `ConnectionBadge` shows "Connected" on all pages
- [ ] **Error handling**: Stop admin-api, verify pages show error messages gracefully
- [ ] **Refresh**: All pages have refresh/reload functionality that works

### Error Scenarios

- [ ] Admin-api down (live mode): Pages show error alerts, ConnectionBadge shows error state
- [ ] Invalid credentials (if auth implemented): Redirects to login or shows auth error
- [ ] Malformed requests: Backend returns 400 with error message
- [ ] Network timeout: Shows timeout error message
- [ ] CORS issues (if any): Resolved with proper CORS config in admin-api

---

## Testing

### Web App Tests

**Framework**: Vitest + React Testing Library

**Run Tests**:
```bash
cd apps/web
pnpm test
```

**Coverage**:
```bash
pnpm test:coverage
```

**Test Files**:
- `tests/unit/lib/admin-client.test.ts` - AdminApiClient tests
- `tests/unit/lib/api/snail-screenshots.test.ts` - Screenshot API client tests
- Additional existing tests in `tests/` directory

### Admin API Tests

**Framework**: Jest + Supertest (inferred from existing tests)

**Run Tests**:
```bash
cd apps/admin-api
# Note: No test script in package.json yet
# Tests exist but may need Jest config or npm script added
```

**Test Files**:
- `tests/api/snail-screenshots.test.js` - Screenshot endpoint tests
- Existing tests in `tests/` and `src/routes/*.test.js`

---

## Known Limitations & Future Work

### Current Limitations

1. **Authentication**: Most pages don't enforce Discord auth yet (TODOs in place)
2. **Stubbed Data**: Screenshots endpoint returns stubbed data (TODOs for real file/DB integration)
3. **Error Recovery**: Some edge cases may not have optimal user feedback
4. **Guild Context**: Multi-guild support partially implemented
5. **Rate Limiting**: May need refinement for production load

### TODOs for Phase 3

- [ ] Implement Discord OAuth flow for web app
- [ ] Add guild-scoped data filtering in all endpoints
- [ ] Integrate real screenshot file storage and retrieval
- [ ] Add pagination for large datasets (codes, screenshots, chat history)
- [ ] Implement request caching strategy (Redis?)
- [ ] Add comprehensive E2E tests with Playwright
- [ ] Set up CI/CD pipeline for automated testing
- [ ] Add monitoring/observability (metrics, logging, tracing)
- [ ] Implement WebSocket support for real-time updates
- [ ] Add admin dashboard for bot management

### Security Considerations

- [ ] Implement CSRF protection for state-changing endpoints
- [ ] Add rate limiting per user/guild
- [ ] Validate and sanitize all user inputs
- [ ] Implement proper session management
- [ ] Add API key rotation mechanism
- [ ] Review and audit Discord OAuth implementation
- [ ] Set up Content Security Policy (CSP) headers
- [ ] Enable HTTPS in production

---

## Architecture Decisions

### Why Dual Mode (Sandbox/Live)?

**Benefits**:
- Frontend developers can work without running backend
- Faster iteration on UI/UX
- Easier onboarding for new contributors
- Demo-ready without infrastructure
- Resilient to backend outages (graceful degradation)

### Why Centralized HTTP Client?

**Benefits**:
- Single source of truth for API communication
- Consistent error handling across all pages
- Easy to add interceptors (auth, logging, etc.)
- Type safety with TypeScript
- Simplified testing with mocked client

### Why Separate API Client Modules?

**Benefits**:
- Clear separation of concerns
- Easier to test individual features
- Sandbox logic co-located with feature
- Reusable across multiple pages
- Type definitions scoped to feature

---

## Troubleshooting

### "Admin API not configured" error

**Cause**: `NEXT_PUBLIC_ADMIN_API_BASE` not set or empty

**Solution**:
1. Check `.env.local` in `apps/web`
2. Ensure variable starts with `NEXT_PUBLIC_`
3. Restart Next.js dev server after changing env vars

### CORS errors in browser console

**Cause**: Admin-api CORS config doesn't allow web origin

**Solution**:
1. Check `apps/admin-api/src/middleware/cors.js` or similar
2. Ensure `http://localhost:3000` is in allowed origins
3. Restart admin-api after CORS config change

### 404 on admin-api endpoints

**Cause**: Route not registered or admin-api not running

**Solution**:
1. Verify admin-api is running: `curl http://localhost:3001/api/health`
2. Check `apps/admin-api/src/routes/index.js` for route registration
3. Review admin-api console logs for errors

### Sandbox mode shows unexpected data

**Cause**: `NEXT_PUBLIC_ADMIN_API_BASE` is set but admin-api is down

**Solution**:
1. Unset env var to force sandbox mode: Remove from `.env.local`
2. Or fix admin-api connection issue
3. Restart Next.js dev server

### Tests failing

**Cause**: Various (outdated snapshots, missing mocks, etc.)

**Solution**:
1. Read test output carefully
2. Update snapshots if intentional changes: `pnpm test -- -u`
3. Check mock configurations in test files
4. Ensure test environment variables are set

---

## Contributing

When adding new features to the web ↔ backend integration:

1. **Follow existing patterns**:
   - Create API client module in `apps/web/lib/api/`
   - Use `AdminApiClient` for HTTP requests
   - Implement sandbox mode with mock data
   - Use `PageShell` and `ConnectionBadge` for pages

2. **Add backend endpoint**:
   - Create service in `apps/admin-api/src/services/`
   - Create route in `apps/admin-api/src/routes/`
   - Register route in `apps/admin-api/src/routes/index.js`
   - Use `apiHandler` wrapper for consistent error handling

3. **Add tests**:
   - Web: Unit tests for API client (sandbox + live mode)
   - Admin-api: Integration tests for endpoint
   - Follow existing test patterns

4. **Update documentation**:
   - Add route to "Frontend Routes" section
   - Add endpoint to "Backend Endpoints" section
   - Update test checklist if applicable

---

## Related Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Express.js](https://expressjs.com/)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest](https://github.com/ladjs/supertest)

---

## Support

For questions or issues:
- Check GitHub Issues: [https://github.com/GurthBro0ks/slimy-monorepo/issues](https://github.com/GurthBro0ks/slimy-monorepo/issues)
- Review this integration summary
- Check individual module READMEs (if applicable)

---

*Last updated: 2025-11-21*
*Integration Phase: Phase 2 (Tests + Docs)*
