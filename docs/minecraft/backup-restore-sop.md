# Minecraft Server Backup & Restore SOP

## Overview

This document outlines Standard Operating Procedures (SOP) for safely backing up and restoring Minecraft server data. Following these procedures will help prevent data loss and ensure smooth disaster recovery.

---

## What Should Be Backed Up

### Critical Data
1. **World Data** (Highest Priority)
   - Main world folder (e.g., `world/`, `world_nether/`, `world_the_end/`)
   - Contains region files, player data, structures, and level.dat
   - Size: Can range from 100MB to 50GB+ depending on world age/size

2. **Server Configuration Files**
   - `server.properties` - Core server settings
   - `bukkit.yml`, `spigot.yml`, `paper.yml` - Server platform configs (if applicable)
   - `permissions.yml`, `ops.json` - Operator and permission lists
   - `whitelist.json`, `banned-players.json`, `banned-ips.json` - Access control
   - `eula.txt` - EULA acceptance record

3. **Plugin Data**
   - `plugins/` folder - All installed plugin JARs
   - Plugin configuration folders (varies by plugin):
     - `plugins/<PluginName>/config.yml`
     - `plugins/<PluginName>/data/`
     - `plugins/<PluginName>/userdata/`
   - Plugin databases (if using SQLite)

4. **Squaremap/Dynmap Data** (if installed)
   - `plugins/squaremap/web/` - Rendered map tiles
   - `plugins/dynmap/web/` - Rendered map tiles (for Dynmap)
   - Configuration: `plugins/squaremap/config.yml`
   - Note: Map tiles can be 1GB-50GB+; consider if re-rendering is acceptable

5. **Logs** (Optional but Recommended)
   - `logs/latest.log` and `logs/*.log.gz` - Server logs
   - Useful for troubleshooting issues post-restore

---

## Typical File Locations

### Linux (Docker/Native)
```
$SERVER_ROOT/
├── world/              # Overworld
├── world_nether/       # Nether dimension
├── world_the_end/      # End dimension
├── plugins/            # Plugin JARs and data
├── server.properties   # Main config
├── ops.json           # Server operators
├── whitelist.json     # Whitelisted players
├── banned-*.json      # Ban lists
└── logs/              # Server logs
```

### Windows
```
C:\MinecraftServer\
├── world\
├── world_nether\
├── world_the_end\
├── plugins\
├── server.properties
└── ...
```

### Docker Volumes
```
# Common Docker mount points:
/data/              # When using itzg/minecraft-server
/minecraft/         # Alternative common mount
/opt/minecraft/     # Another common location

# Check your docker-compose.yml for actual paths
```

---

## Backup Methods

### Method 1: Safe Shutdown Backup (Recommended)

**Best for:**
- Scheduled maintenance windows
- Critical pre-update backups
- Maximum data integrity

**Steps:**
1. Announce planned shutdown to players (5-10 min warning)
2. Stop the server: `stop` command in console or `docker stop <container>`
3. Wait for server to fully shut down (check logs for "Closing Server")
4. Perform backup using preferred method below
5. Restart server

**Backup Commands:**
```bash
# Linux/Mac - Using tar with compression
cd /path/to/minecraft
tar -czf backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  world/ world_nether/ world_the_end/ \
  plugins/ server.properties *.json *.yml

# Linux/Mac - Using rsync (incremental)
rsync -av --delete /path/to/minecraft/ /path/to/backup/minecraft/

# Windows - Using 7zip
7z a -tzip backups\backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.zip ^
  world world_nether world_the_end plugins server.properties *.json
```

### Method 2: Hot Backup (Server Running)

**Best for:**
- Frequent automated backups
- Servers that can't afford downtime

**Risks:**
- Possible file inconsistency if backup occurs during chunk saves
- Corrupted chunks are possible (though rare with modern servers)

**Steps:**
1. Issue `save-all` command in server console
2. Wait 5-10 seconds for flush to complete
3. (Optional) Issue `save-off` to pause auto-saves
4. Perform backup using same commands as Method 1
5. (If used save-off) Issue `save-on` to resume auto-saves

**Recommended Automation:**
```bash
#!/bin/bash
# Example hot backup script
BACKUP_DIR="/backups/minecraft"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Send commands to server (using screen, tmux, or rcon)
screen -S minecraft -p 0 -X stuff "save-all^M"
sleep 10

# Perform backup
tar -czf "$BACKUP_DIR/world-$TIMESTAMP.tar.gz" \
  world/ world_nether/ world_the_end/

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -name "world-*.tar.gz" -mtime +7 -delete
```

### Method 3: Docker Volume Backup

**For Docker deployments:**
```bash
# Stop container
docker stop minecraft-server

# Backup volume
docker run --rm \
  -v minecraft-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/minecraft-backup-$(date +%Y%m%d).tar.gz /data

# Restart container
docker start minecraft-server
```

---

## Quick Backup Checklist

