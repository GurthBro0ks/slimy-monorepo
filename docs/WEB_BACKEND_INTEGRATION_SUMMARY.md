# Web Backend Integration Summary

This document describes the integration between the Next.js web frontend (`apps/web`) and the admin-api backend.

## Architecture Overview

The web frontend uses a proxy pattern to communicate with the admin-api:

```
Web Client → Next.js API Routes → Admin API Client → Admin API Backend
```

### Key Components

1. **Admin API Client** (`lib/api/admin-client.ts`)
   - Core HTTP client for admin-api communication
   - Handles authentication, timeouts, and error handling
   - Single source of truth for proxy logic

2. **API Client** (`lib/api-client.ts`)
   - Wraps AdminApiClient with retry logic and caching
   - Provides `get`, `post`, `patch`, `delete` methods
   - Supports request/response interceptors

3. **Feature-Specific Clients** (`lib/api/*.ts`)
   - Domain-specific API functions (e.g., `club.ts`, `usage.ts`)
   - Provide type-safe interfaces
   - Handle sandbox vs live mode detection

4. **Next.js API Routes** (`app/api/**`)
   - Edge-compatible proxy routes
   - Transform requests between web and admin-api
   - Provide additional error handling and validation

## Frontend Routes

### /club - Club Analytics Dashboard

**Path:** `apps/web/app/club/page.tsx`

**Description:** Real-time club analytics dashboard showing member power metrics.

**Features:**
- Summary cards showing:
  - Total members count
  - Total club power (sum of all member power)
  - Average power change percentage
  - Top member by total power
- Member rankings table with:
  - Rank (with trophy icons for top 3)
  - Member name
  - SIM power
  - Total power
  - Change percentage (with color coding)
  - Last seen timestamp
- Refresh button to reload data
- Sandbox mode indicator
- Error and empty states
- Loading skeletons

**API Integration:**
- Uses `lib/api/club.ts` client
- Calls `/api/club/latest` proxy route
- Supports sandbox mode with mock data
- Auto-refreshes on mount

**Sandbox vs Live Behavior:**
- **Sandbox Mode** (when `NEXT_PUBLIC_ADMIN_API_BASE` not configured):
  - Shows banner: "Sandbox Mode - showing example data"
  - Returns 8 mock members with realistic metrics
  - All UI features work identically

- **Live Mode** (when admin-api is configured):
  - Fetches real data from admin-api
  - Shows actual club member metrics
  - Handles errors gracefully (shows error callout)
  - Respects authentication requirements

**Authentication:**
- Protected by `<ProtectedRoute requiredRole="club">`
- Requires user to be authenticated
- Guild ID currently hardcoded as `'guild-123'` (TODO: get from auth context)

## Backend Endpoints

### GET /api/guilds/:guildId/club/latest

**Admin API Endpoint:** `GET /api/guilds/:guildId/club/latest`

**Web Proxy Route:** `apps/web/app/api/club/latest/route.ts`

**Description:** Returns the latest club metrics for all members in a guild.

**Request:**
- Query param: `guildId` (required)

**Response:**
```typescript
{
  ok: boolean;
  guildId: string;
  members: Array<{
    memberKey: string;
    name: string;
    simPower: number | null;
    totalPower: number | null;
    changePercent: number | null;
    lastSeenAt?: string | null;
  }>;
}
```

**Error Codes:**
- `MISSING_GUILD_ID` (400) - Guild ID not provided
- `CONFIG_ERROR` (503) - Admin API not configured
- `ADMIN_API_ERROR` (5xx) - Upstream error from admin-api

**Frontend Usage:**
- Called by `/club` page on mount and refresh
- Integrated via `lib/api/club.ts` → `fetchClubLatest()`

---

### POST /api/guilds/:guildId/club/rescan

**Admin API Endpoint:** `POST /api/guilds/:guildId/club/rescan`

**Web Proxy Route:** `apps/web/app/api/club/rescan/route.ts`

**Description:** Triggers a rescan of club metrics from the database.

**Request:**
- Query param: `guildId` (required)

**Response:**
```typescript
{
  ok: boolean;
  guildId: string;
  message: string;
  scannedCount?: number;
}
```

**Error Codes:**
- `MISSING_GUILD_ID` (400) - Guild ID not provided
- `CONFIG_ERROR` (503) - Admin API not configured
- `ADMIN_API_ERROR` (5xx) - Upstream error from admin-api

**Frontend Usage:**
- Available via `lib/api/club.ts` → `triggerClubRescan()`
- Not yet wired to UI (future enhancement)

## Configuration

### Environment Variables

**Required for Live Mode:**
- `NEXT_PUBLIC_ADMIN_API_BASE` - Base URL for admin-api (e.g., `https://admin-api.example.com`)

**Optional:**
- Various admin-api specific configs (see admin-api documentation)

### Sandbox Mode

When `NEXT_PUBLIC_ADMIN_API_BASE` is not configured, the app runs in **sandbox mode**:
- All API clients return mock data
- UI displays "Sandbox mode" indicators
- No backend calls are made
- Useful for development and demos

## Error Handling

All API routes follow a consistent error format:

```typescript
{
  ok: false;
  code: string;        // Machine-readable error code
  message: string;     // Human-readable message
  status?: number;     // HTTP status code
  details?: unknown;   // Additional error context
}
```

Common error codes:
- `CONFIG_ERROR` - Configuration issue (e.g., missing env vars)
- `NETWORK_ERROR` - Network/connectivity issue
- `TIMEOUT_ERROR` - Request timeout
- `ADMIN_API_ERROR` - Error from upstream admin-api
- `VALIDATION_ERROR` - Invalid request data

## Future Enhancements

### Club Analytics

**Short-term:**
- [ ] Wire "Rescan" button to UI (trigger `triggerClubRescan()`)
- [ ] Get guild ID from auth context instead of hardcoding
- [ ] Add filtering/sorting options to members table
- [ ] Add export to CSV functionality

**Long-term:**
- [ ] Historical charts showing power trends over time
- [ ] Member comparison views
- [ ] Alerts for significant power changes
- [ ] Integration with Discord notifications

## Testing

### Manual Testing

1. **Sandbox Mode:**
   ```bash
   # Unset admin API URL
   unset NEXT_PUBLIC_ADMIN_API_BASE

   # Start dev server
   cd apps/web
   pnpm dev

   # Visit http://localhost:3000/club
   # Should see sandbox banner and mock data
   ```

2. **Live Mode:**
   ```bash
   # Set admin API URL
   export NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:4000

   # Start admin-api backend
   cd apps/admin-api
   pnpm start

   # Start web frontend
   cd apps/web
   pnpm dev

   # Visit http://localhost:3000/club
   # Should fetch real data from admin-api
   ```

### Automated Tests

(TODO: Add tests for club API client)

## Related Documentation

- [Admin API Documentation](../apps/admin-api/README.md)
- [Web Frontend Documentation](../apps/web/README.md)
- [API Client Architecture](./API_CLIENT_ARCHITECTURE.md) (TODO)
