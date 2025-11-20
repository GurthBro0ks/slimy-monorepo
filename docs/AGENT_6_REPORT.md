# Agent 6 Report: Docker & NUC Infrastructure Analysis

**Agent**: Agent 6 - Docker & NUC Infrastructure Follow-ups
**Date**: 2025-11-20
**Branch**: claude/agent-6-01YBwcM5y5jumXhTSH3p66b8

## Executive Summary

This report documents the current state of the NUC2 Docker infrastructure, identifies observability improvements, and provides a roadmap for NUC1 deployment.

**Key Findings:**
- NUC2 is production-ready with comprehensive health checks and monitoring
- Both NUC1 and NUC2 have health endpoints configured at /api/health
- Admin-api has startup logging; web app uses Next.js defaults
- NUC2 uses PostgreSQL 16, NUC1 uses MySQL 8 (critical difference)
- No timezone-related branches exist in the repository

---

## NUC2 Runtime Recap

### Architecture Overview

**Location**: `/opt/slimy/slimy-monorepo/infra/docker/docker-compose.slimy-nuc2.yml`

NUC2 runs five Docker containers managed by docker-compose:

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| slimy-db | postgres:16-alpine | 5432 | PostgreSQL database |
| slimy-admin-api | custom build | 3080 | Admin API backend |
| slimy-web | custom build | 3000 | Next.js web application |
| slimy-caddy | caddy:2 | host network | Reverse proxy with TLS |
| slimy-loopback1455 | python:3-alpine | 1455 | Simple HTTP test server |

### Service Dependencies

```
postgres (healthy)
  ├─> admin-api (started)
  │     └─> caddy (healthy)
  └─> web (healthy)
        └─> caddy (healthy)

loopback1455 (independent)
```

### Health Checks

All services have comprehensive health checks configured:

#### postgres (slimy-db)
- **Test**: `pg_isready -U $POSTGRES_USER`
- **Interval**: 10s
- **Timeout**: 5s
- **Retries**: 6
- **Location**: infra/docker/docker-compose.slimy-nuc2.yml:16-19

#### admin-api (slimy-admin-api)
- **Endpoint**: `http://127.0.0.1:3080/api/health`
- **Method**: HTTP GET via Node.js
- **Interval**: 30s
- **Timeout**: 10s
- **Retries**: 5
- **Start Period**: 40s (allows time for initial startup)
- **Response**: `{"ok": true, "service": "admin-api", "env": "production", "timestamp": "ISO-8601"}`
- **Implementation**: apps/admin-api/src/routes/index.js:18-25

#### web (slimy-web)
- **Endpoint**: `http://127.0.0.1:3000/api/health`
- **Method**: HTTP GET via wget
- **Interval**: 30s
- **Timeout**: 5s
- **Retries**: 6
- **Start Period**: 30s
- **Response**: `{"ok": true, "ts": "ISO-8601", "env": "production"}`
- **Implementation**: apps/web/app/api/health/route.ts:5-18

#### caddy (slimy-caddy)
- **Dependency**: Waits for `web` to be healthy and `admin-api` to start
- **No explicit health check** (relies on upstream services)

#### loopback1455 (slimy-loopback1455)
- **Test**: `wget -q -O- http://127.0.0.1:1455`
- **Interval**: 30s
- **Timeout**: 5s
- **Retries**: 5

### Environment Variables

NUC2 uses centralized environment files in `/opt/slimy/secrets/`:

#### Database (.env.db.slimy-nuc2)
Required variables:
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name

#### Admin API (.env.admin.production)
Required variables:
- `JWT_SECRET` - Required for authentication (enforced at startup)
- `DB_URL` - Database connection string
- Additional service-specific configuration

