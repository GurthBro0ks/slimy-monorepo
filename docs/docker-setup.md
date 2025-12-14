# Running the Full Stack with Docker

This guide explains how to run the entire Slimy monorepo stack using Docker and Docker Compose. All applications (admin-api, web, admin-ui, bot) and the MySQL database will run in isolated containers with proper networking and orchestration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Running the Stack](#running-the-stack)
- [Accessing Services](#accessing-services)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)

---

## Prerequisites

Before running the stack, ensure you have the following installed:

### Required Software

1. **Docker Desktop** (recommended) or **Docker Engine**
   - **macOS/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - **Linux**: [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose Plugin](https://docs.docker.com/compose/install/)
   - Minimum version: Docker 20.10+ and Docker Compose v2.0+

2. **Verify Installation**
   ```bash
   docker --version
   # Expected: Docker version 20.10.0 or higher
   
   docker compose version
   # Expected: Docker Compose version v2.0.0 or higher
   ```

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended for smooth operation)
- **Disk Space**: At least 10GB free for images and volumes
- **Network**: Internet connection for pulling base images and dependencies

---

## Architecture Overview

The Docker Compose stack consists of the following services:

| Service | Description | Port | Dependencies |
|---------|-------------|------|--------------|
| **db** | MySQL 8.0 database | 3306 | None |
| **admin-api** | Backend API (Node.js) | 3080 | db |
| **web** | Public frontend (Next.js) | 3000 | admin-api, db |
| **admin-ui** | Admin dashboard (Next.js) | 3001 | admin-api |
| **bot** | Discord bot | N/A | None |

All services communicate through a shared Docker network (`slimy-network`). The database uses a persistent volume (`mysql_data`) to preserve data across container restarts.

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/GurthBro0ks/slimy-monorepo.git
cd slimy-monorepo
```

### 2. Configure Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.docker.example .env
```

**Edit `.env` and set the following REQUIRED variables:**

```bash
# Discord OAuth (REQUIRED)
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Security (REQUIRED - generate strong random strings)
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
```

> **Tip**: Generate secure secrets using:
> ```bash
> openssl rand -base64 32
> ```

### 3. Build and Run

```bash
docker compose up --build
```

This command will:
- Build all Docker images (first run takes 5-10 minutes)
- Start all services in the correct order
- Stream logs to your terminal

### 4. Verify Services

Once all services are running, you should see:

```
slimy-db          | [Server] /usr/sbin/mysqld: ready for connections.
slimy-admin-api   | Server listening on port 3080
slimy-web         | ▲ Next.js 16.x.x
slimy-admin-ui    | ▲ Next.js 16.x.x
slimy-bot         | Discord bot logged in as...
```

---

## Configuration

### Environment Variables

The `.env` file controls all configuration. Key sections:

#### Database Configuration

```bash
MYSQL_ROOT_PASSWORD=rootpassword       # Root password for MySQL
MYSQL_DATABASE=slimyai                 # Database name
MYSQL_USER=slimyai                     # Application database user
MYSQL_PASSWORD=slimypassword           # Application database password
```

#### Discord OAuth

Obtain these from the [Discord Developer Portal](https://discord.com/developers/applications):

```bash
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:3001/api/admin-api/api/auth/callback
DISCORD_BOT_TOKEN=your_bot_token
```

#### Security

**CRITICAL**: Change these in production!

```bash
SESSION_SECRET=your_session_secret_here_change_this_32_chars_minimum
JWT_SECRET=your_jwt_secret_here_change_this_32_chars_minimum
SESSION_COOKIE_DOMAIN=.localhost       # Change to your domain in production
```

#### Frontend URLs

```bash
# Public API base URL (for browser requests)
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080

# Internal API URL (for server-side requests from admin-ui)
ADMIN_API_INTERNAL_URL=http://admin-api:3080
```

#### Optional Integrations

```bash
OPENAI_API_KEY=                        # For AI features
STATS_SHEET_ID=                        # Google Sheets integration
NEXT_PUBLIC_SNELP_CODES_URL=           # Snelp codes integration
```

---

## Running the Stack

### Start All Services

```bash
# Build and start (recommended for first run or after code changes)
docker compose up --build

# Start in detached mode (background)
docker compose up -d

# Start specific services only
docker compose up db admin-api
```

### Stop Services

```bash
# Stop all services (preserves volumes)
docker compose down

# Stop and remove volumes (CAUTION: deletes database data)
docker compose down -v
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f admin-api

# Last 100 lines
docker compose logs --tail=100 web
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker compose build admin-api

# Rebuild all services
docker compose build

# Rebuild and restart
docker compose up --build -d
```

---

## Accessing Services

Once the stack is running:

| Service | URL | Description |
|---------|-----|-------------|
| **Web Frontend** | http://localhost:3000 | Public-facing application |
| **Admin UI** | http://localhost:3001 | Admin dashboard |
| **Admin API** | http://localhost:3080 | Backend API (direct access) |
| **MySQL Database** | localhost:3306 | Database (use MySQL client) |

### Testing the API

```bash
# Health check
curl http://localhost:3080/api/health

# Check authentication endpoint
curl http://localhost:3080/api/auth/me
```

---

## Database Management

### Access MySQL Shell

```bash
docker compose exec db mysql -u slimyai -pslimypassword slimyai
```

### Run Prisma Migrations

The admin-api service automatically generates the Prisma client during build. To run migrations:

```bash
# Recommended (idempotent): run migrations via helper script
bash scripts/dev/migrate-admin-api-db.sh

# Manual (inside container)
docker compose exec admin-api sh -lc 'cd /app/apps/admin-api && pnpm prisma migrate deploy'
```

> Note: `pnpm smoke:docker` now runs this migration step automatically after the DB is healthy.

### Backup Database

```bash
# Create backup
docker compose exec db mysqldump -u root -prootpassword slimyai > backup.sql

# Restore from backup
docker compose exec -T db mysql -u root -prootpassword slimyai < backup.sql
```

### Reset Database

**CAUTION**: This deletes all data!

```bash
docker compose down -v
docker compose up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Symptom**: `admin-api` or `web` services fail with "Cannot connect to database"

**Solution**: The database takes 10-20 seconds to initialize on first run. The services have health checks and will wait, but you can verify:

```bash
# Check database health
docker compose ps

# Wait for db to show "healthy"
# If stuck, check logs
docker compose logs db
```

#### 2. Port Already in Use

**Symptom**: `Error: bind: address already in use`

**Solution**: Another service is using the port. Either stop the conflicting service or change the port in `docker-compose.yml`:

```yaml
services:
  web:
    ports:
      - "3002:3000"  # Change host port from 3000 to 3002
```

#### 3. Build Failures

**Symptom**: `npm install` or `pnpm install` fails during build

**Solution**: 
- Ensure you have a stable internet connection
- Clear Docker build cache: `docker compose build --no-cache`
- Check Docker has enough disk space: `docker system df`

#### 4. Permission Denied Errors

**Symptom**: `EACCES: permission denied`

**Solution**: 
- On Linux, ensure your user is in the `docker` group:
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```

#### 5. Next.js Build Errors

**Symptom**: `Module not found` or `Cannot find module` during Next.js build

**Solution**: 
- Ensure all workspace dependencies are copied in the Dockerfile
- Rebuild with no cache: `docker compose build --no-cache web`

#### 6. Discord Bot Not Connecting

**Symptom**: Bot service exits or shows authentication errors

**Solution**: 
- Verify `DISCORD_BOT_TOKEN` is correct in `.env`
- Check bot logs: `docker compose logs bot`
- Ensure bot has proper intents enabled in Discord Developer Portal

### Debugging Tips

#### Inspect Running Containers

```bash
# List running containers
docker compose ps

# Access container shell
docker compose exec admin-api sh
docker compose exec web sh

# Check resource usage
docker stats
```

#### Clean Up Docker Resources

```bash
# Remove stopped containers
docker compose down

# Remove all unused images, containers, volumes
docker system prune -a --volumes

# WARNING: This deletes everything not currently in use!
```

#### Check Service Dependencies

```bash
# Verify network connectivity between services
docker compose exec web ping admin-api
docker compose exec admin-api ping db
```

---

## Development Workflow

### Hot Reload Development

For active development, you may prefer running services locally with hot reload:

```bash
# Run only database in Docker
docker compose up db -d

# Run services locally with hot reload
pnpm dev:admin-api
pnpm dev:web
pnpm dev:admin-ui
pnpm dev:bot
```

Update local `.env` files to point to `localhost:3306` for database.

### Hybrid Development

Run some services in Docker and others locally:

```bash
# Run database and admin-api in Docker
docker compose up db admin-api -d

# Run frontends locally for faster iteration
pnpm dev:web
pnpm dev:admin-ui
```

---

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Change all default passwords in `.env`
- [ ] Generate strong `SESSION_SECRET` and `JWT_SECRET`
- [ ] Update `SESSION_COOKIE_DOMAIN` to your domain (e.g., `.yourdomain.com`)
- [ ] Update `CORS_ORIGIN` to your production frontend URL
- [ ] Update `DISCORD_REDIRECT_URI` to production callback URL
- [ ] Set `NODE_ENV=production`
- [ ] Review and restrict `ADMIN_USER_IDS` and `CLUB_USER_IDS`
- [ ] Enable HTTPS/TLS (use reverse proxy like Nginx or Traefik)
- [ ] Configure database backups
- [ ] Set up monitoring and logging

### Production Environment Variables

```bash
NODE_ENV=production
SESSION_COOKIE_DOMAIN=.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/callback
NEXT_PUBLIC_ADMIN_API_BASE=https://api.yourdomain.com
```

### Reverse Proxy Setup (Nginx Example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Scaling Considerations

For production scale:

1. **Database**: Use managed MySQL (AWS RDS, Google Cloud SQL) instead of containerized MySQL
2. **Load Balancing**: Run multiple instances of `web` and `admin-api` behind a load balancer
3. **Secrets Management**: Use Docker secrets or environment variable injection from CI/CD
4. **Monitoring**: Integrate with Prometheus, Grafana, or cloud monitoring tools

---

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Discord.js Guide](https://discordjs.guide/)

---

## Support

If you encounter issues not covered in this guide:

1. Check service logs: `docker compose logs <service-name>`
2. Review the [GitHub Issues](https://github.com/GurthBro0ks/slimy-monorepo/issues)
3. Consult the individual app READMEs in `apps/*/README.md`

---

**Last Updated**: December 2024  
**Docker Compose Version**: v2.0+  
**Tested On**: Docker Desktop 4.x (macOS, Windows, Linux)
