# Web App Backend Integration Plan

**Status:** Planning Phase
**Created:** 2025-11-20
**Target Completion:** 4-5 weeks
**Team:** Full-stack team (backend + frontend)

---

## Executive Summary

This document provides a concrete, ordered checklist of implementation steps to fully integrate the web app with the admin-api backend. The current integration is ~52% complete. This plan takes it to 80%+ completion and identifies remaining architectural decisions.

**Key Metrics:**
- Current: 15-16 fully wired features (~30%)
- After Phase 1: +11 features (~40%)
- After Phase 2: +11 features (~80%)
- After Phase 3: 50+ features (~100%)

---

## Phase 1: Route Registration Fix (1-2 Days)

**Goal:** Mount missing admin-api routes so web app doesn't get 404 errors

### 1.1 Audit Current Routes

**Task:** Review `/src/routes/index.js` in admin-api

```bash
# Check what routes are actually mounted
cd apps/admin-api/src/routes
ls -la *.js  # List all route files
cat index.js  # See what's registered
```

**Expected Finding:** ~40+ route files but only ~15 mounted

**Deliverable:** List of unmounted route files

### 1.2 Mount Webhook Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js (but webhooks.js exists)

**Action:**
```javascript
// Add to index.js in appropriate section
app.use('/api/webhooks', require('./webhooks'));
```

**Test Commands:**
```bash
# After mounting
curl http://localhost:3080/api/webhooks?guildId=test

# From web app
# Try /guilds/[id]/webhooks page - should load webhook list instead of 404
```

**Validation:**
- [ ] Route mounts without errors
- [ ] Returns webhook list or appropriate error
- [ ] Web app `/guilds/[id]/webhooks` page works

**Web Feature Unblocked:** Webhook management (5 endpoints)

---

### 1.3 Mount Agents Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/agents', require('./agents'));
```

**Test:**
```bash
curl http://localhost:3080/api/agents
```

**Validation:**
- [ ] /api/agents endpoint responds
- [ ] Web `/agents` page loads
- [ ] Can create/list agents

**Web Features Unblocked:** Agents, Agent details

---

### 1.4 Mount Task Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/tasks', require('./tasks'));
```

**Test:**
```bash
curl http://localhost:3080/api/tasks
```

**Validation:**
- [ ] /api/tasks endpoint responds
- [ ] Web `/agents/tasks/[id]` page loads
- [ ] Task management works

**Web Features Unblocked:** Task management

---

### 1.5 Mount Notifications Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/notifications', require('./notifications'));
```

**Test:**
```bash
curl http://localhost:3080/api/notifications
```

**Validation:**
- [ ] /api/notifications endpoint responds
- [ ] Web `/notifications` page loads

**Web Features Unblocked:** Notifications

---

### 1.6 Mount Club Analytics Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js (but club-analytics.js exists)

**Action:**
```javascript
// Check if it's already mounted under /api/clubs or needs separate mounting
app.use('/api/club-analytics', require('./club-analytics'));
// OR
app.use('/api/clubs', require('./club-analytics')); // If that's the expected path
```

**Test:**
```bash
curl http://localhost:3080/api/club-analytics  # or /api/clubs
```

**Validation:**
- [ ] Club analytics endpoint responds
- [ ] Returns existing club analysis data
- [ ] Web can fetch club data if it uses this route

**Decision Needed:** Is club analytics using this endpoint? (Currently likely web-only)

---

### 1.7 Mount Screenshot Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/screenshot', require('./screenshot'));
```

**Test:**
```bash
curl http://localhost:3080/api/screenshot
```

**Validation:**
- [ ] /api/screenshot endpoint responds
- [ ] Doesn't conflict with web's screenshot upload (Vercel Blob)

**Decision Needed:** Should web use admin-api for screenshots or keep Vercel Blob?

---

### 1.8 Mount Profile Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/profile', require('./profile'));
```

**Test:**
```bash
curl http://localhost:3080/api/profile
```

**Validation:**
- [ ] /api/profile endpoint responds
- [ ] Returns user profile data
- [ ] Doesn't duplicate /api/auth/me

---

### 1.9 Mount Seasons Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/seasons', require('./seasons'));
```

**Test:**
```bash
curl http://localhost:3080/api/seasons
```

**Validation:**
- [ ] /api/seasons endpoint responds
- [ ] Web `/club/seasons` page can fetch data

---

