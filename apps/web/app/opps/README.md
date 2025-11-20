# /opps - Opportunities Radar (Experimental)

This directory contains an experimental feature for viewing opportunities from the opps-api service. The route is **isolated** and **not linked** in the main navigation.

## Overview

The Opportunities Radar provides a filtered view of opportunities across multiple domains (stocks, crypto, video trends, class actions, and promotional offers). It's designed for testing and development purposes.

## Access

- **URL**: `/opps` (direct access only)
- **Status**: Experimental, not in production navigation
- **Visibility**: Not indexed by search engines (robots: noindex)

## Features

### 1. Mode Switcher

Toggle between two operational modes:

- **Quick Mode**: Fast, lightweight scan for recent opportunities
- **Daily Mode**: More comprehensive daily digest

The mode selection affects the API query and determines what opportunities are returned.

### 2. Domain Filters

Filter opportunities by category groups:

- **📈 Markets**: Stocks + Crypto opportunities
- **📊 Trends**: Video + Search trending opportunities
- **⚖️ Class Actions**: Legal settlement opportunities
- **🎁 Freebies**: Promotional offers and freebies

**Note**: Domain filters are applied **client-side only**. The API still returns all domains, and the React component filters the results before rendering.

### 3. Max Per Domain Control

Adjustable slider (1-20) to control how many opportunities are fetched per domain from the API.

### 4. Enhanced Rendering

Each opportunity is displayed with:

- Title
- Short summary
- Risk level badge (low/medium/high with color coding)
- Estimated reward (if available)
- Estimated time (if available)
- Confidence score (if available)
- Source attribution (if available)

Opportunities are grouped by domain with clear section headers and counts.

### 5. Debug Panel

A collapsible debug panel at the bottom of the page shows the raw JSON snapshot from the opps-api. This is useful for:

- Verifying API responses during development
- Debugging data structure issues
- Understanding what the API returns vs. what's displayed

## File Structure

```
apps/web/app/opps/
├── README.md                        # This file
├── page.tsx                         # Route entry point (server component)
├── OpportunitiesRadarClient.tsx     # Main client component with UI logic
├── types.ts                         # TypeScript types for opps-api
└── styles.css                       # Local styles (isolated to this route)
```

## API Integration

The component fetches data from:

```
GET /api/radar?mode={quick|daily}&maxPerDomain={number}
```

Expected response structure (see `types.ts`):

```typescript
{
  ok: boolean;
  timestamp: string;
  mode: 'quick' | 'daily';
  totalCount: number;
  topByCategory: {
    stocks?: Opportunity[];
    crypto?: Opportunity[];
    video?: Opportunity[];
    search?: Opportunity[];
    legal?: Opportunity[];
    promo?: Opportunity[];
  };
  error?: string;
}
```

## Development Notes

### Isolation Requirements

This feature is **strictly isolated** to the `/opps` route subtree:

- ✅ All files are contained within `apps/web/app/opps/`
- ✅ Local styles in `styles.css` (no global CSS changes)
- ✅ No modifications to shared layouts or navigation
- ✅ No changes to other routes
- ✅ No new global dependencies

### Client-Side Filtering

The domain filters work entirely on the client side:

1. API returns all domains regardless of filter state
2. React component filters `snapshot.topByCategory` based on `selectedDomainGroups`
3. Only filtered opportunities are rendered

This approach keeps the API simple while providing flexible UI filtering.

### Type Safety

All API interactions use TypeScript types from `types.ts`:

- `RadarSnapshot`: API response structure
- `Opportunity`: Individual opportunity object
- `OpportunityDomain`: Valid domain values
- `RiskLevel`: Risk level enumeration
- `RadarApiParams`: API query parameters

The component handles undefined/null values gracefully with error states.

## Testing

To test this feature:

1. Navigate to `/opps` directly in your browser
2. Try switching between Quick and Daily modes
3. Toggle different domain filters
4. Adjust the max per domain slider
5. Open the debug panel to inspect raw API responses
6. Verify error states by:
   - Checking behavior when API is unavailable
   - Checking behavior when API returns `ok: false`

## Future Considerations

Potential enhancements (not implemented):

- Server-side domain filtering (modify API to accept domain parameters)
- Sorting/ranking options
- Opportunity detail modal/page
- Bookmark/save functionality
- Integration with user profiles
- Adding to main navigation (requires removing isolation constraints)

## Important Constraints

**Do NOT**:

- Add this route to global navigation
- Modify shared layout components
- Change authentication logic
- Wire in real user profile data
- Import this component in other routes
- Add global CSS rules for these components

This feature must remain isolated until explicitly approved for broader integration.
