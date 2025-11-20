# Minecraft Operations Guide

## Overview

This guide covers Minecraft-specific operational tasks for the Slimy platform. The platform includes monitoring for Minecraft servers via the `/api/bedrock-status` endpoint. This document assumes you're working with a Minecraft server setup that includes:

- **Paper** - High-performance Minecraft Java Edition server
- **Geyser** - Protocol bridge enabling Bedrock Edition clients
- **squaremap** - Live web-based map rendering
- Standard ports: **25565** (Java) and **19132** (Bedrock)

**IMPORTANT:** The Minecraft server infrastructure appears to be external to this repository. The slimy-monorepo contains a monitoring endpoint (`/api/bedrock-status`) but not the server itself.

## Architecture

```
┌─────────────────────────────────────┐
│     Slimy Platform (slimy-nuc2)     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Web App (port 3000)          │  │
│  │                               │  │
│  │  GET /api/bedrock-status      │◄─┼──── User queries server status
│  └───────────┬───────────────────┘  │
│              │ HTTP request         │
└──────────────┼──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Minecraft Server (External Host)  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Paper Server (Java)        │   │
│  │  Port: 25565 (TCP)          │◄──┼──── Java Edition clients
│  │                             │   │
│  │  Plugins:                   │   │
│  │  • Geyser (Bedrock bridge)  │   │
│  │  • squaremap (Web map)      │   │
│  │  • (others...)              │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│  ┌──────────▼──────────────────┐   │
│  │  Geyser (Bedrock Protocol)  │   │
│  │  Port: 19132 (UDP)          │◄──┼──── Bedrock Edition clients
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  squaremap Web Interface    │   │
│  │  Port: 8080 (HTTP)          │◄──┼──── Map viewers
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Ports and Protocols

| Port  | Protocol | Service | Purpose | Firewall Rule |
|-------|----------|---------|---------|---------------|
| 25565 | TCP | Paper Server | Java Edition connections | Allow from anywhere |
| 19132 | UDP | Geyser | Bedrock Edition connections | Allow from anywhere |
| 8080 | TCP | squaremap | Web-based map viewer | Allow from trusted IPs |
| 25575 | TCP | RCON (optional) | Remote console | Allow from localhost only |

### Firewall Configuration

```bash
# Allow Java Edition (TCP)
sudo ufw allow 25565/tcp
# Or with iptables:
sudo iptables -A INPUT -p tcp --dport 25565 -j ACCEPT

# Allow Bedrock Edition (UDP)
sudo ufw allow 19132/udp
# Or with iptables:
sudo iptables -A INPUT -p udp --dport 19132 -j ACCEPT

# Allow squaremap web interface (restrict to specific IPs)
sudo ufw allow from 192.168.1.0/24 to any port 8080 proto tcp

# Save rules
sudo ufw enable
# Or for iptables:
sudo iptables-save > /etc/iptables/rules.v4
```

## Paper Server

Paper is a high-performance fork of Spigot with optimizations and bug fixes.

### Server Management

**Assuming systemd service (adjust if using screen/tmux):**

```bash
# Start server
sudo systemctl start minecraft

# Stop server gracefully
sudo systemctl stop minecraft

# Restart server
sudo systemctl restart minecraft

# Check status
sudo systemctl status minecraft

# View server console logs
sudo journalctl -u minecraft -f

# Or if logs go to file:
tail -f /opt/minecraft/logs/latest.log
```

**If using screen/tmux:**

```bash
# Attach to console
screen -r minecraft
# Or: tmux attach -t minecraft

# Detach: Ctrl+A, D (screen) or Ctrl+B, D (tmux)

# Send command without attaching
screen -S minecraft -X stuff "say Server restarting in 5 minutes\n"

# Stop server gracefully
screen -S minecraft -X stuff "stop\n"
```

### Common Server Commands

```bash
# In-game console or via RCON/screen:

# Stop server gracefully
stop

# List online players
list

# Broadcast message
say <message>

# Teleport player
tp <player> <x> <y> <z>

# Change game rule
gamerule <rule> <value>

# Reload plugins (CAUTION: not all plugins support reload)
reload confirm

# View server TPS (ticks per second - should be 20)
tps

