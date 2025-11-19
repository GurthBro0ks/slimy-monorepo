# Snail Analysis Pipeline Overview

This document describes the end-to-end data pipeline for the Super Snail game tools ecosystem, covering how data flows from various inputs through processing stages to final outputs.

## Table of Contents

- [System Architecture](#system-architecture)
- [Stage 1: Inputs](#stage-1-inputs)
- [Stage 2: Processing](#stage-2-processing)
- [Stage 3: Storage](#stage-3-storage)
- [Stage 4: Outputs](#stage-4-outputs)
- [Where AI Models Fit](#where-ai-models-fit)
- [Failure Modes & Resilience](#failure-modes--resilience)

---

## System Architecture

The snail tools pipeline is distributed across multiple components:

- **apps/web**: Next.js application - primary user interface, API routes, caching layer
- **apps/admin-api**: Express.js backend - authenticated operations, guild-scoped data
- **apps/bot**: Discord bot - (planned) event ingestion, user commands
- **Redis**: Caching layer for codes and API responses
- **PostgreSQL**: Persistent storage (via Prisma ORM)
- **File System**: Upload storage for screenshots and analysis results

---

## Stage 1: Inputs

### 1.1 Secret Codes (External Aggregation)

**Component**: `apps/web` (codes aggregator)

**Input Sources**:
- **Snelp API** (`lib/codes/sources/snelp.ts`)
  - Official API endpoint
  - Structured JSON response
  - Timeout: 10s, 3 retries
  - Validates: alphanumeric codes 4-20 chars

- **Reddit r/SuperSnailGame** (`lib/codes/sources/reddit.ts`)
  - Web scraping via HTTP
  - Pattern matching: `/\b[A-Z0-9]{6,12}\b/g`
  - Timeout: 15s, 2 retries
  - False positive filtering

**Data Format**:
```typescript
{
  code: string,          // The redemption code
  source: string,        // 'snelp' | 'reddit'
  addedAt: Date,         // When first seen
  expiresAt?: Date,      // Known expiration
  reward?: string,       // Reward description
  isActive: boolean      // Validity status
}
```

**Failure Modes**:
- Source API timeout/unavailable → fallback to cached data
- Network errors → exponential backoff retry (2s, 4s, 8s)
- Invalid response format → skip source, log error
- Rate limiting → circuit breaker pattern activates

---

### 1.2 Screenshots (User Uploads)

**Component**: `apps/web` and `apps/admin-api`

**Input Methods**:
- **Web Upload** (POST `/api/screenshot`)
  - File upload (multipart/form-data)
  - Max 10MB per file
  - Supports: PNG, JPG, JPEG, WebP
  - User-scoped storage: `/public/uploads/screenshots/{userId}/`

- **Admin API Upload** (POST `/api/snail/:guildId/analyze`)
  - Guild-scoped uploads
  - Max 8 files, 10MB each
  - Requires: authentication, guild membership
  - Storage: `/data/snail/{guildId}/{userId}/latest.json`

- **URL Reference**
  - Accepts image URLs for analysis
  - No local storage, direct to vision API

**Screenshot Types Supported**:
1. `game-stats` - Overall game progress, level, currencies
2. `leaderboard` - Rankings and competitive data
3. `profile` - Player profile and achievements
4. `achievement` - Specific achievements unlocked
5. `inventory` - Items, artifacts, resources
6. `clan-guild` - Club/guild information
7. `performance` - Battle/challenge results
8. `social` - Friends, trading, social features
9. `custom` - User-defined analysis

**Failure Modes**:
- File too large → reject with 413 error
- Invalid image format → validation error before processing
- Upload path not writable → fallback to temp directory
- Disk space full → cleanup old uploads, alert admin

---

### 1.3 Manual Data (User Events)

**Component**: `apps/web` (currently file-based)

**Input Sources**:
- **Timeline Events** (`data/snail-events.json`)
  - Manual entries (currently)
  - Future: user-submitted events via UI
  - Future: automated event detection from screenshots

**Data Format**:
```typescript
{
  id: string,
  timestamp: string,     // ISO 8601
  type: string,          // 'code' | 'artifact' | 'evolution' | 'partner'
  title: string,
  details: object        // Type-specific metadata
}
```

**Failure Modes**:
- JSON parse error → serve empty timeline, log error
- File not found → return empty array
- Corrupted data → validate and skip invalid entries

---

## Stage 2: Processing

### 2.1 Code Aggregation & Deduplication

**Component**: `apps/web/lib/codes-aggregator.ts`

**Process Flow**:
```
1. Concurrent fetch from all sources
   ↓
2. Transform to unified format
   ↓
3. Deduplication (configurable strategy)
   ↓
4. Validation & filtering
   ↓
5. Cache storage (Redis)
```

**Deduplication Strategies** (`lib/codes/deduplication.ts`):
- `newest`: Keep most recently added
- `oldest`: Preserve first seen
- `priority`: Source-based precedence (Snelp > Reddit)
- `merge`: Combine metadata from all sources

**Validation Rules**:
- Code format: alphanumeric, 4-20 characters
- Required fields: code, source, addedAt
- Active status determination
- Expiration date validation

**Caching Strategy** (`lib/codes/cache.ts`):
- **Fresh TTL**: 5 minutes (primary cache)
- **Stale TTL**: 10 minutes (fallback)
- **Strategy**: Stale-while-revalidate
- **Refresh**: Auto-refresh every 5 minutes
- **Key**: `snail:codes:aggregated`

**Component Responsibility**: `apps/web`

**Failure Modes**:
- All sources fail → serve stale cache data
- Cache unavailable → direct database/API query
- Deduplication conflict → log warning, use configured strategy
- Validation failure → exclude invalid codes, continue processing

---

### 2.2 Screenshot Analysis (Vision Processing)

**Component**: `apps/web/lib/screenshot/analyzer.ts`

**Process Flow**:
```
1. Image validation & encoding
   ↓
2. Base64 conversion (if file)
   ↓
3. Prepare analysis prompt (type-specific)
   ↓
4. Call GPT-4 Vision API
   ↓
5. Parse structured response
   ↓
6. Calculate confidence score
   ↓
7. Save results (file/DB)
```

**AI Model Configuration**:
- **Model**: `gpt-4-vision-preview`
- **Max Tokens**: 2000
- **Temperature**: 0.2 (low for consistent extraction)
- **Detail Level**: high (for text recognition)

**Analysis Templates** (9 predefined prompts):
Each template extracts specific data relevant to the screenshot type:
- Game stats: level, currencies, power, timestamp
- Leaderboard: rankings, player names, scores
- Profile: player info, achievements, stats
- Inventory: items, quantities, rarities
- Clan/guild: member list, stats, activities

**Confidence Scoring**:
```typescript
confidence = completedFields / totalExpectedFields
// Range: 0.0 (no data) to 1.0 (complete)
// Threshold for "good" analysis: >= 0.7
```

**Batch Processing**:
- Sequential execution (avoid rate limits)
- Processing time tracking
- Progress callbacks for UI updates

**Component Responsibility**: `apps/web` (primary), `apps/admin-api` (guild-scoped)

**Failure Modes**:
- API rate limit → exponential backoff, queue remaining
- Vision API timeout → retry up to 3 times
- Unparseable response → return raw text, confidence 0.0
- Invalid image format → pre-validation before API call
- Cost limits exceeded → disable auto-analysis, require manual trigger

---

### 2.3 Data Validation & Enrichment

**Component**: Various (per data type)

**Codes Validation**:
- Format checking (regex patterns)
- Source attribution
- Active/expired status determination
- Duplicate detection across sources

**Screenshot Analysis Validation**:
- Required field presence
- Data type validation (numbers, dates, strings)
- Range checks (e.g., level 1-1000)
- Cross-field consistency (e.g., total = sum of components)

**Enrichment**:
- Timestamp normalization to ISO 8601
- Metadata addition (userId, guildId, analysisVersion)
- Derived metrics calculation
- Trend detection (comparison with previous analyses)

**Component Responsibility**: Distributed across `apps/web` and `apps/admin-api`

**Failure Modes**:
- Validation failure → store raw data + error flag
- Partial data → accept with lower confidence
- Enrichment service down → store core data only
- Type mismatch → coerce or reject field, continue

---

## Stage 3: Storage

### 3.1 Cache Layer (Redis)

**Component**: `apps/web/lib/codes/cache.ts`

**Cached Data**:
- Aggregated codes (5 min fresh, 10 min stale)
- API responses (60s server-side)
- User stats (300s fresh, 600s stale) - admin-api
- Source health status

**Cache Strategies**:
- **Stale-while-revalidate**: Serve stale while fetching fresh
- **Circuit breaker**: Stop hitting failing sources
- **Auto-refresh**: Background updates every 5 min

**Component Responsibility**: `apps/web` (primary consumer)

**Failure Modes**:
- Redis connection lost → direct to database/API
- Cache corruption → invalidate and rebuild
- Memory limits → LRU eviction
- Key collision → namespaced keys prevent conflicts

---

### 3.2 File System Storage

**Component**: `apps/web` and `apps/admin-api`

**Storage Locations**:
```
/public/uploads/screenshots/{userId}/
  - User-uploaded screenshots (web)

/data/snail/{guildId}/{userId}/
  - Analysis results (latest.json)
  - Guild-scoped data

/data/reports/
  - Code reports ({date}.jsonl)

/data/
  - snail-events.json (timeline data)
```

**File Formats**:
- Screenshots: Original format (PNG, JPG, WebP)
- Analysis results: JSON
- Reports: JSON Lines (.jsonl)
- Events: JSON array

**Component Responsibility**: `apps/web`, `apps/admin-api`

**Failure Modes**:
- Disk full → cleanup old files, alert admin
- Permission denied → fallback to temp directory
- File corruption → validate on read, regenerate if possible
- Concurrent writes → atomic operations, locking

---

### 3.3 Database (PostgreSQL)

**Component**: `apps/web` (via Prisma)

**Existing Schema** (relevant models):
```prisma
model ClubAnalysis {
  // Template for screenshot analysis storage
  id, guildId, userId, title, summary, confidence
  images: ClubAnalysisImage[]
  metrics: ClubMetric[]
  createdAt, updatedAt
}

model CodeReport {
  // User-reported code issues
  id, code, reason, details, reportedBy, status
  createdAt, updatedAt
}
```

**Planned/Needed Schema**:
- `SnailAnalysis` - Persistent screenshot analysis results
- `SnailEvent` - User timeline events (migrate from JSON)
- `UserStats` - Historical stats snapshots
- `TierCalculation` - Cached tier/ranking data

**Component Responsibility**: `apps/web` (Prisma client)

**Failure Modes**:
- Connection pool exhausted → queue queries, increase pool
- Query timeout → optimize indexes, add caching
- Schema migration failure → rollback, fix migration
- Constraint violation → validate before insert, return error

---

## Stage 4: Outputs

### 4.1 Per-User Statistics

**Component**: `apps/web`, `apps/admin-api`

**Output Types**:

**Latest Stats** (GET `/api/snail/:guildId/stats`):
```json
{
  "userId": "string",
  "guildId": "string",
  "timestamp": "ISO 8601",
  "stats": {
    "level": 42,
    "power": 12500,
    "currency": { "gold": 50000, "gems": 1200 },
    "artifacts": 15,
    "achievements": 87
  },
  "confidence": 0.85,
  "source": "screenshot-analysis"
}
```

**Historical Trends**:
- Change tracking between analyses
- Growth rates (daily, weekly)
- Achievement unlocks timeline
- Resource accumulation patterns

**Component Responsibility**: `apps/admin-api` (primary), `apps/web` (UI)

**Failure Modes**:
- No analysis data → show empty state
- Incomplete data → display available fields only
- Stale data → show age warning
- Comparison error → skip trend calculation

---

### 4.2 Club/Guild Aggregates

**Component**: `apps/admin-api` (planned)

**Output Types**:

**Guild Summary**:
- Total members tracked
- Average level/power
- Top performers (leaderboard)
- Total achievements unlocked
- Guild activity timeline

**Comparative Stats**:
- Member rankings
- Growth rate comparisons
- Contribution metrics
- Participation rates

**Export Formats**:
- JSON (API response)
- CSV (download)
- PDF reports (future)

**Component Responsibility**: `apps/admin-api`

**Failure Modes**:
- Insufficient data → minimum threshold warning
- Member privacy → respect opt-out preferences
- Calculation error → fallback to individual stats
- Large dataset → pagination, streaming

---

### 4.3 Weekly Snapshots

**Component**: `apps/web`, `apps/admin-api` (planned)

**Snapshot Contents**:
```json
{
  "week": "2025-W47",
  "timestamp": "ISO 8601",
  "codes": {
    "new": 5,
    "expired": 2,
    "active": 23,
    "sources": ["snelp", "reddit"]
  },
  "users": {
    "active": 127,
    "newAnalyses": 342,
    "avgConfidence": 0.82
  },
  "events": [
    { "type": "code", "count": 15 },
    { "type": "evolution", "count": 8 }
  ]
}
```

**Generation Schedule**:
- Automated: Sunday 23:59 UTC
- On-demand: Admin trigger
- Retention: 52 weeks (1 year)

**Component Responsibility**: Background worker (future), `apps/web` (current)

**Failure Modes**:
- Scheduled task failure → retry next cycle, alert
- Incomplete week data → partial snapshot with flag
- Storage failure → queue for retry
- Notification failure → log, don't block snapshot

---

### 4.4 Public API Outputs

**Component**: `apps/web/app/api/*`

**Endpoints**:

**GET `/api/codes`**
- Aggregated secret codes
- Query params: scope, search, metadata
- Cache: 60s server-side + stale-while-revalidate
- Response: codes array + metadata

**POST `/api/screenshot`**
- Upload and analyze screenshots
- Returns: file path + optional analysis
- Rate limit: Per-user (planned)

**GET `/api/snail/history`**
- Timeline events
- Cache: 60s
- Pagination: limit 50

**POST `/api/codes/report`**
- Report dead/invalid codes
- Logs to JSONL file
- Returns: success confirmation

**Component Responsibility**: `apps/web`

**Failure Modes**:
- Rate limit exceeded → 429 Too Many Requests
- Invalid request → 400 Bad Request with details
- Service unavailable → 503 with retry-after header
- Auth failure → 401 Unauthorized

---

## Where AI Models Fit

### 5.1 Vision/OCR (Currently Implemented)

**Primary Use**: Screenshot Analysis

**Model**: OpenAI GPT-4 Vision (`gpt-4-vision-preview`)

**Capabilities**:
- **Text Extraction**: Read in-game text, numbers, stats
- **Layout Understanding**: Identify UI sections, menus, tabs
- **Structured Data**: Extract organized data (tables, lists)
- **Context Awareness**: Understand game-specific terminology

**Current Applications**:
- Game stats extraction (level, power, currencies)
- Leaderboard parsing (rankings, scores, names)
- Inventory analysis (items, quantities, rarities)
- Achievement recognition (completed/total counts)
- Profile data extraction (player info, progress)
- Clan/guild information (members, stats, activities)

**Future Enhancements**:
- Multi-screenshot correlation (e.g., compare before/after)
- Automatic screenshot type detection
- OCR confidence scoring per field
- Fallback to dedicated OCR API (Tesseract) for cost optimization

**Cost Considerations**:
- $0.01-0.02 per image (varies by size/detail)
- Batching for efficiency
- Caching results to avoid re-analysis
- User quota limits (e.g., 50 analyses/month free tier)

---

### 5.2 LLM Summarization (Planned)

**Potential Use Cases**:

**Weekly Digest Generation**:
- Input: Week's worth of events, stats changes, new codes
- Output: Natural language summary email/notification
- Model: GPT-4 or Claude (lower cost than vision)

**Code Descriptions**:
- Input: Raw code string + reward data
- Output: User-friendly description
- Example: "SNAIL2025 → 1000 gems, expires Jan 31"

**Event Clustering**:
- Input: Timeline events from multiple users
- Output: Grouped events, trend identification
- Example: "15 players evolved to Dragon tier this week"

**Help/FAQ Automation**:
- Input: User question about game mechanics
- Output: Answer based on documented strategies
- Context: Snail tools documentation, game wiki

**Implementation Approach**:
```typescript
async function generateWeeklySummary(data: WeeklyData): Promise<string> {
  const prompt = `Summarize this week's Super Snail activity:
    - ${data.codes.new} new codes added
    - ${data.users.active} active players
    - ${data.events.length} notable events

    Write a friendly, concise summary (2-3 paragraphs).`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 300
  });

  return response.choices[0].message.content;
}
```

---

### 5.3 Code Agents (Future/Experimental)

**Potential Use Cases**:

**Automated Code Discovery**:
- **Agent Task**: Monitor Reddit, Discord, Twitter for new codes
- **Tools**: Web scraping, API integration, pattern matching
- **Validation**: Test code format, check against existing database
- **Human-in-loop**: Flag suspicious codes for manual review

**Data Quality Assurance**:
- **Agent Task**: Review screenshot analyses for accuracy
- **Tools**: Cross-reference with known game mechanics
- **Validation**: Check statistical outliers, impossible values
- **Feedback Loop**: Improve vision prompts based on errors

**Tier Calculator Automation**:
- **Agent Task**: Calculate optimal progression paths
- **Tools**: Game mechanics knowledge base, user inventory data
- **Output**: Personalized recommendations (e.g., "Evolve snail A, then craft artifact B")
- **Updates**: Adapt to game balance patches

**Anomaly Detection**:
- **Agent Task**: Identify unusual patterns in user stats
- **Tools**: Statistical analysis, historical baselines
- **Alerts**: Notify of potential data errors or exploits
- **Example**: "User level jumped 50 → 500 in one day (likely screenshot mislabel)"

**Implementation Example**:
```typescript
// Pseudo-code for code discovery agent
class CodeDiscoveryAgent {
  async run() {
    const sources = [
      this.monitorReddit(),
      this.monitorDiscord(),
      this.monitorTwitter()
    ];

    for await (const potentialCode of sources) {
      if (this.validateFormat(potentialCode)) {
        if (this.isNovel(potentialCode)) {
          await this.flagForReview(potentialCode);
        }
      }
    }
  }

  validateFormat(code: string): boolean {
    return /^[A-Z0-9]{6,12}$/.test(code);
  }

  async isNovel(code: string): Promise<boolean> {
    const existing = await db.codes.findUnique({ where: { code } });
    return !existing;
  }
}
```

---

### 5.4 Embedding-Based Search (Future)

**Use Case**: Semantic search over player questions/strategies

**Approach**:
1. Generate embeddings for documentation, FAQs, strategies
2. Store in vector database (e.g., Pinecone, Weaviate)
3. On user query: embed query → find similar docs → return relevant content
4. Optional: Pass to LLM for conversational response

**Model**: OpenAI `text-embedding-3-small` (cheap, fast)

**Example Application**:
- User asks: "How do I get more gems quickly?"
- System finds: Strategy guides mentioning gems, daily quests, code redemption
- Response: Ranked list of relevant articles + summarized tips

---

## Failure Modes & Resilience

### 6.1 Network & API Failures

**Failure Scenarios**:
- External API timeout (Snelp, Reddit, OpenAI)
- Network partition
- DNS resolution failure
- SSL/TLS errors

**Resilience Strategies**:
- **Timeouts**: Aggressive timeouts (10-15s)
- **Retries**: Exponential backoff (2s, 4s, 8s, 16s)
- **Circuit Breaker**: Stop hitting failing services
- **Fallback**: Serve cached/stale data
- **Monitoring**: Track error rates, alert on threshold

**Implementation** (codes aggregator):
```typescript
// lib/codes-aggregator.ts
class CodesAggregator {
  private circuitBreaker = {
    failures: 0,
    threshold: 3,
    isOpen: false
  };

  async fetchWithResilience(source: Source) {
    if (this.circuitBreaker.isOpen) {
      return this.getCachedData(source);
    }

    try {
      return await this.fetchWithRetry(source);
    } catch (error) {
      this.circuitBreaker.failures++;
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.isOpen = true;
        setTimeout(() => this.resetCircuitBreaker(), 60000); // Reset after 1 min
      }
      return this.getCachedData(source);
    }
  }
}
```

---

### 6.2 Data Quality Issues

**Failure Scenarios**:
- Vision API returns incomplete/incorrect data
- User uploads wrong screenshot type
- OCR misreads text (e.g., "O" vs "0")
- Game UI changes break parsing

**Resilience Strategies**:
- **Confidence Scoring**: Flag low-confidence analyses
- **Validation Rules**: Reject impossible values (e.g., negative level)
- **Manual Review**: Queue ambiguous results for user confirmation
- **Versioning**: Track analysis prompt versions for debugging
- **Feedback Loop**: Learn from user corrections

**Example Validation**:
```typescript
function validateGameStats(stats: any): ValidationResult {
  const errors = [];

  if (stats.level < 1 || stats.level > 1000) {
    errors.push('Invalid level range');
  }

  if (stats.power < 0) {
    errors.push('Negative power value');
  }

  if (stats.currency?.gold && stats.currency.gold < 0) {
    errors.push('Negative currency');
  }

  return {
    valid: errors.length === 0,
    errors,
    confidence: errors.length === 0 ? 1.0 : 0.3
  };
}
```

---

### 6.3 Storage Failures

**Failure Scenarios**:
- Database connection pool exhausted
- Redis memory full (OOM)
- Disk space full (file uploads)
- Filesystem permissions error

**Resilience Strategies**:
- **Connection Pooling**: Proper limits, timeout handling
- **LRU Eviction**: Redis eviction policy
- **Disk Monitoring**: Automated cleanup of old uploads
- **Fallback Storage**: Temp directory if primary fails
- **Graceful Degradation**: Continue core functions even if storage fails

**Example Disk Management**:
```typescript
async function cleanupOldUploads(maxAge: number = 30 * 24 * 60 * 60 * 1000) {
  const uploadsDir = '/public/uploads/screenshots';
  const now = Date.now();

  for (const userId of await fs.readdir(uploadsDir)) {
    const userDir = path.join(uploadsDir, userId);
    for (const file of await fs.readdir(userDir)) {
      const filePath = path.join(userDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
      }
    }
  }
}
```

---

### 6.4 Rate Limiting & Quotas

**Failure Scenarios**:
- OpenAI API rate limit (RPM, TPM)
- External API quotas exceeded
- User abuse (spam uploads)
- Cost limits reached

**Resilience Strategies**:
- **Rate Limiting**: Per-user, per-endpoint limits
- **Queueing**: Background job queue for non-urgent tasks
- **Quota Tracking**: Monitor API usage, alert on thresholds
- **Graceful Errors**: Inform user of limits, suggest retry time
- **Tiered Access**: Free tier limits, paid tier higher limits

**Implementation** (middleware):
```typescript
// Rate limit: 10 screenshot uploads per hour per user
const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many uploads',
      retryAfter: 3600,
      limit: 10,
      window: '1 hour'
    });
  }
});

app.post('/api/screenshot', rateLimiter, handleUpload);
```

---

### 6.5 Authentication & Authorization

**Failure Scenarios**:
- JWT token expired
- User not in guild (guild-scoped data)
- Missing required role
- CSRF token mismatch

**Resilience Strategies**:
- **Token Refresh**: Automatic refresh before expiration
- **Permission Checks**: Multi-layer validation (API + DB)
- **CSRF Protection**: Token validation on state-changing operations
- **Audit Logging**: Track auth failures for security monitoring

**Implementation** (admin-api):
```typescript
// apps/admin-api/src/routes/snail.js
router.post('/:guildId/analyze', [
  requireAuth,           // JWT validation
  requireRole('member'), // Role check
  requireGuildMembership // Guild membership check
], async (req, res) => {
  // Handler logic
});
```

---

### 6.6 Monitoring & Alerting

**Key Metrics**:
- API response times (p50, p95, p99)
- Error rates by endpoint
- Cache hit/miss ratios
- Vision API costs (daily, monthly)
- Database query performance
- Disk space usage

**Alerting Thresholds**:
- Error rate > 5% (5 min window)
- API response time p95 > 2s
- Vision API daily cost > $50
- Disk usage > 85%
- Database connection pool > 90% utilized

**Tools** (suggestions):
- Logging: Winston, Pino
- Metrics: Prometheus + Grafana
- APM: New Relic, DataDog
- Uptime: UptimeRobot, Pingdom

---

## Summary: Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INPUTS                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Secret Codes        Screenshots        Manual Events              │
│  (Snelp, Reddit)     (Web, Admin-API)   (Timeline, User Data)      │
│       ↓                   ↓                    ↓                    │
└───────┬───────────────────┬────────────────────┬────────────────────┘
        │                   │                    │
┌───────┴───────────────────┴────────────────────┴────────────────────┐
│                        PROCESSING                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Aggregation &      GPT-4 Vision       Validation &                │
│  Deduplication      Analysis           Enrichment                   │
│  (apps/web)         (apps/web)         (distributed)                │
│       ↓                   ↓                    ↓                    │
└───────┬───────────────────┬────────────────────┬────────────────────┘
        │                   │                    │
┌───────┴───────────────────┴────────────────────┴────────────────────┐
│                          STORAGE                                    │
├─────────────────────────────────────────────────────────────────────┤
│   Redis Cache       File System         PostgreSQL                 │
│   (5-10 min TTL)    (uploads, JSON)     (Prisma ORM)               │
│       ↓                   ↓                    ↓                    │
└───────┬───────────────────┬────────────────────┬────────────────────┘
        │                   │                    │
┌───────┴───────────────────┴────────────────────┴────────────────────┐
│                         OUTPUTS                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Per-User Stats    Guild Aggregates    Weekly Snapshots            │
│  API Endpoints     Leaderboards        Reports & Alerts            │
│  (apps/web, admin-api)                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps for Implementation

**Immediate Priorities** (based on current gaps):

1. **Database Persistence** for screenshot analyses
   - Migrate from file-based to Prisma models
   - Create `SnailAnalysis` table
   - Implement historical queries

2. **Stats Tracking UI** (`/snail/stats` page)
   - Display latest user stats
   - Show trend graphs (growth over time)
   - Comparison with previous analyses

3. **Tier Calculator** (`/snail/calc` page)
   - Implement game mechanics calculations
   - Personalized progression recommendations
   - Resource optimization suggestions

4. **Discord Bot Integration**
   - Commands: `/codes`, `/analyze`, `/stats`
   - Webhook event ingestion
   - Notifications for new codes

5. **Background Jobs**
   - Weekly snapshot generation
   - Automated cache refresh
   - Old file cleanup
   - Cost tracking & alerts

---

**Document Version**: 1.0
**Last Updated**: 2025-11-19
**Maintainer**: AI-generated, human-reviewed
