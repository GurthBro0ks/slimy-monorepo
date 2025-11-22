# Web Backend Integration Summary

This document describes how the web app (`apps/web`) integrates with the admin-api backend.

## Overview

The web app supports two modes of operation:

1. **Sandbox Mode**: When `NEXT_PUBLIC_ADMIN_API_BASE` is not configured, the app runs with mock data
2. **Live Mode**: When `NEXT_PUBLIC_ADMIN_API_BASE` is configured, the app connects to the admin-api

## Admin API Client

The centralized admin API client is located at `apps/web/lib/api/admin-client.ts`.

Features:
- Single configuration point for base URL via `NEXT_PUBLIC_ADMIN_API_BASE`
- Consistent header handling
- Unified error handling
- Support for streaming responses (SSE)
- Request/response interceptors
- Automatic timeout handling

## Routes and Features

### /usage - Usage Dashboard

**Location**: `apps/web/app/usage/page.tsx`

**Description**: Comprehensive dashboard for monitoring API usage, costs, and trends.

**Features**:
- **Summary Cards**: Display total tokens, cost (USD), requests, and images
- **Usage Breakdown**: Table showing usage distribution across features (chat, snail, club, other)
- **Usage Over Time**: Interactive timeseries chart with range selector (24h / 7d / 30d)
- **Loading States**: Skeleton loaders for each section during data fetch
- **Error Handling**: Graceful error messages per section without breaking the page
- **Empty States**: Helpful messages when no data is available

**Sandbox vs Live Behavior**:

| Feature | Sandbox Mode | Live Mode |
|---------|-------------|-----------|
| Summary Data | Static mock data | Fetches from `/api/usage/summary` |
| Breakdown | Fixed mock categories | Attempts `/api/usage/breakdown`, falls back to derived data from summary |
| Timeseries | Realistic mock data with variance | Attempts `/api/usage/timeseries?range=X`, falls back to approximate data from summary |
| Mode Indicator | "Sandbox Mode" badge | "Live Data" badge |

**API Client**: `apps/web/lib/api/usage.ts`

**Types**:
```typescript
interface UsageSummary {
  totalTokens: number;
  totalCostUsd: number;
  totalImages: number;
  totalRequests: number;
}

interface UsageBreakdown {
  category: string;
  tokens: number;
  costUsd: number;
  requests: number;
}

interface UsageTimeseriesPoint {
  ts: string; // ISO timestamp
  tokens: number;
  costUsd: number;
}
```

**Backend Endpoints** (admin-api):
- `GET /api/usage/summary` - Returns usage summary (required)
- `GET /api/usage/breakdown` - Returns usage breakdown by category (optional, will derive from summary if not available)
- `GET /api/usage/timeseries?range={24h|7d|30d}` - Returns timeseries data (optional, will approximate from summary if not available)

**TODO Comments**:
- `apps/web/lib/api/usage.ts:211` - Replace derived breakdown logic with real backend endpoint
- `apps/web/lib/api/usage.ts:239` - Replace approximate timeseries logic with real backend endpoint

### /status - System Status

**Location**: `apps/web/app/status/page.tsx`

**Description**: Real-time status monitoring for slimy.ai services.

**Features**:
- Admin API health check
- Codes Aggregator status
- Response time tracking
- Auto-refresh capability

## Development Guidelines

### Adding New Routes with Backend Integration

1. Create API client functions in `apps/web/lib/api/`
2. Use `adminApiClient` for all backend requests
3. Implement sandbox mode with realistic mock data
4. Add proper TypeScript types for request/response
5. Handle errors gracefully at the component level
6. Use loading skeletons to prevent layout shifts

### Error Handling Strategy

- **Per-Section Errors**: Each section handles its own errors independently
- **Fallback to Mock Data**: In sandbox mode or on error, fall back to mock data
- **User-Friendly Messages**: Show clear error messages without technical jargon
- **Non-Blocking**: Errors in one section don't break the entire page

### Testing

Run tests and build from the web app directory:

```bash
cd apps/web
pnpm test      # Run unit tests
pnpm build     # Build for production
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_ADMIN_API_BASE` | Base URL for admin-api (e.g., `https://api.slimy.ai`) | No (defaults to sandbox mode) |

## Architecture Decisions

1. **Client-Side Data Fetching**: Usage dashboard uses client-side fetching for real-time updates and interactivity
2. **Graceful Degradation**: Missing backend endpoints don't break the UI; fallbacks provide approximate data
3. **Sandbox-First Development**: Developers can work on the web app without running admin-api
4. **Typed APIs**: All API responses are strongly typed for better DX and compile-time safety
