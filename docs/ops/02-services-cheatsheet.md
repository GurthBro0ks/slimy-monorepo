# Services Cheatsheet

## Service Overview Table

| Service | Purpose | Probable Host | Port | Container Name | Check if Alive | Logs Location | Healthy Response |
|---------|---------|---------------|------|----------------|----------------|---------------|------------------|
| **Web** | Customer-facing Next.js app | NUC2 | 3000 | `slimy-nuc2-web-1` | `curl http://localhost:3000/api/health` | `docker logs slimy-nuc2-web-1` | `{"status":"ok"}` |
| **Admin API** | Express.js backend API | NUC1, NUC2 | 3080 | `slimy-nuc2-admin-api-1` | `curl http://localhost:3080/api/health` | `docker logs slimy-nuc2-admin-api-1` | `{"status":"ok"}` |
| **Admin UI** | Next.js admin dashboard | NUC1 | 3081 | `slimy-nuc1-admin-ui-1` | `curl http://localhost:3081/` | `docker logs slimy-nuc1-admin-ui-1` | HTTP 200, HTML page |
| **PostgreSQL** | Primary database | NUC2 | 5432 | `slimy-nuc2-postgres-1` | `docker exec slimy-nuc2-postgres-1 pg_isready` | `docker logs slimy-nuc2-postgres-1` | `accepting connections` |
| **MySQL** | Alternative database | NUC1 | 3306 | `slimy-nuc1-db-1` | `docker exec slimy-nuc1-db-1 mysqladmin ping` | `docker logs slimy-nuc1-db-1` | `mysqld is alive` |
| **Redis** | Caching layer | NUC2 | 6379 | `slimy-nuc2-redis-1` | `docker exec slimy-nuc2-redis-1 redis-cli ping` | `docker logs slimy-nuc2-redis-1` | `PONG` |
| **Caddy** | Reverse proxy + TLS | NUC2 | 80, 443 | `slimy-nuc2-caddy-1` | `curl -I https://slimyai.xyz` | `docker logs slimy-nuc2-caddy-1` | HTTP 200 or redirect |
| **loopback1455** | Python HTTP server | NUC2 | 1455 | `slimy-nuc2-loopback1455-1` | `curl http://localhost:1455/` | `docker logs slimy-nuc2-loopback1455-1` | HTTP 200 response |
| **Prometheus** | Metrics collection | (dev/monitoring) | 9090 | `web-prometheus-1` | `curl http://localhost:9090/-/healthy` | `docker logs web-prometheus-1` | `Prometheus is Healthy` |
| **Grafana** | Metrics dashboards | (dev/monitoring) | 3000 | `web-grafana-1` | `curl http://localhost:3000/api/health` | `docker logs web-grafana-1` | `{"database":"ok"}` |

**Note:** Container names assume docker-compose project naming. Verify actual names with `docker ps`.

## Detailed Service Information

### Web (apps/web)

**Technology:** Next.js 16, React 19, Prisma, Redis

**Key Responsibilities:**
- Serve customer-facing websites (slimyai.xyz, slime.chat)
- AI chat interface
- Codes aggregation from Snelp API + Reddit
- Screenshot analysis tools
- Club analytics
- Public stats cards

**Health Check:**
```bash
# Local check
curl http://localhost:3000/api/health

# Public check
curl https://slimyai.xyz/api/health

# Expected response
{"status":"ok"}
```

**Common Log Patterns:**
```bash
# View real-time logs
docker logs -f slimy-nuc2-web-1

# Search for errors
docker logs slimy-nuc2-web-1 2>&1 | grep -i error

# Search for specific API route
docker logs slimy-nuc2-web-1 2>&1 | grep "/api/codes"

# Check codes aggregation
docker logs slimy-nuc2-web-1 2>&1 | grep "Codes aggregation"
```

**Environment Variables (check in `/opt/slimy/secrets/.env.web.production`):**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXT_PUBLIC_SNELP_CODES_URL` - External codes API
- `OPENAI_API_KEY` - AI chat functionality
- `SENTRY_DSN` - Error tracking

**Restart Command:**
```bash
# Graceful restart
docker restart slimy-nuc2-web-1

# Or via docker-compose
cd /opt/slimy/app
docker-compose -f docker-compose.slimy-nuc2.yml restart web
```

---

### Admin API (apps/admin-api)

**Technology:** Express.js, MySQL2/Prisma, Sharp (image processing)

**Key Responsibilities:**
- Discord OAuth authentication
- Guild management
- Image upload processing
- Task runner (backups, ingestion)
- Stats tracking
- Backend API for admin-ui

**Health Check:**
```bash
# Local check
curl http://localhost:3080/api/health