Hardcoded environment in compose:
- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT=3080`
- `TRUST_PROXY=1`
- Various path configurations for uploads and backups

#### Web App (.env.web.production)
Required variables:
- Application-specific configuration

Hardcoded environment in compose:
- `HOST=0.0.0.0`
- `PORT=3000`
- `NEXT_TELEMETRY_DISABLED=1`

Build-time arguments:
- `NEXT_PUBLIC_ADMIN_API_BASE` (default: https://admin.slimyai.xyz)
- `NEXT_PUBLIC_SNELP_CODES_URL` (default: https://snelp.com/api/codes)
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (default: slimy.ai)

### Volume Mounts

#### External Volumes (persistent across container recreations)
- `postgres_data` → `/var/lib/postgresql/data` (maps to `slimyai-web_postgres_data`)
- `caddy_data` → `/data` (maps to `slimyai-web_caddy_data`)
- `caddy_config` → `/config` (maps to `slimyai-web_caddy_config`)

#### Host Bind Mounts
- `/opt/slimy/data/admin-api/data` → `/app/data`
- `/opt/slimy/data/admin-api/uploads` → `/var/lib/slimy/uploads`
- `/opt/slimy/backups/admin-api` → `/var/backups/slimy`
- `/opt/slimy/backups/postgres` → `/backups`
- `/opt/slimy/logs/admin-api` → `/app/logs`
- `/opt/slimy/logs/web` → `/app/logs`
- `./Caddyfile.slimy-nuc2` → `/etc/caddy/Caddyfile:ro`

### Reverse Proxy Configuration

Caddy handles multiple domains and routes traffic appropriately:

#### Domains Served
- `slimyai.xyz`, `www.slimyai.xyz` (main site)
- `login.slimyai.xyz` (login portal)
- `panel.slimyai.xyz` (admin panel)
- `slime.chat`, `www.slime.chat` (chat interface)
- `:8080` (local testing port)

#### Routing Rules
- `/api/bedrock-status` → web app (port 3000)
- `/api/*` (except bedrock) → admin-api (port 3080)
- All other paths → web app (port 3000)

#### Security Headers
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Compression: zstd, gzip

### Startup Logging

#### admin-api (apps/admin-api/server.js)
The admin-api has comprehensive startup logging:
- Line 40-41: Non-production mode warning
- Line 44: Database configuration warning
- Line 54: Startup success message with host:port
- Line 59: SIGINT shutdown message
- Line 70: Startup failure error

Example output:
```
[admin-api] Booting in non-production mode
[admin-api] Listening on http://0.0.0.0:3080
```

#### web (Next.js)
Next.js provides default startup logging:
- Build information
- Server listening confirmation
- Environment mode

### Timezone Handling

**Current State**: No explicit timezone configuration detected in docker-compose files.

**Implications**:
- Containers default to UTC (Alpine/Debian base images)
- Node.js timestamps use system timezone or UTC
- PostgreSQL defaults to system timezone or specified in connection string
- Health check timestamps use ISO-8601 format (timezone-aware)

**Recommendations**:
- If timezone consistency is required, set `TZ` environment variable in compose
- Alternatively, ensure all services use UTC and handle timezone conversion in application layer

---

## Infra Changes Made by Agent 6

### 1. Documentation Created

**File**: `docs/AGENT_6_REPORT.md` (this document)
- Comprehensive NUC2 configuration documentation
- Health check details with code locations
- Environment variable requirements
- NUC1 preparation plan

### 2. Observability Improvements

**Status**: No changes required

**Analysis**: The existing infrastructure already has:
- ✅ Health endpoints on all critical services (admin-api, web)
- ✅ Startup logging in admin-api
- ✅ Health checks configured in docker-compose
- ✅ Proper dependency management with health conditions

**Recommendation**: The current observability setup is production-ready. Adding additional logging or metrics should be considered only if specific operational issues arise.

### 3. Timezone Analysis

**Findings**: No timezone-related branches exist in the repository (checked via `git branch -a`).

**Current Behavior**:
- All timestamps in health endpoints use ISO-8601 format (timezone-aware)
- Docker containers default to UTC
- No timezone-specific configuration in compose files

**Risk Assessment**: Low
- ISO-8601 timestamps include timezone information
- UTC default is standard practice for server deployments
- No evidence of timezone-related issues in documentation

**Action Taken**: No changes required at this time.

---

## Plan for NUC1

### Current NUC1 Configuration

**Location**: `/opt/slimy/slimy-monorepo/infra/docker/docker-compose.slimy-nuc1.yml`

### Key Differences from NUC2

| Aspect | NUC1 | NUC2 |
|--------|------|------|
| **Database** | MySQL 8 | PostgreSQL 16 |
| **DB Container** | slimy-mysql | slimy-db |
| **Admin UI** | ✅ (port 3081) | ❌ Not deployed |
| **Reverse Proxy** | ❌ Direct port access | ✅ Caddy with TLS |
| **Loopback Service** | ❌ | ✅ Port 1455 |
| **Network Mode** | Bridge | Host (for Caddy) |
| **Env File Paths** | `/opt/slimy/app/`, `/opt/slimy/test/` | `/opt/slimy/secrets/` |
| **Volume Strategy** | Named volumes | External + bind mounts |

### Critical Considerations for NUC1

#### 1. Database Migration Path
**Challenge**: NUC1 uses MySQL 8, NUC2 uses PostgreSQL 16

**Implications**:
- Cannot directly share data between environments
- Different SQL dialects and features
- Different connection strings and drivers

**Recommendation**:
- If migrating from NUC1 to NUC2: Export MySQL data, convert to PostgreSQL
- If keeping both: Maintain separate database schemas and migration scripts
- Consider standardizing on PostgreSQL for all future deployments

#### 2. Environment Variable Consolidation

**Current State**: NUC1 uses multiple environment file locations:
- Admin API: `/opt/slimy/app/admin-api/.env.admin.production`
- Admin UI: `/opt/slimy/app/admin-ui/.env.production`
- Web: `/opt/slimy/test/slimyai-web/.env.production`

**NUC2 Pattern** (more organized):
- All secrets in: `/opt/slimy/secrets/`

**Action Required**:
- ✅ **Keep existing paths** if NUC1 is already running in production
- ⚠️ **Document differences** to avoid confusion during deployments
- 🔮 **Future**: Migrate NUC1 to `/opt/slimy/secrets/` pattern during next major update

#### 3. Missing Services

**admin-ui (NUC1 only)**:
- Purpose: Administrative interface on port 3081
- Tech: Next.js app with build-on-startup approach
- Status: Not deployed on NUC2
- **Decision needed**: Should NUC2 deploy admin-ui?

**Reverse Proxy (NUC2 only)**:
- NUC1 exposes services directly on ports 3000, 3080, 3081
- NUC2 uses Caddy for TLS termination and routing
- **Recommendation**: Add Caddy to NUC1 for consistent HTTPS handling

**loopback1455 (NUC2 only)**:
- Simple HTTP server for testing
- Not critical for production
- **Recommendation**: Optional for NUC1

#### 4. Network Configuration

**NUC1**: Uses bridge network `slimy-net`
- Containers communicate via container names
- External access via published ports

**NUC2**: Uses bridge network for apps, host network for Caddy
- Caddy on host network for direct port 80/443 access
- Apps on `slimy-network` bridge

**Action Required**: If adding Caddy to NUC1, switch to host network mode.

### Deployment Checklist for NUC1

When promoting NUC1 or deploying updates:

#### Pre-Deployment
- [ ] Verify environment files exist at expected paths
- [ ] Confirm database connection string matches MySQL format
- [ ] Backup existing data:
  - [ ] MySQL database dump
  - [ ] Volume snapshots (`slimy-db-data`, `admin-api-data`, `admin-api-uploads`)
- [ ] Review recent git changes: `git log --oneline -20`

#### Deployment
- [ ] Pull latest code: `git pull origin main`
- [ ] Run local build sequence:
  ```bash
  corepack enable && corepack prepare pnpm@10.22.0 --activate
  pnpm install
  pnpm --filter @slimy/web run db:generate
  pnpm build
  pnpm --filter @slimy/web test
  ```
- [ ] Navigate to docker directory: `cd infra/docker`
- [ ] Build images: `docker compose -f docker-compose.slimy-nuc1.yml build`
- [ ] Start services: `docker compose -f docker-compose.slimy-nuc1.yml up -d`

#### Post-Deployment
- [ ] Check container status: `docker compose -f docker-compose.slimy-nuc1.yml ps`
- [ ] Verify health endpoints:
  - [ ] `curl http://localhost:3080/api/health` (admin-api)
  - [ ] `curl http://localhost:3000/api/health` (web)
  - [ ] `curl http://localhost:3081` (admin-ui)
- [ ] Check logs for errors:
  - [ ] `docker compose -f docker-compose.slimy-nuc1.yml logs -f admin-api`
  - [ ] `docker compose -f docker-compose.slimy-nuc1.yml logs -f web`
  - [ ] `docker compose -f docker-compose.slimy-nuc1.yml logs -f admin-ui`
- [ ] Test key application flows (login, API calls, etc.)

#### Troubleshooting
If overlay2 errors occur:
```bash
# Safe cleanup (preserves data)
docker compose -f docker-compose.slimy-nuc1.yml down
docker builder prune -f
docker compose -f docker-compose.slimy-nuc1.yml build --no-cache
docker compose -f docker-compose.slimy-nuc1.yml up -d
```

### Environment Variables - Production Checklist

**Critical**: The following variables must NOT use dummy/test values in production:

#### Admin API
- [ ] `JWT_SECRET` - Strong random secret (enforced at startup, will fail if missing)
- [ ] `DB_URL` - Valid MySQL connection string for NUC1
- [ ] `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` - Database credentials
- [ ] `MYSQL_ROOT_PASSWORD` - MySQL root password

#### Web App
- [ ] `NEXT_PUBLIC_ADMIN_API_BASE` - Must point to actual admin API URL
- [ ] Database connection credentials (if using direct DB access)
- [ ] API keys for external services (OpenAI, analytics, etc.)

#### Admin UI (NUC1 only)
- [ ] Admin API endpoint configuration
- [ ] Authentication tokens/secrets

### Future Enhancements for NUC1

1. **Add Reverse Proxy**
   - Deploy Caddy similar to NUC2
   - Configure TLS certificates
   - Route traffic consistently

2. **Standardize Database**
   - Consider migrating to PostgreSQL (matches NUC2)
   - Or document why MySQL is required
   - Maintain separate migration paths

3. **Consolidate Environment Files**
   - Move all secrets to `/opt/slimy/secrets/`
   - Update compose file references
   - Document migration in runbook

4. **Add Monitoring**
   - Container health dashboards
   - Log aggregation
   - Alert on health check failures

5. **Backup Automation**
   - Automated database dumps
   - Volume snapshots
   - Off-site backup storage

---

## References

### Documentation Files
- `/DOCKER_DEPLOYMENT.md` - Main deployment guide
- `/infra/docker/NUC2_DOCKER_ADMIN_API_FIX.md` - Overlay2 troubleshooting
- `/infra/docker/docker-compose.slimy-nuc1.yml` - NUC1 configuration
- `/infra/docker/docker-compose.slimy-nuc2.yml` - NUC2 configuration
- `/infra/docker/Caddyfile.slimy-nuc2` - Reverse proxy rules

### Code References
- Health endpoint (web): `apps/web/app/api/health/route.ts:5-18`
- Health endpoint (admin-api): `apps/admin-api/src/routes/index.js:18-25`
- Startup logging: `apps/admin-api/server.js:31-73`

### Docker Resources
- Docker Compose Documentation: https://docs.docker.com/compose/
- Caddy Documentation: https://caddyserver.com/docs/
- PostgreSQL Docker: https://hub.docker.com/_/postgres
- MySQL Docker: https://hub.docker.com/_/mysql

---

## Conclusion

**NUC2 Status**: Production-ready ✅
- All services have health checks
- Comprehensive monitoring endpoints
- Proper dependency management
- Clear documentation

**NUC1 Status**: Functional, needs alignment 🔧
- Working configuration but differs from NUC2
- Missing reverse proxy (security concern)
- Different database engine (migration complexity)
- Environment files in multiple locations

**Agent 6 Recommendations**:
1. **No immediate changes required** - current setup is stable
2. **Document differences** - this report serves that purpose
3. **Plan NUC1 upgrades** - follow checklist above when ready
4. **Monitor for issues** - existing observability should surface problems

**Next Steps**:
- Review this report with operations team
- Decide on NUC1 reverse proxy deployment
- Plan database standardization (if needed)
- Schedule NUC1 environment consolidation

---

**Report Generated**: 2025-11-20
**Agent**: Agent 6
**Status**: Complete
