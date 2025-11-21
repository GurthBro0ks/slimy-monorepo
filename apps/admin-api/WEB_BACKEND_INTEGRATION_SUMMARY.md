# Web Backend Integration Summary

## Super Snail Tier System

This document describes the backend API endpoints and services for the Super Snail tier calculation system.

## Architecture Overview

The tier system is built with the following components:

### Core Services

#### 1. `snail-tier-formulas.js` - Centralized Formula Logic

Location: `apps/admin-api/src/services/snail-tier-formulas.js`

**Purpose**: Contains all tier calculation math in one place for easy maintenance and future updates.

**Key Functions**:

- `computeScoreFromStats(stats)` - Converts player stats into a numeric score
- `mapScoreToTier(score)` - Maps numeric score to tier ranking (S+, S, A, B, C, D, F)
- `getTierDetails(tier)` - Returns metadata about a tier (description, thresholds, etc.)

**Current Formula** (Placeholder - to be replaced with real spreadsheet logic):

```javascript
score =
  level * 2 +                  // Snail level weight
  cityLevel * 3 +              // City level weight (higher importance)
  relicPower * 0.001 +         // Relic power (scaled down for large numbers)
  clubContribution * 1.5 +     // Club contribution weight
  simPower * 0.0005;           // SIM power (optional)
```

**Tier Thresholds**:

| Tier | Minimum Score | Description |
|------|---------------|-------------|
| S+   | 1000          | Elite tier - Top 1% of players |
| S    | 800           | Excellent tier - Top 5% of players |
| A    | 600           | Strong tier - Top 15% of players |
| B    | 400           | Above average tier - Top 40% of players |
| C    | 200           | Average tier - Middle of the pack |
| D    | 100           | Below average tier - Room for improvement |
| F    | 0             | Beginner tier - Just getting started |

**TODO Items** (marked in code):
- Replace placeholder formula with real Supersnail spreadsheet calculations
- Implement dynamic threshold tables based on game meta
- Add support for complex stat interactions (synergies, diminishing returns)
- Incorporate maxSimPower for efficiency ratings

#### 2. `snail-tier.js` - High-Level Tier Service

Location: `apps/admin-api/src/services/snail-tier.js`

**Purpose**: Provides a clean interface for tier calculation with validation and formatting.

**Key Functions**:

- `calculateSnailTier(params)` - Main entry point for tier calculation
  - Validates input parameters
  - Calls formula helpers
  - Returns structured result with tier, score, summary, and details

**Input Parameters**:
```javascript
{
  level: number,              // Required - Snail level
  cityLevel: number,          // Required - City level
  relicPower: number,         // Optional - Total relic power
  clubContribution: number,   // Optional - Club contribution score
  simPower: number,           // Optional - Current SIM power
  maxSimPower: number         // Optional - Maximum possible SIM power
}
```

**Output Format**:
```javascript
{
  tier: "A",                  // Calculated tier
  score: 645.5,               // Numeric score
  summary: "Player tier: A (score: 645.5) - Strong tier - Top 15% of players",
  details: {
    tier: "A",
    description: "Strong tier - Top 15% of players",
    minScore: 600,
    actualScore: 645.5,
    stats: { /* input stats */ },
    note: "Formula is simplified - real calculations will be more complex"
  }
}
```

#### 3. `snail-screenshots.js` - Screenshot Analysis Service

Location: `apps/admin-api/src/services/snail-screenshots.js`

**Purpose**: Analyzes screenshots and computes tier suggestions based on extracted stats.

**Current Status**: Stubbed implementation returning placeholder data.

**Key Functions**:

- `getLatestScreenshotAnalysis({ guildId, userId })` - Returns latest screenshot analysis with tier suggestions

**TODO Items** (marked in code):
- Integrate with actual screenshot analysis pipeline
- Extract real stats from images using OCR/Vision AI
- Implement confidence scoring for extracted data

---

## API Endpoints

### 1. POST `/api/snail/:guildId/tier`

Calculate player tier based on stats.

**Authentication**: Required (member role, guild membership)

**Request Body**:
```json
{
  "level": 45,
  "cityLevel": 38,
  "relicPower": 8500,
  "clubContribution": 250,
  "simPower": 125000,
  "maxSimPower": 200000
}
```

**Response** (200 OK):
```json
{
  "tier": "B",
  "score": 415.5,
  "summary": "Player tier: B (score: 415.5) - Above average tier - Top 40% of players",
  "details": {
    "tier": "B",
    "description": "Above average tier - Top 40% of players",
    "minScore": 400,
    "actualScore": 415.5,
    "stats": {
      "level": 45,
      "cityLevel": 38,
      "relicPower": 8500,
      "clubContribution": 250,
      "simPower": 125000,
      "maxSimPower": 200000
    },
    "note": "Formula is simplified - real calculations will be more complex"
  }
}
```

**Errors**:
- `400` - Missing required fields (level or cityLevel)
- `500` - Server error

---

### 2. GET `/api/snail/:guildId/screenshots/latest`

Get latest screenshot analysis with tier suggestions.

**Authentication**: Required (member role, guild membership)

