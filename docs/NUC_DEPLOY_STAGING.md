# Slimy Staging Deployment Guide

This guide covers deploying the Slimy staging stack (web + admin-api + database) to a Docker-enabled host, such as a NUC or other Linux server.

## Overview

The staging stack consists of three main services:

- **PostgreSQL** (`slimy-db-staging`) - Database server on port 5433
- **Admin API** (`slimy-admin-api-staging`) - Backend API server on port 3081
- **Web App** (`slimy-web-staging`) - Next.js frontend on port 3001

These services run in isolated Docker containers on the `slimy-staging-network` and can coexist with production services.

## Prerequisites

### Required Software

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git**

Verify installations:

```bash
docker --version
docker compose version
git --version
```

### Required Files

Before deployment, you need three environment files. Copy the template and customize:

```bash
# From the repository root
cp .env.staging.example .env.db.staging
cp .env.staging.example .env.admin-api.staging
cp .env.staging.example .env.web.staging
```

Then edit each file with appropriate values for your staging environment.

#### `.env.db.staging`

```bash
POSTGRES_USER=slimy_staging
POSTGRES_PASSWORD=your_secure_staging_db_password
POSTGRES_DB=slimy_staging
```

#### `.env.admin-api.staging`

Key variables to configure:

- `JWT_SECRET` - Random 32+ character string
- `DISCORD_CLIENT_ID` - Discord OAuth client ID (staging app)
- `DISCORD_CLIENT_SECRET` - Discord OAuth secret
- `DISCORD_REDIRECT_URI` - Must match your staging domain/port
- `DB_URL` - PostgreSQL connection string (use container name `postgres-staging`)
- `COOKIE_DOMAIN` - Your staging domain (e.g., `staging.slimyai.xyz`)
- `ALLOWED_ORIGIN` - Web app URL for CORS

#### `.env.web.staging`

Build-time variables (also set in `docker-compose.staging.yml` as args):

- `NEXT_PUBLIC_ADMIN_API_BASE` - URL to admin-api (e.g., `http://localhost:3081` or `https://staging.slimyai.xyz`)
- `NEXT_PUBLIC_SNELP_CODES_URL` - External API for codes
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - Analytics domain

## Deployment Steps

### 1. Clone/Update Repository

```bash
# Initial clone
git clone https://github.com/GurthBro0ks/slimy-monorepo.git
cd slimy-monorepo

# Or pull latest changes
git pull origin main
```

### 2. Checkout Branch (if needed)

```bash
git checkout claude/setup-page-shell-012s7F8Lv4pR78vjwgtBKdGb
```

### 3. Configure Environment

```bash
# Copy template files
cp .env.staging.example .env.db.staging
cp .env.staging.example .env.admin-api.staging
cp .env.staging.example .env.web.staging

# Edit each file
nano .env.db.staging
nano .env.admin-api.staging
nano .env.web.staging
```

**Important:** Update these critical values:

- Database password
- JWT secret
- Discord OAuth credentials
- Domain/origin settings

### 4. Deploy the Stack

Use the provided deployment script:

```bash
./scripts/deploy-staging.sh
```

This script will:

1. Check prerequisites (Docker, Compose)
2. Validate environment files exist
3. Create necessary data directories
4. Build Docker images
5. Start all containers
6. Wait for services to become healthy
7. Display service URLs and next steps

**Manual deployment** (if you prefer):

```bash
# Build and start
docker compose -f docker-compose.staging.yml up -d --build

# Watch logs
docker compose -f docker-compose.staging.yml logs -f
```

### 5. Verify Deployment

Run smoke tests:

```bash
./scripts/smoke-test-staging.sh
```

This validates:

- Container health status
- Admin API endpoints (`/api/health`, `/api/diag`)
- Web app endpoints
- Protected routes (auth redirects)

**Manual verification:**

```bash
# Check container status
docker compose -f docker-compose.staging.yml ps

# Test admin-api
curl http://localhost:3081/api/health

# Test web app
curl http://localhost:3001/
curl http://localhost:3001/api/health

# Check logs
docker compose -f docker-compose.staging.yml logs admin-api-staging
docker compose -f docker-compose.staging.yml logs web-staging
```

## Service URLs

Once deployed, services are accessible at:

| Service    | URL                          | Notes                          |
|------------|------------------------------|--------------------------------|
| Web App    | http://localhost:3001        | Main user interface            |
| Admin API  | http://localhost:3081        | Backend API                    |
| Database   | postgresql://localhost:5433  | PostgreSQL (internal use)      |

### Behind a Reverse Proxy

If you're using Caddy or Nginx:

```caddyfile
# Example Caddyfile for staging
staging.slimyai.xyz {
    # API routes go to admin-api
    handle /api/* {
        reverse_proxy localhost:3081
    }

    # Everything else goes to web
    reverse_proxy localhost:3001
}
```

Then services are available at:

- **Web:** https://staging.slimyai.xyz
- **API:** https://staging.slimyai.xyz/api/*

