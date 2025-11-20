# AGENT 1 SCAN REPORT
**Scanner & Branch Cartographer**
**Scan Date:** 2025-11-20
**Repository:** slimy-monorepo
**Total Branches Scanned:** 123 claude/* branches + main

---

## TABLE OF CONTENTS
1. [Repo Overview](#repo-overview)
2. [Branch Inventory by Theme](#branch-inventory-by-theme)
3. [Recommended Integration Plan](#recommended-integration-plan)
4. [Risks & Things to Watch](#risks--things-to-watch)

---

## REPO OVERVIEW

### Repository Structure

```
slimy-monorepo/
├── apps/
│   ├── web/              ✅ ACTIVE - Next.js 16, React 19, 174 TS files
│   ├── admin-api/        ✅ ACTIVE - Express.js, PostgreSQL, 95% JavaScript
│   ├── admin-ui/         ✅ ACTIVE - Next.js 14, React 18
│   └── bot/              ⚠️  STUB - No implementation, no docs
├── packages/             ⚠️  ALL STUBS - 5 packages defined but empty
│   ├── shared-auth/      (STUB)
│   ├── shared-config/    (STUB)
│   ├── shared-db/        (STUB)
│   ├── shared-snail/     (STUB)
│   └── shared-codes/     (STUB)
├── infra/
│   └── docker/           ✅ ACTIVE - NUC1 & NUC2 deployments, Caddy config
├── docs/                 ✅ ACTIVE - 12 files, ~2,636 lines
└── .github/workflows/    ✅ ACTIVE - test.yml, deploy-notify.yml
```

### Apps Summary

#### **apps/web** - Next.js Web Application (PRODUCTION READY)
- **Framework:** Next.js 16 with App Router
- **TypeScript:** Strict mode, 174 TypeScript files
- **Key Features:**
  - Slime Chat (AI conversations, 5 personality modes)
  - Club Analytics (screenshot upload + GPT-4 Vision analysis)
  - Snail Tools (codes aggregator, screenshot analysis)
  - Admin Panel (guild management, feature flags)
  - MDX documentation system
- **Data Layer:**
  - Custom API client with retry logic (3 retries, exponential backoff)
  - Caching with TTL (60s-5min depending on data type)
  - Rate limiting (10-100 req/min by endpoint)
  - React Context for auth state
- **Auth:** OAuth2 via Admin API, role-based access control
- **Routes:** 13 pages, 30+ API routes
- **Components:** 60+ React components with lazy loading
- **Testing:** Vitest (unit), Playwright (e2e) - 15 test files
- **Styling:** Tailwind CSS 4 with custom neon-green/purple theme
- **Build Optimization:**
  - Code splitting (framework, radix-ui, lucide-react chunks)
  - Tree-shaking enabled
  - Standalone output mode for Docker
- **TODOs:** 23 items (mainly MCP integration, database persistence, feature flags)

#### **apps/admin-api** - Express Backend (PRODUCTION READY)
- **Framework:** Express.js 4.21.2
- **Language:** 95% JavaScript (CommonJS), 5% TypeScript (coexisting, no build step)
- **Database:** PostgreSQL via Prisma ORM (17 models, comprehensive indexing)
- **Redis/Queues:** BullMQ with 3 queues (chat, database, audit)
- **Caching:** Stale-while-revalidate with TTLs (1min-10min)
- **Auth:** Discord OAuth2 + JWT in httpOnly cookies
- **Authorization:** RBAC with role hierarchy (viewer < editor < admin < owner)
- **API Routes:**
  - Auth (4 endpoints): login, callback, me, logout
  - Guilds (7 endpoints): list, health, settings, channels, personality, corrections, usage
  - Uploads (4 endpoints): list, upload (max 20 files), static serving
  - Chat, Stats, Diagnostics
- **Error Handling:** 14 custom error classes, Pino structured logging, request ID tracking
- **Monitoring:** Sentry APM, Prometheus metrics endpoint
- **TODOs:** Database integration for stub endpoints, Redis session persistence, API documentation (Swagger/OpenAPI)

#### **apps/admin-ui** - Admin Dashboard (ACTIVE)
- **Framework:** Next.js 14, React 18
- **Port:** 3081 (systemd service)
- **Features:** Guild dashboard (uploads, current sheet), diagnostics widget
- **API Integration:** 12 endpoints from admin-api
- **Status:** Functional but minimal documentation

#### **apps/bot** - Discord Bot (STUB - NOT IMPLEMENTED)
- **Status:** Directory exists with placeholder package.json only
- **Documentation:** None
- **Implementation:** Not started

### Packages Summary (Monorepo Shared Libraries)

**ALL 5 PACKAGES ARE STUBS** - Only package.json with TODO scripts exist:
- `@slimy/shared-auth` - Auth utilities (planned)
- `@slimy/shared-config` - Config loaders (planned)
- `@slimy/shared-db` - Database clients (planned)
- `@slimy/shared-snail` - Core domain logic (planned)
- `@slimy/shared-codes` - Error codes/enums (planned)

**Current Workaround:** admin-api imports from `file:vendor/slimy-core` instead of shared packages

**Monorepo Tooling:** pnpm workspaces (no Turborepo/Nx)

### Infrastructure Summary

#### **Docker Deployment (infra/docker/)**
- **NUC2 (Production-like):**
  - PostgreSQL 16, Admin API, Web, Caddy reverse proxy
  - Domains: slimyai.xyz, slime.chat
  - HTTPS with HSTS, zstd/gzip compression
  - Health checks with orchestrated startup
  - External volumes (postgres_data, caddy_data, caddy_config)
- **NUC1 (Dev/Test):**
  - MySQL 8, Admin API, Admin UI (source-mounted), Web
  - Bridge network, simpler configuration
- **Build Strategy:**
  - Monorepo root as Docker build context (for pnpm workspace resolution)
  - Multi-stage builds for web (deps → builder → runner)
  - pnpm v10 build script allowlist (6 dependencies)
- **Known Issues (RESOLVED):**
  - Overlay2 cache corruption (fixed with .dockerignore)
  - pnpm v10 build scripts (fixed with onlyBuiltDependencies)
  - Font loading in restricted networks (fixed with system fonts)

#### **Documentation (docs/)**
- **12 files, ~2,636 lines** across root, docs/, and app directories
- **Strong Areas:** Deployment (DOCKER_DEPLOYMENT.md), API docs, error handling
- **Gaps:** No ADRs, no CONTRIBUTING.md, no testing guide, bot undocumented, packages undocumented
- **Technical Debt:** 710-line web-import-build-errors.md (40+ build errors logged)

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend** | Express.js 4, Node 22 |
| **Database** | PostgreSQL 16 (NUC2), MySQL 8 (NUC1), Prisma ORM |
| **Cache/Queue** | Redis, BullMQ, in-memory caching |
| **Auth** | Discord OAuth2, JWT, httpOnly cookies |
| **AI/Vision** | OpenAI GPT-4, GPT-4 Vision |
| **External APIs** | Snelp, Reddit, Google Sheets (MCP) |
| **Testing** | Vitest, Playwright |
| **Deployment** | Docker, Docker Compose, Caddy 2 |
| **Monitoring** | Sentry, Prometheus, Pino logging |
| **Monorepo** | pnpm workspaces |

### Current Branch
- **Working Branch:** `claude/scan-repo-structure-01URFXMZ5uaMfB85a8nSiQoS`
- **Main Branch:** `main`
- **Recent Commits (main):**
  - a112394 - chore(docker): add .dockerignore and NUC2 overlay2 notes
  - efa7c44 - docs(docker): add overlay2 troubleshooting and NUC deploy checklist
  - 25aa48c - docs: add comprehensive Docker deployment guide
  - a7244a2 - fix(docker): enable pnpm v10 build scripts in non-interactive Docker builds
  - 41306ca - fix(web): enable build in restricted network environments

---

## BRANCH INVENTORY BY THEME

**Total Branches:** 123 claude/* branches

### 1. HTTP Client & Typed API Infrastructure (9 branches)

**Theme:** Building a robust, typed HTTP client with standardized error handling and result types

| Branch | Purpose |
|--------|---------|
| `typed-http-client-01BNjPshnKmZS4ntG8Mmr1ac` | Typed HTTP client implementation (v1) |
| `typed-http-client-01Lnkv3awRwsdCehRA77NQZ9` | Typed HTTP client implementation (v2) |
| `improve-http-wrapper-01WgMZEsUXLiopgtwxsgF51Z` | Enhance HTTP wrapper utilities |
| `add-shared-result-type-01HPus7e7Xqc6NTR2QSWUgHa` | Result<T, E> type for error handling |
| `unify-base-url-config-011grH7Kdijd2fZRjr85uUZH` | Centralize base URL configuration |
| `build-api-client-module-01P4kYYCNHJmDkpLmVo9uXoS` | Build reusable API client module |
| `api-gateway-layer-01GKWpXVWy8bn8nTwbmXYxgs` | API gateway abstraction layer |
| `api-catalog-docs-017x3U6jEbyJsMoyVS1QwtHJ` | Document all API endpoints |
| `add-sync-helpers-015TaWpfjj8Ro9DJBhzrxeR6` | Synchronization helper utilities |

**Integration Priority:** HIGH - Foundational for type safety across apps

### 2. Admin API: Type Safety & Validation (4 branches)

**Theme:** Enforce type safety and robust validation in admin-api (currently 95% JavaScript)

| Branch | Purpose |
|--------|---------|
| `admin-api-type-safety-017d3UtBchDXZnC8gxC59neD` | TypeScript conversion for admin-api |
| `standardize-admin-api-errors-01DUML4HqCmpNpynwQqkf9X8` | Standardize error responses |
| `add-api-validation-01Xxv6VUNwEa3NvqfQvG2vXz` | Add Zod validation to all routes |
| `error-code-catalog-01Ci8KXFaoUw2VDfNyXZwMX4` | Centralized error code catalog |

**Integration Priority:** HIGH - Addresses major type safety gap in admin-api

### 3. Admin API: Security & Authentication (7 branches)

**Theme:** Harden authentication, authorization, and session management

| Branch | Purpose |
|--------|---------|
| `cleanup-sessions-tokens-01L9WCs5tepNTHHzTkmwmjim` | Clean up session/token handling |
| `harden-admin-auth-01YUTbcGvAjBrr2f7ATQFNmF` | Strengthen admin authentication |
| `harden-file-upload-safety-01Cs7U9R8Mu35mH3ETjArgwA` | Secure file upload validation |
| `auth-rbac-implementation-012Meoy8C8cZoPrn2Xbh7VqU` | RBAC implementation (may be complete?) |
| `discord-oauth-sessions-01YWSWByDSYihbemL6u7H7YH` | Improve Discord OAuth flow |
| `discord-permissions-scopes-01G57RmSKtbY6nHsSTt1tN6d` | Audit Discord permission scopes |
| `map-admin-auth-flow-014qDQP4gGXCjtMLAA8H94ph` | Document auth flow (may be docs-only) |

**Integration Priority:** HIGH - Security is critical for production

### 4. Admin Panel & CLI Tooling (5 branches)

**Theme:** Improve admin panel UI/UX and CLI bootstrapping

| Branch | Purpose |
|--------|---------|
| `admin-cli-bootstrap-01NgMsWhXq5QMangoDLqHNyL` | CLI bootstrap utility (v1) |
| `admin-cli-bootstrapper-018VtucPsqZjRcquPEr8Hhrg` | CLI bootstrap utility (v2) |
| `admin-panel-copy-01SDEiFLwYPFTWua2b2jKYVD` | Improve admin panel copy/text |
| `admin-system-diagnostics-01Ewub1EcRMTSHHHXV52kEfr` | System diagnostics dashboard |
| `setup-admin-api-server-01NdEijLLznDfRSmK5vUy25K` | Admin API server setup automation |

**Integration Priority:** MEDIUM - Developer experience improvements

### 5. Frontend: UX & Performance (4 branches)

**Theme:** UI polish, loading states, error handling, caching

| Branch | Purpose |
|--------|---------|
| `add-loading-skeletons-01KKZKhT2Xohoch16h4tjPU3` | Loading skeleton components |
| `add-error-boundaries-01MvXFCFvL6KN8QzAgocdr54` | React error boundary wrappers |
| `add-data-caching-017QB6f2mxqFz2USJfkVPg4W` | Frontend data caching strategy |
| `slimy-ux-principles-01AyvjWcUZYdk3nMivGv2WXL` | UX design principles documentation |

**Integration Priority:** MEDIUM - UX polish after core features

### 6. Testing & Quality (6 branches)

**Theme:** Test infrastructure, fixtures, mocking, E2E tests

| Branch | Purpose |
|--------|---------|
| `add-e2e-tests-01GScYYvW4EgWg49d6XPLpBZ` | End-to-end test suite |
| `setup-full-stack-testing-011fHBiXNa23d8iuZ2mn3U6g` | Full-stack testing framework |
| `e2e-test-stub-config-01WB1sB4badK8hMww1oChJrV` | E2E test configuration |
| `add-test-fixtures-library-01FpivySN368rau6c1yoeebc` | Test fixture generator library |
| `add-fixture-generator-01QiPcowvcLvijaasuWR2VpQ` | Automated fixture generation |
| `add-discord-mock-data-019nHmSWsLqGSg8TuHLkobiH` | Discord API mock data |

**Integration Priority:** HIGH - Testing critical for confidence in changes

### 7. Infrastructure & DevOps (6 branches)

**Theme:** Docker reliability, monorepo setup, deployment automation

| Branch | Purpose |
|--------|---------|
| `docker-deploy-reliability-01HwHbtRtny6uiTc5Qp8fi6y` | Docker deployment improvements |
| `setup-monorepo-dev-017fMKdDcKuqUSiH9FKCVQGn` | Monorepo dev environment setup |
| `organize-npm-scripts-01QhFgUsWbdbU4N2QeXtxYxC` | Organize package.json scripts |
| `add-auto-deploy-script-01JV2MrTuNLEnmLHwYnqhTXG` | Automated deployment script |
| `add-deployment-checklist-tool-01LTGSsbDME9Rpdxqm7bU7aG` | Deployment checklist automation |
| `design-retry-strategy-01KUEXLqhWz5VskbffHLG8bA` | Retry logic design/pattern |

**Integration Priority:** HIGH - DevOps improvements enable faster iteration

### 8. Monitoring, Logging & Observability (7 branches)

**Theme:** Health checks, metrics, Prometheus, logging standards

| Branch | Purpose |
|--------|---------|
| `add-health-monitoring-01Wb7KCdqhzn8pVRKL76TPo1` | Health monitoring system |
| `add-health-check-script-01MK52ruEj6Q8j5BHfBo6UMY` | Health check automation |
| `cli-health-check-tool-01UjYynfHvHctuYHeVfwPzm1` | CLI health check utility |
| `add-prometheus-metrics-01CyEMGNmkGUptwbpBLPydJE` | Prometheus metrics integration |
| `monitoring-metrics-architecture-01A4PKNhf79FXpzMTCDjT6vc` | Monitoring architecture design |
| `enhance-bot-logging-0136hcRjoivxPj8wzPKWJebx` | Improve bot logging |
| `logging-conventions-helper-01GnHDpNCcyvyEGYzk6LXSR5` | Logging standards/conventions |

**Integration Priority:** MEDIUM - Observability important but not blocking

### 9. Documentation (23 branches)

**Theme:** ADRs, contribution guides, API docs, runbooks, onboarding

| Branch | Purpose |
|--------|---------|
| `add-adr-template-01CWRh36YYhpKibe3onbpvhq` | Architecture Decision Record template |
| `add-contribution-guidelines-01PQXkVWRrUJz5QUKxm1e6sC` | CONTRIBUTING.md guide |
| `add-developer-docs-014i2qT7CTp9LNpzXzen4orD` | Developer documentation |
| `document-bootstrap-script-01FbwWUXCxFtBA24anMsGEjX` | Bootstrap script docs |
| `document-db-schema-013Fwup4ezfSzPFoQ69ohTq2` | Database schema documentation |
| `document-release-process-01W31ZxCJ9vh9uZ6CiCUkJFR` | Release process documentation |
| `document-sqlite-local-db-01237b8riXpL3Em3QuHRerKV` | SQLite local DB setup |
| `consolidate-infra-docs-0144jLikt7y9SJbdSs7xhKVL` | Consolidate infrastructure docs |
| `create-ops-runbook-01VcCQSBEyxhuwymPFQeodoj` | Operations runbook |
| `create-roadmap-doc-01MVA4xDJMwpYg3XbwsB8Wu7` | Product roadmap documentation |
| `create-scripts-index-01CLYM8VeTxj6dbFS7wgxVUr` | Index of all scripts |
| `create-slimy-glossary-013yxaAXqDrNoJpCAVW3oKRn` | Slimy terminology glossary |
| `add-exec-summary-01CYjxTRazfPGTvJTNUqHXZN` | Executive summary (v1) |
| `exec-summary-slimy-01Hex3SvSjL69ZSJgjuvAwPE` | Executive summary (v2) |
| `ai-usage-guide-0174dwR2ZqaiUPQJdYLDMJLr` | AI usage guide/best practices |
| `add-prompt-library-docs-01DfoPn9Zm7xX9peoe1zwfHT` | Prompt library documentation |
| `incident-report-template-01LLGVdb832tiB8fwJbGeaK6` | Incident report template |
| `add-github-templates-018gnCwxUH1nZ77iK5ew7Yru` | GitHub issue/PR templates |
| `add-onboarding-checklists-01AFBGHwnBMRVSBeCWrW4eig` | Developer onboarding checklists |
| `env-secrets-checklist-01HXDvpPxurr847qzGviqETe` | Environment/secrets checklist |
| `db-migration-strategy-doc-01UAGNHKNrfqZDtK21WPibzs` | Database migration strategy |
| `markdown-skeleton-generator-01UeWmt4UVhsMQ71pE69rmHz` | Markdown doc generator |
| `snail-analysis-pipeline-docs-01BfasijsonQGQhp6RTQtpBU` | Snail analysis pipeline docs |

**Integration Priority:** MEDIUM-HIGH - Documentation critical for team growth

### 10. Database & Data Management (5 branches)

**Theme:** Prisma schema, migrations, MySQL→PostgreSQL, backups

| Branch | Purpose |
|--------|---------|
| `setup-prisma-schema-01A5sARuhJRyUfG2KgJpjoy9` | Prisma schema setup |
| `mysql-postgres-migration-plan-01PTjbUKwinxG9Y3dtA4BG2y` | MySQL to PostgreSQL migration |
| `document-db-schema-013Fwup4ezfSzPFoQ69ohTq2` | Database schema documentation |
| `data-export-backup-01RYBcRXx6PyE1oqphkhHMJU` | Data export/backup utilities |
| `backup-sources-inventory-012CkDtEgvNVezsv9EyFCMyS` | Backup sources inventory |

**Integration Priority:** HIGH - Database integrity critical

### 11. Discord Bot & Integration (5 branches)

**Theme:** Bot commands, guild sync, message templates

| Branch | Purpose |
|--------|---------|
| `bot-command-inventory-019rqRxwW5rC9ebArAh1mW6R` | Inventory of bot commands |
| `discord-guild-sync-01Mip16vgz5qcv3b41PjfHtG` | Guild sync (v1) |
| `discord-guild-sync-01UWh9xJt6ZGZtA98t5uQECC` | Guild sync (v2) |
| `discord-message-templates-01WPTdQce4C95PokRo2qKXVM` | Message templates for bot |
| `add-tier-slash-command-01A3hVfr8DFRz1uLbQpdgeVW` | /tier slash command |

**Integration Priority:** MEDIUM - Bot features enhancement

### 12. Chat & Messaging (2 branches)

**Theme:** Chat persistence, user profiles, saved prompts

| Branch | Purpose |
|--------|---------|
| `add-chat-persistence-01W6siyJX2BuYNvhPHWaHejS` | Chat conversation persistence |
| `user-profiles-saved-prompts-01BpRR4Ff3QeRRVBBpkADGd4` | User profiles with saved prompts |

**Integration Priority:** MEDIUM - Feature enhancement

### 13. Club Analytics & Features (5 branches)

**Theme:** Club analytics dashboard, screenshot analysis, reporting

| Branch | Purpose |
|--------|---------|
| `add-club-dashboard-01LejKVypL1y9ziV1mC6Etna` | Club analytics dashboard |
| `club-analytics-first-pass-01UsFZRsyE5geSUAaR3JUCw3` | Club analytics v1 |
| `club-analytics-v2-01WjM3fVSN6nMS6REsQvF1CA` | Club analytics v2 |
| `fix-club-analytics-stability-01DeLSDv98mJigJ2TztPRLCX` | Stability fixes for club analytics |
| `weekly-club-report-01PDET1i9GwpKkkFth1LohfE` | Weekly automated club reports |

**Integration Priority:** MEDIUM - Feature improvement

### 14. Snail Tools & Features (4 branches)

**Theme:** Snail-specific features, screenshot analysis, stats tracking

| Branch | Purpose |
|--------|---------|
| `snail-tools-ux-flow-01B7hpgQz4f6dVqbwNeMSpMz` | Snail tools UX flow |
| `snail-analysis-pipeline-docs-01BfasijsonQGQhp6RTQtpBU` | Snail analysis pipeline docs |
| `stats-tracking-system-01VoUa6j84W8kvLFbWXbnwJF` | Stats tracking system |
| `screenshot-analysis-pipeline-01L1ihwkr9CSy1tPWyLfD2Xk` | Screenshot analysis pipeline |
| `screenshot-job-queue-01LfvtNQsCUWdBBTxSA9y43K` | Screenshot job queue processing |

**Integration Priority:** MEDIUM - Feature improvement

### 15. Configuration & Feature Flags (4 branches)

**Theme:** Config management, feature flags, debug mode

| Branch | Purpose |
|--------|---------|
| `add-config-loader-module-013dvr8yb2vRYUU9PkwFLrZP` | Configuration loader module |
| `feature-flags-design-01T9Rki72uzGKfvYau9ytymE` | Feature flags system design |
| `guild-config-feature-flags-01SzDQQbn2uq1sPpWH6HsGpc` | Per-guild feature flags |
| `add-safe-debug-mode-01Q8cuvi966FUwZRQfQzSYqR` | Safe debug mode |

**Integration Priority:** MEDIUM - Infrastructure improvement

### 16. Advanced Features & Integrations (8 branches)

**Theme:** Analytics events, webhooks, notifications, event bus, Redis

| Branch | Purpose |
|--------|---------|
| `add-analytics-events-01GtV52aXoZL1yY1eoyBsiqm` | Analytics event tracking |
| `webhooks-outbound-integrations-01T8sANu1pnv1K93i12phWZj` | Outbound webhook integrations |
| `notification-system-first-pass-015pjC8NoEmwdJJkwWqveCt1` | Notification system (first pass) |
| `add-updates-notices-01CW7gyHsrgUmaosG1Bum8sJ` | Updates/notices system |
| `event-bus-audit-log-012JqPxkwAAALq2pUP4MjhZ4` | Event bus with audit logging |
| `redis-cache-adapter-01QpgkHNZK7YjGH4fajBsmKA` | Redis cache adapter |
| `openai-rate-limit-queue-019ELxrEvnaWMvrKhdQA25uE` | OpenAI rate limit queue |
| `implement-seasons-system-01XKYVi9wiwqeP3iS3NCyFJx` | Seasons/competition system |

**Integration Priority:** LOW-MEDIUM - Advanced features

### 17. Minecraft/SlimeCraft Specific (5 branches)

**Theme:** Minecraft server integration, SlimeCraft features

| Branch | Purpose |
|--------|---------|
| `slime-craft-labs-page-01NUAuZA116xgEnZHM2YZz76` | SlimeCraft Labs landing page |
| `slimecraft-microsite-01Ubv1BNQMxH3oYR7QFhTXAL` | SlimeCraft microsite |
| `slimecraft-ops-dashboard-013FYzfzNdq1umQBogKZ3BPY` | SlimeCraft ops dashboard |
| `slimecraft-player-directory-01DpgZFX9Gr8bAAvWD5ndZUJ` | Player directory |
| `minecraft-status-widget-01MpkWShxB9ydAxDoApMYsvy` | Minecraft server status widget |

**Integration Priority:** LOW - Product vertical expansion

### 18. Dashboards & UI Pages (3 branches)

**Theme:** Additional dashboard pages and mock APIs

| Branch | Purpose |
|--------|---------|
| `draft-front-door-dashboard-017yAifioAEAWHWY8bSfVyxP` | Front door dashboard |
| `market-opportunity-module-017kY9WoybvLNDtHj7CTwEBx` | Market opportunity analysis module |
| `mock-slime-status-api-01DeVhKXpYS3Lf2aeoVp9m1V` | Mock Slime status API |

**Integration Priority:** LOW - Non-critical UI

### 19. Build & Development Tools (4 branches)

**Theme:** Monorepo structure, changelog, git tooling, code review bot

| Branch | Purpose |
|--------|---------|
| `design-monorepo-structure-01Ve2W8GafXtKWjcJEqDWKH7` | Monorepo structure design |
| `changelog-generator-0177fwgDK7qtoZQUZH7Qxcfm` | Automated changelog generation |
| `git-dirt-watcher-design-01Vw3PW9V3jG2ApwBQuArz4H` | Git dirty state watcher |
| `local-reviewer-bot-01JG8Z4dgM7mpaMpE5YGf8xS` | Local code review bot |

**Integration Priority:** LOW-MEDIUM - Developer tooling

### 20. Experimental/Multi-Agent (2 branches)

**Theme:** Multi-agent orchestration, AI agent experiments

| Branch | Purpose |
|--------|---------|
| `multi-agent-orchestration-01AL1weWGWAHRDFoUrZSDsJq` | Multi-agent orchestration system |
| `profit-signals-agent-skeleton-017ff2BVbKwt62zMV5FZnMHt` | Profit signals AI agent skeleton |

**Integration Priority:** EXPERIMENTAL - May not be production-ready

### 21. Timezone & Standardization (1 branch)

**Theme:** Timezone handling consistency

| Branch | Purpose |
|--------|---------|
| `standardize-timezone-handling-01X5TvrHsBK88MkZyv7oMM7n` | Standardize timezone handling across apps |

**Integration Priority:** MEDIUM - Data consistency

### 22. Minecraft Documentation (1 branch)

**Theme:** Minecraft-specific backup/restore documentation

| Branch | Purpose |
|--------|---------|
| `minecraft-backup-restore-docs-01NAbs7JcjPBhyE7NNF8Ymxc` | Minecraft backup/restore guide |

**Integration Priority:** LOW - Documentation for specific vertical

---

## RECOMMENDED INTEGRATION PLAN

### Integration Strategy Overview

**Principles:**
1. **Foundation First:** Infrastructure, typing, testing before features
2. **Safety:** Security and error handling early
3. **Risk Mitigation:** Small batches, test between integrations
4. **Dependencies:** Resolve in dependency order (HTTP client → API validation → features)

### Phase 1: Foundation & Infrastructure (CRITICAL)
**Goal:** Establish solid base for all subsequent work

**Batch 1.1 - Docker & Deployment Reliability**
- `docker-deploy-reliability-01HwHbtRtny6uiTc5Qp8fi6y`
- `setup-monorepo-dev-017fMKdDcKuqUSiH9FKCVQGn`
- `organize-npm-scripts-01QhFgUsWbdbU4N2QeXtxYxC`

**Why:** Ensure deployment infrastructure is rock-solid before adding features

**Batch 1.2 - HTTP Client & Type Infrastructure**
- `typed-http-client-01Lnkv3awRwsdCehRA77NQZ9` (choose v2 or v1 based on inspection)
- `add-shared-result-type-01HPus7e7Xqc6NTR2QSWUgHa`
- `improve-http-wrapper-01WgMZEsUXLiopgtwxsgF51Z`
- `unify-base-url-config-011grH7Kdijd2fZRjr85uUZH`

**Why:** Foundational types needed by all apps

**Batch 1.3 - Database & Prisma**
- `setup-prisma-schema-01A5sARuhJRyUfG2KgJpjoy9`
- `document-db-schema-013Fwup4ezfSzPFoQ69ohTq2`
- `mysql-postgres-migration-plan-01PTjbUKwinxG9Y3dtA4BG2y` (evaluate if needed)

**Why:** Database layer must be stable

### Phase 2: Security & Type Safety (HIGH PRIORITY)
**Goal:** Harden security and enforce type safety

**Batch 2.1 - Admin API Type Safety**
- `admin-api-type-safety-017d3UtBchDXZnC8gxC59neD`
- `add-api-validation-01Xxv6VUNwEa3NvqfQvG2vXz`
- `standardize-admin-api-errors-01DUML4HqCmpNpynwQqkf9X8`
- `error-code-catalog-01Ci8KXFaoUw2VDfNyXZwMX4`

**Why:** Type safety prevents bugs and improves developer experience

**Batch 2.2 - Authentication & Authorization Hardening**
- `cleanup-sessions-tokens-01L9WCs5tepNTHHzTkmwmjim`
- `harden-admin-auth-01YUTbcGvAjBrr2f7ATQFNmF`
- `harden-file-upload-safety-01Cs7U9R8Mu35mH3ETjArgwA`
- `discord-oauth-sessions-01YWSWByDSYihbemL6u7H7YH`

**Why:** Security cannot wait

### Phase 3: Testing Infrastructure (HIGH PRIORITY)
**Goal:** Build confidence in changes with robust testing

**Batch 3.1 - Test Framework & Fixtures**
- `setup-full-stack-testing-011fHBiXNa23d8iuZ2mn3U6g`
- `add-test-fixtures-library-01FpivySN368rau6c1yoeebc`
- `add-fixture-generator-01QiPcowvcLvijaasuWR2VpQ`
- `add-discord-mock-data-019nHmSWsLqGSg8TuHLkobiH`

**Batch 3.2 - E2E Tests**
- `add-e2e-tests-01GScYYvW4EgWg49d6XPLpBZ`
- `e2e-test-stub-config-01WB1sB4badK8hMww1oChJrV`

**Why:** Testing gives confidence to integrate other branches

### Phase 4: Monitoring & Observability (MEDIUM-HIGH PRIORITY)
**Goal:** Visibility into production systems

**Batch 4.1 - Health Checks & Metrics**
- `add-health-monitoring-01Wb7KCdqhzn8pVRKL76TPo1`
- `add-health-check-script-01MK52ruEj6Q8j5BHfBo6UMY`
- `add-prometheus-metrics-01CyEMGNmkGUptwbpBLPydJE`
- `monitoring-metrics-architecture-01A4PKNhf79FXpzMTCDjT6vc`

**Batch 4.2 - Logging Standards**
- `enhance-bot-logging-0136hcRjoivxPj8wzPKWJebx`
- `logging-conventions-helper-01GnHDpNCcyvyEGYzk6LXSR5`

**Why:** Observability enables debugging production issues

### Phase 5: Documentation & Onboarding (MEDIUM-HIGH PRIORITY)
**Goal:** Enable team growth and knowledge sharing

**Batch 5.1 - Core Documentation**
- `add-adr-template-01CWRh36YYhpKibe3onbpvhq`
- `add-contribution-guidelines-01PQXkVWRrUJz5QUKxm1e6sC`
- `add-developer-docs-014i2qT7CTp9LNpzXzen4orD`
- `add-onboarding-checklists-01AFBGHwnBMRVSBeCWrW4eig`

**Batch 5.2 - API & Architecture Docs**
- `api-catalog-docs-017x3U6jEbyJsMoyVS1QwtHJ`
- `consolidate-infra-docs-0144jLikt7y9SJbdSs7xhKVL`
- `create-ops-runbook-01VcCQSBEyxhuwymPFQeodoj`
- `document-release-process-01W31ZxCJ9vh9uZ6CiCUkJFR`

**Batch 5.3 - Utility Docs**
- `create-slimy-glossary-013yxaAXqDrNoJpCAVW3oKRn`
- `create-scripts-index-01CLYM8VeTxj6dbFS7wgxVUr`
- `add-github-templates-018gnCwxUH1nZ77iK5ew7Yru`

**Why:** Documentation scales the team

### Phase 6: UX Polish & Features (MEDIUM PRIORITY)
**Goal:** Improve user experience and add polish

**Batch 6.1 - Frontend UX**
- `add-loading-skeletons-01KKZKhT2Xohoch16h4tjPU3`
- `add-error-boundaries-01MvXFCFvL6KN8QzAgocdr54`
- `add-data-caching-017QB6f2mxqFz2USJfkVPg4W`

**Batch 6.2 - Club Analytics Improvements**
- `fix-club-analytics-stability-01DeLSDv98mJigJ2TztPRLCX`
- `club-analytics-v2-01WjM3fVSN6nMS6REsQvF1CA` (choose v1 or v2)
- `weekly-club-report-01PDET1i9GwpKkkFth1LohfE`

**Batch 6.3 - Chat & Persistence**
- `add-chat-persistence-01W6siyJX2BuYNvhPHWaHejS`
- `user-profiles-saved-prompts-01BpRR4Ff3QeRRVBBpkADGd4`

**Why:** UX improvements after foundation is solid

### Phase 7: Configuration & Admin Tooling (MEDIUM PRIORITY)
**Goal:** Simplify configuration and admin operations

**Batch 7.1 - Configuration Management**
- `add-config-loader-module-013dvr8yb2vRYUU9PkwFLrZP`
- `feature-flags-design-01T9Rki72uzGKfvYau9ytymE`
- `guild-config-feature-flags-01SzDQQbn2uq1sPpWH6HsGpc`

**Batch 7.2 - Admin CLI & Panel**
- `admin-cli-bootstrapper-018VtucPsqZjRcquPEr8Hhrg` (choose v2 or v1)
- `admin-panel-copy-01SDEiFLwYPFTWua2b2jKYVD`
- `admin-system-diagnostics-01Ewub1EcRMTSHHHXV52kEfr`

**Why:** Admin tooling improves operational efficiency

### Phase 8: Advanced Features (LOW-MEDIUM PRIORITY)
**Goal:** Add advanced capabilities

**Batch 8.1 - Integrations & Events**
- `add-analytics-events-01GtV52aXoZL1yY1eoyBsiqm`
- `webhooks-outbound-integrations-01T8sANu1pnv1K93i12phWZj`
- `notification-system-first-pass-015pjC8NoEmwdJJkwWqveCt1`
- `event-bus-audit-log-012JqPxkwAAALq2pUP4MjhZ4`

**Batch 8.2 - Discord Bot Features**
- `discord-guild-sync-01UWh9xJt6ZGZtA98t5uQECC` (choose v2 or v1)
- `discord-message-templates-01WPTdQce4C95PokRo2qKXVM`
- `add-tier-slash-command-01A3hVfr8DFRz1uLbQpdgeVW`

**Why:** Advanced features build on solid foundation

### Branches to Defer or Archive

**Experimental/Research (Evaluate Before Integrating):**
- `multi-agent-orchestration-01AL1weWGWAHRDFoUrZSDsJq` - May be exploratory
- `profit-signals-agent-skeleton-017ff2BVbKwt62zMV5FZnMHt` - May be proof-of-concept

**Product Verticals (Low Priority for Core Product):**
- All `slimecraft-*` branches (5 branches)
- `minecraft-status-widget-01MpkWShxB9ydAxDoApMYsvy`
- `minecraft-backup-restore-docs-01NAbs7JcjPBhyE7NNF8Ymxc`

**Duplicates (Choose One, Archive Others):**
- `typed-http-client-*` (2 versions) - Inspect both, choose latest/best
- `admin-cli-bootstrap*` (2 versions) - Choose v2 likely
- `discord-guild-sync-*` (2 versions) - Choose v2 likely
- `club-analytics-*` (3 versions) - Choose v2 or stability fix
- `exec-summary-*` (2 versions) - Choose latest

**Dependencies to Resolve:**
- Inspect `auth-rbac-implementation-012Meoy8C8cZoPrn2Xbh7VqU` - May already be implemented in main
- Inspect `setup-prisma-schema-01A5sARuhJRyUfG2KgJpjoy9` - May already exist in main

---

## RISKS & THINGS TO WATCH

### High-Risk Areas

#### 1. **Merge Conflicts - Expected to be Severe**
**Risk Level:** 🔴 CRITICAL

**Why:**
- 123 branches developed independently over time
- Core files likely modified in multiple branches:
  - `apps/web/lib/api-client.ts` (HTTP client changes)
  - `apps/admin-api/src/middleware/auth.js` (auth hardening)
  - `apps/admin-api/src/routes/*.js` (validation, error handling)
  - Type definitions and shared utilities
- No coordination between branches

**Mitigation:**
- **Small batches:** Integrate 2-4 related branches at a time
- **Test between batches:** Run full test suite after each batch
- **Dedicated merge agent:** Consider Agent 2/3 specializing in conflict resolution
- **Git strategy:** Use feature branch → staging → main workflow
- **Rollback plan:** Tag before each integration for quick rollback

#### 2. **TypeScript Migration in Admin API**
**Risk Level:** 🔴 CRITICAL

**Why:**
- Admin API is 95% JavaScript (CommonJS)
- `admin-api-type-safety-017d3UtBchDXZnC8gxC59neD` likely converts to TypeScript
- Breaking changes to imports, module resolution
- No build step currently - adding TypeScript requires build pipeline

**Mitigation:**
- Review branch thoroughly before integration
- Set up incremental TypeScript migration (allowJs, checkJs first)
- Add build step to package.json and Docker build
- Update all import paths
- Test extensively after migration

#### 3. **Database Schema Changes**
**Risk Level:** 🟠 HIGH

**Why:**
- Prisma schema may diverge across branches
- Migration conflicts could break database
- Production data at risk if migrations not careful

**Mitigation:**
- Audit all branches for Prisma schema changes
- Create consolidated migration plan
- Test migrations on dev database first
- Backup production database before any schema changes
- Use Prisma's migration diff tools

#### 4. **Duplicate/Conflicting Implementations**
**Risk Level:** 🟠 HIGH

**Why:**
- Multiple HTTP client implementations (2 branches)
- Multiple CLI bootstrappers (2 branches)
- Multiple club analytics versions (3 branches)
- Multiple guild sync implementations (2 branches)

**Mitigation:**
- **Inspect before integrating:** Check out both branches, compare implementations
- **Choose best implementation:** Prefer newer session ID, better code quality, more complete
- **Archive others:** Document why one was chosen over another

#### 5. **Breaking API Changes**
**Risk Level:** 🟠 HIGH

**Why:**
- API validation (`add-api-validation-*`) may break existing clients
- Error standardization may change response formats
- Type safety may enforce stricter contracts

**Mitigation:**
- Version APIs if breaking changes unavoidable
- Add deprecation warnings before removing old endpoints
- Update all client code (web, admin-ui) simultaneously
- Test cross-app integration

### Medium-Risk Areas

#### 6. **Test Coverage Gaps**
**Risk Level:** 🟡 MEDIUM

**Why:**
- Only 15 test files currently in apps/web
- Admin API has test files but coverage unknown
- Integrating 123 branches without tests is risky

**Mitigation:**
- Prioritize test infrastructure branches early (Phase 3)
- Require tests for critical path branches before integration
- Use E2E tests to catch integration issues

#### 7. **Environment Variable Sprawl**
**Risk Level:** 🟡 MEDIUM

**Why:**
- Each branch may introduce new env vars
- No centralized env var documentation (gap identified in docs scan)
- Risk of missing env vars in production

**Mitigation:**
- Integrate `env-secrets-checklist-01HXDvpPxurr847qzGviqETe` early
- Audit all branches for new env vars
- Update `.env.example` files
- Document in centralized ENVIRONMENT_VARIABLES.md

#### 8. **Docker Build Complexity**
**Risk Level:** 🟡 MEDIUM

**Why:**
- Docker overlay2 issues already occurred (resolved)
- Adding dependencies may trigger pnpm v10 build script blocks
- Multi-stage builds sensitive to layer cache invalidation

**Mitigation:**
- Test Docker builds locally before pushing
- Update `onlyBuiltDependencies` if new native modules added
- Monitor build times and cache hit rates

#### 9. **Shared Package Migration**
**Risk Level:** 🟡 MEDIUM

**Why:**
- All 5 shared packages are stubs
- Branches may assume shared packages exist
- Migration from vendor/slimy-core to packages/* will touch many files

**Mitigation:**
- Defer shared package population until critical branches integrated
- Use vendor/slimy-core workaround temporarily
- Plan shared package migration as separate Phase 9 effort

### Low-Risk Areas (Monitor but Not Blocking)

#### 10. **Documentation Consistency**
**Risk Level:** 🟢 LOW

**Why:**
- 23 documentation branches may have overlapping content
- Conflicting style/format

**Mitigation:**
- Documentation conflicts easier to resolve (non-code)
- Prioritize core docs (ADR, CONTRIBUTING.md) first
- Consolidate duplicates

#### 11. **Feature Flag System**
**Risk Level:** 🟢 LOW

**Why:**
- Multiple feature flag branches
- May conflict with existing experiments in web app

**Mitigation:**
- Review existing feature flag implementation in web
- Integrate if complements, skip if duplicates

#### 12. **Experimental Features**
**Risk Level:** 🟢 LOW

**Why:**
- Multi-agent orchestration and profit signals may be exploratory
- May not be production-ready

**Mitigation:**
- Review branches, extract learnings
- Archive if not production-ready

### Critical Success Factors

✅ **Automated Testing:** Must have comprehensive tests before mass integration
✅ **Staging Environment:** Need safe place to test integrations before production
✅ **Rollback Plan:** Git tags + Docker image tags for quick rollback
✅ **Communication:** Document what's being integrated and why
✅ **Incremental Approach:** Small batches, test frequently
✅ **Dedicated Time:** Don't rush - allocate time for thorough integration

### Red Flags to Abort Integration

🚫 **Test suite fails after integration** - Rollback immediately
🚫 **Production build fails** - Rollback immediately
🚫 **Database migration fails** - Do NOT apply to production
🚫 **Docker build fails** - Fix before proceeding
🚫 **Authentication breaks** - Security regression, rollback
🚫 **Performance degrades >20%** - Investigate before proceeding

### Recommended Pre-Integration Checklist

Before integrating ANY branch:

- [ ] Check out branch locally
- [ ] Review code changes (files changed, lines added/removed)
- [ ] Check for package.json changes (new dependencies?)
- [ ] Check for Prisma schema changes (migrations?)
- [ ] Check for new environment variables
- [ ] Check for breaking API changes
- [ ] Run tests locally
- [ ] Run build locally
- [ ] Check for conflicts with main branch
- [ ] Document what the branch does (for rollback reference)

### Integration Team Recommendations

**Minimum Team:** 2-3 people
**Roles:**
- **Agent 2 (Integrator):** Performs merges, resolves conflicts
- **Agent 3 (Tester):** Runs tests, validates functionality
- **Agent 4 (Reviewer - optional):** Code review, architectural oversight

**Workflow:**
1. Agent 1 (this scan) provides roadmap
2. Agent 2 integrates batch 1.1 (Docker reliability)
3. Agent 3 tests integration
4. If green, proceed to batch 1.2
5. If red, Agent 2 debugs/rollback, Agent 4 reviews

**Estimated Timeline:**
- Phase 1-2 (Foundation + Security): 2-3 weeks
- Phase 3 (Testing): 1 week
- Phase 4 (Monitoring): 1 week
- Phase 5 (Documentation): 1-2 weeks
- Phase 6-8 (Features): 3-4 weeks
- **Total:** 8-13 weeks for systematic integration

---

## APPENDIX

### Branch Count by Theme

| Theme | Count |
|-------|-------|
| Documentation | 23 |
| HTTP Client & API Infrastructure | 9 |
| Monitoring & Observability | 7 |
| Testing & Quality | 6 |
| Infrastructure & DevOps | 6 |
| Minecraft/SlimeCraft | 6 |
| Club Analytics | 5 |
| Database & Data Management | 5 |
| Discord Bot | 5 |
| Admin Panel & CLI | 5 |
| Admin API Security | 7 |
| Admin API Type Safety | 4 |
| Frontend UX | 4 |
| Configuration & Feature Flags | 4 |
| Snail Tools | 4 |
| Build & Dev Tools | 4 |
| Advanced Features | 8 |
| Dashboards & UI | 3 |
| Chat & Messaging | 2 |
| Experimental | 2 |
| Timezone | 1 |
| Minecraft Docs | 1 |
| **TOTAL** | **123** |

### Files Analyzed in This Scan

- Repository structure: 5 top-level directories
- Apps explored: 4 (web, admin-api, admin-ui, bot)
- Packages explored: 5 (all stubs)
- Documentation files read: 12
- Docker files analyzed: 4 (2 compose files, 2 Dockerfiles)
- Branch patterns matched: 123

### Tools & Commands Used

```bash
git fetch --all --prune
git branch -r | grep 'origin/claude/' | sort
# Parallel exploration agents for apps/web, apps/admin-api, packages/, infra/docker/, docs/
```

---

**END OF REPORT**

**Next Steps:**
- Agent 2: Begin Phase 1 integration (Docker reliability batch)
- Agent 3: Set up test environment for validation
- Agent 4: Review integration plan and provide architectural oversight

**Questions or Concerns:**
- Contact: Agent 1 (Scanner & Branch Cartographer)
- Report Generated: 2025-11-20
