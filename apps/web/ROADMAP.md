# Slimy.ai Web - Implementation Roadmap

## Overview

This roadmap maps the Builder System Prompt v2 features to the existing codebase and outlines the implementation plan.

## Current Foundation (✅ Complete)

- Next.js 16 App Router with TypeScript
- Tailwind CSS v4 + shadcn/ui components
- Admin API proxies with role mapping
- Basic codes aggregator (Snelp + Reddit)
- MDX docs system
- Testing infrastructure (Vitest + Playwright)
- Docker deployment support

---

## SCOPE A — "Ship Now" Features

### A1. Codes Hub v2 ✅ Foundation / 🚧 Enhancements

**Current State:**
- ✅ Basic aggregator (Snelp + Reddit)
- ✅ Scope filters (active, past7, all)
- ✅ Copy All button (non-expiring)
- ✅ Per-code display

**To Implement:**
- 🚧 Search box for filtering codes
- 🚧 "Report dead code" functionality
- 🚧 Performance optimization (<200ms load)
- 🚧 Offline copy button support

**Files to Touch:**
- `app/snail/codes/page.tsx` - Add search & report UI
- `app/api/codes/route.ts` - Optimize caching
- `app/api/codes/report/route.ts` - NEW: Report endpoint
- `lib/codes-aggregator.ts` - NEW: Extract aggregator logic

**PR:** `feat: enhance codes hub with search and reporting`

---

### A2. Ask Manus Bar 🆕

**Description:** Sticky bottom bar on /club and /snail for runtime assistance

**To Implement:**
- Runtime chat interface
- Server-side chat endpoint
- Role-aware actions
- Rate limiting

**Files to Create:**
- `components/ask-manus-bar.tsx` - NEW: Chat bar component
- `app/api/chat/bot/route.ts` - NEW: Chat endpoint
- `lib/chat-actions.ts` - NEW: Action handlers
- `lib/rate-limiter.ts` - NEW: Rate limiting

**Files to Modify:**
- `app/snail/layout.tsx` - Add Ask Manus bar
- `app/club/layout.tsx` - Add Ask Manus bar

**PR:** `feat: add Ask Manus runtime assistance bar`

---

### A3. Public Stats Cards 🆕

**Description:** Public, read-only stats with guild-scoped toggle

**To Implement:**
- Guild settings for public stats toggle
- Public stats route
- OG image generation
- PII scrubbing

**Files to Create:**
- `app/public-stats/[guildId]/page.tsx` - NEW: Public stats page
- `app/api/guilds/[id]/settings/route.ts` - NEW: Settings endpoint
- `app/api/og/stats/route.tsx` - NEW: OG image generator
- `lib/stats-scrubber.ts` - NEW: PII scrubbing

**PR:** `feat: add public stats cards with guild toggle`

---

### A4. Snail Timeline 🆕

**Description:** File-backed user history with delta comparison

**To Implement:**
- User history JSON storage
- Timeline comparison UI
- Delta highlighting

**Files to Create:**
- `app/snail/timeline/page.tsx` - NEW: Timeline page
- `app/api/snail/history/route.ts` - NEW: History endpoint
- `lib/timeline-differ.ts` - NEW: Delta calculation
- `data/user-history/.gitkeep` - NEW: History storage

**Files to Modify:**
- `app/snail/page.tsx` - Add timeline link

**PR:** `feat: add snail timeline with delta comparison`

---

### A5. Usage Soft Caps 🆕

**Description:** Color badges for spend thresholds

**To Implement:**
- Usage tracking endpoint
- Badge components
- Threshold configuration

**Files to Create:**
- `components/usage-badge.tsx` - NEW: Usage badge
- `app/api/usage/route.ts` - NEW: Usage endpoint
- `lib/usage-thresholds.ts` - NEW: Threshold config

**Files to Modify:**
- `components/layout/header.tsx` - Add usage badge

**PR:** `feat: add usage soft caps with color badges`

---

## SCOPE B — Near-Term Upgrades

### B1. Discord → Docs Sync 🆕

**Description:** Sync Discord channels to searchable docs

**To Implement:**
- Discord API integration
- Channel → Markdown conversion
- Build-time search indexing

**Files to Create:**
- `scripts/sync-discord-docs.ts` - NEW: Discord sync script
- `lib/discord-client.ts` - NEW: Discord API wrapper
- `lib/search-indexer.ts` - NEW: Search indexing
- `.github/workflows/discord-sync.yml` - NEW: Sync workflow

**PR:** `feat: add Discord to docs sync with search`

---

### B2. Persona Lab A/B 🆕

**Description:** Side-by-side persona testing

**To Implement:**
- A/B comparison UI
- Rating system
- Results storage

