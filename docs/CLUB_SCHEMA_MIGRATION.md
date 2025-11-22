# Club Analytics Schema Migration Guide

## Overview

This document describes how to apply the club analytics database schema to your MySQL/MariaDB instance.

The club analytics feature tracks guild member power metrics (SIM and Total Power) over time, parsed from game screenshots via OCR. The schema consists of two main tables:

- **`club_metrics`** - Historical time-series data of all observed member power levels
- **`club_latest`** - Aggregated "current" view showing the most recent metrics per member

## What This Schema Does

### Tables Created

1. **club_metrics**
   - Stores all historical observations of member power metrics
   - Each row represents one OCR parse result for one member at a specific time
   - Includes: guild_id, member_key (normalized name), name, sim_power, total_power, observed_at
   - Unique constraint on (guild_id, member_key, observed_at)

2. **club_latest**
   - Stores the most recent/current metrics per member
   - Updated by the `recomputeLatest()` function in club-store.js
   - Includes: guild_id, member_key, name, sim_power, total_power, last_seen_at
   - Unique constraint on (guild_id, member_key)

### Indexes Created

- **club_metrics**: Indexed on (guild_id, member_key) and observed_at for fast queries
- **club_latest**: Indexed on guild_id and total_power (for leaderboard sorting)

## Prerequisites

- MySQL 5.7+ or MariaDB 10.2+
- Database user with CREATE TABLE and ALTER TABLE privileges
- Backup of existing database (always backup before schema changes!)

## Applying the Schema

### Option 1: Manual Application (Recommended for Production)

1. **Backup your database first:**
   ```bash
   mysqldump -u <user> -p <database> > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Connect to your database:**
   ```bash
   mysql -u <user> -p <database>
   ```

3. **Apply the schema:**
   ```sql
   SOURCE /path/to/slimy-monorepo/apps/admin-api/lib/club-schema.sql;
   ```

   Or from the command line:
   ```bash
   mysql -u <user> -p <database> < apps/admin-api/lib/club-schema.sql
   ```

4. **Verify the tables were created:**
   ```sql
   SHOW TABLES LIKE 'club_%';
   DESCRIBE club_metrics;
   DESCRIBE club_latest;
   ```

### Option 2: Using the Helper Script

A helper script is provided for convenience:

```bash
cd /path/to/slimy-monorepo
export DB_URL='mysql://user:password@host:port/database'
./scripts/apply-club-schema.sh
```

**Note:** The script will echo the commands it would run but requires manual confirmation before executing destructive operations.

### Option 3: Using Docker/Docker Compose

If running admin-api in Docker:

1. **Copy schema into container:**
   ```bash
   docker cp apps/admin-api/lib/club-schema.sql <container_name>:/tmp/club-schema.sql
   ```

2. **Execute inside container:**
   ```bash
   docker exec -it <container_name> mysql -u <user> -p <database> < /tmp/club-schema.sql
   ```

## Database Configuration

The admin-api uses the `DB_URL` environment variable to connect to the database:

```bash
DB_URL=mysql://username:password@hostname:port/database
```

Example:
```bash
DB_URL=mysql://admin:secretpassword@localhost:3306/slimy
```

## Applying on Staging

### Staging Deployment Checklist

- [ ] **Backup staging database**
  ```bash
  mysqldump -u <user> -p <database> > staging-backup-$(date +%Y%m%d-%H%M%S).sql
  ```

- [ ] **Stop admin-api service** (prevents writes during migration)
  ```bash
  docker-compose -f docker-compose.staging.yml stop admin-api
  ```

- [ ] **Apply schema**
  ```bash
  mysql -u <user> -p <database> < apps/admin-api/lib/club-schema.sql
  ```

- [ ] **Verify tables and indexes**
  ```sql
  SHOW TABLES LIKE 'club_%';
  SHOW CREATE TABLE club_metrics;
  SHOW CREATE TABLE club_latest;
  ```

- [ ] **Restart admin-api service**
  ```bash
  docker-compose -f docker-compose.staging.yml start admin-api
  ```

- [ ] **Test club endpoints** (see below)

## After Applying Schema

Once the schema is applied, you can verify the club analytics integration:

### 1. Check Database Tables

```sql
SELECT COUNT(*) FROM club_metrics;
SELECT COUNT(*) FROM club_latest;
```

Both should return 0 initially (no data yet).

### 2. Test Admin-API Endpoints

Use the new club endpoints to verify functionality:

```bash
# Get latest club metrics for a guild
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/guilds/<guildId>/club/latest

# Expected response (initially empty):
{
  "ok": true,
  "guildId": "<guildId>",
  "members": []
}
```

### 3. Trigger Ingestion

Once you have OCR screenshot data, the admin-api will automatically populate these tables via:
- OCR parsing → `club-vision.js`
- Metrics storage → `club-store.js`
- Latest aggregation → `recomputeLatest()`

## Rollback

If you need to rollback the schema changes:

```sql
DROP TABLE IF EXISTS club_latest;
DROP TABLE IF EXISTS club_metrics;
```

Then restore from your backup:
```bash
mysql -u <user> -p <database> < backup-YYYYMMDD-HHMMSS.sql
```

## Troubleshooting

### "Table already exists" errors

The schema uses `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times. If you see errors about existing tables, the schema is likely already applied.

### Permission errors

Ensure your database user has these privileges:
```sql
GRANT CREATE, ALTER, INDEX ON <database>.* TO '<user>'@'%';
FLUSH PRIVILEGES;
```

### Character encoding issues

The schema uses `utf8mb4_unicode_ci` for proper Unicode support (emojis, international characters). If you see encoding issues, verify your database default charset:

```sql
SHOW VARIABLES LIKE 'character_set%';
```

## Next Steps

After applying the schema:
1. Configure admin-api OCR ingestion pipeline (see `lib/club-ingest.js`)
2. Set up frontend to call `/api/guilds/:guildId/club/latest`
3. Optionally configure Google Sheets export (see `lib/club-sheets.js`)

For API documentation, see the admin-api README or `/api/guilds/:guildId/club` endpoint docs.