# View timings report (performance)
timings paste
```

### Health Checks

```bash
# 1. Check if Java process is running
ps aux | grep java | grep minecraft

# 2. Check port 25565 is listening
netstat -tulpn | grep 25565
# Or: ss -tulpn | grep 25565

# 3. Test connection locally
nc -zv localhost 25565

# 4. Test connection externally (from another host)
nc -zv your-server-ip 25565

# 5. Check player count
# Via RCON:
mcrcon -H localhost -P 25575 -p <password> "list"

# 6. Check server TPS (healthy = 20.0)
mcrcon -H localhost -P 25575 -p <password> "tps"

# 7. Check logs for errors
tail -100 /opt/minecraft/logs/latest.log | grep -i "error\|exception\|fatal"
```

### Performance Tuning

```bash
# Check Java process memory usage
ps aux | grep java | grep minecraft

# Check JVM flags (example optimized flags)
-Xms8G -Xmx8G          # Start/Max heap (adjust to server RAM)
-XX:+UseG1GC           # G1 garbage collector
-XX:MaxGCPauseMillis=50  # Target max GC pause
-XX:+ParallelRefProcEnabled
-XX:+UnlockExperimentalVMOptions
-XX:G1NewSizePercent=30
-XX:G1MaxNewSizePercent=40
-XX:G1HeapRegionSize=8M
-XX:G1ReservePercent=20

# Monitor TPS in real-time
watch -n 2 'mcrcon -H localhost -P 25575 -p <password> "tps"'

# Analyze timings
# Run in console: /timings paste
# Then visit the generated URL
```

## Geyser (Bedrock Bridge)

Geyser allows Bedrock Edition players (Xbox, PlayStation, Mobile, Windows 10) to join Java Edition servers.

### Configuration

Geyser config location: `/opt/minecraft/plugins/Geyser-Spigot/config.yml`

**Key settings to verify:**

```yaml
# Bedrock listener
bedrock:
  address: 0.0.0.0  # Listen on all interfaces
  port: 19132       # Default Bedrock port

# Java server connection
remote:
  address: auto     # Auto-detect (usually 127.0.0.1)
  port: 25565

# Authentication
auth-type: floodgate  # If using Floodgate plugin
# Or: online          # Requires Xbox Live auth
```

### Health Checks

```bash
# 1. Check Geyser is loaded
grep "Geyser" /opt/minecraft/logs/latest.log | tail -5

# 2. Check UDP port 19132 is listening
netstat -ulpn | grep 19132
# Or: ss -ulpn | grep 19132

# 3. Test Bedrock connection (requires Bedrock client)
# Add server: your-server-ip, port 19132

# 4. Check Geyser player count
# In server console:
geyser list

# 5. Check for Geyser errors
grep -i "geyser.*error" /opt/minecraft/logs/latest.log

# 6. Check Bedrock protocol version
# In logs, look for: "Geyser version X supporting Bedrock Y"
```

### Common Issues

**Bedrock clients can't connect:**

```bash
# 1. Verify UDP port open
sudo ufw status | grep 19132

# 2. Check Geyser is enabled
grep "Geyser.*enabled\|started" /opt/minecraft/logs/latest.log

# 3. Reload Geyser
# In server console:
geyser reload

# 4. Check for version mismatch
grep -i "unsupported.*version" /opt/minecraft/logs/latest.log
```

**Bedrock players have skin/username issues:**

```bash
# If using Floodgate:
# 1. Verify Floodgate is installed
ls /opt/minecraft/plugins/ | grep -i floodgate

# 2. Check Floodgate config
cat /opt/minecraft/plugins/Floodgate/config.yml

# 3. Verify username prefix (default: ".")
# Bedrock players appear as: .BedrockUsername
```

### Updating Geyser

```bash
# 1. Check current version
# In logs or: /geyser version

# 2. Download latest from https://geysermc.org/download
cd /opt/minecraft/plugins
wget https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot

# 3. Stop server
sudo systemctl stop minecraft

# 4. Backup old version
mv Geyser-Spigot.jar Geyser-Spigot.jar.bak

# 5. Install new version
mv spigot Geyser-Spigot.jar
chown minecraft:minecraft Geyser-Spigot.jar

