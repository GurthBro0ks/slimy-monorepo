# Session Cleanup Documentation

## Overview

The admin-api service stores user sessions in a PostgreSQL database to manage authentication. Over time, expired sessions can accumulate and cause the database to grow unbounded. This document describes the session cleanup mechanism and how to use it.

## Session Storage

Sessions are stored in the `sessions` table with the following structure:

- `id`: Unique session identifier (CUID)
- `user_id`: Foreign key to the user
- `token`: Unique session token (JWT access token)
- `expires_at`: Expiration timestamp
- `created_at`: Creation timestamp

Sessions are indexed on `expires_at` for efficient cleanup queries.

## Cleanup Mechanism

### Automatic Cleanup

An automatic cleanup job runs every hour in the background (see `lib/session-store.js`). This job deletes sessions where `expires_at < now()`.

**Limitations of automatic cleanup:**
- Deletes all expired sessions in a single transaction
- Can cause database locks if many sessions have accumulated
- No batching or rate limiting

### Manual Cleanup (Recommended)

For safer, more controlled cleanup, use the batch-based cleanup script:

```bash
node scripts/cleanup-sessions.js
```

This script:
- Processes deletions in configurable batches (default: 1000)
- Adds delays between batches to avoid overwhelming the database
- Provides progress reporting
- Supports dry-run mode
- Allows customization of retention period

## Usage

### Basic Usage

Run the cleanup script with default settings (30-day retention, 1000 batch size):

```bash
cd apps/admin-api
node scripts/cleanup-sessions.js
```

### Dry Run

Preview what would be deleted without actually deleting:

```bash
node scripts/cleanup-sessions.js --dry-run
```

### Custom Retention Period

Delete sessions older than 60 days:

```bash
node scripts/cleanup-sessions.js --max-age 60
```

### Custom Batch Size and Delay

Process in smaller batches with longer delays (safer for production):

```bash
node scripts/cleanup-sessions.js --batch-size 500 --delay 200
```

### All Options

```bash
node scripts/cleanup-sessions.js --help
```

**Available options:**
- `--batch-size <number>`: Number of sessions to delete per batch (default: 1000)
- `--delay <number>`: Delay between batches in milliseconds (default: 100)
- `--max-age <number>`: Delete sessions older than N days (default: 30)
- `--dry-run`: Show what would be deleted without actually deleting
- `--help`: Show help message

## Scheduling Cleanup

### Cron (Recommended for NUC)

Add to your crontab (`crontab -e`):

```bash
# Run session cleanup daily at 2 AM
0 2 * * * cd /home/user/slimy-monorepo/apps/admin-api && node scripts/cleanup-sessions.js >> /var/log/admin-api/session-cleanup.log 2>&1
```

**Alternative schedules:**

```bash
# Run every 6 hours
0 */6 * * * cd /home/user/slimy-monorepo/apps/admin-api && node scripts/cleanup-sessions.js

# Run weekly on Sunday at 3 AM
0 3 * * 0 cd /home/user/slimy-monorepo/apps/admin-api && node scripts/cleanup-sessions.js

# Run monthly on the 1st at 4 AM
0 4 1 * * cd /home/user/slimy-monorepo/apps/admin-api && node scripts/cleanup-sessions.js
```

**Log rotation:**

Create `/etc/logrotate.d/admin-api-session-cleanup`:

```
/var/log/admin-api/session-cleanup.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
```

### Systemd Timer (Alternative)

Create `/etc/systemd/system/admin-api-session-cleanup.service`:

```ini
[Unit]
Description=Admin API Session Cleanup
After=postgresql.service

[Service]
Type=oneshot
User=www-data
Group=www-data
WorkingDirectory=/home/user/slimy-monorepo/apps/admin-api
ExecStart=/usr/bin/node scripts/cleanup-sessions.js
StandardOutput=journal
StandardError=journal
Environment="DATABASE_URL=postgresql://user:password@localhost:5432/admin_api"
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/admin-api-session-cleanup.timer`:

```ini
[Unit]
Description=Admin API Session Cleanup Timer
Requires=admin-api-session-cleanup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Enable and start the timer:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable admin-api-session-cleanup.timer
sudo systemctl start admin-api-session-cleanup.timer

# Check timer status
sudo systemctl status admin-api-session-cleanup.timer
sudo systemctl list-timers | grep session-cleanup
```

## Monitoring

### Check Session Count