### 1.10 Mount Slimecraft Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/slimecraft', require('./slimecraft-updates'));
```

**Test:**
```bash
curl http://localhost:3080/api/slimecraft
```

**Validation:**
- [ ] /api/slimecraft endpoint responds
- [ ] Web `/slime.craft` pages can fetch updates

---

### 1.11 Mount Saved Prompts Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/saved-prompts', require('./savedPrompts'));
```

**Test:**
```bash
curl http://localhost:3080/api/saved-prompts
```

**Validation:**
- [ ] /api/saved-prompts endpoint responds
- [ ] Web can fetch/create saved prompts

---

### 1.12 Mount Export Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/export', require('./export'));
```

**Test:**
```bash
curl http://localhost:3080/api/export
```

**Validation:**
- [ ] /api/export endpoint responds
- [ ] Supports guild, user exports

---

### 1.13 Mount Audit Log Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ❌ Not in index.js

**Action:**
```javascript
app.use('/api/audit-logs', require('./auditLog'));
```

**Test:**
```bash
curl http://localhost:3080/api/audit-logs
```

**Validation:**
- [ ] /api/audit-logs endpoint responds
- [ ] Returns audit events

**Note:** Web has its own AuditLog model - may need consolidation later

---

### 1.14 Mount Guild Channels Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ⚠️ May already be mounted (check)

**Action:**
```javascript
// Verify it's mounted - if not:
app.use('/api/guild-channels', require('./guild-channels'));
// OR it might be under:
app.use('/api/guilds/:guildId/channels', require('./guild-channels'));
```

**Test:**
```bash
curl http://localhost:3080/api/guild-channels
```

**Validation:**
- [ ] Guild channels endpoint responds
- [ ] Web can fetch/update channel configs

---

### 1.15 Mount Guild Config Routes

**File:** `apps/admin-api/src/routes/index.js`

**Current Status:** ⚠️ May already be mounted (check)

**Action:**
```javascript
// Verify it's mounted - if not:
app.use('/api/guild-config', require('./guild-config'));
```

**Test:**
```bash
curl http://localhost:3080/api/guild-config
```

**Validation:**
- [ ] Guild config endpoint responds

---

### Phase 1 Completion Checklist

**Deliverables:**
- [ ] All route files reviewed and inventory created
- [ ] Each route mounted in index.js
- [ ] Each route tested individually
- [ ] All 404 errors eliminated
- [ ] docs/FEATURE_PORT_STATUS.md updated with "Route Status" column

**Success Criteria:**
- Web app makes no calls to non-existent routes
- ~11 additional features move from "Partially Wired" to "Fully Wired"
- Integration score improves from ~52% to ~68%

**Time Estimate:** 1-2 days

---

## Phase 2: Critical Schema Consolidation (2-3 Days) - Decisions Made ✅

**Goal:** Consolidate duplicate models per approved architectural decisions

**Status:** Architectural decisions approved (2025-11-20)
**Approved By:** User input
**Implementation Ready:** Yes

### 2.1 Create Schema Consolidation Decision Document

**File:** Create `docs/SCHEMA_CONSOLIDATION_PLAN.md`

**Content:** For EACH duplicate model, document:

```markdown
## Model: ClubAnalysis

**Currently In:**
- Web app: apps/web/prisma/schema.prisma (basic model, no FK relations)
- Admin-api: apps/admin-api/prisma/schema.prisma (with FK relations)

**Schema Differences:**
- Web version: guildId, userId (strings), no relations
- Admin version: guildId, userId (with FK relations), guild/user relations

**Decision:** Use admin-api as source of truth
- [x] Admin-api has proper FK relations
- [x] Admin-api has audit trail support
- [ ] Plan: Migrate web's ClubAnalysis data to admin-api

**Migration Impact:**
- Web loses local club analytics storage
- Web calls admin-api for all club queries
- Requires data export/import script

**Status:** TBD
```

**Duplicate Models to Document:**
- [ ] ClubAnalysis (high impact)
- [ ] ClubAnalysisImage (high impact)
- [ ] ClubMetric (high impact)
- [ ] ChatMessage (high impact - two different purposes)
- [ ] AuditLog (medium impact - different fields)
- [ ] Session/UserSession (medium impact)

**Deliverable:** Decision document with consolidation strategy for each

---

### 2.2 Club Analytics - Decision ✅ **APPROVED: Consolidate to Admin-API**

**Decision:** Admin-API is the canonical source of truth for club analytics

**Rationale:**
- Single source of truth reduces data inconsistency
- Admin-api has proper foreign key relations
- Supports guild/user context for multi-tenant access
- Scalable for future admin dashboard features
- Long-term maintainability

**Implementation Plan:**

```
Phase 2.2.1: Data Migration (1 day)
├─ Export ClubAnalysis, ClubAnalysisImage, ClubMetric from web database
├─ Transform data to match admin-api schema
└─ Import into admin-api database