**Response** (200 OK):
```json
{
  "guildId": "123456789",
  "userId": "987654321",
  "analysis": {
    "results": [
      {
        "imageUrl": "/api/uploads/files/snail/123456789/screenshot1.png",
        "timestamp": "2025-01-15T10:30:00.000Z",
        "stats": {
          "snailLevel": 45,
          "cityLevel": 38,
          "simPower": 125000,
          "relicPower": 8500,
          "clubContribution": 250,
          "suggestedTier": "B",
          "suggestedScore": 415.5
        },
        "confidence": {
          "snailLevel": 0.95,
          "cityLevel": 0.92,
          "simPower": 0.88,
          "relicPower": 0.85,
          "clubContribution": 0.90
        },
        "note": "Stubbed screenshot analysis - replace with real Vision AI extraction"
      },
      {
        "imageUrl": "/api/uploads/files/snail/123456789/screenshot2.png",
        "timestamp": "2025-01-15T10:30:00.000Z",
        "stats": {
          "snailLevel": 52,
          "cityLevel": 42,
          "simPower": 185000,
          "relicPower": 12300,
          "clubContribution": 380,
          "suggestedTier": "A",
          "suggestedScore": 652.65
        },
        "confidence": {
          "snailLevel": 0.96,
          "cityLevel": 0.94,
          "simPower": 0.91,
          "relicPower": 0.87,
          "clubContribution": 0.93
        },
        "note": "Stubbed screenshot analysis - replace with real Vision AI extraction"
      }
    ],
    "summary": "Analyzed 2 screenshots with tier suggestions",
    "note": "This is stubbed data - integrate with real screenshot processing pipeline"
  }
}
```

**New Fields Added**:
- `stats.suggestedTier` - Tier computed from extracted screenshot stats
- `stats.suggestedScore` - Numeric score used to determine the tier

**Errors**:
- `500` - Server error

---

## Frontend Integration

### Existing Frontend Components

Based on the context provided, the following frontend components consume these APIs:

#### Web App (`apps/web`)

**Tier Calculation Page**:
- Location: `apps/web/app/tiers/page.tsx`
- API Client: `apps/web/lib/api/snail-tier.ts`
- Consumes: `POST /api/snail/:guildId/tier`

**Screenshot Analysis Page**:
- Location: `apps/web/app/screenshots/page.tsx`
- API Client: `apps/web/lib/api/snail-screenshots.ts`
- Consumes: `GET /api/snail/:guildId/screenshots/latest`

**Integration Notes**:
- The API response shapes are designed to maintain backward compatibility
- New fields (`suggestedTier`, `suggestedScore`) are additive and won't break existing UI
- Frontend can optionally display the tier suggestions without requiring changes

---

## Development Roadmap

### Phase 5 ✅ (Current - Complete)

**Goal**: Refactor tier system to be centralized and extensible

**Completed**:
- [x] Extract tier formulas into dedicated module (`snail-tier-formulas.js`)
- [x] Create high-level tier service (`snail-tier.js`)
- [x] Add `POST /api/snail/:guildId/tier` endpoint
- [x] Create screenshot service with tier suggestions (`snail-screenshots.js`)
- [x] Add `GET /api/snail/:guildId/screenshots/latest` endpoint
- [x] Add `suggestedTier` and `suggestedScore` to screenshot results
- [x] Document all endpoints and services

### Phase 6 (Future)

**Goal**: Replace placeholder formulas with real game calculations

**Planned**:
- [ ] Implement actual Supersnail spreadsheet formulas
- [ ] Add dynamic tier thresholds based on game meta
- [ ] Incorporate complex stat interactions (synergies, diminishing returns)
- [ ] Add support for maxSimPower efficiency ratings
- [ ] Implement threshold effects and breakpoints
- [ ] Add meta-dependent weighting system

### Phase 7 (Future)

**Goal**: Integrate real screenshot analysis

**Planned**:
- [ ] Replace stubbed screenshot data with real Vision AI extraction
- [ ] Implement OCR for stat extraction from images
- [ ] Add confidence scoring and validation
- [ ] Store analysis results in database
- [ ] Add historical analysis tracking
- [ ] Implement comparison features (week-over-week, etc.)

---

## Testing

### Manual Testing

**Test Tier Calculation**:
```bash
curl -X POST http://localhost:3001/api/snail/YOUR_GUILD_ID/tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "level": 45,
    "cityLevel": 38,
    "relicPower": 8500,
    "clubContribution": 250,
    "simPower": 125000
  }'
```

**Test Screenshot Analysis**:
```bash
curl -X GET http://localhost:3001/api/snail/YOUR_GUILD_ID/screenshots/latest \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Unit Tests

**TODO**: Add unit tests for:
- `computeScoreFromStats()` with various input combinations
- `mapScoreToTier()` with boundary conditions
- `calculateSnailTier()` with validation scenarios
- `getLatestScreenshotAnalysis()` with tier computation

---

## Notes and Caveats

⚠️ **Placeholder Formulas**: The current tier calculation formulas are simplified placeholders. They do not reflect the actual complexity of Super Snail game mechanics. These will be replaced in Phase 6 with real calculations based on the game's spreadsheet logic.

⚠️ **Stubbed Screenshot Data**: The screenshot analysis endpoint currently returns stubbed data. Real screenshot processing and stat extraction will be implemented in Phase 7.

⚠️ **API Compatibility**: All changes are designed to be backward compatible. New fields are additive and won't break existing frontend code.

⚠️ **Future Extensibility**: The modular structure makes it easy to:
- Swap out formulas without changing API endpoints
- Add new stat types without breaking existing code
- Implement A/B testing for different calculation methods
- Add caching and performance optimizations

---

## Questions or Issues?

For questions about the tier system or to report issues:
- Check the TODO comments in the source code
- Review the inline documentation in service files
- Consult the game's official spreadsheet calculations
- Discuss complex formula changes with the team before implementing
