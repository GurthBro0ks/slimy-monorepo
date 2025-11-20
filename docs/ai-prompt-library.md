# AI Prompt Library for Slimy.ai

This document contains reusable prompts for working with AI agents (ChatGPT/Codex, Claude Code, Blackbox, etc.) on the Slimy.ai monorepo. Each prompt is designed to be pasted directly into your AI tool of choice with minimal modifications.

## Table of Contents

- [Infra & Server Health](#infra--server-health)
- [Web & Admin Features](#web--admin-features)
- [Monitoring & Observability](#monitoring--observability)
- [Snail Tools & Analytics](#snail-tools--analytics)
- [Testing & Quality](#testing--quality)
- [Documentation & Planning](#documentation--planning)

---

## Infra & Server Health

### 1. Investigate Production Service Issues

**When to use:** Service is down, logs show errors, or health checks are failing.

**For ChatGPT/Codex Agent Mode:**
```
I'm investigating a production issue with the Slimy.ai admin-api service running on systemd.

Context:
- Service: admin-api.service (Express.js on port 3080)
- Location: /opt/slimy/admin-api
- Environment: Production (behind Caddy reverse proxy)

Task:
1. Check the service status and recent logs
2. Identify the root cause of any errors
3. Suggest fixes WITHOUT modifying existing code
4. Create a new diagnostic script in infra/scripts/ if needed

Constraints:
- Do NOT modify existing source code
- Do NOT restart services without asking
- Create new diagnostic/monitoring scripts only
- Document findings in docs/ directory
```

**For Claude Code:**
```
Investigate the admin-api.service systemd service for production issues.

Steps:
1. Read recent logs: `sudo journalctl -u admin-api -n 200`
2. Check service status: `sudo systemctl status admin-api`
3. Review error patterns and correlate with monitoring data
4. Create a diagnostic report in docs/incidents/YYYY-MM-DD-admin-api-issue.md

Rules:
- Read-only investigation - no code changes
- New scripts go to infra/scripts/
- Document all findings
```

**For Blackbox CLI:**
```
Debug Slimy.ai admin-api systemd service. Check logs, identify errors, create diagnostic script in infra/scripts/. NO CODE CHANGES to existing files.
```

---

### 2. Deploy Configuration Updates

**When to use:** Need to update environment variables, systemd units, or Caddy configs.

**For ChatGPT/Codex Agent Mode:**
```
I need to deploy a configuration update to the Slimy.ai infrastructure.

Context:
- Monorepo structure with apps/admin-api, apps/web, apps/admin-ui
- Systemd services: admin-api.service, slimy-bot.service
- Caddy reverse proxy at infra/caddy/Caddyfile
- Environment configs: .env.admin.production, .env.production

Task:
1. Review the current configuration in infra/
2. Create NEW configuration files (do NOT edit existing ones directly)
3. Generate deployment instructions in docs/deployments/
4. Create validation scripts in infra/scripts/

Constraints:
- Create new config files with timestamp or version suffix
- Include rollback instructions
- Validate before suggesting deployment
- Document all changes
```

**For Claude Code:**
```
Help me update Slimy.ai infrastructure configuration safely.

Process:
1. Read current configs from infra/caddy/, infra/systemd/
2. Create new versioned configs (e.g., Caddyfile.new, admin-api.service.v2)
3. Generate deployment checklist in docs/deployments/config-update-YYYY-MM-DD.md
4. Include validation and rollback steps

Safety first:
- Never overwrite production configs directly
- Always create backup instructions
- Test configurations before deployment
```

**For Blackbox CLI:**
```
Update Slimy.ai infra configs (Caddy/systemd). Create NEW versioned files in infra/. Write deployment guide in docs/deployments/. Include rollback plan.
```

---

### 3. Docker Container Optimization

**When to use:** Need to optimize Docker images, update compose files, or troubleshoot container issues.

**For ChatGPT/Codex Agent Mode:**
```
Optimize the Docker setup for Slimy.ai applications.

Context:
- Docker images for web (Next.js 16) and admin-api (Express)
- Multi-stage builds required for production
- Files: apps/web/Dockerfile, apps/admin-api/Dockerfile, infra/docker/docker-compose.yml

Task:
1. Analyze current Dockerfiles for optimization opportunities
2. Create NEW optimized Dockerfiles with .optimized suffix
3. Document size improvements and build time changes
4. Generate comparison report in docs/infra/docker-optimization.md

Constraints:
- Preserve existing Dockerfiles (create .optimized versions)
- Must maintain compatibility with existing deployment
- Include performance metrics in documentation
- Security scanning recommendations
```

**For Claude Code:**
```
Analyze and optimize Slimy.ai Docker configurations.

Steps:
1. Read Dockerfiles from apps/web/, apps/admin-api/
2. Create optimized versions: Dockerfile.optimized
3. Compare image sizes and build times
4. Document in docs/infra/docker-optimization.md

Include:
- Multi-stage build improvements
- Layer caching strategies
- Security best practices
- Size comparison table
```

**For Blackbox CLI:**
```
Optimize Slimy.ai Dockerfiles. Create .optimized versions. Compare sizes. Document improvements in docs/infra/. NO modifications to original Dockerfiles.
```

---

## Web & Admin Features

### 4. Add New API Endpoint (Documentation Only)

**When to use:** Planning a new API endpoint but want to document it first.

**For ChatGPT/Codex Agent Mode:**
```
I'm planning a new API endpoint for the Slimy.ai web application.

Context:
- Next.js 16 App Router structure (app/api/)
- Existing patterns: app/api/codes/route.ts, app/api/auth/me/route.ts
- Server-side proxies to admin-api backend

Task:
1. Review existing API routes for patterns and conventions
2. Create API specification in docs/api-specs/[endpoint-name].md
3. Include request/response examples, error handling, and caching strategy
4. Generate implementation checklist (DO NOT implement yet)

Constraints:
- Documentation only - no code changes
- Follow existing API patterns from apps/web/app/api/
- Include authentication/authorization requirements
- Specify caching and rate limiting needs
```

**For Claude Code:**
```
Document a new API endpoint for Slimy.ai web app.

Research:
1. Read existing routes in apps/web/app/api/
2. Analyze patterns: auth, error handling, caching

Create in docs/api-specs/[endpoint-name].md:
- Endpoint specification (method, path, params)
- Request/response schemas
- Error codes and handling
- Caching strategy (60s like codes endpoint?)
- Authentication requirements
- Implementation checklist

Pure documentation - no code.
```

**For Blackbox CLI:**
```
Document new Slimy.ai API endpoint. Study apps/web/app/api/ patterns. Create spec in docs/api-specs/. Include schemas, errors, caching, auth. NO CODE.
```

---

### 5. Codes Aggregator Enhancement Planning

**When to use:** Want to enhance the codes system (new sources, features, optimizations).

**For ChatGPT/Codex Agent Mode:**
```
Plan enhancements to the Slimy.ai codes aggregator system.

Context:
- Aggregates codes from Snelp API and Reddit r/SuperSnailGame
- Architecture: apps/web/lib/codes-aggregator.ts, apps/web/docs/CODES_SYSTEM.md
- Features: deduplication, caching (60s), circuit breakers, fallbacks
- Endpoint: apps/web/app/api/codes/route.ts

Task:
1. Review the current codes system architecture
2. Identify enhancement opportunities (new sources, better dedup, etc.)
3. Create enhancement proposal in docs/enhancements/codes-system-v2.md
4. Include architecture diagrams (ASCII), data flow, and migration plan

Constraints:
- Documentation and planning only
- Must maintain backward compatibility
- Consider performance impact (<200ms load requirement)
- Include testing strategy
```

**For Claude Code:**
```
Create enhancement plan for Slimy.ai codes aggregator.

Review:
1. Read apps/web/docs/CODES_SYSTEM.md
2. Analyze apps/web/lib/codes-aggregator.ts patterns
3. Check apps/web/app/api/codes/route.ts performance

Document in docs/enhancements/codes-system-v2.md:
- Proposed enhancements (new sources, features)
- Architecture changes (ASCII diagrams)
- Performance analysis and optimizations
- Migration strategy
- Testing plan

Planning only - no implementation.
```

**For Blackbox CLI:**
```
Plan codes aggregator enhancements. Read CODES_SYSTEM.md. Propose improvements in docs/enhancements/. Include architecture, migration, testing. PLANNING ONLY.
```

---

### 6. Admin Panel Feature Documentation

**When to use:** Documenting new admin panel features before implementation.

**For ChatGPT/Codex Agent Mode:**
```
Document a new feature for the Slimy.ai admin panel.

Context:
- Admin UI: Next.js app in apps/admin-ui/ (role-based access)
- Admin API: Express backend in apps/admin-api/ (Discord OAuth, JWT sessions)
- Current features: guild management, settings, usage stats (mostly stubs)
- Roles: admin, club, user (defined in slimy.config.ts roleMap)

Task:
1. Review existing admin panel structure and patterns
2. Create feature specification in docs/features/admin-[feature-name].md
3. Include UI mockups (ASCII wireframes), API contracts, and database needs
4. Generate implementation checklist with file locations

Constraints:
- Documentation only - no code implementation
- Follow existing patterns in apps/admin-ui/ and apps/admin-api/
- Include authentication/authorization for each route
- Consider both frontend and backend requirements
```

**For Claude Code:**
```
Document new admin panel feature for Slimy.ai.

Research:
1. Read apps/admin-ui/README.md and apps/admin-api/README.md
2. Review existing components and API routes
3. Check role mapping in slimy.config.ts

Create docs/features/admin-[feature-name].md:
- Feature overview and user stories
- UI wireframes (ASCII)
- API endpoints specification
- Database schema changes (if any)
- Authentication/authorization rules
- Implementation phases

Documentation only.
```

**For Blackbox CLI:**
```
Document admin panel feature. Study apps/admin-ui/ and apps/admin-api/. Create spec in docs/features/. Include UI mockups, API contracts, auth rules. NO CODE.
```

---

## Monitoring & Observability

### 7. Create Custom Grafana Dashboard

**When to use:** Need new monitoring dashboards for specific metrics.

**For ChatGPT/Codex Agent Mode:**
```
Create a custom Grafana dashboard for Slimy.ai monitoring.

Context:
- Monitoring stack: Prometheus + Grafana + Sentry
- Current setup: apps/admin-api/MONITORING_SETUP_GUIDE.md
- Metrics endpoint: /api/metrics (Prometheus format)
- Alert rules: apps/admin-api/src/lib/alerts.js

Task:
1. Review existing metrics from apps/admin-api/src/lib/monitoring/metrics.ts
2. Design dashboard layout and panels
3. Create dashboard JSON spec in docs/monitoring/dashboards/[name].json
4. Document metrics queries and alert thresholds

Constraints:
- Create new dashboard files only (don't modify existing)
- Follow Prometheus query syntax
- Include alert visualization panels
- Document in docs/monitoring/dashboard-guide.md
```

**For Claude Code:**
```
Design custom Grafana dashboard for Slimy.ai.

Steps:
1. Read apps/admin-api/src/lib/monitoring/metrics.ts for available metrics
2. Review MONITORING_SETUP_GUIDE.md for architecture
3. Design dashboard panels for specific use case

Create:
- docs/monitoring/dashboards/[name].json (Grafana JSON model)
- docs/monitoring/[name]-dashboard-guide.md (setup instructions)

Include:
- PromQL queries for each panel
- Alert threshold visualization
- Panel descriptions and purposes

New files only.
```

**For Blackbox CLI:**
```
Design Grafana dashboard for Slimy.ai. Review metrics in monitoring/metrics.ts. Create JSON spec in docs/monitoring/dashboards/. Document queries and setup. NEW FILES ONLY.
```

---

### 8. Alert Rule Optimization

**When to use:** Need to tune alert thresholds or add new alert rules.

**For ChatGPT/Codex Agent Mode:**
```
Optimize alert rules for Slimy.ai monitoring system.

Context:
- Current alerts: apps/admin-api/src/lib/alerts.js
- Metrics: HTTP (requests, errors, latency), DB (queries, connections), System (memory, CPU)
- Alerting: Prometheus alert rules + Alertmanager

Task:
1. Analyze existing alert rules and thresholds
2. Review historical metrics to identify false positives/negatives
3. Create optimized alert rules in docs/monitoring/alert-rules-v2.yml
4. Document changes and rationale in docs/monitoring/alert-tuning.md

Constraints:
- Create new versioned alert files (don't modify originals)
- Include testing/validation instructions
- Document baseline metrics used for tuning
- Preserve existing alert structure
```

**For Claude Code:**
```
Tune Slimy.ai alert rules for better accuracy.

Analysis:
1. Read apps/admin-api/src/lib/alerts.js
2. Review current thresholds (error rate, latency, memory)
3. Consider production traffic patterns

Create:
- docs/monitoring/alert-rules-v2.yml (optimized Prometheus rules)
- docs/monitoring/alert-tuning.md (changes and rationale)

Include:
- Before/after threshold comparison
- Expected alert frequency
- Testing methodology

New files only - preserve originals.
```

**For Blackbox CLI:**
```
Optimize Slimy.ai alerts. Analyze alerts.js. Create v2 rules in docs/monitoring/. Document tuning rationale. NO MODIFICATIONS to existing alert files.
```

---

## Snail Tools & Analytics

### 9. Snail Timeline Feature Planning

**When to use:** Planning the snail timeline feature from the roadmap.

**For ChatGPT/Codex Agent Mode:**
```
Plan the Snail Timeline feature for Slimy.ai web app.

Context:
- Roadmap: apps/web/ROADMAP.md (Scope A4 - Snail Timeline)
- Requirements: File-backed user history with delta comparison
- User flow: View personal snail progress over time with highlighted changes

Task:
1. Review ROADMAP.md section A4 for requirements
2. Design data structure for user history JSON storage
3. Create implementation plan in docs/pr-plans/snail-timeline-v2.md
4. Include UI/UX flow (ASCII wireframes) and API contracts

Constraints:
- Planning document only - no implementation
- Follow patterns from existing snail tools in apps/web/app/snail/
- Include privacy considerations (PII, data retention)
- Consider storage strategy (file-based vs database)
```

**For Claude Code:**
```
Plan Snail Timeline feature implementation.

Research:
1. Read apps/web/ROADMAP.md section A4
2. Check existing snail tools in apps/web/app/snail/
3. Review data storage patterns in project

Create docs/pr-plans/snail-timeline-v2.md:
- Feature overview and user stories
- Data structure (JSON schema for history)
- UI flow (ASCII wireframes)
- API endpoints (/api/snail/history)
- Delta calculation algorithm
- Storage and privacy considerations
- Implementation phases

Planning only.
```

**For Blackbox CLI:**
```
Plan Snail Timeline feature. Read ROADMAP.md A4. Design data structure and UI. Create plan in docs/pr-plans/. Include API specs, storage, privacy. PLANNING ONLY.
```

---

### 10. Usage Analytics Dashboard Design

**When to use:** Designing analytics dashboards for snail tools or club features.

**For ChatGPT/Codex Agent Mode:**
```
Design usage analytics dashboard for Slimy.ai snail tools.

Context:
- Target users: Snail tool users and club operators
- Metrics needed: tool usage, active users, popular features
- Current structure: apps/web/app/snail/ and apps/web/app/club/

Task:
1. Review existing analytics patterns in the codebase
2. Define key metrics and tracking events
3. Create dashboard design in docs/analytics/snail-dashboard-spec.md
4. Include data collection strategy and privacy compliance

Constraints:
- Documentation only - no implementation
- Consider GDPR/privacy (no PII in analytics)
- Use existing infrastructure where possible
- Define API contracts for data collection
```

**For Claude Code:**
```
Design analytics dashboard for Slimy.ai snail tools.

Review:
1. Check apps/web/app/snail/ for current features
2. Review apps/web/app/club/ for operator needs
3. Look for existing analytics patterns

Create docs/analytics/snail-dashboard-spec.md:
- Dashboard layout (ASCII wireframes)
- Key metrics and KPIs
- Data collection events
- API endpoints for analytics data
- Privacy considerations (anonymization)
- Implementation approach

Design document only.
```

**For Blackbox CLI:**
```
Design analytics dashboard for snail tools. Review app/snail/ and app/club/. Create spec in docs/analytics/. Define metrics, collection, privacy. DESIGN ONLY.
```

---

## Testing & Quality

### 11. Test Coverage Analysis

**When to use:** Need to understand current test coverage and identify gaps.

**For ChatGPT/Codex Agent Mode:**
```
Analyze test coverage for Slimy.ai applications.

Context:
- Testing: Vitest (unit) and Playwright (e2e)
- Test files: apps/web/tests/, apps/admin-api/tests/
- Critical paths: codes aggregator, auth flows, API endpoints

Task:
1. Review existing test files and coverage
2. Identify untested or under-tested areas
3. Create coverage report in docs/testing/coverage-analysis.md
4. Generate test plan for missing coverage

Constraints:
- Analysis only - don't write tests yet
- Prioritize critical paths (auth, data integrity, external APIs)
- Include recommendations for test types (unit/integration/e2e)
- Document testing gaps and risks
```

**For Claude Code:**
```
Analyze test coverage across Slimy.ai monorepo.

Review:
1. Scan apps/web/tests/ and apps/admin-api/tests/
2. Check critical features: codes aggregator, auth, API routes
3. Identify coverage gaps

Create docs/testing/coverage-analysis.md:
- Current coverage summary
- Coverage gaps by feature
- Risk assessment for untested areas
- Recommended test priorities
- Test plan outline

Analysis only - no test writing.
```

**For Blackbox CLI:**
```
Analyze Slimy.ai test coverage. Review tests/ directories. Identify gaps. Create report in docs/testing/. Prioritize critical paths. ANALYSIS ONLY.
```

---

### 12. E2E Test Scenarios Planning

**When to use:** Planning end-to-end test scenarios for new features.

**For ChatGPT/Codex Agent Mode:**
```
Plan end-to-end test scenarios for Slimy.ai features.

Context:
- E2E framework: Playwright
- Test files: apps/web/tests/e2e/
- Key user flows: Discord login, codes access, admin panel navigation

Task:
1. Review existing E2E tests for patterns
2. Define comprehensive user journey scenarios
3. Create test plan in docs/testing/e2e-test-scenarios.md
4. Include test data setup and teardown requirements

Constraints:
- Test planning only - no test implementation
- Cover happy paths and error scenarios
- Consider cross-browser requirements
- Include accessibility testing notes
```

**For Claude Code:**
```
Plan E2E test scenarios for Slimy.ai.

Review:
1. Check apps/web/tests/e2e/ for existing patterns
2. Map user journeys (login → codes → admin, etc.)
3. Identify critical flows

Create docs/testing/e2e-test-scenarios.md:
- User journey maps
- Test scenario descriptions
- Test data requirements
- Expected outcomes
- Error/edge case scenarios
- Accessibility considerations

Planning document only.
```

**For Blackbox CLI:**
```
Plan E2E tests for Slimy.ai. Review tests/e2e/ patterns. Map user journeys. Create scenarios in docs/testing/. Include test data and edge cases. PLANNING ONLY.
```

---

## Documentation & Planning

### 13. Architecture Decision Record (ADR)

**When to use:** Documenting important architectural decisions for future reference.

**For ChatGPT/Codex Agent Mode:**
```
Create an Architecture Decision Record (ADR) for Slimy.ai.

Context:
- Monorepo structure with pnpm workspaces
- Current architecture: docs/STRUCTURE.md
- Recent decisions to document: [specify decision topic]

Task:
1. Review existing architecture documentation
2. Create ADR in docs/adr/NNNN-[decision-title].md
3. Follow ADR format: Context, Decision, Consequences, Alternatives
4. Include migration path if applicable

Constraints:
- Documentation only - no code changes
- Use standard ADR template format
- Link to related documentation
- Consider long-term maintenance implications
```

**For Claude Code:**
```
Create Architecture Decision Record for Slimy.ai.

Review:
1. Read docs/STRUCTURE.md for current architecture
2. Understand the decision context and requirements

Create docs/adr/NNNN-[decision-title].md:
- Title and Status
- Context (problem and constraints)
- Decision (chosen approach)
- Consequences (positive and negative)
- Alternatives Considered
- Related Decisions/Links

Follow ADR template format.
Documentation only.
```

**For Blackbox CLI:**
```
Write ADR for Slimy.ai decision. Follow ADR format: Context, Decision, Consequences, Alternatives. Create in docs/adr/. Include migration notes. DOC ONLY.
```

---

### 14. Dependency Audit Documentation

**When to use:** Documenting npm/pnpm dependencies and identifying upgrade paths.

**For ChatGPT/Codex Agent Mode:**
```
Audit and document dependencies for Slimy.ai monorepo.

Context:
- Package manager: pnpm workspaces
- Main apps: web (Next.js 16), admin-api (Express), admin-ui (Next.js)
- Package files: package.json across workspace

Task:
1. Scan all package.json files in the monorepo
2. Identify outdated packages and security vulnerabilities
3. Create audit report in docs/dependencies/audit-YYYY-MM-DD.md
4. Prioritize upgrade recommendations

Constraints:
- Audit and documentation only - no package updates
- Check security advisories (npm audit, snyk)
- Consider breaking changes in major version upgrades
- Document testing requirements for upgrades
```

**For Claude Code:**
```
Audit dependencies across Slimy.ai monorepo.

Scan:
1. Find all package.json files in workspace
2. Run pnpm outdated (read-only analysis)
3. Check for security vulnerabilities

Create docs/dependencies/audit-YYYY-MM-DD.md:
- Current dependency snapshot
- Outdated packages list
- Security vulnerabilities
- Upgrade priority (critical/high/medium/low)
- Breaking changes to watch for
- Testing recommendations

Audit only - no updates.
```

**For Blackbox CLI:**
```
Audit Slimy.ai dependencies. Scan package.json files. Check outdated and vulnerable packages. Create report in docs/dependencies/. Prioritize upgrades. NO UPDATES.
```

---

### 15. Onboarding Documentation

**When to use:** Creating or updating onboarding guides for new developers.

**For ChatGPT/Codex Agent Mode:**
```
Create comprehensive onboarding documentation for Slimy.ai developers.

Context:
- Monorepo with multiple apps and shared packages
- Tech stack: Next.js, Express, TypeScript, pnpm workspaces
- Existing docs: README.md, STRUCTURE.md, app-specific READMEs

Task:
1. Review existing documentation and identify gaps
2. Create onboarding guide in docs/ONBOARDING.md
3. Include: setup, architecture overview, common tasks, troubleshooting
4. Add links to other relevant documentation

Constraints:
- Documentation only - no code changes
- Assume reader has basic Node.js/Git knowledge
- Include practical examples and commands
- Keep it concise but comprehensive
```

**For Claude Code:**
```
Create developer onboarding guide for Slimy.ai.

Review:
1. Read README.md, STRUCTURE.md, and app READMEs
2. Identify common setup steps and pain points
3. Map typical developer workflows

Create docs/ONBOARDING.md:
- Prerequisites and environment setup
- Repository structure overview
- First-time setup (pnpm install, env files)
- Common development workflows
- Testing and CI/CD
- Troubleshooting guide
- Links to deep-dive docs

Clear, actionable guide.
```

**For Blackbox CLI:**
```
Write onboarding guide for Slimy.ai devs. Cover setup, structure, workflows, testing, troubleshooting. Create in docs/ONBOARDING.md. Link to other docs. CLEAR AND PRACTICAL.
```

---

## Quick Reference

### Prompt Template Variables

When using these prompts, replace the following placeholders:

- `[endpoint-name]` - Name of the API endpoint (e.g., guild-stats, user-timeline)
- `[feature-name]` - Name of the feature (e.g., persona-lab, camera-scan)
- `[name]` - Generic name for dashboards, scripts, etc.
- `YYYY-MM-DD` - Current date for timestamping files
- `NNNN` - Sequential number for ADRs (e.g., 0001, 0002)
- `[decision-title]` - Short kebab-case title for ADRs

### File Location Conventions

- **API Specs**: `docs/api-specs/`
- **Feature Specs**: `docs/features/`
- **Implementation Plans**: `docs/pr-plans/`
- **Enhancements**: `docs/enhancements/`
- **Monitoring**: `docs/monitoring/`
- **Testing**: `docs/testing/`
- **ADRs**: `docs/adr/`
- **Dependencies**: `docs/dependencies/`
- **Incidents**: `docs/incidents/`
- **Deployments**: `docs/deployments/`
- **Infra Docs**: `docs/infra/`
- **Analytics**: `docs/analytics/`

### Common Constraints Across All Prompts

1. **No code modifications** - Create new files only
2. **Documentation first** - Plan before implementing
3. **Follow existing patterns** - Review similar code first
4. **Include testing strategy** - Always consider how to test
5. **Consider security** - Auth, privacy, data protection
6. **Performance awareness** - Note any performance implications
7. **Backward compatibility** - Don't break existing features

---

## Contributing to This Library

When adding new prompts to this library:

1. Place them in the appropriate category section
2. Number them sequentially within the category
3. Include all three AI tool formats (ChatGPT/Codex, Claude Code, Blackbox)
4. Specify clear "When to use" criteria
5. Always emphasize the documentation-first, read-only approach
6. Update the Table of Contents

---

**Last Updated**: 2025-11-19
**Maintainer**: Slimy.ai Team
**Related Docs**: [ai-prompt-usage-notes.md](./ai-prompt-usage-notes.md), [STRUCTURE.md](./STRUCTURE.md)