Use this checklist for routine backups:

- [ ] **Announce** - Warn players if doing safe shutdown
- [ ] **Save** - Issue `save-all` command (hot) OR stop server (safe)
- [ ] **Wait** - 10 seconds for flush OR full shutdown
- [ ] **Backup** - Execute backup command/script
- [ ] **Verify** - Check backup file exists and has reasonable size
- [ ] **Resume** - Restart server (if stopped) OR re-enable saves (if save-off used)
- [ ] **Test** - Periodically test restore process (monthly recommended)
- [ ] **Rotate** - Delete old backups per retention policy
- [ ] **Offsite** - Copy critical backups to offsite/cloud storage

**Recommended Backup Frequency:**
- **Hourly**: World data only (hot backup)
- **Daily**: Full backup including configs and plugins
- **Weekly**: Full backup + offsite copy
- **Pre-update**: Full backup before any server/plugin updates

---

## Disaster Recovery: World Restore Flow

### Scenario: World corruption detected or need to rollback

**Step 1: Assess Damage**
- [ ] Identify what needs restoration (full world, single region, configs)
- [ ] Select appropriate backup (most recent OR specific timestamp)
- [ ] Verify backup integrity (`tar -tzf backup.tar.gz` to list contents)

**Step 2: Prepare for Restore**
- [ ] **CRITICAL**: Stop the Minecraft server completely
- [ ] Verify server is stopped: `ps aux | grep java` (no minecraft process)
- [ ] Announce downtime to players (Discord, website, etc.)

**Step 3: Backup Current State (Safety Net)**
```bash
# Even if corrupted, keep a copy just in case
mv world world.broken-$(date +%Y%m%d-%H%M%S)
mv world_nether world_nether.broken-$(date +%Y%m%d-%H%M%S)
mv world_the_end world_the_end.broken-$(date +%Y%m%d-%H%M%S)
```

**Step 4: Restore from Backup**

**Option A: Full Restore**
```bash
# Extract backup
cd /path/to/minecraft
tar -xzf /path/to/backup/backup-20240115-120000.tar.gz

# Verify extracted files
ls -lh world/level.dat  # Should exist and have reasonable size
```

**Option B: Selective Restore (e.g., only world data)**
```bash
# Extract only specific directories
tar -xzf backup.tar.gz world/ world_nether/ world_the_end/
```

**Option C: Docker Volume Restore**
```bash
# Stop container
docker stop minecraft-server

# Remove old volume
docker volume rm minecraft-data

# Create new volume
docker volume create minecraft-data

# Restore from backup
docker run --rm \
  -v minecraft-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/minecraft-backup-20240115.tar.gz -C /
```

**Step 5: Verify and Test**
- [ ] Check file permissions: `chown -R minecraft:minecraft world/` (if applicable)
- [ ] Verify level.dat exists: `ls -lh world/level.dat`
- [ ] Start server in test mode if possible
- [ ] Monitor server logs for errors during startup
- [ ] Check first few chunks load correctly

**Step 6: Resume Operations**
- [ ] Once verified, announce server is back online
- [ ] Monitor for player-reported issues
- [ ] Document what happened and what was restored

**Step 7: Post-Restore Actions**
- [ ] Review backup procedures (were they adequate?)
- [ ] Update documentation if new issues discovered
- [ ] Consider increasing backup frequency if needed
- [ ] Test restored data integrity over next 24-48 hours

---

## ⚠️ Critical Warnings: What NOT to Do

### 🛑 NEVER: Restore While Server is Running
**Why:** File corruption, data races, instant crash or silent data loss
**Result:** You'll corrupt BOTH the backup and current data

### 🛑 NEVER: Overwrite Without a Safety Backup
**Why:** If restoration fails, you lose both corrupted and backup data
**Result:** Complete unrecoverable data loss
**Always:** Rename current world to `.broken` or `.old` before restore

### 🛑 NEVER: Restore Partial Plugin Data
**Why:** Plugin config/data versions must match
**Example:** Restoring old EssentialsX data with new plugin version causes errors
**Do instead:** Restore plugin JAR + config + data as a complete set

### 🛑 NEVER: Skip Backup Verification
**Why:** Corrupted backups are useless during disasters
**Result:** Discovering backup is corrupt when you need it most
**Do instead:** Monthly restore tests to verify backup integrity

### 🛑 NEVER: Mix Backup Sources
**Why:** Timestamp mismatches cause inconsistencies
**Example:** Restoring world from Monday + plugins from Wednesday = player inventory loss
**Do instead:** Restore all components from the same timestamp

### 🛑 NEVER: Forget Permission Fixes
**Why:** Server may not be able to read/write restored files
**Result:** Server crashes on startup or can't save changes
**Do instead:** Always run `chown` after restore on Linux

### 🛑 NEVER: Restore During High Load
**Why:** Players might join during restore, causing corruption
**Result:** Confusing half-restored state
**Do instead:** Restore during scheduled maintenance or off-peak hours

