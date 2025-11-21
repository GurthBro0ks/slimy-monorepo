# Web-Backend Integration Summary

This document outlines the integration points between the web frontend (apps/web) and the admin-api backend for Super Snail features.

## Overview

The web app integrates with admin-api through a centralized API client (`apps/web/lib/api/admin-client.ts`) that handles:

- Unified request/response handling
- Error handling and retries
- Timeout management
- Sandbox mode fallbacks

All snail-specific API integrations follow this pattern and provide sandbox data for offline/development use.

## Screenshot Analysis

**Frontend:** `apps/web/app/screenshots/page.tsx`
**API Client:** `apps/web/lib/api/snail-screenshots.ts`
**Backend Endpoint:** `GET /api/snail/:guildId/screenshots/latest`

### Features

The frontend now surfaces `suggestedTier` and `suggestedScore` (when present) as a highlight tier suggestion per screenshot, along with run-level summary metrics:

- **Summary Metrics:**
  - Total screenshots analyzed in the current run
  - Average Slimy score across all screenshots
  - Best tier achieved in the run
  - Highlight card for the "top snail" (highest score)

- **Per-Screenshot Display:**
  - Tier badge with color-coded styling (S+, S, A, B, C, D, F)
  - Numeric Slimy score
  - Full stats breakdown (snail level, city level, sim power, relic power, club contribution)
  - Confidence metrics with average confidence calculation

### Data Shape

```typescript
{
  guildId: string;
  timestamp: string;
  results: [
    {
      imageUrl: string;
      timestamp: string;
      stats: {
        snailLevel?: number;
        cityLevel?: number;
        simPower?: number;
        relicPower?: number;
        clubContribution?: number;
        suggestedTier?: string;      // e.g., "S+", "A"
        suggestedScore?: number;     // numeric score
      };
      confidence?: {
        snailLevel?: number;
        cityLevel?: number;
        simPower?: number;
        relicPower?: number;
        clubContribution?: number;
      };
    }
  ]
}
```

### Sandbox Mode

When admin-api is not configured, the frontend displays example data with mock tier suggestions and scores. This allows development and UI testing without backend dependencies.

## Tier Calculator

**Frontend:** `apps/web/app/tiers/page.tsx`
**API Client:** `apps/web/lib/api/snail-tier.ts`
**Backend Endpoint:** `POST /api/snail/tier`

### Features

The frontend displays a "Slimy score" and a rough tier band explanation. The exact formulas and thresholds live in `apps/admin-api/src/services/snail-tier-formulas.js` and can be tuned without breaking the UI.

- **Score Explanation:**
  - Labels the score as "Slimy score"
  - Explains it's computed from level, city, relic power, club contribution, and sim power
  - Shows tier band (S+, S, A, B, C, D, F) with description

- **Tier Band Display:**
  - Color-coded tier badge
  - Band description (e.g., "Strong and efficient" for A tier)
  - Score range context

- **Improvement Hints:**
  - Frontend-side heuristics suggest which stats to focus on next
  - Checks for lagging relic power, city level, club contribution
  - Provides actionable suggestions (e.g., "Focus on relic upgrades")

### Request Shape

```typescript
{
  level: number;
  cityLevel: number;
  relicPower: number;
  clubContribution: number;
  simPower?: number; // Optional
}
```

### Response Shape

```typescript
{
  tier: string;           // "S+", "S", "A", "B", "C", "D", "F"
  score: number;          // Numeric score
  summary: string;        // Human-readable summary
  details: string[];      // Stats breakdown
}
```

### Sandbox Mode

When admin-api is not configured, the frontend uses a simplified scoring formula for demonstration. The sandbox calculation is purely client-side and serves as a fallback for development.

## Graceful Degradation

Both features are designed to work without admin-api:

1. **Detection:** Check if `NEXT_PUBLIC_ADMIN_API_BASE` is configured
2. **Fallback:** Use sandbox data/calculation if API is unavailable
3. **User Notification:** Display callouts indicating sandbox mode
4. **No Crashes:** All tier/score fields are optional and safely handled

## Backend Integration Points

The backend services that power these features:

- `apps/admin-api/src/services/snail-tier-formulas.js`
  - `computeScoreFromStats(stats)` - Calculate numeric score
  - `mapScoreToTier(score)` - Map score to tier string
  - `getTierDetails(tier)` - Get tier metadata

- `apps/admin-api/src/services/snail-screenshots.js`
  - OCR/analysis pipeline
  - Screenshot processing
  - Tier suggestion integration

## Future Enhancements

Potential improvements:

- Real-time score updates as user types
- Historical tier tracking over time
- Comparison with guild/global averages
- Detailed score breakdown by component
- Advanced filtering and sorting of screenshots
- Export functionality for analysis data