# 6. Start server
sudo systemctl start minecraft

# 7. Verify version
tail -f /opt/minecraft/logs/latest.log | grep Geyser
```

## squaremap (Web Map)

squaremap provides a live, interactive web-based map of the Minecraft world.

### Configuration

Config location: `/opt/minecraft/plugins/squaremap/config.yml`

**Key settings:**

```yaml
web:
  bind: 0.0.0.0     # Listen address
  port: 8080        # Web interface port

# Optional: integrate with Caddy reverse proxy
# Add to Caddyfile:
# map.slimyai.xyz {
#   reverse_proxy localhost:8080
# }
```

### Health Checks

```bash
# 1. Check squaremap web interface
curl -I http://localhost:8080

# 2. Check rendering status
# In server console:
squaremap status

# 3. Check for render errors
grep -i "squaremap.*error" /opt/minecraft/logs/latest.log

# 4. View active render tasks
# In server console:
squaremap renderers
```

### Common Operations

```bash
# Full world re-render (SLOW - use during low traffic)
squaremap fullrender world

# Cancel ongoing render
squaremap cancelrender world

# Reload configuration
squaremap reload

# Pause/resume rendering
squaremap pause
squaremap resume

# Check render progress
squaremap radiusrender world 0 0 5000  # Render 5000 block radius
```

### Troubleshooting

**Map not updating:**

```bash
# 1. Check if rendering is paused
squaremap status

# 2. Resume if paused
squaremap resume

# 3. Check for errors in logs
grep "squaremap" /opt/minecraft/logs/latest.log | tail -20

# 4. Restart incremental render
squaremap cancelrender world
squaremap fullrender world
```

**Web interface returns 404/500:**

```bash
# 1. Verify port 8080 is listening
netstat -tulpn | grep 8080

# 2. Check web directory exists
ls -la /opt/minecraft/plugins/squaremap/web/

# 3. Check file permissions
# Web files should be readable by the web server

# 4. Reload plugin
# In server console:
squaremap reload
```

## Monitoring via /api/bedrock-status

The Slimy web app provides a monitoring endpoint for Minecraft server status.

### Endpoint Information

**URL:** `https://slimyai.xyz/api/bedrock-status`

**Purpose:** Query Minecraft server status (Java/Bedrock online, player count, etc.)

**Routing:** Caddy routes `/api/bedrock-status` to web app (port 3000)

### Testing the Endpoint

```bash
# 1. Query status endpoint
curl https://slimyai.xyz/api/bedrock-status

# 2. Expected response (example - actual format depends on implementation)
{
  "java": {
    "online": true,
    "players": 5,
    "maxPlayers": 20,
    "version": "1.20.4"
  },
  "bedrock": {
    "online": true,
    "players": 2,
    "maxPlayers": 20
  }
}

# 3. Check response time
time curl -s https://slimyai.xyz/api/bedrock-status

# 4. Check from web app logs
docker logs slimy-nuc2-web-1 2>&1 | grep "bedrock-status"
```

### Debugging Status Endpoint

If `/api/bedrock-status` returns errors:

```bash
# 1. Verify Caddy routing
docker logs slimy-nuc2-caddy-1 2>&1 | grep "bedrock-status"

# 2. Check web app handling
docker logs slimy-nuc2-web-1 2>&1 | grep -i "bedrock"

# 3. Test direct to web app (bypass Caddy)
curl http://localhost:3000/api/bedrock-status

# 4. Verify Minecraft server is reachable from web container
docker exec slimy-nuc2-web-1 nc -zv minecraft-server-ip 25565
docker exec slimy-nuc2-web-1 nc -zv minecraft-server-ip 19132

# 5. Check for network issues
ping minecraft-server-ip
traceroute minecraft-server-ip
```

## Backup Procedures

### World Backup

**CRITICAL:** Always backup before major changes!

