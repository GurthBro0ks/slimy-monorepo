# Usage Dashboard Documentation

## Overview

The `/usage` dashboard provides users with a comprehensive view of their API usage, including current spend, limits, and service status. The page is designed to be resilient, handling errors gracefully and displaying informative messages when data is unavailable.

## Architecture

### Components

1. **Usage Page** (`app/usage/page.tsx`)
   - Main dashboard displaying usage data
   - Shows loading skeletons while fetching
   - Handles errors gracefully without crashing
   - Auto-refreshes every 30 seconds

2. **Usage Badge** (`components/usage-badge.tsx`)
   - Compact usage indicator in the header
   - Shows percentage and tier
   - Tooltip with detailed information
   - Auto-refreshes every 30 seconds

3. **API Client** (`lib/api/usage.ts`)
   - Type-safe client for fetching usage data
   - Comprehensive error handling
   - Safe variant for non-critical components

### Data Flow

```
User → /usage page
       ↓
       fetchUsageData() (lib/api/usage.ts)
       ↓
       GET /api/usage (app/api/usage/route.ts)
       ↓
       getMockUsageData() (lib/usage-thresholds.ts)
       ↓
       Returns UsageData
```

**Note**: Currently uses mock data. In production, `/api/usage/route.ts` would fetch from the admin-api service.

## Data Structure

### UsageData Type

```typescript
interface UsageData {
  level: "free" | "pro" | "over_cap";
  currentSpend: number;
  limit: number;
  modelProbeStatus: "ok" | "soft_cap" | "hard_cap";
}
```

### Thresholds

- **Free Tier**: 0-100 spend
- **Pro Tier**: 101-1000 spend
- **Over Cap**: 1000+ spend

### Status Indicators

- **ok**: Operating normally (< 90% of limit)
- **soft_cap**: Approaching limit (90-100% of limit)
- **hard_cap**: Limit exceeded (> 100%)

## Features

### Resilience

The dashboard is designed to handle various edge cases:

1. **Division by Zero**: Safely handles `limit: 0` without crashing
2. **Negative Values**: Clamps percentages to 0-100 range
3. **Missing Data**: Shows appropriate message when data is unavailable
4. **Network Errors**: Displays user-friendly error message with recovery instructions
5. **Upstream Errors**: Gracefully handles 502/500 errors from admin-api

### Visual States

1. **Loading**: Skeleton cards while data is fetching
2. **Success**: Full dashboard with usage details
3. **Warning**: Yellow callout when at soft cap (90%+)
4. **Error**: Red callout when at hard cap (100%+)
5. **Failure**: Error message with retry instructions

### Auto-Refresh

Both the page and badge automatically refresh data every 30 seconds to keep information current without requiring manual page refresh.

## Development

### Running Locally

```bash
# From the workspace root
cd apps/web

# Start dev server
pnpm dev

# Visit the page
open http://localhost:3000/usage
```

### Mocking Data for Offline Development

The usage data is currently mocked in `app/api/usage/route.ts`. To test different scenarios:

```typescript
// Edit app/api/usage/route.ts

// Test soft cap (90% usage)
const mockSpend = 950;

// Test hard cap (100%+ usage)
const mockSpend = 1100;

// Test low usage
const mockSpend = 50;

// Test zero usage
const mockSpend = 0;
```

### Testing Different Error States

To test error handling during development:

```typescript
// In app/api/usage/route.ts, add:

export async function GET() {
  // Simulate 502 error
  return NextResponse.json(
    { ok: false, code: "BAD_GATEWAY", message: "Upstream service unavailable" },
    { status: 502 }
  );
}

// Or simulate missing data
export async function GET() {
  return NextResponse.json({ ok: true }); // Missing data field
}
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run only usage-related tests
pnpm test usage

# Run with coverage
pnpm test:coverage

# Watch mode during development
pnpm test --watch
```

### Test Coverage

The following scenarios are tested:

**API Client Tests** (`tests/api/usage.test.ts`):
- ✅ Successful data fetch
- ✅ HTTP errors (404, 500, 502)
- ✅ Application errors (ok: false)
- ✅ Network failures
- ✅ Invalid data structures
- ✅ Edge cases (negative values, zero limits)
- ✅ Safe fetch variant