Phase 2.2.2: Web Integration (1.5 days)
├─ Update web app API calls to use admin-api endpoints
├─ Remove ClubAnalysis, ClubAnalysisImage, ClubMetric from web Prisma
├─ Update all `/club` pages to call `/api/club-analytics`
└─ Test all club features end-to-end

Phase 2.2.3: Cleanup (0.5 days)
├─ Remove duplicated models from web schema
├─ Update Prisma migrations
└─ Document schema consolidation

Total Time: 3 days
```

**Specific Tasks:**
1. [ ] Create migration script (export from web db)
2. [ ] Test data integrity during migration
3. [ ] Update `/club/analytics` page to call admin-api
4. [ ] Update `/club/screenshot-upload` to use admin-api
5. [ ] Update `/club/seasons` to use admin-api
6. [ ] Remove web Prisma models (ClubAnalysis, ClubMetric, ClubAnalysisImage)
7. [ ] Run end-to-end tests

**Blocked Features (Will Unblock):**
- Club Analytics Dashboard (currently isolated)
- Club Admin View (currently web-only)
- Cross-guild analytics (impossible with separate DBs)

---

### 2.2b Database Architecture - Decision ✅ **APPROVED: Single Canonical Database**

**Decision:** Use one PostgreSQL instance and one primary logical database per environment

**Rationale:**
- Eliminates data duplication and sync issues
- Single source of truth for all features
- Easier multi-tenancy support (guild/user relationships)
- Simplified backup and disaster recovery
- Consistent schema versioning with Prisma migrations

**Architecture:**
```
Environment: Development
├─ Database Name: slimy_dev
├─ Primary: Used by both apps (web + admin-api)
├─ Schemas: public (shared Prisma models)
├─ Connection: Both apps use DATABASE_URL pointing to this DB
└─ Migrations: Single Prisma migration history

Environment: Staging
├─ Database Name: slimy_staging
└─ Same structure as dev

Environment: Production
├─ Database Name: slimy_prod
├─ Replicated: Read replicas for analytics
└─ Backups: Automated daily snapshots
```

**Implementation Plan (1 day):**

```
Phase 2.2a.1: Database Consolidation (0.5 days)
├─ Verify both apps pointing to same DATABASE_URL
├─ Verify schema compatibility
├─ Backup existing databases
└─ Migrate duplicate models to shared location

Phase 2.2a.2: Prisma Migration (0.5 days)
├─ Remove model duplication from web schema
├─ Keep admin-api as canonical schema source
├─ Run migrations to consolidate schemas
└─ Verify data integrity

Total Time: 1 day (mostly validation, migrations already prepared)
```

**Specific Tasks:**
1. [ ] Verify current DATABASE_URL in both apps
2. [ ] Confirm both apps can connect to same database
3. [ ] Review and consolidate Prisma schemas
4. [ ] Create final migration combining all models
5. [ ] Test data consistency across both apps
6. [ ] Update documentation with new database layout

**Benefits Achieved:**
- ✅ Single source of truth for all data
- ✅ Eliminates duplicate models
- ✅ Enables proper foreign key relationships
- ✅ Supports multi-tenancy features

---

### 2.3 Chat Systems - Decision ✅ **APPROVED: Clarified Separation**

**Decision:** Keep two separate chat systems by design, rename to avoid confusion

**Rationale:**
- Admin-api chat: Guild communication (Discord-style)
- Web chat: AI conversation (OpenAI)
- Fundamentally different purposes, not meant to be unified
- Each can evolve independently without cross-impact
- Clearer naming removes confusion

**Architectural Distinction:**
```
Admin-API Chat (Guild Communication):
├─ Purpose: Guild member conversations
├─ Context: Guild + User + Channel
├─ Messages: Text-based guild communications
├─ Storage: Prisma (admin-api)
└─ API: /api/chat (future: /api/guilds/:guildId/chat)