```bash
# 1. Announce to players
screen -S minecraft -X stuff "say Server backing up in 1 minute. Brief lag possible.\n"

# 2. Disable auto-save (reduces corruption risk)
screen -S minecraft -X stuff "save-off\n"

# 3. Force save current state
screen -S minecraft -X stuff "save-all\n"

# 4. Wait for save to complete (check logs)
sleep 10

# 5. Backup world directory
sudo tar -czf /backups/minecraft/world-$(date +%Y%m%d-%H%M%S).tar.gz /opt/minecraft/world/

# 6. Re-enable auto-save
screen -S minecraft -X stuff "save-on\n"

# 7. Announce completion
screen -S minecraft -X stuff "say Backup complete. Thank you!\n"

# 8. Verify backup
ls -lh /backups/minecraft/world-*.tar.gz | tail -1
```

### Plugin Backup

```bash
# Backup all plugins and configs
sudo tar -czf /backups/minecraft/plugins-$(date +%Y%m%d-%H%M%S).tar.gz \
  /opt/minecraft/plugins/

# Backup just configs
sudo tar -czf /backups/minecraft/configs-$(date +%Y%m%d-%H%M%S).tar.gz \
  /opt/minecraft/plugins/*/config.yml \
  /opt/minecraft/server.properties \
  /opt/minecraft/bukkit.yml \
  /opt/minecraft/spigot.yml \
  /opt/minecraft/paper.yml
```

### Automated Backups

**Example cron job:**

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 4 AM
0 4 * * * /opt/minecraft/scripts/backup.sh

# Example backup script (/opt/minecraft/scripts/backup.sh):
#!/bin/bash
BACKUP_DIR="/backups/minecraft"
DATE=$(date +%Y%m%d-%H%M%S)

# Announce
screen -S minecraft -X stuff "save-off\n"
screen -S minecraft -X stuff "save-all\n"
sleep 15

# Backup world
tar -czf $BACKUP_DIR/world-$DATE.tar.gz /opt/minecraft/world/

# Re-enable saves
screen -S minecraft -X stuff "save-on\n"

# Delete backups older than 7 days
find $BACKUP_DIR -name "world-*.tar.gz" -mtime +7 -delete

# Log completion
echo "Backup completed: world-$DATE.tar.gz" >> $BACKUP_DIR/backup.log
```

### Restore from Backup

```bash
# 1. STOP THE SERVER FIRST
sudo systemctl stop minecraft

# 2. Backup current state (just in case)
mv /opt/minecraft/world /opt/minecraft/world.bak.$(date +%Y%m%d-%H%M%S)

# 3. Extract backup
cd /opt/minecraft
tar -xzf /backups/minecraft/world-20240101-040000.tar.gz

# 4. Fix permissions
chown -R minecraft:minecraft /opt/minecraft/world

# 5. Start server
sudo systemctl start minecraft

# 6. Verify world loaded correctly
tail -f /opt/minecraft/logs/latest.log | grep "Done"
```

## Things NEVER to Do on Production Minecraft Data

### Absolute DON'Ts

1. **NEVER edit world files while server is running**
   - ALWAYS stop server first
   - Risk: World corruption, chunk errors, player inventory loss

2. **NEVER use `/reload` in production**
   - Use proper restarts instead
   - Risk: Memory leaks, plugin state corruption, config mismatches
   - Exception: Some plugins support `/reload` safely (check docs)

3. **NEVER delete player data files directly**
   - Use in-game commands or admin tools
   - Risk: Permanent player progress loss, angry users

4. **NEVER run `/stop` without announcing**
   - Give players 5+ minutes warning
   - Risk: Lost player progress, bad user experience

5. **NEVER update plugins without backups**
   - ALWAYS backup world + plugins first
   - Risk: Plugin incompatibility breaking the server

6. **NEVER change game rules mid-event**
   - Example: Don't disable PVP during a PVP tournament
   - Risk: Unfair gameplay, confused players

7. **NEVER grant OP to untrusted players**
   - OP = full server control (can destroy everything)
   - Risk: Griefing, world destruction, data theft

8. **NEVER share RCON password**
   - Equivalent to root access
   - Risk: Server compromise, malicious commands

9. **NEVER force-kill Java process during save**
   - Example: `kill -9` while "Saving world..."
   - Risk: Catastrophic world corruption

10. **NEVER restore old backup over newer data without player consent**
    - Players lose recent progress
    - Risk: Mass player exodus, reputation damage

### Dangerous Commands (Use with Caution)

```bash
# These commands can cause problems if misused:

