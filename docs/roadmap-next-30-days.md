# Slimy.ai — Next 30 Days Roadmap

**Last Updated:** 2025-11-19
**Status:** Active Development
**Focus:** Monorepo Stabilization, Admin Panel Hardening, Infrastructure Polish

---

## Context: Where Slimy.ai Is Today

### Recent Achievements (Week of Nov 18-19)
- ✅ **Monorepo Migration Complete** — Successfully consolidated `slimyai-web`, `admin-api`, and `admin-ui` into unified `slimy-monorepo`
- ✅ **Test Infrastructure Modernized** — Migrated from Jest to Vitest, stabilized test suites across all hosts (75% coverage)
- ✅ **Docker Deployment Ready** — Configured compose files for slimy-nuc1 (test) and slimy-nuc2 (production)
- ✅ **CI/CD Pipeline Active** — GitHub Actions for test/lint/build + Discord notifications on deploy
- ✅ **Production-Grade Web App** — Next.js 16 with React 19, enterprise-ready (A++ rating, 98/100)

### Current State
**What's Working:**
- **apps/web** — Fully operational customer-facing site with codes aggregator, AI chat, club analytics, screenshot analysis
- **apps/admin-api** — Backend API operational with Discord OAuth2, session management, guild CRUD operations
- **apps/admin-ui** — Admin panel with guild dashboard, uploads, diagnostics, real-time logs
- **Infrastructure** — Caddy reverse proxy with HTTPS, auto-deploy on push to `main`, systemd services