**Page Tests** (`tests/components/usage-page.test.tsx`):
- ✅ Loading state display
- ✅ Error state handling
- ✅ Successful data rendering
- ✅ Different tier displays (free, pro, over_cap)
- ✅ Status callouts (soft_cap, hard_cap)
- ✅ Edge cases (zero limits, negative values)
- ✅ Auto-refresh behavior

**Badge Tests** (`tests/components/usage-badge.test.tsx`):
- ✅ Loading state
- ✅ Error resilience
- ✅ Percentage calculations
- ✅ Status icons
- ✅ Auto-refresh
- ✅ Responsive display

## Production Integration

### Connecting to Admin API

When ready to use real data, update `app/api/usage/route.ts`:

```typescript
export async function GET() {
  try {
    // Fetch from admin-api instead of mock
    const response = await fetch(`${process.env.ADMIN_API_URL}/usage`, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Admin API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      ok: true,
      data: {
        level: data.tier,
        currentSpend: data.spend,
        limit: data.limit,
        modelProbeStatus: data.status,
      },
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "USAGE_FETCH_ERROR",
        message: "Failed to fetch usage data",
      },
      { status: 500 }
    );
  }
}
```

### Required Environment Variables

```bash
ADMIN_API_URL=https://admin-api.example.com
ADMIN_API_KEY=your-api-key-here
```

## Error Behavior

### Upstream Service Down (502)

When admin-api is unavailable:
1. Page shows error callout with message
2. User sees friendly "Please try refreshing" message
3. Page doesn't crash or show broken UI
4. Auto-refresh continues attempting to fetch data

### Invalid/Missing Data

When data is malformed:
1. API client validates structure
2. Throws `UsageApiError` with specific code
3. Page catches error and shows error state
4. Logs detailed error for debugging

### Network Issues

When network is unavailable:
1. Fetch fails with TypeError
2. API client wraps in `UsageApiError` with "NETWORK_ERROR" code
3. Badge shows "Loading..." (graceful degradation)
4. Page shows error state with recovery instructions

## Monitoring

### Key Metrics to Track

1. **API Response Time**: Should be < 50ms for mock, < 200ms for real API
2. **Error Rate**: Track failed fetches
3. **Usage Patterns**: Monitor typical spend levels
4. **Refresh Success**: Track auto-refresh success rate

### Logging

Errors are logged to console with context:

```typescript
console.error("Failed to fetch usage:", error);
// Includes error type, message, and stack trace
```

In production, these logs should be sent to your logging service (e.g., Sentry, LogRocket).

## Future Enhancements

Potential improvements for the usage dashboard:

1. **Historical Data**: Chart showing usage over time
2. **Projections**: Estimate when user will hit limits
3. **Notifications**: Alert users before hitting soft cap
4. **Breakdown**: Show usage by feature/endpoint
5. **Billing Integration**: Link to upgrade/billing page
6. **Export**: Allow users to download usage reports

## Troubleshooting

### Badge not showing

**Check**:
1. Is `UsageBadge` imported in the header?
2. Are there console errors?
3. Is `/api/usage` endpoint responding?

### Data not updating

**Check**:
1. Open browser console for errors
2. Check Network tab for failed `/api/usage` requests
3. Verify auto-refresh interval is working
4. Check if component is properly mounted

### Tests failing

**Check**:
1. Run `pnpm install` to ensure dependencies are current
2. Clear test cache: `pnpm test --clearCache`
3. Check for TypeScript errors: `pnpm tsc --noEmit`
4. Verify mocks are properly set up in test files

## Related Files

- `app/usage/page.tsx` - Main dashboard page
- `app/api/usage/route.ts` - API endpoint
- `lib/api/usage.ts` - API client
- `lib/usage-thresholds.ts` - Threshold logic and types
- `components/usage-badge.tsx` - Header badge component
- `tests/api/usage.test.ts` - API client tests
- `tests/components/usage-page.test.tsx` - Page component tests
- `tests/components/usage-badge.test.tsx` - Badge component tests
- `tests/unit/usage-thresholds.test.ts` - Threshold logic tests

## Support

For issues or questions:
1. Check this documentation
2. Review test files for usage examples
3. Check console for detailed error messages
4. Review admin-api logs if using real data
