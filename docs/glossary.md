# Slimy.ai Glossary

This document provides a comprehensive reference of all domain-specific terms, acronyms, and internal jargon used throughout the Slimy.ai platform. Use this glossary to maintain consistency across documentation, user interfaces, and code.

---

## Core Terms Reference

| Term | Definition | Where It's Used |
|------|-----------|-----------------|
| **Slimy.ai** | The overall platform brand providing tools and analytics for Super Snail game players via Discord integration | Web, Admin, Bot, Docs |
| **slime.craft** | Minecraft-related service or feature (legacy or planned integration) | Infrastructure (docker configs) |
| **Snail Tools** | Comprehensive toolkit for Super Snail players including screenshot analysis, stats tracking, codes aggregation, and tier calculator | Web (`/snail`), Admin API (`/api/snail/*`) |
| **Club Analytics** | AI-powered analytics system for Super Snail club management using GPT-4 Vision to extract metrics from screenshots | Web (`/club`), Admin API (`/api/club/*`) |
| **Codes Aggregator** | System that aggregates Super Snail secret/redemption codes from multiple sources (Snelp, Reddit) with deduplication and caching | Web (`/snail/codes`), API (`/api/codes`), Shared package (`packages/shared-codes`) |
| **Admin Panel** | Dashboard for Discord server administrators to manage bot settings, guild configuration, and monitor usage | Admin UI (port 3081), Admin API (port 3080) |
| **Guild** | A Discord server using the Slimy.ai bot (Guild ID = Discord server ID) | Admin API (`/api/guilds/*`), Web, Bot |
| **Personality** | Bot behavior configuration per guild with preset templates and custom settings | Admin API (`/api/:guildId/personality`) |
| **NUC1** | Development/staging infrastructure deployment node using MySQL database | Infrastructure (`infra/docker/docker-compose.slimy-nuc1.yml`) |
| **NUC2** | Production infrastructure deployment node using PostgreSQL database with Caddy reverse proxy | Infrastructure (`infra/docker/docker-compose.slimy-nuc2.yml`) |
| **Super Snail** | The mobile game that Slimy.ai provides tools for (also written as "SuperSnail") | Web, Admin, Docs |
| **Screenshot Analysis** | GPT-4 Vision API integration for analyzing game screenshots and extracting data/metrics | Snail Tools, Club Analytics (Web app) |
| **Stats Tracker** | System for tracking user progress over time in Super Snail with automatic logging to Google Sheets | Snail Tools, Admin API |
| **Tier Calculator** | Tool for calculating Super Snail upgrade costs based on SIM value and total value | Snail Tools (`POST /api/snail/:guildId/calc`) |
| **Corrections** | User-submitted corrections and feedback system with Google Sheets integration | Admin UI (CorrectionsManager), Admin API |
| **Rescan** | Feature to re-analyze previously uploaded screenshots with clearer/higher-resolution versions | Admin UI (RescanUploader), Web app |
| **Ask Manus Bar** | AI-powered chat assistant bar providing in-app help (feature flag controlled) | Web (`/snail`, `/club` pages) |
| **Manus** | Name of the AI assistant/bot persona | Web app chat features |
| **Snelp** | Third-party Super Snail codes API service (https://snelp.com/api/codes) | Codes Aggregator (primary source) |
| **RBAC** | Role-Based Access Control system with hierarchy: Owner > Admin > Editor > Viewer > Member > Club | Admin API (middleware), Web |
| **Redis Cache** | Caching layer for codes aggregation and API responses with stale-while-revalidate strategy | Web app, API responses |
| **Deduplication Engine** | System for removing duplicate codes from aggregated sources using normalization and merge strategies | Codes system (`apps/web/lib/codes/deduplication.ts`) |
| **Circuit Breaker** | Fault tolerance pattern for handling failing external services (Closed → Open → Half-Open states) | Codes aggregator, External API calls |
| **Fallback Mechanisms** | Multi-tier fallback strategy: cache fallback → partial response → emergency codes | Codes system during API failures |
| **Caddy** | HTTP reverse proxy handling TLS and routing for Slimy.ai services | NUC2 production deployment (port 443) |
| **Feature Flags** | Toggleable features for A/B testing and gradual rollout (e.g., `askManus` flag) | Admin panel (`/admin/flags`), Web |
| **MDX Docs** | Markdown + JSX documentation system with auto-import from GitHub | Web (`apps/web/content/docs/`) |
| **Admin API** | Express.js REST API serving authentication, guild management, and feature endpoints | Port 3080 (`apps/admin-api`) |
| **Admin UI** | Next.js 14 frontend dashboard for administrators | Port 3081 (`apps/admin-ui`) |
| **Web App** | Next.js 16 main application with App Router serving Snail Tools, Club Analytics, and docs | Port 3000 (`apps/web`) |
| **Bot Service** | Discord bot integration for guild automation (minimal implementation currently) | `apps/bot/` |
| **Google Sheets Integration** | Integration for exporting stats, corrections, and club analytics data | Snail Tools, Club Analytics, Admin API |
| **Health Checks** | Service health monitoring endpoints for diagnostics and Docker orchestration | All services (`/api/health`, `/api/diag`) |
| **Uploads** | Guild-specific file storage with auto-processing (JPEG, XL, thumbnails) in `/var/lib/slimy/uploads` | Admin API, Web (25MB max, 20 files per upload) |

---

## Role Hierarchy

Understanding the RBAC role hierarchy:

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Owner** | Full access to all features and settings | Account owner(s), configured in `config.roles.ownerIds` |
| **Admin** | Guild management capabilities | Discord users with "Manage Guild" permission |
| **Editor** | Can modify content and settings | Discord users with "Manage Channels" or "Manage Roles" |
| **Viewer** | Read-only access | Regular guild members |
| **Member** | Access to Snail Tools | Authenticated users in a guild |
| **Club** | Access to Club Analytics | Users with club role permission |

---

## Infrastructure Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **NUC1** | Development/staging environment with MySQL | `infra/docker/docker-compose.slimy-nuc1.yml` |
| **NUC2** | Production environment with PostgreSQL + Caddy | `infra/docker/docker-compose.slimy-nuc2.yml` |
| **Caddy** | Reverse proxy for HTTPS and routing | NUC2 deployment on port 443 |
| **Docker Compose** | Container orchestration for all services | Infrastructure directory |
| **Redis** | Caching layer for performance optimization | Web app codes system |
| **PostgreSQL** | Production database (NUC2) | Production deployment |
| **MySQL** | Development database (NUC1) | Development deployment |

---

## External Services & Integrations

| Service | Purpose | Integration Point |
|---------|---------|------------------|
| **Snelp** | Primary source for Super Snail codes | `https://snelp.com/api/codes` |
| **Reddit (r/SuperSnail_US)** | Community codes aggregation | JSON search API |
| **OpenAI GPT-4 Vision** | Screenshot analysis and data extraction | Snail Tools, Club Analytics |
| **Google Sheets API** | Data export and persistence | Stats tracking, corrections |
| **Discord OAuth2** | Authentication and guild management | Admin panel login |

---

## Shared Packages

| Package | Purpose | Status |
|---------|---------|--------|
| `shared-codes` | Utilities for Codes Aggregator | Scaffolding |
| `shared-snail` | Utilities for Snail Tools | Scaffolding |
| `shared-db` | Database utilities | Infrastructure |
| `shared-auth` | Authentication utilities | Infrastructure |
| `shared-config` | Central configuration | Scaffolding |

---

## Writing Style Guide

### Capitalization Rules

**Product & Brand Names:**
- ✅ **Slimy.ai** (with lowercase "ai")
- ✅ **Super Snail** (both words capitalized)
- ✅ **Snail Tools** (both words capitalized)
- ✅ **Club Analytics** (both words capitalized)
- ✅ **Admin Panel** (both words capitalized)
- ✅ **Ask Manus Bar** (all words capitalized)
- ❌ Avoid: "Slimy.AI", "slimy.ai" (in titles), "super snail", "snail tools"

**Technical Terms:**
- ✅ **RBAC** (all caps - acronym)
- ✅ **NUC1** / **NUC2** (all caps)
- ✅ **Redis**, **Caddy**, **PostgreSQL** (proper technical capitalization)
- ✅ **GPT-4 Vision** (as per OpenAI branding)
- ✅ **MDX** (all caps)

**Feature Names:**
- ✅ **Codes Aggregator** (title case)
- ✅ **Screenshot Analysis** (title case)
- ✅ **Stats Tracker** (title case)
- ✅ **Tier Calculator** (title case)

### Terminology Guidelines

**Use Consistently:**
- ✅ "guild" (not "server" when referring to Discord servers in technical contexts)
- ✅ "admin panel" (not "dashboard" or "admin console")
- ✅ "screenshot analysis" (not "image processing" or "vision analysis")
- ✅ "codes aggregator" (not "code scraper" or "code collector")
- ✅ "personality" (not "persona" or "bot config")
- ✅ "corrections" (not "feedback" or "user input")
- ✅ "uploads" (not "files" when referring to user-uploaded content)

**Avoid Internal Jargon in User-Facing Content:**
- ❌ Avoid: "NUC1/NUC2" in user docs (internal infrastructure terms)
- ❌ Avoid: "RBAC middleware" (say "permission system" instead)
- ❌ Avoid: "circuit breaker pattern" (say "automatic error recovery" instead)
- ❌ Avoid: "deduplication engine" (say "duplicate removal" instead)
- ❌ Avoid: Raw API endpoint paths like `/api/snail/:guildId` (describe functionality instead)

**User-Facing vs. Internal Names:**
| User-Facing (Docs, UI) | Internal (Code, Comments) | Notes |
|------------------------|---------------------------|-------|
| Snail Tools | snail routes, snail API | Keep user-facing simple |
| Club Analytics | club routes, club service | Avoid "analytics system" |
| Admin Panel | admin-api, admin-ui | Separate apps internally |
| Screenshot Analysis | GPT-4 Vision integration | User doesn't need API details |
| Codes | codes aggregator, deduplication | Internal details hidden |
| Settings | personality, guild config | "Personality" is internal |

### Tone & Voice

**For Documentation:**
- Use active voice and present tense
- Be concise and direct
- Include examples where helpful
- Write for both technical and non-technical audiences

**For User Interfaces:**
- Use friendly, helpful language
- Avoid technical jargon
- Provide clear calls-to-action
- Use sentence case for buttons and labels

**For API Documentation:**
- Be precise and technical
- Include all parameters and types
- Provide example requests/responses
- Document error cases

### Acronyms & Abbreviations

**When to Define:**
- First use in a document: "Role-Based Access Control (RBAC)"
- User-facing documentation: Always define on first use
- Internal documentation: Define if not widely known
- Code comments: Use full term or common acronym

**Common Acronyms:**
- **RBAC**: Role-Based Access Control
- **API**: Application Programming Interface
- **UI**: User Interface
- **NUC**: Next Unit of Computing (Intel NUC - internal only)
- **MDX**: Markdown + JSX
- **GPT**: Generative Pre-trained Transformer

### Examples of Good Usage

**Documentation:**
```markdown
# Snail Tools

Snail Tools helps you analyze Super Snail screenshots using AI-powered analysis.
Upload up to 8 screenshots to extract stats, track progress, and calculate upgrade costs.
```

**User Interface:**
```
Button: "Analyze Screenshots"
Help text: "Upload Super Snail screenshots to automatically extract your stats"
Error: "Screenshot analysis failed. Please try uploading a clearer image."
```

**Code Comments:**
```javascript
// Fetch codes from Snelp API with circuit breaker fallback
// Guild personality preset (user-facing: "Bot Settings")
// RBAC check: requires Admin or Owner role
```

---

## Questions or Updates?

This glossary is a living document. If you encounter new terms or need clarification:
1. Check existing code and documentation for usage patterns
2. Follow the writing style guidelines above
3. Update this glossary when introducing new domain terms
4. Ensure consistency across all user-facing materials

**Last Updated:** 2025-11-19