```bash
# Connect to PostgreSQL
psql -U admin_api_user -d admin_api

# Count total sessions
SELECT COUNT(*) FROM sessions;

# Count expired sessions
SELECT COUNT(*) FROM sessions WHERE expires_at < NOW();

# Count sessions by age
SELECT
  CASE
    WHEN expires_at > NOW() THEN 'Active'
    WHEN expires_at > NOW() - INTERVAL '7 days' THEN '< 7 days old'
    WHEN expires_at > NOW() - INTERVAL '30 days' THEN '7-30 days old'
    WHEN expires_at > NOW() - INTERVAL '90 days' THEN '30-90 days old'
    ELSE '> 90 days old'
  END AS age_group,
  COUNT(*) as count
FROM sessions
GROUP BY age_group
ORDER BY age_group;
```

### View Cleanup Logs

If using cron:

```bash
tail -f /var/log/admin-api/session-cleanup.log
```

If using systemd:

```bash
journalctl -u admin-api-session-cleanup.service -f
```

## Performance Considerations

### Database Impact

- **Indexes**: The `expires_at` field is indexed for fast cleanup queries
- **Batch size**: Larger batches = faster cleanup but more database load
- **Delay**: Longer delays = slower cleanup but less database stress
- **Transaction size**: Each batch is a separate transaction to avoid long locks

### Recommendations

**Development/Testing:**
```bash
node scripts/cleanup-sessions.js --batch-size 100 --delay 50
```

**Production (low traffic):**
```bash
node scripts/cleanup-sessions.js --batch-size 1000 --delay 100
```

**Production (high traffic):**
```bash
node scripts/cleanup-sessions.js --batch-size 500 --delay 200
```

**Very large cleanups (thousands of sessions):**
```bash
# Run during low-traffic hours
node scripts/cleanup-sessions.js --batch-size 2000 --delay 500
```

## Troubleshooting

### Database Connection Errors

**Error:** `Database is not configured`

**Solution:** Ensure `DATABASE_URL` environment variable is set:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/admin_api"
node scripts/cleanup-sessions.js
```

### Permission Errors

**Error:** `permission denied` or `cannot delete`

**Solution:** Ensure the database user has DELETE permissions on the sessions table:

```sql
GRANT DELETE ON sessions TO admin_api_user;
```

### Out of Memory Errors

**Error:** `JavaScript heap out of memory`

**Solution:** Reduce batch size and increase delay:

```bash
node scripts/cleanup-sessions.js --batch-size 100 --delay 500
```

Or increase Node.js memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" node scripts/cleanup-sessions.js
```

### Cleanup Takes Too Long

**Issue:** Cleanup runs for hours

**Solution:**
1. Run during off-peak hours
2. Increase batch size (if database can handle it)
3. Consider one-time cleanup with aggressive settings, then schedule regular cleanups

```bash
# One-time aggressive cleanup
node scripts/cleanup-sessions.js --batch-size 5000 --delay 50

# Then schedule regular cleanups with conservative settings
crontab -e
# Add: 0 2 * * * cd /path/to/admin-api && node scripts/cleanup-sessions.js
```

## Security Considerations

- Sessions are automatically deleted when users are deleted (CASCADE constraint)
- Expired sessions are not automatically invalidated until cleaned up
- The JWT token itself expires after 12 hours (see `src/config.js`)
- Session tokens are unique and indexed for fast lookups
- Cleanup script requires database credentials (use environment variables)

## Migration Notes

This cleanup mechanism was added to prevent unbounded database growth. It does NOT:

- Modify the schema
- Change how sessions are created
- Change how sessions are validated
- Affect active sessions (only deletes expired ones)

The existing hourly cleanup job in `lib/session-store.js` continues to run but can be safely replaced with cron/systemd scheduled runs of the batch script.

## API Reference

### Database Method

```javascript
const database = require('./src/lib/database');

// Initialize database
await database.initialize();

// Run batched cleanup
const result = await database.cleanupExpiredSessionsBatched({
  batchSize: 1000,      // Sessions per batch
  delayMs: 100,         // Delay between batches
  maxAge: 30,           // Delete sessions older than N days
  onProgress: (batchNum, deletedCount, totalDeleted) => {
    console.log(`Batch ${batchNum}: deleted ${deletedCount}, total: ${totalDeleted}`);
  }
});

console.log(result);
// {
//   totalDeleted: 5432,
//   batchesProcessed: 6,
//   duration: 1234
// }

// Close connection
await database.close();
```

## Changelog

### 2024-11-19
- Initial implementation of batch-based cleanup
- Added CLI script with dry-run support
- Added comprehensive documentation
- Added cron and systemd timer examples

## Support

For issues or questions:
1. Check this documentation
2. Review the script help: `node scripts/cleanup-sessions.js --help`
3. Check logs for error messages
4. Verify database connectivity and permissions
5. Run with `--dry-run` to preview changes