Web Chat (AI Conversation):
├─ Purpose: User interactions with AI
├─ Context: User only
├─ Messages: User/Assistant/System roles
├─ Storage: Prisma (web app)
└─ API: /api/chat (internal, not wired to admin-api)
```

**Implementation Plan (1-2 days):**

```
Phase 2.3.1: Model Renaming (0.5 days)
├─ Admin-api: Rename Conversation → GuildConversation
├─ Admin-api: Rename ChatMessage → GuildChatMessage
├─ Web: Rename ChatConversation → AiChatConversation
└─ Web: Rename ChatMessage (implicit) with clear comments

Phase 2.3.2: Code Updates (0.5 days)
├─ Update all imports in admin-api code
├─ Update all imports in web code
├─ Update test files
└─ Update type definitions

Phase 2.3.3: Documentation (0.5 days)
├─ Add schema comments explaining purpose
├─ Document in architecture docs
├─ Update API documentation
└─ Add decision record to ADR

Total Time: 1-2 days (low-risk, mostly renaming)
```

**Specific Tasks:**
1. [ ] Create database migration for admin-api schema rename
2. [ ] Create database migration for web app schema updates
3. [ ] Update admin-api code references (conversations, chat messages)
4. [ ] Update web app code references
5. [ ] Update test files
6. [ ] Add schema documentation comments
7. [ ] Document decision in ADR (Architecture Decision Record)

**Note:** Chat renaming is low-risk and doesn't require data migration since schemas differ in structure.

---

### 2.4 Session Management - Decision & Planning

**Decision Point:** Consolidate to single session system?

**Current State:**
```
Admin-API:
- In-memory session-store (not in Prisma yet)
- Cookie-based
- 12-hour TTL

Web:
- UserSession model in Prisma
- Separate from admin-api
```

**Recommendation: Consolidate to Admin-API Prisma**

```
Action Plan:
1. Verify admin-api's Prisma Session model is complete
   - Check: apps/admin-api/prisma/schema.prisma (Session model)
   - Expected fields: id, userId, token, expiresAt, createdAt

2. Migrate admin-api from in-memory to Prisma Session
   - Update session-store.js to use Prisma
   - Run database migrations

3. Remove web's UserSession model
   - Delete from apps/web/prisma/schema.prisma
   - Remove session management code from web

4. Both apps share admin-api's session system
   - Admin-api creates session (Prisma)
   - Web reads session via /api/auth/me
   - Both validate against same Prisma table

Time: 2-3 days
```

**Action:** Approve and schedule (coordinate with admin-api team)

---

### 2.5 Feature Flags - Decision & Planning

**Current State:**
- Web has GuildFeatureFlags model (local only)
- Admin-api has no feature flag system
- Flags can't be controlled from admin panel

**Recommendation: Move to Admin-API**

```
Action Plan:
1. Add GuildFeatureFlags model to admin-api Prisma
   - Add relation to Guild
   - Fields: guildId, flagName, enabled, createdAt, updatedAt

2. Create admin-api endpoints
   - GET /api/guilds/:guildId/flags - list flags
   - PUT /api/guilds/:guildId/flags/:name - toggle flag
   - DELETE /api/guilds/:guildId/flags/:name - remove flag

3. Update web to call admin-api
   - GET /api/guilds/:guildId/flags (fetch from admin-api)
   - PUT /api/guilds/:guildId/flags/:name (update on admin-api)

4. Create admin UI for feature flags
   - Add to guild settings page
   - Toggle controls for each flag

Time: 2-3 days
```

**Action:** Approve and schedule

---

### Phase 2 Completion Checklist ✅ **ALL DECISIONS APPROVED**

**Deliverables (All Completed):**
- ✅ All architectural decisions made and documented
- ✅ ClubAnalysis: APPROVED - Consolidate to Admin-API (3 days work)
- ✅ Chat Systems: APPROVED - Clarified separation (1-2 days work)
- ✅ Database: APPROVED - Single canonical PostgreSQL (1 day work)
- ✅ Migration impact assessment complete for each

**Phase 2 Implementation Timeline:**

```
Week 1:
├─ Day 1: Database consolidation & Prisma schema alignment (1 day)
├─ Day 2-3: Club analytics data migration & API wiring (3 days)
├─ Day 4-5: Chat system renaming & documentation (1-2 days)
└─ Total: ~5 days (end of Week 1)