### 🛑 NEVER: Delete Backups Without Retention Policy
**Why:** Disk fills up OR you delete the backup you need
**Result:** No available backups when needed
**Do instead:** Implement 7-day rolling + monthly archive policy

### 🛑 NEVER: Store Backups Only on Same Disk
**Why:** Hardware failure destroys backups AND live data
**Result:** Total data loss from single failure
**Do instead:** Keep copies on different physical disks + cloud/offsite

### 🛑 NEVER: Use Copy/Paste Instead of Proper Tools
**Why:** Hidden files, permissions, and symlinks get lost
**Result:** Incomplete backups that fail during restore
**Do instead:** Use `tar`, `rsync`, or proper backup tools

---

## Backup Retention Policy (Example)

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Hot World   | Every 1hr | 24 hours  | Local disk       |
| Full Daily  | Daily     | 7 days    | Local disk       |
| Weekly      | Sunday    | 4 weeks   | NAS/Secondary    |
| Monthly     | 1st day   | 12 months | Cloud/Offsite    |
| Pre-update  | As needed | Until verified | Local + Cloud |

**Storage Requirements Example:**
- Average world size: 5GB
- Hourly backups (24): ~120GB
- Daily backups (7): ~35GB
- Weekly (4): ~20GB
- Monthly (12): ~60GB
- **Total**: ~235GB storage needed

**Compression:** Use `gzip` (-z flag) or `xz` for 30-50% size reduction

---

## Quick Reference Commands

### Check Backup Integrity
```bash
# List contents without extracting
tar -tzf backup.tar.gz | head -20

# Verify archive integrity
tar -tzf backup.tar.gz > /dev/null && echo "OK" || echo "CORRUPT"
```

### Find Backup by Date
```bash
# List backups sorted by date
ls -lht /backups/minecraft/

# Find backups from specific day
ls /backups/ | grep 20240115
```

### Check World Size
```bash
# Check before backup to estimate size
du -sh world/ world_nether/ world_the_end/
```

### Monitor Backup Process
```bash
# Create backup with progress
tar -czf - world/ | pv > backup.tar.gz

# Or use tar verbose mode
tar -czvf backup.tar.gz world/
```

---

## Additional Resources

### Recommended Tools
- **Linux Backups**: `rsync`, `tar`, `restic`, `duplicity`
- **Windows Backups**: 7zip, Robocopy, Windows Backup
- **Docker**: `docker volume` commands, `docker cp`
- **Automation**: `cron` (Linux), Task Scheduler (Windows)
- **Remote**: `rclone` (cloud sync), `scp`, `rsync over ssh`

### Plugin-Specific Backup Considerations

**WorldEdit/FAWE:**
- Backup `//schem` folder for saved schematics
- No special procedures needed

**LuckPerms:**
- Backup `plugins/LuckPerms/` for all permissions data
- Or use built-in export: `/lp export <file>`

**CoreProtect:**
- Database can be very large (10GB+)
- Consider separate backup schedule
- Can regenerate from logs if needed (time-consuming)

**EssentialsX:**
- Backup `plugins/Essentials/userdata/` for player data
- Includes homes, balances, kits used, etc.

**Squaremap:**
- Tiles folder can be huge (50GB+)
- Low priority - can always re-render
- Consider excluding from hourly backups

---

## Testing Your Backups

**Monthly Backup Test Procedure:**

1. Select random backup from last month
2. Set up isolated test environment (different port/folder)
3. Restore backup following SOP
4. Start test server and verify:
   - World loads correctly
   - Player data intact (check random player inventories)
   - Plugins activate without errors
   - No corruption warnings in logs
5. Document results in backup log
6. If failure: investigate and fix backup procedure

**Why Test?**
> "Untested backups are just wishful thinking." - Every SysAdmin

---

## Emergency Contact & Escalation

- **Server Admin**: [Contact Info]
- **Backup Storage**: [Location/Credentials]
- **Hosting Provider**: [Support Contact]
- **Documentation**: This SOP + [Other Resources]

**When to Escalate:**
- Multiple backup failures in a row
- Corruption affecting multiple worlds
- Backup storage running out of space
- Restore fails repeatedly

---

## Document Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-15 | 1.0 | Initial SOP creation | - |

---

## Appendix: Common Error Messages

### "level.dat not found"
- **Cause**: Incomplete world backup or restore
- **Fix**: Restore from earlier backup, verify tar extraction

### "Failed to load world: corrupted"
- **Cause**: Backup taken while saving, disk error
- **Fix**: Try previous backup, use recovery tools

### "Permission denied" on startup
- **Cause**: Wrong file ownership after restore
- **Fix**: `chown -R minecraft:minecraft /path/to/world`

### Backup script hangs
- **Cause**: save-all never completes, disk full
- **Fix**: Check disk space, verify server responding

---

**Remember: The best disaster recovery plan is the one you've tested.**