/kill @a                    # Kills ALL players
/clear @a                   # Clears ALL player inventories
/tp @a 0 100 0             # Teleports ALL players
/gamerule doDaylightCycle false  # Stops time (confusing)
/difficulty peaceful       # Removes all monsters (may be wanted)
/weather clear 999999      # Locks weather for 999999 seconds
```

### Safe Practices

1. **Always announce major changes:**
   ```
   /say Server restarting for updates in 5 minutes. Please log off safely.
   ```

2. **Always backup before updates:**
   ```bash
   ./backup.sh && systemctl stop minecraft && update_plugins && systemctl start minecraft
   ```

3. **Always test in staging first:**
   - Copy world to test server
   - Test plugin updates
   - Verify compatibility

4. **Always keep rollback backups:**
   - Minimum 7 days of daily backups
   - Keep monthly snapshots

5. **Always monitor after changes:**
   ```bash
   tail -f /opt/minecraft/logs/latest.log | grep -i "error\|exception"
   ```

## Maintenance Windows

### Planned Maintenance Procedure

**1 week before:**
- Announce in Discord, in-game MOTD, server website
- Example: "Maintenance window: Jan 15, 4-6 AM UTC"

**24 hours before:**
- Repeat announcement
- Pin message in Discord

**1 hour before:**
- In-game announcement every 15 minutes
- Disable new player joins (whitelist)

**During maintenance:**
1. Stop server gracefully
2. Backup everything
3. Perform updates/changes
4. Test startup in safe mode
5. Monitor logs for errors
6. Re-enable joins

**After maintenance:**
- Announce completion
- Monitor for issues (first 30 minutes critical)
- Be ready to rollback

### Emergency Maintenance

If emergency restart needed (crash, exploit, etc.):

```bash
# 1. Quick announcement (if possible)
screen -S minecraft -X stuff "say EMERGENCY RESTART IN 60 SECONDS\n"
sleep 60

# 2. Stop server
sudo systemctl stop minecraft

# 3. Quick backup (if time allows)
tar -czf /backups/emergency-$(date +%Y%m%d-%H%M%S).tar.gz /opt/minecraft/world/

# 4. Fix issue (patch, config change, etc.)
# ... perform fix ...

# 5. Restart
sudo systemctl start minecraft

# 6. Monitor logs
tail -f /opt/minecraft/logs/latest.log

# 7. Post-incident: Announce what happened and when normal ops resume
```

## Useful Resources

### Official Documentation

- Paper: https://docs.papermc.io/
- Geyser: https://wiki.geysermc.org/
- squaremap: https://github.com/pl3xgaming/squaremap
- Minecraft Server: https://minecraft.wiki/w/Server

### Tools

- mcrcon: Remote console client
- MCEdit: World editing tool (use with EXTREME caution)
- Chunky: Pre-generation plugin
- LuckPerms: Permissions management

### Monitoring

- Grafana + Prometheus: Server metrics
- Plan: In-game analytics plugin
- CoreProtect: Rollback/logging plugin (highly recommended)

### Community

- Paper Discord: https://discord.gg/papermc
- Geyser Discord: https://discord.gg/geysermc
- r/admincraft: Reddit community for server admins

## Emergency Contacts

- **Server host provider:** [Contact info]
- **Plugin developers:** Check plugin pages on SpigotMC/Paper forums
- **Minecraft ops team:** [Your team's contact]
- **Escalation:** If world corruption suspected, stop server and contact senior ops immediately

## Quick Reference Card

```bash
# Health checks
systemctl status minecraft
tail -f /opt/minecraft/logs/latest.log
netstat -tulpn | grep -E "25565|19132"
mcrcon -H localhost -P 25575 -p <pass> "tps"

# Graceful restart
screen -S minecraft -X stuff "say Restarting in 5 min\n"
sleep 300
systemctl restart minecraft

# Emergency stop
systemctl stop minecraft

# Backup
./backup.sh

# Check players online
mcrcon -H localhost -P 25575 -p <pass> "list"

# Geyser status
# In console: geyser list
```

---

**Remember:** When in doubt, stop the server, backup, ask for help. Better safe than explaining to players why they lost their items.