**Files to Create:**
- `app/admin/persona-lab/page.tsx` - NEW: Persona lab
- `app/api/persona/compare/route.ts` - NEW: Comparison endpoint
- `app/api/persona/ratings/route.ts` - NEW: Ratings endpoint
- `components/persona-comparison.tsx` - NEW: Comparison UI

**PR:** `feat: add persona lab A/B testing`

---

### B3. Tasks & Jobs Panel 🆕

**Description:** Admin panel for running jobs with SSE logs

**To Implement:**
- Jobs panel UI
- SSE streaming
- Job handlers

**Files to Create:**
- `app/admin/jobs/page.tsx` - NEW: Jobs panel
- `app/api/jobs/[action]/route.ts` - NEW: Job endpoints
- `lib/job-runner.ts` - NEW: Job execution
- `lib/sse-stream.ts` - NEW: SSE helper

**PR:** `feat: add tasks and jobs admin panel`

---

### B4. Club Operator Dashboard 🆕

**Description:** Club management dashboard with actions

**To Implement:**
- Dashboard cards
- Operator actions
- Status tracking

**Files to Create:**
- `app/club/dashboard/page.tsx` - NEW: Dashboard
- `app/api/club/actions/route.ts` - NEW: Action endpoints
- `components/club/coverage-card.tsx` - NEW: Coverage card
- `components/club/movers-card.tsx` - NEW: Movers card

**Files to Modify:**
- `app/club/page.tsx` - Link to dashboard

**PR:** `feat: add club operator dashboard`

---

## SCOPE C — Feature Flags & Theming

### C1. Guild-Scoped Feature Flags 🆕

**Description:** Server-owned config with theme and experiments

**To Implement:**
- Flags configuration system
- Admin toggle panel
- SSR injection

**Files to Create:**
- `lib/feature-flags.ts` - NEW: Flags system
- `app/api/guilds/[id]/flags/route.ts` - NEW: Flags endpoint
- `app/admin/flags/page.tsx` - NEW: Flags admin panel
- `data/guild-flags/.gitkeep` - NEW: Flags storage
- `middleware.ts` - NEW: Flags injection

**Files to Modify:**
- `slimy.config.ts` - Add default flags

**PR:** `feat: add guild-scoped feature flags and theming`

---

## SCOPE D — Cross-Source Search

### D1. Unified Search System 🆕

**Description:** Search across docs, codes, and sheets with citations

**To Implement:**
- Search indexers
- Hybrid search (lexical + embeddings)
- Citation system
- Deep linking

**Files to Create:**
- `lib/search/indexer.ts` - NEW: Search indexer
- `lib/search/query.ts` - NEW: Query engine
- `lib/search/embeddings.ts` - NEW: Embeddings (optional)
- `app/api/search/route.ts` - NEW: Search endpoint
- `app/api/answer/route.ts` - NEW: Answer endpoint
- `app/search/page.tsx` - NEW: Search UI
- `components/search-bar.tsx` - NEW: Search component
- `components/citation.tsx` - NEW: Citation component

**Files to Modify:**
- `components/layout/header.tsx` - Add search bar

**PR:** `feat: add cross-source search with citations`

---

## SCOPE E — Camera Workflows

### E1. Mobile Camera Scanning 🆕

**Description:** PWA camera capture with offline queue

**To Implement:**
- PWA manifest
- Camera capture
- Offline queue
- OCR pipeline
- Classification

**Files to Create:**
- `public/manifest.json` - NEW: PWA manifest
- `app/club/scan/page.tsx` - NEW: Scan interface
- `app/api/scans/route.ts` - NEW: Scans endpoint
- `app/api/scans/[id]/route.ts` - NEW: Scan detail
- `app/api/ingest/enqueue/route.ts` - NEW: Ingest queue
- `lib/camera/capture.ts` - NEW: Camera handler
- `lib/camera/offline-queue.ts` - NEW: Offline queue
- `lib/ocr/processor.ts` - NEW: OCR processor
- `lib/ocr/classifier.ts` - NEW: Image classifier
- `components/scan-progress.tsx` - NEW: Progress UI

**Files to Modify:**
- `app/club/page.tsx` - Add scan action
- `app/layout.tsx` - Add PWA meta tags

**PR:** `feat: add mobile camera scanning workflows`

---

## Implementation Order

### Phase 1: Foundation Enhancements (Week 1)
1. ✅ A1: Codes Hub v2 enhancements
2. ✅ A5: Usage soft caps
3. ✅ C1: Feature flags system

### Phase 2: Runtime Features (Week 2)
4. A2: Ask Manus bar
5. A3: Public stats cards
6. A4: Snail timeline

### Phase 3: Admin Tools (Week 3)
7. B2: Persona lab A/B
8. B3: Tasks & jobs panel
9. B4: Club operator dashboard

