# Backup and Restore Guide

This guide provides step-by-step instructions for backing up and restoring critical Slimy.ai infrastructure data.

## Table of Contents

- [What to Back Up](#what-to-back-up)
- [Backup Procedures](#backup-procedures)
- [Restore Procedures](#restore-procedures)
- [Disaster Recovery](#disaster-recovery)
- [Known Gaps and Caveats](#known-gaps-and-caveats)

---

## What to Back Up

### Critical Data Categories

1. **Databases**
   - PostgreSQL database (nuc2 production)
   - MySQL database (nuc1 development)

2. **Application Data**
   - Admin API uploads: `/opt/slimy/data/admin-api/uploads`
   - Admin API data: `/opt/slimy/data/admin-api/data`

3. **Configuration Files**
   - Environment files in `/opt/slimy/secrets/`
   - Docker Compose configurations
   - Caddy configuration

4. **Docker Volumes**
   - `postgres_data` (PostgreSQL data)
   - `slimy-db-data` (MySQL data)
   - `caddy_data` (Caddy SSL certificates)
   - `caddy_config` (Caddy configuration)
   - `admin-api-data`, `admin-api-uploads`

5. **Logs (Optional)**
   - `/opt/slimy/logs/admin-api`
   - `/opt/slimy/logs/web`

---

## Backup Procedures

### 1. PostgreSQL Database Backup (nuc2)

**Automated Backup (Recommended):**

The nuc2 docker-compose configuration includes a backup mount at `/opt/slimy/backups/postgres`.

**Manual Backup:**

```bash
# Create backup directory if it doesn't exist
mkdir -p /opt/slimy/backups/postgres

# Dump database using docker exec
docker exec slimy-db pg_dump -U $POSTGRES_USER $POSTGRES_DB > \
  /opt/slimy/backups/postgres/backup_$(date +%Y%m%d_%H%M%S).sql

# Or dump with custom format (smaller, faster restore)
docker exec slimy-db pg_dump -U $POSTGRES_USER -Fc $POSTGRES_DB > \
  /opt/slimy/backups/postgres/backup_$(date +%Y%m%d_%H%M%S).dump

# Compress the backup
gzip /opt/slimy/backups/postgres/backup_*.sql
```

**Automated Daily Backup Script:**

Create `/opt/slimy/scripts/backup-postgres.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/slimy/backups/postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.dump"

# Create backup
docker exec slimy-db pg_dump -U postgres -Fc slimy_production > "${BACKUP_FILE}"

# Compress
gzip "${BACKUP_FILE}"

# Remove old backups
find "${BACKUP_DIR}" -name "backup_*.dump.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

**Add to crontab:**
```bash
# Daily at 2 AM
0 2 * * * /opt/slimy/scripts/backup-postgres.sh >> /opt/slimy/logs/backup.log 2>&1
```

---

### 2. MySQL Database Backup (nuc1)

**Manual Backup:**

```bash
# Create backup directory
mkdir -p /opt/slimy/backups/mysql

# Dump database
docker exec slimy-mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD \
  --all-databases --single-transaction --quick --lock-tables=false > \
  /opt/slimy/backups/mysql/backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip /opt/slimy/backups/mysql/backup_*.sql
```

**Automated Daily Backup Script:**

Create `/opt/slimy/scripts/backup-mysql.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/slimy/backups/mysql"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Read password from env file
source /opt/slimy/app/admin-api/.env.admin.production

# Create backup
docker exec slimy-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} \
  --all-databases --single-transaction --quick --lock-tables=false > "${BACKUP_FILE}"

# Compress
gzip "${BACKUP_FILE}"

# Remove old backups
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

---

### 3. Application Data Backup

**Admin API Uploads and Data (nuc2):**

```bash
# Create backup directory
mkdir -p /opt/slimy/backups/admin-api

# Backup uploads directory
tar -czf /opt/slimy/backups/admin-api/uploads_$(date +%Y%m%d_%H%M%S).tar.gz \
  -C /opt/slimy/data/admin-api uploads/

# Backup data directory
tar -czf /opt/slimy/backups/admin-api/data_$(date +%Y%m%d_%H%M%S).tar.gz \
  -C /opt/slimy/data/admin-api data/

# Keep only last 10 backups
cd /opt/slimy/backups/admin-api
ls -t uploads_*.tar.gz | tail -n +11 | xargs -r rm
ls -t data_*.tar.gz | tail -n +11 | xargs -r rm
```

---

### 4. Configuration Files Backup

**Environment Files and Secrets:**

```bash
# Create backup directory
mkdir -p /opt/slimy/backups/config

# Backup all secrets (ENCRYPTED!)
tar -czf /opt/slimy/backups/config/secrets_$(date +%Y%m%d_%H%M%S).tar.gz \
  /opt/slimy/secrets/

# IMPORTANT: Encrypt sensitive backups
gpg --symmetric --cipher-algo AES256 \
  /opt/slimy/backups/config/secrets_$(date +%Y%m%d_%H%M%S).tar.gz

# Remove unencrypted file
rm /opt/slimy/backups/config/secrets_*.tar.gz
# Keep only .gpg files
```

**Docker Compose and Caddy Configurations:**

```bash
# Backup infrastructure configs
tar -czf /opt/slimy/backups/config/infra_$(date +%Y%m%d_%H%M%S).tar.gz \
  /home/user/slimy-monorepo/infra/docker/
```

---

### 5. Docker Volumes Backup

**Backup All Named Volumes:**

```bash
# PostgreSQL data volume
docker run --rm \
  -v postgres_data:/data \
  -v /opt/slimy/backups/volumes:/backup \
  alpine tar -czf /backup/postgres_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Caddy data (SSL certificates)
docker run --rm \
  -v caddy_data:/data \
  -v /opt/slimy/backups/volumes:/backup \
  alpine tar -czf /backup/caddy_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Caddy config
docker run --rm \
  -v caddy_config:/data \
  -v /opt/slimy/backups/volumes:/backup \
  alpine tar -czf /backup/caddy_config_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

---

### 6. Complete System Backup Script

**All-in-One Backup:**

Create `/opt/slimy/scripts/backup-all.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_ROOT="/opt/slimy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_ROOT}/backup_${TIMESTAMP}.log"

echo "Starting full backup at $(date)" | tee "${LOG_FILE}"

# 1. Database backup
echo "Backing up PostgreSQL..." | tee -a "${LOG_FILE}"
docker exec slimy-db pg_dump -U postgres -Fc slimy_production > \
  "${BACKUP_ROOT}/postgres/db_${TIMESTAMP}.dump" 2>> "${LOG_FILE}"
gzip "${BACKUP_ROOT}/postgres/db_${TIMESTAMP}.dump"

# 2. Application data
echo "Backing up application data..." | tee -a "${LOG_FILE}"
tar -czf "${BACKUP_ROOT}/admin-api/uploads_${TIMESTAMP}.tar.gz" \
  -C /opt/slimy/data/admin-api uploads/ 2>> "${LOG_FILE}"
tar -czf "${BACKUP_ROOT}/admin-api/data_${TIMESTAMP}.tar.gz" \
  -C /opt/slimy/data/admin-api data/ 2>> "${LOG_FILE}"

# 3. Docker volumes (Caddy certs)
echo "Backing up Docker volumes..." | tee -a "${LOG_FILE}"
mkdir -p "${BACKUP_ROOT}/volumes"
docker run --rm -v caddy_data:/data -v "${BACKUP_ROOT}/volumes":/backup \
  alpine tar -czf "/backup/caddy_data_${TIMESTAMP}.tar.gz" -C /data . 2>> "${LOG_FILE}"

# 4. Cleanup old backups (keep 30 days)
echo "Cleaning up old backups..." | tee -a "${LOG_FILE}"
find "${BACKUP_ROOT}" -type f -name "*.gz" -mtime +30 -delete 2>> "${LOG_FILE}"
find "${BACKUP_ROOT}" -type f -name "*.dump.gz" -mtime +30 -delete 2>> "${LOG_FILE}"

echo "Backup completed at $(date)" | tee -a "${LOG_FILE}"
```

**Make it executable and add to cron:**
```bash
chmod +x /opt/slimy/scripts/backup-all.sh

# Add to crontab (daily at 3 AM)
0 3 * * * /opt/slimy/scripts/backup-all.sh
```

---

## Restore Procedures

### 1. Restore PostgreSQL Database

**From SQL Dump:**

```bash
# Copy backup to host if needed
cd /opt/slimy/backups/postgres

# Uncompress
gunzip backup_YYYYMMDD_HHMMSS.sql.gz

# Stop services that depend on database
docker compose -f docker-compose.slimy-nuc2.yml stop web admin-api

# Drop and recreate database (CAREFUL!)
docker exec -it slimy-db psql -U postgres -c "DROP DATABASE IF EXISTS slimy_production;"
docker exec -it slimy-db psql -U postgres -c "CREATE DATABASE slimy_production;"

# Restore from backup
docker exec -i slimy-db psql -U postgres slimy_production < backup_YYYYMMDD_HHMMSS.sql

# Restart services
docker compose -f docker-compose.slimy-nuc2.yml start admin-api web
```

**From Custom Format Dump:**

```bash
# Uncompress
gunzip backup_YYYYMMDD_HHMMSS.dump.gz

# Copy into container
docker cp backup_YYYYMMDD_HHMMSS.dump slimy-db:/tmp/

# Restore
docker exec -it slimy-db pg_restore -U postgres -d slimy_production -c /tmp/backup_YYYYMMDD_HHMMSS.dump

# Clean up
docker exec slimy-db rm /tmp/backup_YYYYMMDD_HHMMSS.dump
```

---

### 2. Restore MySQL Database (nuc1)

```bash
# Uncompress backup
cd /opt/slimy/backups/mysql
gunzip backup_YYYYMMDD_HHMMSS.sql.gz

# Stop dependent services
docker compose -f docker-compose.slimy-nuc1.yml stop web admin-api admin-ui

# Restore database
docker exec -i slimy-mysql mysql -u root -p$MYSQL_ROOT_PASSWORD < backup_YYYYMMDD_HHMMSS.sql

# Restart services
docker compose -f docker-compose.slimy-nuc1.yml start admin-api admin-ui web
```

---

### 3. Restore Application Data

**Admin API Uploads:**

```bash
# Stop admin-api
docker compose -f docker-compose.slimy-nuc2.yml stop admin-api

# Remove existing data (optional backup first!)
mv /opt/slimy/data/admin-api/uploads /opt/slimy/data/admin-api/uploads.old

# Extract backup
tar -xzf /opt/slimy/backups/admin-api/uploads_YYYYMMDD_HHMMSS.tar.gz \
  -C /opt/slimy/data/admin-api/

# Fix permissions
chown -R 1000:1000 /opt/slimy/data/admin-api/uploads

# Restart service
docker compose -f docker-compose.slimy-nuc2.yml start admin-api
```

**Admin API Data:**

```bash
# Stop admin-api
docker compose -f docker-compose.slimy-nuc2.yml stop admin-api

# Backup current data
mv /opt/slimy/data/admin-api/data /opt/slimy/data/admin-api/data.old

# Restore from backup
tar -xzf /opt/slimy/backups/admin-api/data_YYYYMMDD_HHMMSS.tar.gz \
  -C /opt/slimy/data/admin-api/

# Fix permissions
chown -R 1000:1000 /opt/slimy/data/admin-api/data

# Restart service
docker compose -f docker-compose.slimy-nuc2.yml start admin-api
```

---

### 4. Restore Configuration Files

**Environment Files (ENCRYPTED):**

```bash
# Decrypt backup
gpg --decrypt /opt/slimy/backups/config/secrets_YYYYMMDD_HHMMSS.tar.gz.gpg > \
  /tmp/secrets.tar.gz

# Extract (CAREFUL - will overwrite!)
tar -xzf /tmp/secrets.tar.gz -C /

# Secure cleanup
rm /tmp/secrets.tar.gz

# Restart all services to pick up new configs
docker compose -f docker-compose.slimy-nuc2.yml restart
```

---

### 5. Restore Docker Volumes

**PostgreSQL Data Volume:**

```bash
# Stop all services
docker compose -f docker-compose.slimy-nuc2.yml down

# Remove old volume (CAREFUL!)
docker volume rm postgres_data

# Create new volume
docker volume create postgres_data

# Restore from backup
docker run --rm \
  -v postgres_data:/data \
  -v /opt/slimy/backups/volumes:/backup \
  alpine tar -xzf /backup/postgres_data_YYYYMMDD_HHMMSS.tar.gz -C /data

# Restart services
docker compose -f docker-compose.slimy-nuc2.yml up -d
```

**Caddy Data (SSL Certificates):**

```bash
# Stop Caddy
docker compose -f docker-compose.slimy-nuc2.yml stop caddy

# Restore volume
docker run --rm \
  -v caddy_data:/data \
  -v /opt/slimy/backups/volumes:/backup \
  alpine sh -c "rm -rf /data/* && tar -xzf /backup/caddy_data_YYYYMMDD_HHMMSS.tar.gz -C /data"

# Restart Caddy
docker compose -f docker-compose.slimy-nuc2.yml start caddy
```

---

## Disaster Recovery

### Complete System Restoration to New Hardware

**Prerequisites:**
- Docker and Docker Compose installed
- Access to backup files (external storage or cloud)
- Monorepo code checked out
- Network/domain configuration complete

**Step-by-Step Recovery:**

```bash
# 1. Prepare system
sudo apt update && sudo apt install -y docker.io docker-compose gpg

# 2. Create directory structure
sudo mkdir -p /opt/slimy/{secrets,data,backups,logs}
sudo mkdir -p /opt/slimy/data/admin-api/{uploads,data}
sudo mkdir -p /opt/slimy/backups/{postgres,mysql,admin-api,config,volumes}
sudo mkdir -p /opt/slimy/logs/{admin-api,web}

# 3. Clone repository
git clone https://github.com/GurthBro0ks/slimy-monorepo.git /home/user/slimy-monorepo
cd /home/user/slimy-monorepo

# 4. Restore configuration files
# (decrypt and extract secrets backup as shown in section 4 above)

# 5. Create Docker volumes
docker volume create postgres_data
docker volume create caddy_data
docker volume create caddy_config

# 6. Restore volumes from backups
# (follow volume restore procedures from section 5 above)

# 7. Restore application data
# (follow application data restore from section 3 above)

# 8. Start services
cd /home/user/slimy-monorepo/infra/docker
docker compose -f docker-compose.slimy-nuc2.yml up -d

# 9. Verify services
docker ps  # Check all containers are running
curl http://localhost:3080/api/health
curl http://localhost:3000/api/health
curl https://slimyai.xyz/

# 10. Restore database if not using volume backup
# (follow database restore procedures from sections 1 or 2 above)
```

---

## Known Gaps and Caveats

### Missing from Documentation

1. **Minecraft Server Backups**
   - No Minecraft server configuration found in repository
   - If Minecraft worlds exist, manually back up:
     - World data directories
     - Server configuration files
     - Plugin/mod data

2. **Laptop "Control Center"**
   - No specific backup procedures documented
   - Likely contains:
     - SSH keys for server access
     - Local development environments
     - Deployment scripts
   - **Recommendation:** Back up `~/.ssh/`, project directories, and dotfiles

3. **VPS Configuration**
   - No VPS infrastructure documented
   - If VPS exists, document and back up separately

4. **Discord Bot Data**
   - Bot application mentioned in monorepo structure but no deployment found
   - Bot data and state may need separate backup procedures

### Important Caveats

1. **Secrets Encryption**
   - **ALWAYS** encrypt backups containing environment files
   - Store GPG encryption keys securely (password manager, hardware key)
   - Test decryption regularly

2. **Backup Testing**
   - **Test restores regularly** (quarterly recommended)
   - Partial restore tests can use nuc1 (development) environment
   - Document any restore issues discovered

3. **External Storage**
   - Current backup procedures assume local storage
   - **CRITICAL:** Copy backups to external location:
     - Cloud storage (AWS S3, Backblaze B2, etc.)
     - Network-attached storage (NAS)
     - External hard drives (keep offsite)

4. **Volume Backup Limitations**
   - Volume backups capture point-in-time snapshots
   - For databases, prefer database-native dump methods
   - Volume backups may be inconsistent if services are running

5. **Restore Order Matters**
   - Always restore in this order:
     1. Configuration files
     2. Docker volumes
     3. Databases
     4. Application data
     5. Start services

6. **Permissions**
   - Restored files may have wrong ownership
   - Check and fix with `chown` commands
   - Container user UID is typically 1000

### Recommended Improvements

1. **Implement automated offsite backups**
   - Use `rclone` for cloud sync
   - Schedule via cron

2. **Add backup monitoring**
   - Alert if backups fail
   - Track backup sizes and growth

3. **Document backup verification**
   - Checksum validation
   - Test restore procedures

4. **Create backup inventory**
   - Track what's backed up where
   - Document retention policies

---

## Quick Reference: Backup Commands

```bash
# Database (PostgreSQL)
docker exec slimy-db pg_dump -U postgres -Fc slimy_production | gzip > /opt/slimy/backups/postgres/backup_$(date +%Y%m%d).dump.gz

# Application Data
tar -czf /opt/slimy/backups/admin-api/uploads_$(date +%Y%m%d).tar.gz -C /opt/slimy/data/admin-api uploads/

# Configuration (encrypted)
tar -czf - /opt/slimy/secrets/ | gpg --symmetric --cipher-algo AES256 > /opt/slimy/backups/config/secrets_$(date +%Y%m%d).tar.gz.gpg

# Caddy Certificates
docker run --rm -v caddy_data:/data -v /opt/slimy/backups/volumes:/backup alpine tar -czf /backup/caddy_$(date +%Y%m%d).tar.gz -C /data .
```

---

Last updated by Claude Code (2025-11-19)
