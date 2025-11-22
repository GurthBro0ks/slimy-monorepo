# Web Backend Integration Summary

This document outlines the frontend routes, components, and API integrations for the Slimy web application.

## Authentication

- **Provider**: `AuthProvider` (lib/auth/context.tsx)
- **Hook**: `useAuth()` provides user, loading, error, login, logout, refresh
- **Component**: `ProtectedRoute` for route-level auth protection

## Frontend Routes

### /dashboard (Auth Required)
**Global authenticated dashboard page**

- **Auth**: Required (any logged-in user)
- **Layout**: Uses `PageShell` with `ConnectionBadge` status indicator
- **Sections**:
  - **Top Row**:
    - Snail snapshot (latest tier/level info from screenshot analysis)
    - Usage summary (tokens, cost, requests from usage API)
    - Status panel (connection status, user info)
  - **Quick Actions**: Navigation cards to:
    - /snail/codes (Snail Codes)
    - /snail (Screenshot Analysis)
    - /snail (Tier Calculator)
    - /analytics (Usage Dashboard)
    - /club (Club Analytics)
  - **Bottom Row**:
    - Mini usage chart (7-day timeseries with SVG visualization)
    - Active codes preview (top 5 active codes with link to full list)
- **Modes**:
  - **Sandbox**: Uses mock data when `NEXT_PUBLIC_ADMIN_API_BASE` not configured
  - **Live**: Fetches from admin-api when configured
- **Graceful degradation**: Per-section error handling, no full-page crashes

### /snail
Snail tools dashboard with timeline and quick tools

### /snail/codes
Active snail codes aggregated from sources

### /club (Auth Required, Role: club)
Club analytics with screenshot upload and AI analysis

### /chat
Slime chat interface

### /analytics
Usage analytics dashboard

## Shared Components

### Layout
- **PageShell** (components/layout/page-shell.tsx)
  - Consistent page wrapper with icon, title, subtitle, and status area
  - Used by: /dashboard
- **ConnectionBadge** (components/layout/connection-badge.tsx)
  - Shows admin-api connection status (Live/Sandbox)
  - Auto-checks connection health every 30s
- **Header** (components/layout/header.tsx)
- **Footer** (components/layout/footer.tsx)

### Auth
- **ProtectedRoute** (components/auth/protected-route.tsx)
  - Handles authentication and role-based access control
  - Supports custom fallback components and redirects

### Snail
- **SnailSnapshotCard** (components/snail/snail-snapshot-card.tsx)
  - Displays latest snail analysis with tier, level, and stats
  - Shows confidence score and analysis date
  - Handles loading/error states gracefully

### UI Components
Standard UI library in components/ui/:
- Card, Button, Badge, Skeleton, Callout, Tooltip, etc.

## API Clients (lib/api/)

### Usage API (usage.ts)
- **getUsageSummary()**: Returns tokens, cost, requests, images
- **getUsageBreakdown()**: Returns usage by category
- **getUsageTimeseries(days)**: Returns time-series data points
- **Sandbox**: Returns mock data when admin-api not available

### Snail Screenshots API (snail-screenshots.ts)
- **getSnailAnalyses()**: Returns all snail screenshot analyses
- **getLatestSnailAnalysis()**: Returns most recent analysis
- **pickBestSnailFromAnalysis(analyses)**: Selects best snail by tier/level
- **Types**: SnailAnalysis with tier, level, stats, confidence
- **Sandbox**: Returns mock SSR/SR tier snails

### Snail Codes API (snail-codes.ts)
- **getSnailCodes()**: Returns all codes (active and inactive)
- **getActiveSnailCodes()**: Returns only active codes
- **Types**: SnailCode with code, source, notes, active status
- **Sandbox**: Returns mock codes from Reddit/Snelp/Discord

### Admin API (admin-client.ts)
Main admin-api client for authenticated requests

## Sandbox vs Live Mode

### Sandbox Mode
- **Enabled when**: `NEXT_PUBLIC_ADMIN_API_BASE` environment variable not set
- **Behavior**: All API clients return mock/sample data
- **Indicators**: ConnectionBadge shows "Sandbox", status panels indicate sandbox mode
- **Use case**: Development, testing, demo without backend

### Live Mode
- **Enabled when**: `NEXT_PUBLIC_ADMIN_API_BASE` is configured
- **Behavior**: API clients fetch from admin-api
- **Fallback**: If admin-api requests fail, falls back to sandbox data with console warnings
- **Indicators**: ConnectionBadge shows "Live" when healthy

## Environment Variables

- `NEXT_PUBLIC_ADMIN_API_BASE`: Admin API base URL (required for live mode)

## TODO / Future Enhancements

- **Dashboard**: When richer backend data becomes available:
  - Add more detailed usage breakdowns
  - Include historical snail progression charts
  - Add notifications for new codes
  - Personalized recommendations based on usage patterns
