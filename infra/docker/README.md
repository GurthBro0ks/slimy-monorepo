# Docker Configurations

Docker Compose configurations for Slimy.ai services

## Overview

This directory contains Docker Compose configurations for different deployment environments. Each configuration is optimized for its specific use case.

## Configurations

### docker-compose.slimy-nuc1.yml (Development)

**Target Environment**: Development and testing
**Database**: MySQL 8
**Services**: web, admin-api, admin-ui, mysql

#### Features
- MySQL database with custom entrypoint for URL parsing
- Bridge network for internal communication
- Named volumes for data persistence
- Health checks for all services
- Port exposure for debugging

#### Usage

```bash
# Start all services
docker-compose -f docker-compose.slimy-nuc1.yml up -d

# Start specific service
docker-compose -f docker-compose.slimy-nuc1.yml up -d web

# View logs
docker-compose -f docker-compose.slimy-nuc1.yml logs -f

# Stop all services
docker-compose -f docker-compose.slimy-nuc1.yml down

# Stop and remove volumes (WARNING: data loss)
docker-compose -f docker-compose.slimy-nuc1.yml down -v
```

#### Service Details

**MySQL Service**:
- Image: `mysql:8`
- Port: `3306`
- Volume: `mysql-data` (named volume)
- Custom entrypoint for DATABASE_URL parsing

**Web Service**:
- Build: `../../apps/web`
- Port: `3000`
- Depends on: mysql
- Health check: `GET /api/health`

**Admin API Service**:
- Build: `../../apps/admin-api`
- Port: `3080`
- Depends on: mysql
- Health check: `GET /api/health`

**Admin UI Service**:
- Build: `../../apps/admin-ui`
- Port: `3081`
- Depends on: admin-api
- Health check: `GET /`

---

### docker-compose.slimy-nuc2.yml (Production)

**Target Environment**: Production
**Database**: PostgreSQL 16
**Services**: postgres, admin-api, web, caddy, loopback

#### Features
- PostgreSQL 16 Alpine for production
- External volumes for data persistence
- Caddy reverse proxy with host network
- Build arguments for environment-specific builds
- Production-grade health checks

#### Usage

```bash
# Start all services
docker-compose -f docker-compose.slimy-nuc2.yml up -d

# Start with build
docker-compose -f docker-compose.slimy-nuc2.yml up -d --build

# View logs
docker-compose -f docker-compose.slimy-nuc2.yml logs -f

# Restart specific service
docker-compose -f docker-compose.slimy-nuc2.yml restart web

# Stop all services
docker-compose -f docker-compose.slimy-nuc2.yml down
```

#### Service Details

**PostgreSQL Service**:
- Image: `postgres:16-alpine`
- Port: `5432`
- External volumes: Pre-existing Docker volumes
- Environment: Production credentials

**Admin API Service**:
- Build: `../../apps/admin-api`
- Port: `3080`
- Volumes: External volume mounts at `/opt/slimy/`
- Depends on: postgres

**Web Service**:
- Build: `../../apps/web`
- Port: `3000`
- Build args: `NEXT_PUBLIC_ADMIN_API_BASE`
- Prisma migrations on startup
- Depends on: postgres

**Caddy Service**:
- Image: `caddy:2`
- Network mode: `host`
- Volumes: Caddyfile from host
- Purpose: Reverse proxy and HTTPS

**Loopback Service** (Testing):
- Build: Python HTTP server
- Port: `1455`
- Purpose: Testing and diagnostics

---

## Environment Variables

### Development (.env.development)

```env
# Database
DATABASE_URL=mysql://root:password@mysql:3306/slimy

# Web
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080

# Admin API
PORT=3080
NODE_ENV=development
```

### Production (.env.production)

```env
# Database
DATABASE_URL=postgresql://slimy:password@postgres:5432/slimy

# Web
NEXT_PUBLIC_ADMIN_API_BASE=https://panel.slimyai.xyz/api

# Admin API
PORT=3080
NODE_ENV=production
```

## Networking

### Development (slimy-net)

```yaml
networks:
  slimy-net:
    driver: bridge
```

Services communicate via bridge network. Use service names as hostnames:
- `mysql` - Database
- `web` - Web app
- `admin-api` - Admin API

### Production (slimy)

```yaml
networks:
  slimy:
    name: slimy
```

Custom network for production with explicit naming.

Caddy uses `host` network mode for direct port access.

## Volume Management

### Development Volumes

**Named volumes** (managed by Docker):

```yaml
volumes:
  mysql-data:
    driver: local
```

**Backup volume**:
```bash
docker run --rm -v slimy_mysql-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mysql-data-backup.tar.gz /data
```

**Restore volume**:
```bash
docker run --rm -v slimy_mysql-data:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/mysql-data-backup.tar.gz --strip 1"
```

### Production Volumes

**External volumes** (pre-existing):

```yaml
volumes:
  postgres-data:
    external: true
    name: slimy-postgres-data
```

