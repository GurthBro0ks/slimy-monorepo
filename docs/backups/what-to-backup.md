# Backup Inventory for slimy-monorepo

This document catalogs all critical infrastructure, data, and configuration that should be backed up regularly for the Slimy.ai platform.

---

## 1. Git Repositories

### GitHub Repositories
- **Repository**: `GurthBro0ks/slimy-monorepo`
  - **Location**: https://github.com/GurthBro0ks/slimy-monorepo
  - **What**: Complete monorepo including apps/web, apps/admin-api, infra configs
  - **Frequency**: Continuous (GitHub-hosted)
  - **Retention**: Indefinite via GitHub
  - **Notes**: Primary source of truth for all code, configs, and infrastructure definitions

### Local Development/Staging Clones
- **Location**: `/home/user/slimy-monorepo` (or wherever deployed)
  - **What**: Working directory, may contain uncommitted changes
  - **Frequency**: Daily if contains uncommitted work
  - **Retention**: 7 days
  - **Notes**: Verify all critical changes are pushed to GitHub

---

## 2. Databases

### PostgreSQL (Primary Production Database)

#### Database Files
- **Type**: PostgreSQL 16 (alpine)
- **Location**: Docker volume `slimyai-web_postgres_data`
  - **Mount Point**: `/var/lib/postgresql/data` (inside container)
  - **External Volume**: Managed by Docker
- **What**: All application data including:
  - User profiles and sessions
  - Discord guild configurations
  - Chat conversations and messages
  - Club analyses and metrics
  - Screenshot analyses and insights
  - Audit logs
  - User preferences and feature flags
- **Frequency**: **Daily** (critical data)
- **Retention**: **14 days** (configurable via `BACKUP_RETENTION_DAYS`)
- **Priority**: 🔴 CRITICAL

#### Database Backups (PostgreSQL Dumps)
- **Location**: `/opt/slimy/backups/postgres/`
  - **Mount Point**: `/backups` (inside postgres container)
- **Format**: SQL dumps (typically gzip compressed)
- **Frequency**: Daily automated dumps
- **Retention**: 14 days (as configured)
- **Notes**: Backup scripts exist in `apps/admin-api/src/routes/backup.js`

#### Database Connection Strings
- **Location**: `/opt/slimy/secrets/.env.db.slimy-nuc2`
- **What**: PostgreSQL connection credentials
- **Frequency**: On change
- **Retention**: Keep 2 most recent versions
- **Security**: ⚠️ Store encrypted or in secure vault

### MySQL/MariaDB (Legacy/Alternative)
- **Status**: Backup utilities exist but not currently in production config
- **Location**: `/var/backups/slimy/mysql/` (if configured)
- **Format**: Timestamped gzip files (`slimy-YYYYMMDDHHmmss.sql.gz`)
- **Frequency**: As triggered via admin API
- **Retention**: 14 days default
- **Notes**: See `apps/admin-api/src/util/mysql-dump.js`

---

## 3. Minecraft Infrastructure

**Status**: ❌ **NOT APPLICABLE**

This repository contains a Discord bot and web application (Slimy.ai) - there is no Minecraft server infrastructure, worlds, plugins, or configuration in this codebase.

---

## 4. Caddy Reverse Proxy Configuration

### Caddyfile Templates & Production Configs

#### Source-Controlled Caddyfiles (in Git)
- **Location**:
  - `apps/web/Caddyfile.template` (82 lines)
  - `infra/docker/Caddyfile.slimy-nuc2` (84 lines)
- **What**: Reverse proxy routing, TLS config, security headers
- **Frequency**: Backed up via Git (continuous)
- **Retention**: Indefinite (version controlled)
- **Priority**: 🟡 IMPORTANT

#### Caddy Runtime Data (Docker Volumes)

**TLS Certificates & State**
- **Location**: Docker volume `slimyai-web_caddy_data`
  - **External Volume**: `slimyai-web_caddy_data`
- **What**: Let's Encrypt certificates, ACME data, Caddy internal state
- **Frequency**: **Weekly** (certificates auto-renew)
- **Retention**: 30 days
- **Priority**: 🔴 CRITICAL (required for HTTPS)

**Caddy Runtime Config**
- **Location**: Docker volume `slimyai-web_caddy_config`
  - **External Volume**: `slimyai-web_caddy_config`
- **What**: Active Caddy configuration state
- **Frequency**: **On change** or weekly
- **Retention**: 14 days
- **Priority**: 🟡 IMPORTANT

---