Week 2 (Optional):
├─ Session management consolidation (2-3 days)
└─ Feature flags integration (2-3 days)
```

**Success Criteria:**
- ✅ Clear roadmap for data consolidation (established)
- ✅ No ambiguity about duplicate models (decisions made)
- ✅ Team aligned on direction (user approved)
- ✅ Implementation ready to begin

**Status:** READY FOR PHASE 2 IMPLEMENTATION

---

## Phase 3: Feature-by-Feature Integration (1-2 Weeks)

**Goal:** Wire isolated features to admin-api, migrate data where needed

### Priority 1: Critical Business Features

#### 3.1 Club Analytics Integration

**Current State:** ❌ Completely isolated (web-only)

**Steps:**

1. **Verify Admin-API Club Model Completeness**
   ```bash
   # Check admin-api Prisma schema
   grep -A 20 "model ClubAnalysis" apps/admin-api/prisma/schema.prisma
   grep -A 5 "model ClubAnalysisImage" apps/admin-api/prisma/schema.prisma
   grep -A 5 "model ClubMetric" apps/admin-api/prisma/schema.prisma
   ```

   **Expected Fields:**
   - ClubAnalysis: id, guildId, userId, title, summary, confidence, createdAt, updatedAt
   - ClubAnalysisImage: id, analysisId, imageUrl, originalName, fileSize, uploadedAt
   - ClubMetric: id, analysisId, name, value, unit, category

2. **Create Data Export Script**
   ```bash
   # Script location: apps/admin-api/scripts/migrate-club-analytics.ts
   # Reads from web's Prisma, transforms to admin-api schema

   Steps:
   1. Connect to web database (if separate)
   2. Export ClubAnalysis records
   3. Export ClubAnalysisImage records
   4. Export ClubMetric records
   5. Transform IDs if needed
   6. Import into admin-api database
   7. Validate row counts match
   ```

   **Test Command:**
   ```bash
   pnpm --filter @slimy/admin-api run migrate:club-analytics --dry-run
   ```

3. **Update Web to Call Admin-API**

   **File:** `apps/web/lib/api-client.ts` (or create new admin-api client)

   **Old Code (web-local):**
   ```typescript
   // GET /api/club/analyze - queries web's Prisma
   export async function getClubAnalysis(guildId: string) {
     return prisma.clubAnalysis.findMany({ where: { guildId } });
   }
   ```

   **New Code (admin-api):**
   ```typescript
   // GET /api/club-analytics?guildId=X - calls admin-api
   export async function getClubAnalysis(guildId: string) {
     const response = await adminApiClient.get(`/club-analytics?guildId=${guildId}`);
     return response.data.analyses;
   }
   ```

4. **Update Web Components**
   - Update all `/club` pages to call admin-api endpoints
   - Verify component data shapes match
   - Test all club features end-to-end

5. **Remove Web's Club Models** (after verification)
   ```bash
   # Remove from apps/web/prisma/schema.prisma:
   # - ClubAnalysis
   # - ClubAnalysisImage
   # - ClubMetric

   # Run: pnpm --filter @slimy/web prisma:generate
   ```

**Validation Checklist:**
- [ ] Admin-api club endpoints working
- [ ] Web calls admin-api for club data
- [ ] Data exported and imported successfully
- [ ] Web `/club/analytics` page displays data correctly
- [ ] Can upload and analyze screenshots
- [ ] Export to Google Sheets works
- [ ] All club features tested

**Time Estimate:** 2-3 days

---

#### 3.2 Move Feature Flags to Admin-API

**Current State:** ❌ Web-only (GuildFeatureFlags)

**Steps:**

1. **Add to Admin-API Prisma Schema**
   ```prisma
   model GuildFeatureFlag {
     id        String   @id @default(cuid())
     guildId   String   @map("guild_id")
     flagName  String   @map("flag_name")
     enabled   Boolean  @default(false)
     createdAt DateTime @default(now()) @map("created_at")
     updatedAt DateTime @updatedAt @map("updated_at")

     guild Guild @relation(fields: [guildId], references: [id], onDelete: Cascade)

     @@unique([guildId, flagName])
     @@map("guild_feature_flags")
   }
   ```

2. **Create Admin-API Routes**
   ```typescript
   // apps/admin-api/src/routes/guild-feature-flags.ts

   // GET /api/guilds/:guildId/flags - list all flags
   // PUT /api/guilds/:guildId/flags/:flagName - set flag
   // DELETE /api/guilds/:guildId/flags/:flagName - remove flag
   ```

3. **Update Web to Call Admin-API**
   - Replace local Prisma queries with admin-api calls
   - Remove GuildFeatureFlags from web's Prisma

4. **Update Admin UI**
   - Add feature flag controls to guild settings
   - Display current state
   - Allow toggle

**Validation Checklist:**
- [ ] Admin-api routes working
- [ ] Web calls admin-api for flags
- [ ] Can toggle flags from admin UI
- [ ] Flags affect feature behavior correctly

**Time Estimate:** 1-2 days

---

#### 3.3 Consolidate Sessions (Admin-API Only)

**Current State:** ⚠️ In-memory on admin-api, separate UserSession in web

**Steps:**

1. **Update Admin-API to Use Prisma Session**

   **File:** `apps/admin-api/lib/session-store.js`

   ```javascript
   // OLD: In-memory Map
   const sessions = new Map();

   // NEW: Prisma database
   const prisma = require('../src/lib/database').getClient();

   async function storeSession(userId, sessionData) {
     await prisma.session.create({
       data: {
         userId,
         token: sessionData.token,
         expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
       },
     });
   }
   ```

2. **Run Migration**
   ```bash
   pnpm --filter @slimy/admin-api db:migrate
   ```

3. **Test Admin-API Sessions**
   - Login, verify session created in Prisma
   - Check session expiry
   - Verify logout clears session

4. **Remove Web's UserSession Model**
   ```bash
   # Remove from apps/web/prisma/schema.prisma
   # Run: pnpm --filter @slimy/web prisma:generate
   ```

**Validation Checklist:**
- [ ] Admin-api sessions stored in Prisma
- [ ] Sessions have correct TTL
- [ ] Logout deletes session
- [ ] Web doesn't need separate session management

**Time Estimate:** 1 day

---

### Priority 2: High-Value Features

#### 3.4 Wire Notifications

**Current State:** ❌ Route exists, not mounted

**Steps:**
1. Mount `/api/notifications` in admin-api index.js
2. Test endpoint
3. Update web to call admin-api (if not already)
4. Verify notification center displays data

**Time Estimate:** 1 day

---

#### 3.5 Wire Agents & Tasks

**Current State:** ❌ Routes exist, not mounted

**Steps:**
1. Mount `/api/agents` and `/api/tasks` in admin-api index.js
2. Test endpoints
3. Verify web pages load agent/task data
4. Test create/update/delete operations

**Time Estimate:** 1 day

---

#### 3.6 Wire Seasons

**Current State:** ❌ Route exists, not mounted

**Steps:**
1. Mount `/api/seasons` in admin-api index.js
2. Test endpoint
3. Update web to call admin-api if needed
4. Verify season data loads

**Time Estimate:** 1 day

---

#### 3.7 Wire Saved Prompts

**Current State:** ❌ Route exists, not mounted

**Steps:**
1. Mount `/api/saved-prompts` in admin-api index.js
2. Test endpoint
3. Update web to call admin-api if needed
4. Verify can save/load prompts

**Time Estimate:** 1 day

---

### Priority 3: Additional Features

#### 3.8 Wire Exports

**Current State:** ❌ Route exists, not mounted (currently web-only)

**Steps:**
1. Mount `/api/export` in admin-api index.js
2. Determine if web should use admin-api or keep local
3. If use admin-api: update web calls
4. Test exports work end-to-end

**Time Estimate:** 1 day

---

#### 3.9 Wire Slimecraft Updates

**Current State:** ❌ Route exists, not mounted

**Steps:**
1. Mount `/api/slimecraft` in admin-api index.js
2. Test endpoint
3. Update web pages to call admin-api
4. Verify updates display

**Time Estimate:** 1 day

---

#### 3.10 Clarify Screenshot Integration

**Current State:** ⚠️ Web uses Vercel Blob, admin-api has separate screenshot route

**Decision Point:** Should web use admin-api for screenshots?

**Option A: Keep Separate** (Current)
- Web: Vercel Blob (fast, scalable)
- Admin-api: Self-hosted or other storage

**Option B: Consolidate to Admin-API**
- All screenshots go through admin-api
- Admin-api manages storage
- Unified API

**Action:** Document decision and implement

**Time Estimate:** 1-2 days

---

#### 3.11 Consolidate Audit Logs

**Current State:** ⚠️ Different schemas in web and admin-api

**Decision Point:** Use admin-api AuditLog only?

**Steps:**
1. Compare schemas
2. Decide if consolidation needed
3. If consolidate: migrate web data to admin-api
4. Update web to call admin-api for audit queries

**Time Estimate:** 1 day

---

### Phase 3 Completion Checklist

**Priority 1 (Critical):**
- [ ] Club Analytics integrated (admin-api source of truth)
- [ ] Feature Flags moved to admin-api
- [ ] Sessions consolidated to admin-api Prisma
- [ ] Data migrations completed successfully

**Priority 2 (High-Value):**
- [ ] Notifications wired
- [ ] Agents/Tasks wired
- [ ] Seasons wired
- [ ] Saved Prompts wired

**Priority 3 (Additional):**
- [ ] Exports wired
- [ ] Slimecraft wired
- [ ] Screenshots decision made and implemented
- [ ] Audit Logs consolidated

**Integration Score After Phase 3:**
- Should reach 80%+ "Fully Wired"
- Only remaining isolations are intentional (e.g., web-local preferences)

**Time Estimate:** 1-2 weeks

---

## Phase 4: Testing & Documentation (3-5 Days)

### 4.1 Integration Test Suite

**Create:** `apps/web/tests/integration/` with tests for each integrated feature

**Example Test:**
```typescript
// tests/integration/club-analytics.test.tsx
describe('Club Analytics Integration', () => {
  it('should fetch club analytics from admin-api', async () => {
    const guildId = 'test-guild-123';
    const analyses = await getClubAnalysis(guildId);

    expect(analyses).toBeDefined();
    expect(analyses[0]).toHaveProperty('guildId', guildId);
    expect(analyses[0]).toHaveProperty('summary');
  });

  it('should display analytics on club page', async () => {
    render(<ClubAnalyticsPage guildId="test-guild" />);

    await waitFor(() => {
      expect(screen.getByText(/Club Analytics/i)).toBeInTheDocument();
    });
  });
});
```

**Coverage:**
- [ ] Club Analytics (fetch, display, upload, export)
- [ ] Feature Flags (fetch, toggle)
- [ ] Agents/Tasks (list, create, detail)
- [ ] Notifications (fetch, mark read)
- [ ] Seasons (list, current)
- [ ] Saved Prompts (fetch, create, delete)
- [ ] Auth (login, logout, session)
- [ ] Guild Management (settings, personality, channels)

**Command:**
```bash
pnpm --filter @slimy/web test:integration
```

---

### 4.2 End-to-End Test Suite

**Create:** E2E tests for critical user flows (Playwright or Cypress)

**Flows to Test:**
1. User login with Discord OAuth
2. Navigate to guild settings, update configuration
3. Upload and analyze club screenshot
4. View club analytics dashboard
5. Manage webhooks
6. Create and assign tasks
7. Create saved prompt
8. Toggle feature flag

---

### 4.3 Update FEATURE_PORT_STATUS.md

**Task:** Update overall status table

**Expected Changes:**
```
Before Phase 1: ~52% (15-16 fully wired)
After Phase 1: ~68% (26 fully wired)
After Phase 2: ~75% (37 fully wired)
After Phase 3: ~85%+ (40+ fully wired)
```

---

### 4.4 Create Architecture Documentation

**File:** `docs/ARCHITECTURE.md`

**Sections:**
- Data ownership (which app owns which models)
- API gateway patterns (if applicable)
- Database schema consolidation (what was done, what's remaining)
- Feature flag system (how it works)
- Session management (unified system)

---

### 4.5 Create Migration Guides

**Files:**
- `docs/MIGRATION_GUIDE_CLUB_ANALYTICS.md` - How club data was migrated
- `docs/MIGRATION_GUIDE_FEATURE_FLAGS.md` - How flags were moved
- `docs/SCHEMA_CONSOLIDATION_RESULTS.md` - What was consolidated and why

---

### Phase 4 Completion Checklist

**Deliverables:**
- [ ] Integration test suite (50+ tests)
- [ ] E2E test suite (10+ flows)
- [ ] FEATURE_PORT_STATUS.md updated to final state
- [ ] Architecture documentation completed
- [ ] Migration guides written
- [ ] Team trained on new architecture

**Success Criteria:**
- All tests pass
- Integration score at 80%+
- Zero bugs in wired features
- Documentation is complete and accurate

**Time Estimate:** 3-5 days

---

## Success Metrics & Acceptance Criteria

### Quantitative

| Metric | Baseline | Target | Success? |
|--------|----------|--------|----------|
| Fully Wired Features | 15-16 (30%) | 40+ (80%+) | ✓ |
| Integration Routes | ~15 mounted | 40+ mounted | ✓ |
| Duplicate Models | 5 models | 0-2 (consolidated or separated) | ✓ |
| Web-Local Endpoints | 15+ | <5 (intentional only) | ✓ |
| 404 Errors in Web | High | Zero | ✓ |
| Test Coverage | <50% | >80% | ✓ |

### Qualitative

- ✓ All expected features working as designed
- ✓ No 404 errors when using web app
- ✓ Data flows correctly between web and admin-api
- ✓ Clear documentation of architecture
- ✓ Team understands data ownership and API contracts
- ✓ Can easily add new features leveraging shared admin-api

---

## Dependencies & Blockers

### Admin-API Team Dependencies

- Mount all route files in `/src/routes/index.js`
- Complete any stubbed/partial route implementations
- Provide API documentation for each route
- Ensure Prisma migrations are applied

### Web Team Dependencies

- Update API clients to call admin-api routes
- Update components to use admin-api data shapes
- Create migration scripts for data consolidation
- Update Prisma schema to consolidate models

### Database Team Dependencies

- Ensure single PostgreSQL instance is running
- Confirm app/admin-api access correct databases
- Validate schema migrations apply without errors
- Provide backup/restore procedures

---

## Risk Assessment

### High Risk

**Risk:** Missing or incomplete admin-api routes cause 404s
- **Mitigation:** Phase 1 audit and mounting
- **Contingency:** Update web to gracefully handle 404s

**Risk:** Schema consolidation causes data loss
- **Mitigation:** Dry-run migration scripts, validate counts
- **Contingency:** Maintain backup before executing migrations

### Medium Risk

**Risk:** Performance degradation from calling admin-api (especially for club analytics)
- **Mitigation:** Implement caching, pagination
- **Contingency:** Keep some web-local caching for frequently accessed data

**Risk:** Breaking changes in admin-api routes during integration
- **Mitigation:** Version API endpoints, clear API contracts
- **Contingency:** Feature flags to toggle between old/new implementations

### Low Risk

**Risk:** Chart/visualization library incompatibilities
- **Mitigation:** Testing on latest versions
- **Contingency:** Use fallback components

---

## Timeline Overview

```
Week 1:
  Day 1-2: Route mounting & testing (Phase 1)
  Day 3-5: Schema consolidation decisions (Phase 2)