**What's Incomplete:**
- **apps/bot** — Discord bot service is scaffolded but not implemented
- **packages/** — All 5 shared packages (`shared-config`, `shared-db`, `shared-auth`, `shared-snail`, `shared-codes`) are placeholders
- **Admin API** — Many endpoints are stubs; need database integration
- **Documentation** — Infrastructure setup (DNS, Caddy, deployment) lacks comprehensive docs
- **Monitoring** — No dedicated status page or health monitoring dashboard

### Technical Debt
1. **Shared Package Consolidation** — Code duplication across apps; need to extract to `packages/`
2. **Admin API Database Layer** — Stub endpoints need real database connections
3. **Session Storage** — Using in-memory sessions; needs Redis/PostgreSQL persistence
4. **Rate Limiting** — Missing on admin-api endpoints
5. **Input Validation** — Needs express-validator or Zod for API requests
6. **API Documentation** — No Swagger/OpenAPI specs for admin-api

---

## Goals for the Next 30 Days

### Primary Objectives
1. **Stabilize Monorepo** — Finalize branch synchronization, establish clear branching strategy
2. **Harden Admin Panel** — Complete database integration, add auth improvements, polish UX
3. **Document Infrastructure** — Comprehensive DNS/Caddy/deployment documentation
4. **Implement Bot Service** — Basic Discord bot service in `apps/bot`
5. **Shared Packages Foundation** — Implement core utilities in `shared-config`, `shared-db`, `shared-auth`
6. **Status & Monitoring** — Public status page with uptime tracking

### Success Metrics
- **Zero CI/CD Failures** — All tests passing on all branches
- **Documentation Coverage** — Every infrastructure component documented
- **Admin Panel Auth** — Session persistence, rate limiting, input validation
- **Bot Service MVP** — Discord bot responds to basic commands
- **Shared Packages** — At least 3 packages with >80% test coverage

---

## Week-by-Week Breakdown

### Week 1 (Nov 19 - Nov 25): Monorepo Finalization & Infrastructure Documentation

**Objectives:**
- Finalize monorepo structure and branching strategy
- Document DNS, Caddy, and deployment configurations
- Set up Redis for persistent session storage
- Establish monitoring and alerting baseline

**Tasks:**
1. **Branching Strategy**
   - Document `main`, `develop`, and feature branch workflows in `docs/CONTRIBUTING.md`
   - Set up branch protection rules on GitHub (require PR reviews, passing tests)
   - Create `develop` branch for integration testing before production merge

2. **Infrastructure Documentation**
   - Create `docs/infrastructure/dns-setup.md` — Document all domains, DNS records, TXT records for SPF/DKIM
   - Create `docs/infrastructure/caddy-configuration.md` — Explain Caddyfile structure, reverse proxy rules, HTTPS setup
   - Create `docs/infrastructure/deployment-guide.md` — Step-by-step deployment process for NUC1 and NUC2
   - Update `docs/STRUCTURE.md` with current monorepo layout

3. **Session Storage Migration**
   - Add Redis container to `infra/docker/docker-compose.slimy-nuc2.yml`
   - Implement Redis session store in `apps/admin-api` (replace in-memory)
   - Add session expiration and cleanup logic
   - Test session persistence across admin-api restarts

4. **Basic Monitoring**
   - Add Prometheus metrics exporter to `apps/admin-api` and `apps/web`
   - Create `infra/monitoring/prometheus.yml` configuration
   - Set up basic uptime checks with health endpoints
   - Configure Discord webhook alerts for service failures

**Deliverables:**
- ✅ `docs/CONTRIBUTING.md` with branching strategy
- ✅ `docs/infrastructure/` directory with 3 new guides
- ✅ Redis-backed session storage in admin-api
- ✅ Prometheus metrics on all services

---

### Week 2 (Nov 26 - Dec 2): Admin Panel Hardening & Database Integration

**Objectives:**
- Connect admin-api stub endpoints to real databases
- Add comprehensive input validation
- Implement rate limiting
- Improve authentication flow

**Tasks:**
1. **Database Integration**
   - Wire up guild settings CRUD operations to PostgreSQL (Prisma)
   - Implement channel management endpoints with database persistence
   - Connect personality and corrections endpoints to storage
   - Add usage tracking to database (track API calls, token usage)

2. **Input Validation & Security**
   - Add `zod` schemas for all admin-api request payloads
   - Implement request validation middleware
   - Add SQL injection protection (parameterized queries via Prisma)
   - Implement CSRF token validation for state-changing operations

3. **Rate Limiting**
   - Add Redis-backed rate limiter to admin-api (100 req/min per IP, 1000 req/hour per user)
   - Implement endpoint-specific limits (e.g., uploads: 10/hour)
   - Add rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
   - Return 429 with Retry-After header when exceeded

4. **Auth Improvements**
   - Add session rotation on privilege escalation
   - Implement "remember me" functionality (optional long-lived sessions)
   - Add audit logging for admin actions (who did what, when)
   - Improve error messages (don't leak sensitive info)

**Deliverables:**
- ✅ All admin-api stub endpoints connected to database
- ✅ Request validation on 100% of endpoints
- ✅ Rate limiting with Redis backend
- ✅ Audit log table and logging middleware

---

### Week 3 (Nov 27 - Dec 9): Bot Service MVP & Shared Packages

**Objectives:**
- Implement basic Discord bot service
- Extract shared utilities to packages
- Enable cross-app code reuse

**Tasks:**
1. **Discord Bot Service (`apps/bot`)**
   - Set up Discord.js application skeleton
   - Implement basic slash commands (`/ping`, `/status`, `/help`)
   - Connect to admin-api for guild configuration
   - Add event handlers for guild join/leave
   - Deploy bot to test server and verify functionality

2. **Shared Packages Implementation**
   - **`packages/shared-config`**
     - Environment variable loaders with Zod validation
     - Configuration schema definitions
     - Runtime config validation utilities

   - **`packages/shared-db`**
     - Prisma client singleton wrapper
     - Database connection pooling utilities
     - Migration helpers and scripts

   - **`packages/shared-auth`**
     - JWT token generation/validation
     - Session management utilities
     - Role-based access control (RBAC) helpers
     - Discord OAuth2 client wrapper

3. **Code Migration**
   - Extract duplicated code from `apps/web` and `apps/admin-api` to shared packages
   - Update imports across all apps to use shared packages
   - Verify all tests still pass after refactoring

4. **Package Testing**
   - Add Vitest config to each package
   - Write unit tests for all shared utilities (target 80% coverage)
   - Add integration tests for database and auth packages

**Deliverables:**
- ✅ Discord bot responding to basic commands in test server
- ✅ 3 shared packages implemented with >80% test coverage
- ✅ Code duplication reduced by extracting to shared packages

---

### Week 4 (Dec 10 - Dec 16): Status Page, Auto-Deploy, & Polish

**Objectives:**
- Public status page for service monitoring
- Finalize Git Dirt Watcher integration (if approved)
- Documentation polish and knowledge transfer

**Tasks:**
1. **Status Page & Monitoring**
   - Create `apps/status` — Simple Next.js app for public status page
   - Display uptime for: web app, admin-api, admin-ui, bot service
   - Add incident history (manual entry or automated detection)
   - Integrate with Prometheus for real-time metrics
   - Deploy to `status.slimyai.xyz`

2. **Super Snail Game Status**
   - Enhance `/api/bedrock-status` endpoint (currently exists in `apps/web`)
   - Add caching layer (Redis) to reduce API calls to game servers
   - Create public dashboard at `/status/game` showing server health
   - Add historical uptime tracking

3. **Git Dirt Watcher & Auto-Deploy (Conditional)**
   - **NOTE:** Only proceed if explicit approval received
   - Set up webhook listener for git push events
   - Trigger deployment pipeline on push to `main`
   - Add safety checks (tests must pass, no merge conflicts)
   - Send deployment status to Discord webhook
   - Document rollback procedure

4. **Caddy Configuration Cleanup**
   - Consolidate Caddyfile configurations (reduce duplication)
   - Add comments explaining each reverse proxy rule
   - Document SSL certificate renewal process
   - Create troubleshooting guide for common Caddy issues

5. **Documentation Polish**
   - Review all docs for accuracy and completeness
   - Add architecture diagrams (system overview, data flow)
   - Create onboarding guide for new developers
   - Record video walkthrough of local development setup

**Deliverables:**
- ✅ Public status page at `status.slimyai.xyz`
- ✅ Super Snail game server status dashboard
- ✅ Git-based auto-deploy (if approved) or documented manual process
- ✅ Comprehensive infrastructure documentation
- ✅ Developer onboarding guide

---

## Risks & Mitigation

### Risk 1: Database Migration Errors
**Severity:** High
**Likelihood:** Medium
**Impact:** Data loss, service downtime

**Mitigation:**
- ✅ Always test migrations on `slimy-nuc1` (test environment) before production
- ✅ Create database backups before every migration (`pg_dump` scheduled daily)
- ✅ Use Prisma migrations (versioned, rollback-safe)
- ✅ Never run migrations manually in production; use CI/CD pipeline
- ✅ Keep separate staging database for migration testing

### Risk 2: Session Storage Transition Issues
**Severity:** Medium
**Likelihood:** Medium
**Impact:** Users logged out unexpectedly

**Mitigation:**
- ✅ Gradual rollout: dual-write to both in-memory and Redis during transition
- ✅ Add session migration script to preserve existing sessions
- ✅ Monitor error rates during transition period
- ✅ Plan deployment during low-traffic hours
- ✅ Have rollback plan ready (revert to in-memory sessions if issues arise)

### Risk 3: Rate Limiting False Positives
**Severity:** Low
**Likelihood:** Medium
**Impact:** Legitimate users blocked

**Mitigation:**
- ✅ Start with generous limits, tighten gradually based on usage patterns
- ✅ Whitelist known admin IPs from rate limiting
- ✅ Add manual override mechanism for false positives
- ✅ Monitor rate limit metrics to detect legitimate high-usage patterns
- ✅ Provide clear error messages with contact info for appeals

### Risk 4: Discord Bot Permission Issues
**Severity:** Medium
**Likelihood:** High
**Impact:** Bot cannot perform required actions in guilds

**Mitigation:**
- ✅ Document required bot permissions clearly in invite link
- ✅ Add permission check on bot startup (warn if missing critical permissions)
- ✅ Graceful degradation (disable features if permissions missing, don't crash)
- ✅ Provide admin UI to diagnose permission issues
- ✅ Test bot in guilds with varying permission configurations

### Risk 5: Caddy Configuration Syntax Errors
**Severity:** High
**Likelihood:** Low
**Impact:** Complete site outage

**Mitigation:**
- ✅ Always validate Caddyfile syntax before deployment (`caddy validate`)
- ✅ Test configuration changes in `slimy-nuc1` first
- ✅ Keep previous working Caddyfile backed up
- ✅ Add automated syntax validation to CI/CD pipeline
- ✅ Document rollback procedure for Caddy configs

### Risk 6: Auto-Deploy Breaks Production
**Severity:** Critical
**Likelihood:** Low (if safety checks implemented)
**Impact:** Service outage, data corruption

**Mitigation:**
- ✅ **DO NOT** enable auto-deploy without explicit approval
- ✅ Require all tests to pass before deployment
- ✅ Add smoke tests to verify deployment health
- ✅ Implement automatic rollback on deployment failure
- ✅ Add manual approval gate for production deployments
- ✅ Preserve last 5 deployment artifacts for quick rollback

---

## Agent Jobs vs. Human Jobs

This section explicitly defines which tasks can be safely delegated to AI agents and which require human oversight and decision-making.

### 🤖 Tasks Safe for AI Agents

**Code Transformations:**
- Migrating code between files (e.g., extracting to shared packages)
- Renaming variables, functions, or files across the codebase
- Converting code between libraries (e.g., Jest → Vitest)
- Formatting and linting fixes
- Adding TypeScript type annotations
- Generating boilerplate code (API routes, components, tests)

**Documentation Generation:**
- Writing API documentation from code comments
- Generating README files for packages
- Creating changelog entries from git commits
- Writing inline code comments
- Generating architecture diagrams from code structure

**Testing & Quality:**
- Writing unit tests for pure functions
- Generating test fixtures and mock data
- Running linters and fixing reported issues
- Running test suites and reporting results
- Analyzing code coverage reports

**Scaffolding & Templating:**
- Creating new packages with standard structure
- Generating CRUD endpoint skeletons
- Creating component templates (React components, API routes)
- Setting up new services with Docker configs
- Generating configuration files from templates

**Analysis & Reporting:**
- Analyzing dependencies for security vulnerabilities
- Generating performance reports from metrics
- Identifying code duplication
- Finding unused exports and dead code
- Analyzing bundle sizes and suggesting optimizations

**Data Transformations:**
- Converting data formats (JSON ↔ YAML ↔ CSV)
- Transforming API response shapes
- Generating sample/seed data for testing
- Parsing and restructuring log files

### 👤 Tasks Requiring Human Oversight

**Production Database Operations:**
- Running database migrations on production ❌ NEVER delegate to AI
- Deleting data from production databases ❌ NEVER delegate to AI
- Modifying schema on live databases ❌ NEVER delegate to AI
- Creating database backups (agent can schedule, human must verify)
- Restoring from backups ❌ NEVER delegate to AI

**Security & Access Control:**
- Setting up Discord OAuth2 credentials ⚠️ Human must verify
- Generating or rotating API keys ⚠️ Human must verify
- Configuring firewall rules ⚠️ Human must verify
- Managing SSL certificates ⚠️ Agent can generate CSR, human must verify
- Granting admin access to users ❌ NEVER delegate to AI

**Billing & Financial:**
- Configuring payment integrations ❌ NEVER delegate to AI
- Setting up billing alerts ⚠️ Human must verify
- Processing refunds or chargebacks ❌ NEVER delegate to AI
- Modifying pricing or subscription tiers ❌ NEVER delegate to AI

**Production Deployments:**
- Deploying to production servers ⚠️ Agent can prepare, human must approve
- Rolling back failed deployments ⚠️ Agent can recommend, human must execute
- Modifying infrastructure (DNS, Caddy, Docker) ⚠️ Human must verify changes
- Pushing git commits to `main` branch ⚠️ Human must review and approve

**Strategic Decisions:**
- Choosing technology stack for new features ⚠️ Agent can recommend, human decides
- Deprecating existing features ❌ NEVER delegate to AI
- Changing public APIs (breaking changes) ❌ NEVER delegate to AI
- Deciding feature prioritization ⚠️ Agent can analyze data, human decides

**User Communication:**
- Announcing service outages ⚠️ Agent can draft, human must send
- Responding to security incidents ⚠️ Agent can help, human must lead
- Handling GDPR/privacy requests ❌ NEVER delegate to AI
- Customer support for sensitive issues ⚠️ Agent can assist, human must review

### 🔄 Collaborative Tasks (AI + Human)

These tasks benefit from AI assistance but require human oversight at critical steps:

1. **API Endpoint Implementation**
   - AI: Generate endpoint skeleton, validation schemas, tests
   - Human: Review business logic, verify security, approve merge

2. **Database Schema Changes**
   - AI: Generate Prisma migration, update types, update queries
   - Human: Review migration safety, test on staging, execute on production

3. **Feature Implementation**
   - AI: Scaffold components, write tests, implement logic
   - Human: Review UX decisions, verify edge cases, approve deployment

4. **Bug Fixes**
   - AI: Identify root cause, suggest fixes, write regression tests
   - Human: Verify fix doesn't introduce new issues, approve patch

5. **Performance Optimization**
   - AI: Identify bottlenecks, suggest optimizations, benchmark improvements
   - Human: Verify correctness, test under production-like load, approve changes

6. **Documentation**
   - AI: Generate initial documentation from code and comments
   - Human: Review for accuracy, add context, verify clarity for target audience

### ⚠️ Safety Guidelines

**Before delegating to AI agent:**
1. Is this task reversible? (If no → requires human approval)
2. Could this task delete or corrupt data? (If yes → human only)
3. Does this task affect production users? (If yes → human approval required)
4. Are there financial or legal implications? (If yes → human only)
5. Could this task introduce security vulnerabilities? (If yes → human review required)

**Red Flags (NEVER delegate):**
- Tasks with irreversible consequences
- Tasks involving real money or billing
- Tasks that could expose user data
- Tasks that could cause extended downtime
- Tasks that modify access control or permissions

---

## Implementation Notes

### Branching Strategy
- `main` — Production-ready code (auto-deploys to slimy-nuc2)
- `develop` — Integration branch for testing (deploys to slimy-nuc1)
- `feature/*` — Feature branches (merge to `develop` via PR)
- `hotfix/*` — Emergency production fixes (merge to `main` and `develop`)

### Testing Requirements
- All PRs must pass CI/CD tests (lint, type-check, unit tests, integration tests)
- New features require >80% test coverage
- Breaking changes require migration guide

### Deployment Process
1. Merge PR to `develop`
2. Verify on slimy-nuc1 (test environment)
3. Create PR from `develop` to `main`
4. Obtain approval from human reviewer
5. Merge to `main` (triggers auto-deploy to slimy-nuc2)
6. Monitor error rates and performance metrics
7. If issues detected, rollback immediately

### Communication Channels
- **Discord** — Real-time deployment notifications, alerts
- **GitHub Issues** — Bug tracking, feature requests
- **GitHub PRs** — Code review, discussion
- **Docs** — Long-form documentation, guides

---

## Success Criteria

By December 16, 2025, we should have:

- ✅ **Stable Monorepo** — Clear branching strategy, all tests passing
- ✅ **Production-Ready Admin Panel** — Database-backed, rate-limited, session persistence
- ✅ **Working Discord Bot** — Deployed and responding to basic commands
- ✅ **Shared Packages** — At least 3 packages with >80% test coverage
- ✅ **Public Status Page** — Live at `status.slimyai.xyz`
- ✅ **Comprehensive Documentation** — Infrastructure, deployment, onboarding guides
- ✅ **Monitoring & Alerting** — Prometheus metrics, Discord alerts
- ✅ **Clear AI/Human Boundaries** — Team knows what to delegate and what requires human oversight

---

**Next Review:** December 2, 2025 (Mid-sprint checkpoint)
**Roadmap Owner:** Engineering Team
**Last Updated:** November 19, 2025