## 5. Environment Files & Secrets

### Environment Configuration Files

⚠️ **SECURITY WARNING**: These files contain sensitive credentials. Never commit to Git. Store backups encrypted.

#### Admin API Environment
- **Location**: `/opt/slimy/secrets/` (assumed, not in repo)
  - Example templates in repo:
    - `apps/admin-api/.env.example`
    - `apps/admin-api/.env.admin.example`
    - `apps/admin-api/.env.admin.production.example`
- **What**:
  - `DATABASE_URL` (PostgreSQL connection string)
  - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` (OAuth)
  - `SESSION_SECRET`, `JWT_SECRET` (Auth tokens)
  - `OPENAI_API_KEY` (External AI API)
  - `COOKIE_DOMAIN`, CORS settings
  - Upload limits and file paths
- **Frequency**: **On change** (manual backup after any modification)
- **Retention**: Keep last 3 versions with timestamps
- **Priority**: 🔴 CRITICAL
- **Storage Method**:
  - Encrypted backup in secure location (NOT plain text)
  - Consider using HashiCorp Vault, AWS Secrets Manager, or encrypted git-crypt repo
  - Offline encrypted backup (gpg, age, or similar)

#### Web App Environment
- **Location**: `/opt/slimy/secrets/` (production)
  - Template: `apps/web/.env.example` (in repo)
- **What**: Similar secrets for web application
- **Frequency**: On change
- **Retention**: Last 3 versions
- **Priority**: 🔴 CRITICAL

#### Database-Specific Environment
- **File**: `/opt/slimy/secrets/.env.db.slimy-nuc2`
- **What**: PostgreSQL credentials for docker-compose
- **Frequency**: On change
- **Retention**: Last 2 versions
- **Priority**: 🔴 CRITICAL

---

## 6. Application Data & User-Generated Content

### Admin API Data Directory
- **Location**: `/opt/slimy/data/admin-api/`
  - **Mount Point**: `/app/data` (inside container)
- **What**:
  - Guild settings JSON files (e.g., `settings/1176605506912141444.json`)
  - Application state and runtime data
  - `data_store.json` persistence file
- **Frequency**: **Daily**
- **Retention**: 30 days
- **Priority**: 🟡 IMPORTANT

### User Uploads
- **Location**: `/opt/slimy/data/admin-api/uploads/`
  - **Mount Point**: `/var/lib/slimy/uploads` (inside container)
- **What**: User-uploaded images and files (club analysis images, screenshots, etc.)
- **Size**: Variable (10MB max per file default)
- **Frequency**: **Daily**
- **Retention**: 60 days (longer for user content)
- **Priority**: 🟡 IMPORTANT

### Web App Data Directory
- **Location**: `/opt/slimy/data/web/` (if separate)
- **What**:
  - `snail-events.json`
  - Rate limit data
  - Code samples
- **Frequency**: Daily
- **Retention**: 14 days
- **Priority**: 🟢 NICE TO HAVE

---

## 7. Logs & Monitoring Data

### Application Logs

#### Admin API Logs
- **Location**: `/opt/slimy/logs/admin-api/`
  - **Mount Point**: `/app/logs` (inside container)
- **Format**: JSON logs (10MB rotation configured in Caddyfile)
- **Frequency**: **Weekly** or when investigating issues
- **Retention**: 30 days active, 90 days archived
- **Priority**: 🟢 NICE TO HAVE (for troubleshooting)

#### Web App Logs
- **Location**: `/opt/slimy/logs/web/`
  - **Mount Point**: `/app/logs` (inside container)
- **Frequency**: Weekly
- **Retention**: 30 days active, 90 days archived
- **Priority**: 🟢 NICE TO HAVE

### Monitoring Configurations

#### Prometheus Configuration
- **Location**: `apps/admin-api/prometheus.yml` (in Git)
- **Frequency**: Backed up via Git
- **Priority**: 🟢 NICE TO HAVE

#### Grafana Dashboards
- **Location**: `apps/admin-api/grafana-dashboard.json` (in Git)
- **Location**: `apps/web/grafana/provisioning/datasources/prometheus.yml` (in Git)
- **Frequency**: Backed up via Git
- **Priority**: 🟢 NICE TO HAVE

#### Alertmanager Config
- **Location**: `apps/web/monitoring/alertmanager.yml` (in Git)
- **What**: SMTP settings for alerts (contains credentials)
- **Frequency**: Backed up via Git (sanitize secrets first)
- **Priority**: 🟢 NICE TO HAVE

---

## 8. Docker Infrastructure

### Docker Compose Files (in Git)
- **Location**:
  - `infra/docker/docker-compose.slimy-nuc2.yml` (production NUC2)
  - `infra/docker/docker-compose.slimy-nuc1.yml` (production NUC1)
  - `apps/web/docker-compose.yml`, `docker-compose.production.yml`, `docker-compose.monitoring.yml`
- **Frequency**: Backed up via Git (continuous)
- **Retention**: Indefinite (version controlled)
- **Priority**: 🟡 IMPORTANT

### Docker Volume Backups
Volumes are backed up implicitly through their mounted host directories (see sections above):
- `slimyai-web_postgres_data` → Database backups
- `slimyai-web_caddy_data` → TLS certificates
- `slimyai-web_caddy_config` → Caddy config

---

## 9. CI/CD & Automation

### GitHub Actions Workflows
- **Location**: `.github/workflows/` (in Git)
  - `test.yml` - Lint, build, test pipeline
  - `deploy-notify.yml` - Deployment notifications
- **Frequency**: Backed up via Git
- **Priority**: 🟢 NICE TO HAVE

### Deployment Scripts
- **Location**:
  - `apps/web/deploy-to-server.sh` (52 lines)
  - `apps/web/quickstart.sh` (97 lines)
  - `apps/web/setup-env.sh`
- **Frequency**: Backed up via Git
- **Priority**: 🟡 IMPORTANT

---

## 10. Documentation

### Critical Documentation (in Git)
- **Location**:
  - `README.md` - Monorepo overview
  - `docs/STRUCTURE.md` - Infrastructure layout
  - `apps/web/DEPLOYMENT.md`, `DEPLOYMENT_FIX.md`, `SLIME_CHAT_DEPLOYMENT.md`
  - `apps/admin-api/MONITORING_README.md`, `ERROR_HANDLING.md`
- **Frequency**: Backed up via Git
- **Priority**: 🟡 IMPORTANT

---

## Disaster Recovery Priorities

In the event of catastrophic failure, restore services in this order:

### Phase 1: Critical Infrastructure (0-2 hours)
**Goal**: Get authentication and core services online

1. **Environment Files & Secrets** 🔴
   - Restore all `.env` files to `/opt/slimy/secrets/`
   - Verify `DATABASE_URL`, Discord OAuth, JWT secrets
   - **Without this**: Nothing will start

2. **PostgreSQL Database** 🔴
   - Restore database from most recent backup
   - Verify data integrity (check user count, recent records)
   - **Without this**: No user data, sessions, or application state

3. **Git Repository** 🔴
   - Clone `GurthBro0ks/slimy-monorepo` from GitHub
   - Checkout appropriate branch/tag for production
   - **Without this**: No application code to deploy

4. **Caddy TLS Certificates** 🔴
   - Restore `caddy_data` volume or let Caddy re-issue certificates
   - Re-issuing takes ~1-5 minutes if DNS is correct
   - **Without this**: No HTTPS (can temporarily use HTTP for internal recovery)

### Phase 2: Application Services (2-4 hours)
**Goal**: Restore full application functionality

5. **Docker Compose Deployment**
   - Deploy containers using `infra/docker/docker-compose.slimy-nuc2.yml`
   - Verify health checks pass for all services
   - **Commands**:
     ```bash
     cd /opt/slimy/slimy-monorepo/infra/docker
     docker compose -f docker-compose.slimy-nuc2.yml up -d
     ```

6. **Application Data Directories**
   - Restore `/opt/slimy/data/admin-api/` (guild settings)
   - Verify JSON files are valid
   - **Without this**: Guild configurations lost, but can be rebuilt

7. **User Uploads**
   - Restore `/opt/slimy/data/admin-api/uploads/`
   - **Without this**: Uploaded images/files lost (not critical for service operation)

### Phase 3: Monitoring & Logging (4-8 hours)
**Goal**: Restore observability and long-term data

8. **Caddy Configuration Volume**
   - Restore `caddy_config` volume if custom runtime config exists
   - Not critical if Caddyfile templates are available

9. **Monitoring Stack**
   - Redeploy Prometheus, Grafana, Alertmanager
   - Restore Grafana dashboards (already in Git)
   - Historical metrics will be lost (acceptable)

10. **Logs**
    - Restore recent logs from `/opt/slimy/logs/` if needed for forensics
    - Not critical for service restoration

### Phase 4: Validation (Post-Recovery)
**Checklist**:
- [ ] Can users log in via Discord OAuth?
- [ ] Can users view their guild settings?
- [ ] Can users upload files?
- [ ] Are chat conversations accessible?
- [ ] Is HTTPS working with valid certificates?
- [ ] Are health checks (`/api/health`) returning 200 OK?
- [ ] Are metrics being collected (`/api/metrics`)?
- [ ] Are backups running successfully post-recovery?

---

## Backup Verification Checklist

Run these checks monthly to ensure backups are functional:

- [ ] **Database Restore Test**: Restore PostgreSQL backup to staging environment, verify data integrity
- [ ] **Secret Accessibility Test**: Verify encrypted secrets can be decrypted
- [ ] **Docker Volume Snapshots**: Verify volumes are being snapshotted correctly
- [ ] **Git Repository Access**: Confirm GitHub repository is accessible and up-to-date
- [ ] **TLS Certificate Validity**: Check Caddy certificates are valid and auto-renewing
- [ ] **Backup Age**: Ensure most recent database backup is <24 hours old
- [ ] **Backup Retention**: Confirm old backups are being cleaned up per retention policy
- [ ] **Documentation Currency**: Review this document and update as infrastructure changes

---

## Backup Automation Recommendations

### Existing Backup System
- **Location**: `apps/admin-api/src/routes/backup.js`
- **Capabilities**:
  - API-triggered MySQL dumps
  - Lists backups from configured directories
  - Async task execution
- **Configuration**: `apps/admin-api/src/config.js` (lines 100-106)

### Suggested Additions
1. **Automated Daily PostgreSQL Dumps**
   - Use `pg_dump` from within postgres container
   - Cron job or systemd timer on host
   - Example:
     ```bash
     docker exec slimy-db pg_dump -U $DB_USER -Fc $DB_NAME > /opt/slimy/backups/postgres/slimy-$(date +%Y%m%d-%H%M%S).dump
     ```

2. **Backup Rotation Script**
   - Automatically delete backups older than `BACKUP_RETENTION_DAYS`
   - Implement in existing backup.js or separate cron

3. **Off-site Backup Sync**
   - Sync `/opt/slimy/backups/` to remote storage (S3, B2, rsync.net)
   - Encrypt before transmission
   - Example: `rclone sync /opt/slimy/backups/ remote:slimy-backups/ --encrypt`

4. **Docker Volume Snapshots**
   - Use Docker volume plugins or backup utilities
   - Example: `docker run --rm -v slimyai-web_postgres_data:/data -v /opt/slimy/backups/volumes:/backup alpine tar czf /backup/postgres_data-$(date +%Y%m%d).tar.gz -C /data .`

5. **Health Monitoring for Backups**
   - Add metrics to `/api/metrics` for backup age and success/failure
   - Alert if backups are >36 hours old

---

## Backup Storage Requirements

Based on retention policies, estimate storage needs:

| Item | Size (Estimate) | Daily Growth | 30-Day Total |
|------|----------------|--------------|--------------|
| PostgreSQL Dumps (compressed) | 50-500 MB | 50 MB | ~1.5 GB (14 days) |
| User Uploads | Variable | 100 MB | ~6 GB (60 days) |
| Application Data | 10-50 MB | 1 MB | ~30 MB |
| Logs (compressed) | 50 MB/day | 50 MB | ~4.5 GB (90 days) |
| Docker Volumes | 500 MB | 10 MB | ~500 MB (snapshots) |
| **Total** | - | - | **~12-15 GB** |

**Recommendation**: Provision at least **50 GB** for backup storage to account for growth and temporary files.

---

## Summary Table

| Category | Critical Items | Frequency | Retention | Priority |
|----------|---------------|-----------|-----------|----------|
| **Git Repos** | slimy-monorepo | Continuous | Indefinite | 🔴 CRITICAL |
| **Databases** | PostgreSQL data + dumps | Daily | 14 days | 🔴 CRITICAL |
| **Caddy** | TLS certs, Caddyfiles | Weekly | 30 days | 🔴 CRITICAL |
| **Secrets** | All .env files | On change | 3 versions | 🔴 CRITICAL |
| **User Data** | Uploads, app data | Daily | 30-60 days | 🟡 IMPORTANT |
| **Logs** | Application logs | Weekly | 30-90 days | 🟢 NICE TO HAVE |
| **Monitoring** | Grafana, Prometheus configs | Via Git | Indefinite | 🟢 NICE TO HAVE |

---

**Document Version**: 1.0
**Last Updated**: 2025-11-19
**Next Review**: 2025-12-19