**Important:** Update environment variables to match:

```bash
# .env.admin-api.staging
COOKIE_DOMAIN=staging.slimyai.xyz
ALLOWED_ORIGIN=https://staging.slimyai.xyz
DISCORD_REDIRECT_URI=https://staging.slimyai.xyz/api/auth/callback

# .env.web.staging (also update docker-compose args)
NEXT_PUBLIC_ADMIN_API_BASE=https://staging.slimyai.xyz
```

## Common Operations

### View Logs

```bash
# All services
docker compose -f docker-compose.staging.yml logs -f

# Specific service
docker compose -f docker-compose.staging.yml logs -f web-staging
docker compose -f docker-compose.staging.yml logs -f admin-api-staging
```

### Restart Services

```bash
# Restart specific service
docker compose -f docker-compose.staging.yml restart web-staging

# Restart all
docker compose -f docker-compose.staging.yml restart
```

### Stop Stack

```bash
# Using helper script (preserves data)
./scripts/down-staging.sh

# Also remove volumes (DELETES DATA!)
./scripts/down-staging.sh --volumes

# Manual
docker compose -f docker-compose.staging.yml down
```

### Rebuild After Code Changes

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.staging.yml up -d --build

# Or use the deploy script
./scripts/deploy-staging.sh
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it slimy-db-staging psql -U slimy_staging -d slimy_staging

# Backup database
docker exec slimy-db-staging pg_dump -U slimy_staging slimy_staging > backup.sql

# Restore database
cat backup.sql | docker exec -i slimy-db-staging psql -U slimy_staging -d slimy_staging
```

### Execute Commands in Containers

```bash
# Admin API container
docker exec -it slimy-admin-api-staging sh

# Web container
docker exec -it slimy-web-staging sh

# Database container
docker exec -it slimy-db-staging sh
```

## Troubleshooting

### Services Won't Start

**Check logs:**

```bash
docker compose -f docker-compose.staging.yml logs
```

**Common issues:**

1. **Port conflicts** - Another service using 3001, 3081, or 5433
   ```bash
   # Check what's using ports
   sudo lsof -i :3001
   sudo lsof -i :3081
   sudo lsof -i :5433
   ```

2. **Missing environment files**
   ```bash
   # Verify all env files exist
   ls -la .env.*.staging
   ```

3. **Docker daemon not running**
   ```bash
   sudo systemctl status docker
   sudo systemctl start docker
   ```

### 502 Bad Gateway

This usually means:

1. **Admin API not running**
   ```bash
   docker logs slimy-admin-api-staging
   curl http://localhost:3081/api/health
   ```

2. **Wrong API URL in web app**
   - Check `NEXT_PUBLIC_ADMIN_API_BASE` in docker-compose.staging.yml
   - Rebuild web after changing: `docker compose -f docker-compose.staging.yml up -d --build web-staging`

3. **Network issues between containers**
   ```bash
   # From web container, test admin-api
   docker exec slimy-web-staging wget -O- http://admin-api-staging:3080/api/health
   ```

### Database Connection Errors

1. **Check database is running:**
   ```bash
   docker exec slimy-db-staging pg_isready
   ```

2. **Verify connection string** in `.env.admin-api.staging`:
   ```bash
   DB_URL=postgresql://slimy_staging:password@postgres-staging:5432/slimy_staging
   ```

   Note: Use container name `postgres-staging`, not `localhost`

3. **Check credentials match:**
   - `.env.db.staging` sets: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `.env.admin-api.staging` must use same values in `DB_URL`

### Auth/Login Issues

1. **Discord OAuth not working:**
   - Verify `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`
   - Check `DISCORD_REDIRECT_URI` matches your domain
   - In Discord Developer Portal, add redirect URI to allowed list

2. **CORS errors:**
   - Update `ALLOWED_ORIGIN` in `.env.admin-api.staging`
   - Must match exact origin (including protocol and port)

3. **Cookies not persisting:**
   - Check `COOKIE_DOMAIN` matches your domain
   - For local testing, try removing `COOKIE_DOMAIN` entirely
   - Verify `COOKIE_SECURE=false` for HTTP (use `true` for HTTPS)

### Container Health Check Failing

```bash
# Check health status
docker inspect slimy-web-staging | grep -A 10 Health
docker inspect slimy-admin-api-staging | grep -A 10 Health

