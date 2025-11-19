# Incident Playbooks

This document provides step-by-step runbooks for responding to common incidents in the Slimy platform. Each playbook follows the pattern: Symptoms → Quick Checks → Deeper Debug → Resolution → When to Escalate.

## Table of Contents

1. [Web UI is Down](#web-ui-is-down)
2. [Admin Panel Login Loop](#admin-panel-login-loop)
3. [Minecraft Java Online, Bedrock Not Reachable](#minecraft-java-online-bedrock-not-reachable)
4. [Discord Bot Seems Offline](#discord-bot-seems-offline)
5. [Database Connection Failures](#database-connection-failures)
6. [Slow API Response Times](#slow-api-response-times)
7. [Codes Not Loading](#codes-not-loading)
8. [Certificate/TLS Errors](#certificatetls-errors)

---

## Web UI is Down

### Symptoms

- Users report slimyai.xyz returns errors or doesn't load
- Getting 502 Bad Gateway, 503 Service Unavailable, or timeout errors
- Health check fails: `curl https://slimyai.xyz/api/health`

### Quick Checks (5 minutes)

```bash
# 1. Check if web container is running
docker ps | grep web

# 2. Check web service health
docker exec slimy-nuc2-web-1 curl http://localhost:3000/api/health

# 3. Check recent logs for errors
docker logs --tail=100 slimy-nuc2-web-1

# 4. Check Caddy is proxying correctly
docker ps | grep caddy
curl -I https://slimyai.xyz
```

**Common Quick Fixes:**

```bash
# If container stopped, start it
docker start slimy-nuc2-web-1

# If running but unresponsive, restart
docker restart slimy-nuc2-web-1

# If Caddy is down
docker restart slimy-nuc2-caddy-1
```

### Deeper Debug (15 minutes)

```bash
# 1. Check container resource usage
docker stats slimy-nuc2-web-1 --no-stream

# 2. Check for crash loops
docker logs slimy-nuc2-web-1 2>&1 | grep -i "error\|fatal\|crash"

# 3. Check database connectivity from web container
docker exec slimy-nuc2-web-1 sh -c 'curl -v $DATABASE_URL'

# 4. Check Redis connectivity
docker exec slimy-nuc2-web-1 sh -c 'curl -v $REDIS_URL'

# 5. Inspect environment variables
docker exec slimy-nuc2-web-1 env | grep -E "DATABASE_URL|REDIS_URL|NODE_ENV"

# 6. Check for port conflicts
netstat -tulpn | grep :3000

# 7. Check Docker networks
docker network inspect slimy-network
```

**Common Issues:**

1. **Out of Memory:**
   - Check: `docker stats` shows 100% memory
   - Fix: Increase container memory limit or restart

2. **Database connection pool exhausted:**
   - Check logs: `connection pool exhausted`
   - Fix: Restart web service, check for connection leaks

3. **Environment variable missing:**
   - Check logs: `Cannot read environment variable`
   - Fix: Verify `/opt/slimy/secrets/.env.web.production` exists and is mounted

### Resolution

```bash
# Standard restart procedure
cd /opt/slimy/app
docker-compose -f docker-compose.slimy-nuc2.yml restart web

# If that fails, full stop/start
docker-compose -f docker-compose.slimy-nuc2.yml stop web
docker-compose -f docker-compose.slimy-nuc2.yml start web

# If still failing, rebuild (more disruptive)
docker-compose -f docker-compose.slimy-nuc2.yml up -d --build web
```

### When to Ask for Help

- Container won't start after multiple restart attempts
- Logs show database schema errors or migration failures
- Issue persists for >30 minutes
- Multiple services are down simultaneously
- Disk space issues (can't be resolved quickly)

---

## Admin Panel Login Loop

### Symptoms

- Users redirected to Discord OAuth but return to login page
- Cookie not being set after successful Discord authentication
- `/api/auth/callback` returns errors
- Admin panel shows "Unauthorized" repeatedly

### Quick Checks (5 minutes)

```bash
# 1. Check admin-api is running
docker ps | grep admin-api

# 2. Check admin-api health
curl http://localhost:3080/api/health

# 3. Check recent auth logs
docker logs slimy-nuc2-admin-api-1 2>&1 | grep "auth"

# 4. Verify HTTPS is working (required for secure cookies)
curl -I https://slimyai.xyz
```

### Deeper Debug (15 minutes)

```bash
# 1. Check session secret is configured
docker exec slimy-nuc2-admin-api-1 sh -c 'echo $SESSION_SECRET'

# 2. Check Discord OAuth credentials
docker exec slimy-nuc2-admin-api-1 sh -c 'echo $DISCORD_CLIENT_ID && echo $DISCORD_CLIENT_SECRET'

# 3. Check CORS configuration
docker logs slimy-nuc2-admin-api-1 2>&1 | grep "CORS\|ALLOWED_ORIGIN"

# 4. Test OAuth flow manually
# Visit https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=identify%20guilds

# 5. Check cookie domain settings
docker logs slimy-nuc2-admin-api-1 2>&1 | grep "cookie"

# 6. Inspect callback errors
docker logs slimy-nuc2-admin-api-1 2>&1 | grep "/api/auth/callback"
```

**Common Issues:**

1. **Session secret changed/missing:**
   - Symptom: All users logged out simultaneously
   - Fix: Verify `SESSION_SECRET` in env file, restart if changed

2. **Wrong redirect URI:**
   - Symptom: Discord shows "Invalid redirect_uri"
   - Fix: Check Discord app settings match actual domain

3. **Cookie not set due to HTTP (not HTTPS):**
   - Symptom: Works locally but not in production
   - Fix: Verify Caddy is providing HTTPS, check `secure: true` cookie setting

4. **CORS blocking requests:**
   - Symptom: Browser console shows CORS errors
   - Fix: Verify `ALLOWED_ORIGIN` matches frontend domain

### Resolution

```bash
# 1. Restart admin-api
docker restart slimy-nuc2-admin-api-1

# 2. Clear user sessions (they'll need to re-login)
docker exec slimy-nuc2-admin-api-1 sh -c 'rm -rf /tmp/sessions/*'  # if file-based sessions

# 3. Verify environment variables
cat /opt/slimy/secrets/.env.admin.production | grep -E "SESSION_SECRET|DISCORD_CLIENT_ID|ALLOWED_ORIGIN"

# 4. If env changed, recreate container
cd /opt/slimy/app
docker-compose -f docker-compose.slimy-nuc2.yml up -d admin-api
```

### When to Ask for Help

- Discord OAuth app credentials are invalid/expired
- Need to reconfigure Discord app settings (requires admin access)
- Database stores corrupted session data
- Issue affects all users for >1 hour

---

## Minecraft Java Online, Bedrock Not Reachable

### Symptoms

- Java Edition players (port 25565) can connect
- Bedrock Edition players (port 19132) cannot connect
- `/api/bedrock-status` returns errors or shows server offline
- Geyser plugin not bridging connections

### Quick Checks (5 minutes)

```bash
# 1. Check if /api/bedrock-status endpoint is accessible
curl https://slimyai.xyz/api/bedrock-status

# 2. Check if Minecraft server process is running
# (This assumes external Minecraft server - adjust as needed)
ssh minecraft-server "ps aux | grep java"

# 3. Check port 19132 is listening
# On Minecraft host:
netstat -tulpn | grep 19132
# Or with ss:
ss -tulpn | grep 19132

# 4. Check firewall rules
# On Minecraft host:
sudo iptables -L -n | grep 19132
# Or with ufw:
sudo ufw status | grep 19132
```

### Deeper Debug (20 minutes)

```bash
# 1. Check Geyser plugin status
# SSH to Minecraft server, then:
tail -f /path/to/minecraft/logs/latest.log | grep Geyser

# 2. Check Geyser config
cat /path/to/minecraft/plugins/Geyser-Spigot/config.yml

# 3. Verify bedrock address and port settings
# In config.yml, check:
# bedrock:
#   address: 0.0.0.0
#   port: 19132

# 4. Test Bedrock port externally
# From a different machine:
nc -zv your-server-ip 19132

# 5. Check if Geyser is enabled
# In server console or logs:
grep "Geyser.*enabled" /path/to/minecraft/logs/latest.log

# 6. Check for Geyser errors
grep -i "error\|exception" /path/to/minecraft/logs/latest.log | grep -i geyser
```

**Common Issues:**

1. **Geyser plugin disabled or crashed:**
   - Check: Logs show Geyser failed to load
   - Fix: Restart Minecraft server, check plugin compatibility

2. **Firewall blocking UDP 19132:**
   - Check: `netstat` shows port listening but external test fails
   - Fix: Add firewall rule for UDP 19132

3. **Port conflict:**
   - Check: Another service using 19132
   - Fix: Stop conflicting service or change Geyser port

4. **Bedrock version incompatibility:**
   - Check: Geyser logs show "Unsupported Bedrock version"
   - Fix: Update Geyser plugin to latest version

### Resolution

```bash
# 1. Restart Minecraft server (most common fix)
# SSH to Minecraft host:
sudo systemctl restart minecraft.service
# Or if using screen/tmux:
screen -r minecraft
# Type: /stop
# Then restart server

# 2. Reload Geyser plugin (less disruptive)
# In server console:
/geyser reload

# 3. Add firewall rule (if missing)
sudo ufw allow 19132/udp
# Or with iptables:
sudo iptables -A INPUT -p udp --dport 19132 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4

# 4. Verify fix
nc -zv your-server-ip 19132
curl https://slimyai.xyz/api/bedrock-status
```

### When to Ask for Help

- Geyser plugin won't load even after reinstalling
- Bedrock version requires major Geyser update
- Network infrastructure changes needed (ISP, router, etc.)
- Java Edition also affected
- Issue persists after server restart

---

## Discord Bot Seems Offline

### Symptoms

- Bot shows as offline in Discord
- Bot doesn't respond to commands
- Admin panel shows bot not connected
- Guild count not updating

### Quick Checks (5 minutes)

```bash
# Note: Bot service is currently a STUB in the codebase
# This playbook assumes a future Discord bot implementation

# 1. Check if bot container is running
docker ps | grep bot

# 2. Check bot logs
docker logs --tail=100 slimy-nuc2-bot-1

# 3. Check bot token is set
docker exec slimy-nuc2-bot-1 sh -c 'echo $DISCORD_BOT_TOKEN'

# 4. Check Discord API status
curl https://status.discord.com/api/v2/status.json
```

### Deeper Debug (15 minutes)

```bash
# 1. Check for Discord gateway errors
docker logs slimy-nuc2-bot-1 2>&1 | grep -i "gateway\|websocket"

# 2. Check for authentication errors
docker logs slimy-nuc2-bot-1 2>&1 | grep -i "auth\|token\|unauthorized"

# 3. Verify bot token is valid
# Test with Discord API:
curl -H "Authorization: Bot YOUR_BOT_TOKEN" \
  https://discord.com/api/v10/users/@me

# 4. Check rate limiting
docker logs slimy-nuc2-bot-1 2>&1 | grep -i "rate limit\|429"

# 5. Check for network connectivity issues
docker exec slimy-nuc2-bot-1 ping -c 3 discord.com

# 6. Check bot permissions in guilds
# Visit: https://discord.com/developers/applications/YOUR_APP_ID/bot
```

**Common Issues:**

1. **Invalid/expired bot token:**
   - Symptom: Logs show 401 Unauthorized
   - Fix: Regenerate token in Discord Developer Portal

2. **Gateway connection lost:**
   - Symptom: Logs show "Gateway connection closed"
   - Fix: Restart bot service

3. **Rate limited:**
   - Symptom: Logs show 429 errors
   - Fix: Wait for rate limit to reset, check for spam loops

4. **Insufficient permissions:**
   - Symptom: Bot online but can't perform actions
   - Fix: Check guild permissions, update bot scopes

### Resolution

```bash
# 1. Restart bot service
docker restart slimy-nuc2-bot-1

# 2. If token changed, update env and recreate
# Edit: /opt/slimy/secrets/.env.bot.production
cd /opt/slimy/app
docker-compose -f docker-compose.slimy-nuc2.yml up -d bot

# 3. Verify bot is online
# Check Discord server or:
curl -H "Authorization: Bot YOUR_BOT_TOKEN" \
  https://discord.com/api/v10/users/@me
```

### When to Ask for Help

- Bot token regeneration required (needs developer portal access)
- Discord API outage confirmed
- Bot banned from Discord (TOS violation)
- Issue affects multiple bots (platform-wide)
- Need to verify bot application settings

---

## Database Connection Failures

### Symptoms

- Services log "Unable to connect to database"
- 500 errors on API endpoints
- Prisma client errors: "Connection pool timeout"
- PostgreSQL container unreachable

### Quick Checks (5 minutes)

```bash
# 1. Check PostgreSQL is running
docker ps | grep postgres

# 2. Check PostgreSQL is healthy
docker exec slimy-nuc2-postgres-1 pg_isready

# 3. Check connection from app container
docker exec slimy-nuc2-web-1 sh -c 'curl -v $DATABASE_URL 2>&1 | head'

# 4. Check number of connections
docker exec slimy-nuc2-postgres-1 psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Deeper Debug (15 minutes)

```bash
# 1. Check PostgreSQL logs
docker logs slimy-nuc2-postgres-1 2>&1 | tail -100

# 2. Check for "too many connections"
docker logs slimy-nuc2-postgres-1 2>&1 | grep "too many"

# 3. List current connections
docker exec slimy-nuc2-postgres-1 psql -U postgres -c \
  "SELECT pid, usename, application_name, client_addr, state FROM pg_stat_activity;"

# 4. Check connection pool settings
docker exec slimy-nuc2-web-1 sh -c 'env | grep DATABASE_URL'
# Look for connection_limit or pool_timeout parameters

# 5. Check disk space (database may be full)
docker exec slimy-nuc2-postgres-1 df -h

# 6. Check database is accepting connections
docker exec slimy-nuc2-postgres-1 psql -U postgres -c "SHOW max_connections;"
```

**Common Issues:**

1. **Connection pool exhausted:**
   - Symptom: "Connection pool timeout" errors
   - Fix: Restart web/admin-api to reset pools

2. **Database max connections reached:**
   - Symptom: "too many connections" in postgres logs
   - Fix: Kill idle connections, increase max_connections

3. **Wrong DATABASE_URL:**
   - Symptom: "Connection refused" or "Host not found"
   - Fix: Verify connection string in env file

4. **Network issue between containers:**
   - Symptom: "No route to host"
   - Fix: Check docker network configuration

### Resolution

```bash
# 1. Restart application services (frees connection pools)
docker restart slimy-nuc2-web-1
docker restart slimy-nuc2-admin-api-1

# 2. If max_connections hit, kill idle connections
docker exec slimy-nuc2-postgres-1 psql -U postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';"

# 3. If database unresponsive, restart (CAUTION)
docker restart slimy-nuc2-postgres-1

# 4. Verify connections restored
docker exec slimy-nuc2-postgres-1 psql -U postgres -c "SELECT 1;"
```

### When to Ask for Help

- Database won't start after restart
- Corruption suspected (logs show "invalid page header")
- Need to restore from backup
- Persistent connection leak (pools never reset)
- Disk space critically low

---

## Slow API Response Times

### Symptoms

- API requests taking >5 seconds
- Users report slow page loads
- Grafana/Prometheus shows P95 latency spike
- Timeout errors appearing

### Quick Checks (5 minutes)

```bash
# 1. Test API response time
time curl https://slimyai.xyz/api/health

# 2. Check resource usage
docker stats --no-stream

# 3. Check for CPU/memory bottlenecks
docker stats slimy-nuc2-web-1 slimy-nuc2-admin-api-1 --no-stream

# 4. Quick log scan for slow queries
docker logs slimy-nuc2-web-1 2>&1 | grep -i "slow\|timeout"
```

### Deeper Debug (20 minutes)

```bash
# 1. Check database query performance
docker exec slimy-nuc2-postgres-1 psql -U postgres -c \
  "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 2. Check Redis cache hit rate
docker exec slimy-nuc2-redis-1 redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"

# 3. Check for external API slowdowns
docker logs slimy-nuc2-web-1 2>&1 | grep -i "snelp\|reddit" | tail -20

# 4. Check node.js event loop lag
# (Requires app instrumentation - check metrics endpoint)
curl http://localhost:3000/api/metrics | grep event_loop

# 5. Check disk I/O
iostat -x 2 5

# 6. Check network latency
ping -c 10 8.8.8.8
```

**Common Issues:**

1. **Missing database index:**
   - Symptom: Queries taking seconds, high DB CPU
   - Fix: Add index, run EXPLAIN on slow queries

2. **Cache expired/cold start:**
   - Symptom: First request slow, subsequent fast
   - Fix: Prime cache, increase TTL

3. **External API timeout:**
   - Symptom: Snelp or Reddit API slow/down
   - Fix: Add timeout, implement fallback

4. **Memory pressure (GC pauses):**
   - Symptom: Periodic slowdowns every few minutes
   - Fix: Increase container memory

### Resolution

```bash
# 1. Restart services to clear memory
docker restart slimy-nuc2-web-1 slimy-nuc2-admin-api-1

# 2. Clear Redis cache if stale
docker exec slimy-nuc2-redis-1 redis-cli FLUSHALL

# 3. Analyze slow queries (example)
docker exec slimy-nuc2-postgres-1 psql -U postgres -c \
  "EXPLAIN ANALYZE SELECT * FROM users WHERE discord_id = '123';"

# 4. Add missing index (example)
docker exec slimy-nuc2-postgres-1 psql -U postgres -c \
  "CREATE INDEX idx_users_discord_id ON users(discord_id);"

# 5. Monitor improvements
watch -n 2 'time curl -s https://slimyai.xyz/api/health'
```

### When to Ask for Help

- Database needs major optimization/reindexing
- Infrastructure upgrade required (more RAM/CPU)
- Persistent slow queries after optimization
- External dependencies consistently slow
- Need to implement caching strategy changes

---

## Codes Not Loading

### Symptoms

- `/snail/codes` page shows empty list
- API returns no codes: `curl https://slimyai.xyz/api/codes?scope=active`
- "Copy All" button disabled or empty
- Errors in console about codes fetch failure

### Quick Checks (5 minutes)

```bash
# 1. Test codes API
curl https://slimyai.xyz/api/codes?scope=active

# 2. Check web service logs
docker logs slimy-nuc2-web-1 2>&1 | grep "codes" | tail -20

# 3. Check external API availability
curl -I $NEXT_PUBLIC_SNELP_CODES_URL

# 4. Check Redis cache
docker exec slimy-nuc2-redis-1 redis-cli GET "codes:active"
```

### Deeper Debug (15 minutes)

```bash
# 1. Check Snelp API response
curl "https://api.snelp.com/v1/codes" | jq .

# 2. Check Reddit API response
curl -H "User-Agent: SlimyBot/1.0" \
  "https://www.reddit.com/r/SuperSnailGame/search.json?q=flair%3Acodes&limit=50" | jq .

# 3. Check for rate limiting
docker logs slimy-nuc2-web-1 2>&1 | grep -i "rate limit\|429"

# 4. Check aggregation logic
docker logs slimy-nuc2-web-1 2>&1 | grep "Codes aggregation"

# 5. Verify environment variables
docker exec slimy-nuc2-web-1 env | grep SNELP

# 6. Test cache expiry
docker exec slimy-nuc2-redis-1 redis-cli TTL "codes:active"
```

**Common Issues:**

1. **External API down:**
   - Symptom: Snelp or Reddit API returns 500/timeout
   - Fix: Wait for recovery, check status pages

2. **API response format changed:**
   - Symptom: Codes API returns 200 but no codes parsed
   - Fix: Check API response structure, update adapter

3. **Cache stuck with empty result:**
   - Symptom: API works but cache returns empty
   - Fix: Clear Redis cache

4. **Rate limit hit:**
   - Symptom: 429 errors in logs
   - Fix: Wait for reset, implement backoff

### Resolution

```bash
# 1. Clear codes cache
docker exec slimy-nuc2-redis-1 redis-cli DEL "codes:active" "codes:past7" "codes:all"

# 2. Restart web service
docker restart slimy-nuc2-web-1

# 3. Test codes endpoint
curl https://slimyai.xyz/api/codes?scope=active | jq .

# 4. Verify UI loads codes
# Visit: https://slimyai.xyz/snail/codes
```

### When to Ask for Help

- External APIs permanently changed/deprecated
- Need to update API adapters (code changes)
- Reddit API requires OAuth (not implemented)
- Persistent parsing errors
- Cache strategy needs redesign

---

## Certificate/TLS Errors

### Symptoms

- Browser shows "Your connection is not private"
- Certificate expired warnings
- HTTPS requests fail
- Caddy logs show ACME/Let's Encrypt errors

### Quick Checks (5 minutes)

```bash
# 1. Check certificate expiry
echo | openssl s_client -servername slimyai.xyz -connect slimyai.xyz:443 2>/dev/null | \
  openssl x509 -noout -dates

# 2. Check Caddy logs
docker logs slimy-nuc2-caddy-1 2>&1 | grep -i "certificate\|acme" | tail -20

# 3. Test HTTPS
curl -vI https://slimyai.xyz 2>&1 | grep -E "SSL|certificate"

# 4. Check Caddy is running
docker ps | grep caddy
```

### Deeper Debug (15 minutes)

```bash
# 1. Check Let's Encrypt rate limits
# Visit: https://crt.sh/?q=slimyai.xyz

# 2. Check DNS resolution
dig slimyai.xyz A
dig slimyai.xyz AAAA

# 3. Check port 80 is accessible (needed for ACME challenge)
curl http://slimyai.xyz/.well-known/acme-challenge/test

# 4. Check Caddy config syntax
docker exec slimy-nuc2-caddy-1 caddy validate --config /etc/caddy/Caddyfile

# 5. Check certificate storage
docker exec slimy-nuc2-caddy-1 ls -la /data/caddy/certificates/

# 6. Check firewall allows 80/443
sudo iptables -L -n | grep -E ":80|:443"
```

**Common Issues:**

1. **Certificate expired:**
   - Symptom: "Certificate expired" in browser
   - Fix: Caddy should auto-renew; restart Caddy

2. **ACME challenge failed:**
   - Symptom: "Failed to obtain certificate" in logs
   - Fix: Verify port 80 accessible, check DNS

3. **Let's Encrypt rate limit:**
   - Symptom: "too many certificates" error
   - Fix: Wait 7 days or use staging environment

4. **Wrong domain in certificate:**
   - Symptom: Certificate valid but for wrong domain
   - Fix: Check Caddyfile domain configuration

### Resolution

```bash
# 1. Restart Caddy (triggers renewal attempt)
docker restart slimy-nuc2-caddy-1

# 2. Force certificate renewal (if needed)
docker exec slimy-nuc2-caddy-1 caddy reload --config /etc/caddy/Caddyfile --force

# 3. Check new certificate
echo | openssl s_client -servername slimyai.xyz -connect slimyai.xyz:443 2>/dev/null | \
  openssl x509 -noout -dates

# 4. If stuck, remove old certificates and restart
docker exec slimy-nuc2-caddy-1 rm -rf /data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/slimyai.xyz
docker restart slimy-nuc2-caddy-1
```

### When to Ask for Help

- Hit Let's Encrypt rate limits (5 certs/week)
- DNS not pointing to correct server
- Firewall blocking port 80 (can't resolve without access)
- Need wildcard certificate (requires DNS challenge)
- Persistent ACME failures after multiple attempts

---

## General Escalation Guidelines

Escalate to senior ops or dev team when:

1. **Data loss risk** - Any situation that could corrupt or lose data
2. **Security incident** - Suspected breach, unauthorized access, exposed credentials
3. **Multiple services down** - Suggests infrastructure-level problem
4. **>1 hour downtime** - For customer-facing services
5. **Need code changes** - Bug fixes or feature updates required
6. **Need infrastructure changes** - DNS, firewall, server provisioning
7. **Unfamiliar territory** - If you don't understand the root cause
8. **Recurring issues** - Same problem happens multiple times

## After Every Incident

1. Document what happened
2. Document what fixed it
3. Update this runbook if needed
4. Consider preventive measures
5. Create Jira/GitHub issue for follow-up

## Quick Command Reference

```bash
# Service health
docker ps && docker stats --no-stream

# All service logs
docker-compose -f docker-compose.slimy-nuc2.yml logs -f

# Restart all
docker-compose -f docker-compose.slimy-nuc2.yml restart

# Emergency stop all
docker-compose -f docker-compose.slimy-nuc2.yml stop
```