Week 2-3:
  Day 1-5: Club analytics integration (Phase 3.1)
  Day 6-10: Feature flags, sessions, other features (Phase 3.2-3.11)

Week 4:
  Day 1-5: Testing & documentation (Phase 4)

Week 5 (Buffer):
  Bug fixes, edge cases, deployment prep
```

**Total Effort:** ~4-5 weeks (with full-time team)

---

## Rollout Strategy

### Stage 1: Dev/Staging (Week 1-2)
- Mount routes, test individually
- Begin data migrations
- Test integrated features in staging

### Stage 2: Beta Users (Week 3)
- Deploy to subset of users
- Monitor for issues
- Gather feedback

### Stage 3: General Release (Week 4)
- Full deployment
- Monitor metrics
- Support users

### Rollback Plan
- Feature flags to disable new endpoints
- Separate database snapshots for quick recovery
- Clear rollback procedures documented

---

## Post-Integration Roadmap

### Remaining Work (Not in This Plan)

1. **Database Consolidation**
   - Currently separate databases or tables
   - Consolidate to single PostgreSQL instance
   - Optimize with indexes, caching

2. **API Gateway Pattern**
   - Consider API gateway for routing
   - Load balancing across services

3. **GraphQL (Optional)**
   - Consider GraphQL for complex queries
   - Better data fetching efficiency

4. **Real-Time Features**
   - WebSockets for notifications
   - Live updates for shared data

5. **Performance Optimization**
   - Query optimization
   - Caching strategy
   - CDN for static assets

---

## Document Maintenance

- **Owner:** Platform Team
- **Last Updated:** 2025-11-20
- **Next Review:** Weekly (during implementation)
- **Update Frequency:** As phase completion status changes
- **Related Documents:**
  - `docs/FEATURE_PORT_STATUS.md` - Current feature status
  - `docs/MEGA_INTEGRATION_AUDIT.md` - Full audit details
  - `docs/SCHEMA_CONSOLIDATION_PLAN.md` - Schema decisions (to be created)
  - `docs/db/PRISMA_MIGRATION_GUIDE.md` - Prisma setup

---

## Approval & Sign-Off

**Plan Reviewed By:**
- [ ] Backend Lead
- [ ] Frontend Lead
- [ ] DevOps Lead
- [ ] Product Lead

**Approved:** 2025-11-20
**Target Start:** 2025-11-21
**Target Completion:** 2025-12-19