Create external volumes:
```bash
docker volume create slimy-postgres-data
```

**Host mounts** (direct filesystem access):

```yaml
volumes:
  - /opt/slimy/backups:/backups
  - /opt/slimy/logs:/logs
```

## Health Checks

All services include health checks for monitoring:

### Web Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### API Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3080/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 20s
```

## Building Images

### Build All Services

```bash
docker-compose -f docker-compose.slimy-nuc2.yml build
```

### Build Specific Service

```bash
docker-compose -f docker-compose.slimy-nuc2.yml build web
```

### Build Without Cache

```bash
docker-compose -f docker-compose.slimy-nuc2.yml build --no-cache
```

### Build with Args

```bash
docker-compose -f docker-compose.slimy-nuc2.yml build --build-arg NODE_ENV=production web
```

## Running Migrations

### Web App (Prisma)

```bash
# Development
docker-compose -f docker-compose.slimy-nuc1.yml exec web pnpm prisma migrate dev

# Production
docker-compose -f docker-compose.slimy-nuc2.yml exec web pnpm prisma migrate deploy
```

### Admin API (Prisma)

```bash
# Development
docker-compose -f docker-compose.slimy-nuc1.yml exec admin-api pnpm prisma migrate dev

# Production
docker-compose -f docker-compose.slimy-nuc2.yml exec admin-api pnpm prisma migrate deploy
```

## Viewing Logs

### All Services

```bash
docker-compose -f docker-compose.slimy-nuc2.yml logs -f
```

### Specific Service

```bash
docker-compose -f docker-compose.slimy-nuc2.yml logs -f web
```

### Last N Lines

```bash
docker-compose -f docker-compose.slimy-nuc2.yml logs --tail=100 web
```

### Filter by Time

```bash
docker-compose -f docker-compose.slimy-nuc2.yml logs --since="2025-01-01T00:00:00" web
```

## Scaling Services

Docker Compose supports scaling for stateless services:

```bash
# Scale web service to 3 instances
docker-compose -f docker-compose.slimy-nuc2.yml up -d --scale web=3
```

**Note**: Requires load balancer configuration (Caddy can handle this).

## Resource Limits

Add resource limits to prevent services from consuming too many resources:

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## Troubleshooting

### Service Won't Start

```bash
# Check service status
docker-compose -f docker-compose.slimy-nuc2.yml ps

# View logs for errors
docker-compose -f docker-compose.slimy-nuc2.yml logs service-name

# Inspect container
docker inspect slimy-web
```

### Database Connection Errors

```bash
# Check database is running
docker-compose -f docker-compose.slimy-nuc2.yml ps postgres

# Test connection
docker-compose -f docker-compose.slimy-nuc2.yml exec postgres psql -U slimy

# Check environment variables
docker-compose -f docker-compose.slimy-nuc2.yml exec web env | grep DATABASE
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a
docker volume prune

# Remove old images
docker image prune -a
```

## Best Practices

1. **Use .env files**: Store environment-specific variables in `.env` files
2. **Named volumes**: Use named volumes for important data
3. **Health checks**: Always include health checks
4. **Resource limits**: Set resource limits to prevent resource exhaustion
5. **Logging**: Configure logging drivers for production
6. **Restart policies**: Use `restart: unless-stopped` for production
7. **Security**: Don't expose unnecessary ports
8. **Backups**: Regular backups of volumes and databases

## Security

### Secrets Management

Don't hardcode secrets in docker-compose.yml:

```yaml
# Bad
environment:
  - DATABASE_PASSWORD=mysecretpassword

# Good
environment:
  - DATABASE_PASSWORD=${DATABASE_PASSWORD}
```

### Network Isolation

Isolate services with internal networks:

```yaml
services:
  database:
    networks:
      - backend  # Internal only

  api:
    networks:
      - backend
      - frontend

  web:
    networks:
      - frontend

networks:
  backend:
    internal: true  # No external access
  frontend:
```

## Monitoring

### Container Stats

```bash
# View resource usage
docker stats

# Specific services
docker-compose -f docker-compose.slimy-nuc2.yml stats
```

### Health Check Status

```bash
# View health status
docker-compose -f docker-compose.slimy-nuc2.yml ps
```

### Export Metrics

Use Prometheus to scrape Docker metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['docker.for.mac.localhost:9323']
```

## Future Enhancements

- **Multi-stage builds**: Optimize image sizes
- **Docker secrets**: Use Docker secrets for sensitive data
- **Health check endpoints**: More sophisticated health checks
- **Graceful shutdown**: Implement SIGTERM handling
- **Auto-restart**: Configure restart policies
- **Log rotation**: Implement log rotation for containers

## Related Documentation

- [Main Infrastructure README](../README.md)
- [Caddy Configuration](../caddy/README.md)
- Docker Compose Documentation: https://docs.docker.com/compose/

## License

Proprietary - Slimy.ai