# Via Caddy
curl https://slimyai.xyz/api/health

# Expected response
{"status":"ok"}
```

**Common Log Patterns:**
```bash
# View real-time logs
docker logs -f slimy-nuc2-admin-api-1

# Check auth requests
docker logs slimy-nuc2-admin-api-1 2>&1 | grep "POST /api/auth"

# Check task runner
docker logs slimy-nuc2-admin-api-1 2>&1 | grep "task:"

# Check image processing
docker logs slimy-nuc2-admin-api-1 2>&1 | grep "sharp"
```

**Environment Variables (check in `/opt/slimy/secrets/.env.admin.production`):**
- `DATABASE_URL` - Database connection
- `DISCORD_CLIENT_ID` - OAuth app ID
- `DISCORD_CLIENT_SECRET` - OAuth secret
- `SESSION_SECRET` - JWT signing key
- `ALLOWED_ORIGIN` - CORS configuration

**Restart Command:**
```bash
# Graceful restart
docker restart slimy-nuc2-admin-api-1

# Or via docker-compose
cd /opt/slimy/app
docker-compose -f docker-compose.slimy-nuc2.yml restart admin-api
```

---

### Admin UI (apps/admin-ui)

**Technology:** Next.js 14, React 18, Chart.js, Socket.io

**Key Responsibilities:**
- Admin dashboard for guild management
- Screenshot upload interface
- Task runner controls
- Usage statistics visualization

**Health Check:**
```bash
# Local check (returns HTML, not JSON)
curl -I http://localhost:3081/

# Expected response
HTTP/1.1 200 OK
```

**Common Log Patterns:**
```bash
# View real-time logs
docker logs -f slimy-nuc1-admin-ui-1

# Check build/startup
docker logs slimy-nuc1-admin-ui-1 2>&1 | head -30

# Search for errors
docker logs slimy-nuc1-admin-ui-1 2>&1 | grep -i error
```

**Environment Variables (check in `/opt/slimy/secrets/.env.production`):**
- `NEXT_PUBLIC_API_URL` - Backend API URL

**Restart Command:**
```bash
# Graceful restart
docker restart slimy-nuc1-admin-ui-1

# Or via docker-compose
cd /opt/slimy/app
docker-compose -f docker-compose.slimy-nuc1.yml restart admin-ui
```

---

### PostgreSQL

**Version:** 16 (alpine)

**Responsibilities:**
- Primary data store for web and admin-api
- User accounts, guilds, conversations, analytics

**Health Check:**
```bash
# Quick check
docker exec slimy-nuc2-postgres-1 pg_isready

# Detailed check
docker exec slimy-nuc2-postgres-1 psql -U <username> -d <database> -c "SELECT 1;"

# Check connections
docker exec slimy-nuc2-postgres-1 psql -U <username> -d <database> -c "SELECT count(*) FROM pg_stat_activity;"
```

**Common Log Patterns:**
```bash
# View logs
docker logs slimy-nuc2-postgres-1

# Check for errors
docker logs slimy-nuc2-postgres-1 2>&1 | grep -i error

# Check connection issues
docker logs slimy-nuc2-postgres-1 2>&1 | grep "connection"
```

**Data Location:**
- Volume mount: check `docker volume ls | grep postgres`
- Backup location: `/opt/slimy/backups/` or `/var/backups/slimy/`

**Restart Command:**
```bash
# CAUTION: Restart will disconnect all clients
docker restart slimy-nuc2-postgres-1
```

---

### MySQL

**Version:** 8

**Responsibilities:**
- Alternative database for admin-api on NUC1
- Same schema as PostgreSQL

**Health Check:**
```bash
# Quick check
docker exec slimy-nuc1-db-1 mysqladmin ping

# Detailed check
docker exec slimy-nuc1-db-1 mysql -u<user> -p<pass> -e "SELECT 1;"

# Check connections
docker exec slimy-nuc1-db-1 mysql -u<user> -p<pass> -e "SHOW PROCESSLIST;"
```

**Common Log Patterns:**
```bash
# View logs
docker logs slimy-nuc1-db-1

# Check for errors
docker logs slimy-nuc1-db-1 2>&1 | grep -i error
```

**Restart Command:**
```bash
# CAUTION: Restart will disconnect all clients
docker restart slimy-nuc1-db-1
```

---

### Redis

**Version:** Latest (alpine)

**Responsibilities:**
- Cache for codes API (60s TTL)
- Session storage
- Diagnostics caching

**Health Check:**
```bash
# Quick check
docker exec slimy-nuc2-redis-1 redis-cli ping