# Common fixes:
# 1. Wait longer (health checks have start_period)
# 2. Check app logs for startup errors
# 3. Verify health endpoints respond
curl http://localhost:3001/api/health
curl http://localhost:3081/api/health
```

## Sandbox vs Live Configuration

The staging environment should mirror production setup but use staging/test credentials:

### Sandbox Mode (Development/Staging)

- Uses test Discord OAuth app
- Mock or test database
- Less restrictive CORS
- Verbose logging enabled
- Lower rate limits

### Live Mode (Production)

- Production Discord OAuth app
- Production database with real data
- Strict CORS and security headers
- Production logging
- Enforced rate limits

**Environment variables that differ:**

| Variable              | Sandbox/Staging           | Production                |
|-----------------------|---------------------------|---------------------------|
| `NODE_ENV`            | `staging` or `development`| `production`              |
| `DISCORD_CLIENT_ID`   | Test app ID               | Prod app ID               |
| `COOKIE_SECURE`       | `false` (HTTP)            | `true` (HTTPS)            |
| `ALLOWED_ORIGIN`      | Staging domain            | Production domain         |
| `DB_URL`              | Staging database          | Production database       |

## Comparison: Staging vs Production

### Staging Stack

- **Compose file:** `docker-compose.staging.yml`
- **Containers:** `slimy-*-staging`
- **Ports:** 3001 (web), 3081 (api), 5433 (db)
- **Network:** `slimy-staging-network`
- **Data:** `./data/*-staging/`, `./logs/*-staging/`

### Production Stack

- **Compose file:** `infra/docker/docker-compose.slimy-nuc2.yml` (or nuc1)
- **Containers:** `slimy-*` (no suffix)
- **Ports:** 3000 (web), 3080 (api), 5432 (db)
- **Network:** `slimy-network`
- **Data:** `/opt/slimy/data/`, `/opt/slimy/logs/`

Both stacks can run simultaneously on the same host without conflicts.

## Monitoring and Health Checks

### Built-in Health Endpoints

```bash
# Admin API health
curl http://localhost:3081/api/health
# Response: {"status":"ok","timestamp":"..."}

# Admin API diagnostics
curl http://localhost:3081/api/diag
# Response: {"uptime":123,"memory":...}

# Web app health
curl http://localhost:3001/api/health
# Response: {"status":"ok"}
```

### Docker Health Status

```bash
# Check all container health
docker compose -f docker-compose.staging.yml ps

# Watch health in real-time
watch -n 2 'docker compose -f docker-compose.staging.yml ps'
```

### Automated Monitoring

Add to cron for periodic health checks:

```bash
# /etc/cron.d/slimy-staging-health
*/5 * * * * /path/to/slimy-monorepo/scripts/smoke-test-staging.sh >> /var/log/slimy-staging-health.log 2>&1
```

## Updating the Stack

### Pull Latest Changes

```bash
cd /path/to/slimy-monorepo
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.staging.yml up -d --build
```

### Migrate Database

If schema changes are included:

```bash
# For admin-api (if using migrations)
docker exec slimy-admin-api-staging npm run migrate

# For web (Prisma)
docker exec slimy-web-staging npx prisma migrate deploy
```

### Zero-Downtime Updates

For minimal downtime:

```bash
# Build new images
docker compose -f docker-compose.staging.yml build

# Rolling restart
docker compose -f docker-compose.staging.yml up -d --no-deps web-staging
docker compose -f docker-compose.staging.yml up -d --no-deps admin-api-staging
```

## Security Considerations

### Staging-Specific Security

1. **Don't use production secrets** - Use separate Discord OAuth app, different JWT secret
2. **Network access** - Consider firewall rules if exposed to internet
3. **HTTPS** - Use reverse proxy with TLS even for staging
4. **Data isolation** - Keep staging DB separate from production

### Recommended Security Headers

If using a reverse proxy, add these headers:

```caddyfile
header {
    Strict-Transport-Security "max-age=31536000"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "strict-origin-when-cross-origin"
}
```

## Next Steps

After successful staging deployment:

1. **Test the full auth flow:**
   - Visit http://localhost:3001/login
   - Complete Discord OAuth
   - Access protected routes

2. **Validate features:**
   - Chat: http://localhost:3001/chat
   - Snail codes: http://localhost:3001/snail/codes
   - Screenshots: http://localhost:3001/screenshots
   - Club: http://localhost:3001/club

3. **Run smoke tests regularly:**
   ```bash
   ./scripts/smoke-test-staging.sh
   ```

4. **Set up production:**
   - Use `infra/docker/docker-compose.slimy-nuc2.yml` as reference
   - Create production env files
   - Deploy to production host
   - Configure reverse proxy with HTTPS

## Additional Resources

- **Integration Summary:** [docs/WEB_BACKEND_INTEGRATION_SUMMARY.md](./WEB_BACKEND_INTEGRATION_SUMMARY.md)
- **Docker Troubleshooting:** [infra/docker/NUC2_DOCKER_ADMIN_API_FIX.md](../infra/docker/NUC2_DOCKER_ADMIN_API_FIX.md)
- **Web Deployment:** [apps/web/DEPLOYMENT.md](../apps/web/DEPLOYMENT.md)
- **Repository:** https://github.com/GurthBro0ks/slimy-monorepo

## Support

For issues or questions:

1. Check logs: `docker compose -f docker-compose.staging.yml logs`
2. Run diagnostics: `./scripts/smoke-test-staging.sh`
3. Review troubleshooting section above
4. Check existing documentation in `docs/`