### Phase 4: Advanced Features (Week 4)
10. B1: Discord → docs sync
11. D1: Cross-source search
12. E1: Camera workflows

---

## File Structure After Implementation

```
slimyai-web/
├── app/
│   ├── admin/
│   │   ├── flags/page.tsx           # Feature flags panel
│   │   ├── jobs/page.tsx            # Jobs panel
│   │   └── persona-lab/page.tsx     # Persona A/B testing
│   ├── api/
│   │   ├── answer/route.ts          # Search answers
│   │   ├── chat/bot/route.ts        # Ask Manus
│   │   ├── codes/
│   │   │   ├── route.ts             # Codes aggregator
│   │   │   └── report/route.ts      # Report dead code
│   │   ├── guilds/[id]/
│   │   │   ├── flags/route.ts       # Feature flags
│   │   │   └── settings/route.ts    # Guild settings
│   │   ├── ingest/enqueue/route.ts  # Ingest queue
│   │   ├── jobs/[action]/route.ts   # Job runners
│   │   ├── og/stats/route.tsx       # OG images
│   │   ├── persona/
│   │   │   ├── compare/route.ts     # Persona comparison
│   │   │   └── ratings/route.ts     # Ratings
│   │   ├── scans/
│   │   │   ├── route.ts             # Scans list
│   │   │   └── [id]/route.ts        # Scan detail
│   │   ├── search/route.ts          # Search
│   │   ├── snail/history/route.ts   # Timeline
│   │   └── usage/route.ts           # Usage tracking
│   ├── club/
│   │   ├── dashboard/page.tsx       # Operator dashboard
│   │   └── scan/page.tsx            # Camera scanning
│   ├── public-stats/[guildId]/page.tsx  # Public stats
│   ├── search/page.tsx              # Search UI
│   └── snail/timeline/page.tsx      # Timeline
├── components/
│   ├── ask-manus-bar.tsx            # Chat bar
│   ├── citation.tsx                 # Citations
│   ├── club/
│   │   ├── coverage-card.tsx        # Coverage metrics
│   │   └── movers-card.tsx          # Top movers
│   ├── persona-comparison.tsx       # A/B comparison
│   ├── scan-progress.tsx            # Scan progress
│   ├── search-bar.tsx               # Search input
│   └── usage-badge.tsx              # Usage indicator
├── lib/
│   ├── camera/
│   │   ├── capture.ts               # Camera API
│   │   └── offline-queue.ts         # Offline support
│   ├── chat-actions.ts              # Chat actions
│   ├── codes-aggregator.ts          # Codes logic
│   ├── discord-client.ts            # Discord API
│   ├── feature-flags.ts             # Flags system
│   ├── job-runner.ts                # Job execution
│   ├── ocr/
│   │   ├── classifier.ts            # Image classification
│   │   └── processor.ts             # OCR processing
│   ├── rate-limiter.ts              # Rate limiting
│   ├── search/
│   │   ├── embeddings.ts            # Vector search
│   │   ├── indexer.ts               # Indexing
│   │   └── query.ts                 # Query engine
│   ├── search-indexer.ts            # Search indexing
│   ├── sse-stream.ts                # SSE helper
│   ├── stats-scrubber.ts            # PII removal
│   ├── timeline-differ.ts           # Delta calc
│   └── usage-thresholds.ts          # Usage config
├── scripts/
│   ├── sync-discord-docs.ts         # Discord sync
│   └── [existing scripts]
├── data/
│   ├── guild-flags/                 # Flags storage
│   └── user-history/                # Timeline data
└── public/
    └── manifest.json                # PWA manifest
```

---

## Testing Strategy

### Unit Tests
- Feature flags system
- Search indexer
- Codes aggregator
- Timeline differ
- OCR classifier

### Integration Tests
- API endpoints
- Chat actions
- Job runners
- Offline queue

### E2E Tests
- Codes hub workflow
- Search and citations
- Camera scanning
- Feature flag toggles

---

## Deployment Checklist

- [ ] Feature flags default configuration
- [ ] Environment variables for new services
- [ ] PWA manifest and service worker
- [ ] Search index build step
- [ ] Discord bot token (for sync)
- [ ] OCR API credentials
- [ ] Rate limiting configuration
- [ ] Offline storage quotas

---

## Success Metrics

- Codes Hub: <200ms load time, 100% copy success
- Ask Manus: <2s response time, 95% action success
- Search: <500ms query time, 90% citation accuracy
- Camera: 100% offline queue reliability, <5s OCR
- Feature Flags: Zero-downtime toggles

---

**Status:** Ready for Phase 1 implementation  
**Next:** Start with A1 (Codes Hub v2 enhancements)