# Check memory usage
docker exec slimy-nuc2-redis-1 redis-cli INFO memory

# Check keyspace
docker exec slimy-nuc2-redis-1 redis-cli INFO keyspace
```

**Common Operations:**
```bash
# Clear all cache (DANGEROUS in production!)
docker exec slimy-nuc2-redis-1 redis-cli FLUSHALL

# Clear specific key
docker exec slimy-nuc2-redis-1 redis-cli DEL "codes:active"

# List all keys (use with caution)
docker exec slimy-nuc2-redis-1 redis-cli KEYS "*"

# Get cache hit stats
docker exec slimy-nuc2-redis-1 redis-cli INFO stats
```

**Restart Command:**
```bash
# Safe to restart - cache will rebuild
docker restart slimy-nuc2-redis-1
```

---

### Caddy

**Version:** 2

**Responsibilities:**
- Reverse proxy for all HTTP(S) traffic
- Automatic HTTPS/TLS certificate management
- Route /api/* to admin-api (except /api/bedrock-status)
- Route /api/bedrock-status to web
- Compression (zstd, gzip)

**Health Check:**
```bash
# Check Caddy is running
docker ps | grep caddy

# Check HTTPS is working
curl -I https://slimyai.xyz

# Check specific routing
curl -I https://slimyai.xyz/api/health  # Should hit admin-api
curl -I https://slimyai.xyz/api/bedrock-status  # Should hit web
```

**Configuration:**
- File: `infra/docker/Caddyfile.slimy-nuc2`
- Mounted at: `/etc/caddy/Caddyfile` in container

**Common Log Patterns:**
```bash
# View access logs
docker logs slimy-nuc2-caddy-1

# Check certificate issues
docker logs slimy-nuc2-caddy-1 2>&1 | grep -i "certificate"

# Check proxy errors
docker logs slimy-nuc2-caddy-1 2>&1 | grep -i "proxy"
```

**Restart Command:**
```bash
# Reload config without downtime
docker exec slimy-nuc2-caddy-1 caddy reload --config /etc/caddy/Caddyfile

# Full restart (brief downtime)
docker restart slimy-nuc2-caddy-1
```

---

## Generic Docker Commands

### Check All Services

```bash
# List all running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Check resource usage
docker stats

# Check network connectivity
docker network ls
docker network inspect slimy-network
```

### View Logs

```bash
# Follow logs for all services
docker-compose -f docker-compose.slimy-nuc2.yml logs -f

# Follow specific service
docker-compose -f docker-compose.slimy-nuc2.yml logs -f web

# Last 100 lines
docker-compose -f docker-compose.slimy-nuc2.yml logs --tail=100

# Logs since timestamp
docker-compose -f docker-compose.slimy-nuc2.yml logs --since 2024-01-01T10:00:00
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.slimy-nuc2.yml restart

# Restart specific service
docker-compose -f docker-compose.slimy-nuc2.yml restart web

# Stop then start (more thorough)
docker-compose -f docker-compose.slimy-nuc2.yml stop web
docker-compose -f docker-compose.slimy-nuc2.yml start web
```

### Emergency Stop

```bash
# Stop all services gracefully
docker-compose -f docker-compose.slimy-nuc2.yml stop

# Force stop (if graceful fails)
docker-compose -f docker-compose.slimy-nuc2.yml kill

# Stop specific service
docker-compose -f docker-compose.slimy-nuc2.yml stop web
```

## Systemd Integration (if applicable)

Some deployments may use systemd to manage docker-compose. Check with:

```bash
# List systemd services
systemctl list-units | grep slimy

# Check service status
systemctl status slimy-web.service  # example name

# Restart via systemd
systemctl restart slimy-web.service

# View systemd logs
journalctl -u slimy-web.service -f
```

**Note:** Verify actual systemd service names on your system. They may not exist if deployment is purely docker-compose based.

## Monitoring & Metrics

### Prometheus Metrics

```bash
# Check metrics endpoint
curl http://localhost:3000/api/metrics  # Web metrics
curl http://localhost:3080/api/metrics  # Admin API metrics (if exists)

# Query Prometheus
curl http://localhost:9090/api/v1/query?query=up
```

### Sentry

- Error tracking: Check Sentry dashboard
- Performance: APM traces for slow requests
- Releases: Track which version is deployed

## Next Steps

- Review incident playbooks: `03-playbooks-common-incidents.md`
- Understand Minecraft monitoring: `04-minecraft-notes.md`
- Set up monitoring dashboard access
- Add these commands to your personal cheatsheet
