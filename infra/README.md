# Infrastructure

Infrastructure configuration and deployment files for Slimy.ai services

## Overview

This directory contains all infrastructure-related files for deploying and running Slimy.ai services across different environments. The infrastructure is designed to support:

- **Development**: Local Docker Compose setup with MySQL
- **Production**: Production Docker Compose setup with PostgreSQL
- **Reverse Proxy**: Caddy for HTTPS and domain routing
- **Monitoring**: Prometheus and Grafana for observability
- **Deployment**: Scripts for automation and maintenance

## Directory Structure

```
infra/
├── docker/                   # Docker and container configurations
│   ├── docker-compose.slimy-nuc1.yml     # Dev environment (MySQL)
│   ├── docker-compose.slimy-nuc2.yml     # Prod environment (PostgreSQL)
│   └── README.md
├── caddy/                    # Caddy reverse proxy configurations
│   ├── Caddyfile.slimy-nuc2  # Production Caddy config
│   └── README.md
├── scripts/                  # Deployment and utility scripts
│   └── README.md
└── README.md                 # This file
```

## Deployment Environments

### slimy-nuc1 (Development)

**Database**: MySQL 8
**Services**: web, admin-api, admin-ui
**Use Case**: Development and testing

```bash
# Start development environment
docker-compose -f infra/docker/docker-compose.slimy-nuc1.yml up -d

# View logs
docker-compose -f infra/docker/docker-compose.slimy-nuc1.yml logs -f

# Stop environment
docker-compose -f infra/docker/docker-compose.slimy-nuc1.yml down
```

### slimy-nuc2 (Production)

**Database**: PostgreSQL 16
**Services**: web, admin-api, caddy
**Use Case**: Production deployment

```bash
# Start production environment
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d

# View logs
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml logs -f

# Restart specific service
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml restart web
```

## Services Overview

### Web App (apps/web)
- **Port**: 3000
- **Framework**: Next.js 16
- **Purpose**: Customer-facing portal
- **Domains**:
  - slimyai.xyz
  - www.slimyai.xyz
  - slime.chat
  - www.slime.chat

### Admin API (apps/admin-api)
- **Port**: 3080
- **Framework**: Express.js
- **Purpose**: Backend REST API
- **Endpoint**: panel.slimyai.xyz/api/*

### Admin UI (apps/admin-ui)
- **Port**: 3081
- **Framework**: Next.js 14
- **Purpose**: Admin dashboard
- **Domain**: panel.slimyai.xyz

### Caddy (Reverse Proxy)
- **Port**: 80, 443
- **Purpose**: HTTPS termination and routing
- **Features**:
  - Automatic HTTPS
  - Domain routing
  - Load balancing
  - Compression

## Database Management

### MySQL (Development)

```bash
# Connect to MySQL
docker exec -it slimy-mysql mysql -u root -p

# Backup database
docker exec slimy-mysql mysqldump -u root -p slimy > backup.sql

# Restore database
docker exec -i slimy-mysql mysql -u root -p slimy < backup.sql
```

### PostgreSQL (Production)

```bash
# Connect to PostgreSQL
docker exec -it slimy-postgres psql -U slimy

# Backup database
docker exec slimy-postgres pg_dump -U slimy slimy > backup.sql

# Restore database
docker exec -i slimy-postgres psql -U slimy slimy < backup.sql
```

## Monitoring

### Prometheus (Metrics)

**URL**: http://localhost:9090
**Config**: `apps/admin-api/monitoring/prometheus.yml`

```bash
# View Prometheus targets
curl http://localhost:9090/api/v1/targets
```

### Grafana (Dashboards)

**URL**: http://localhost:3001
**Dashboards**: `apps/admin-api/monitoring/grafana/`

```bash
# Import Grafana dashboard
curl -X POST http://admin:admin@localhost:3001/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @dashboard.json
```

## Health Checks

All services expose health check endpoints:

```bash
# Web app
curl http://localhost:3000/api/health

# Admin API
curl http://localhost:3080/api/health

# Admin UI
curl http://localhost:3081/
```

## SSL/TLS Certificates

Caddy automatically provisions and renews SSL certificates via Let's Encrypt.

**Certificate Storage**: Managed by Caddy (automatic)
**Renewal**: Automatic (30 days before expiry)

## Networking

### Docker Networks

**slimy-net** (Development):
- Bridge network
- Internal communication between services

**slimy** (Production):
- Custom bridge network
- External volume mounting

### Port Mapping

| Service    | Internal Port | External Port | Access       |
|------------|---------------|---------------|--------------|
| Web        | 3000          | 3000          | Public       |
| Admin API  | 3080          | 3080          | Internal     |
| Admin UI   | 3081          | 3081          | Internal     |
| Caddy      | 80, 443       | 80, 443       | Public       |
| MySQL      | 3306          | 3306          | Internal     |
| PostgreSQL | 5432          | 5432          | Internal     |
| Prometheus | 9090          | 9090          | Internal     |
| Grafana    | 3001          | 3001          | Internal     |

## Volume Management

### Named Volumes (Development)

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect slimy-mysql-data

# Remove volumes (WARNING: data loss)
docker volume rm slimy-mysql-data
```

### External Volumes (Production)

Production uses external volumes mounted from host:

- `/opt/slimy/backups/` - Database backups
- `/opt/slimy/logs/` - Application logs
- Pre-existing Docker volumes for persistence

## Deployment Workflow

### Initial Setup

1. **Clone repository**:
   ```bash
   git clone https://github.com/GurthBro0ks/slimy-monorepo.git
   cd slimy-monorepo
   ```

2. **Configure environment**:
   ```bash
   # Copy environment templates
   cp apps/web/.env.example apps/web/.env
   cp apps/admin-api/.env.example apps/admin-api/.env

   # Edit environment files with production values
   ```

3. **Build images**:
   ```bash
   docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml build
   ```

4. **Start services**:
   ```bash
   docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d
   ```

5. **Run migrations**:
   ```bash
   docker exec slimy-web pnpm prisma migrate deploy
   docker exec slimy-admin-api pnpm prisma migrate deploy
   ```

### Updates and Deployments

1. **Pull latest code**:
   ```bash
   git pull origin main
   ```

2. **Rebuild images**:
   ```bash
   docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml build
   ```

3. **Restart services** (zero-downtime):
   ```bash
   docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --no-deps --build web
   docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --no-deps --build admin-api
   ```

4. **Run migrations** (if needed):
   ```bash
   docker exec slimy-web pnpm prisma migrate deploy
   ```

## Troubleshooting

### Service Not Starting

```bash
# Check logs
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml logs service-name

# Check container status
docker ps -a

# Restart service
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml restart service-name
```

### Database Connection Issues

```bash
# Check database is running
docker ps | grep postgres

# Check connection from app
docker exec slimy-web pnpm prisma db pull

# Test database connection
docker exec slimy-postgres psql -U slimy -c "SELECT 1"
```

### Network Issues

```bash
# List networks
docker network ls

# Inspect network
docker network inspect slimy

# Recreate network
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml down
docker network rm slimy
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with real secrets
2. **Database Passwords**: Use strong, unique passwords
3. **SSL/TLS**: Always use HTTPS in production (Caddy handles this)
4. **Network Isolation**: Services communicate via internal Docker network
5. **Access Control**: Restrict database and monitoring ports to internal only

## Backup Strategy

### Database Backups

**Automated** (recommended):
```bash
# Add to crontab
0 2 * * * /opt/slimy/scripts/backup-db.sh
```

**Manual**:
```bash
# PostgreSQL
docker exec slimy-postgres pg_dump -U slimy slimy > backup-$(date +%Y%m%d).sql

# Compress and store
gzip backup-$(date +%Y%m%d).sql
mv backup-$(date +%Y%m%d).sql.gz /opt/slimy/backups/
```

### Application Data Backups

```bash
# Backup uploads and user data
tar -czf data-backup-$(date +%Y%m%d).tar.gz /opt/slimy/data/
```

## Monitoring and Alerting

### Prometheus Alerts

Configure alerts in `apps/admin-api/monitoring/prometheus.yml`:

```yaml
rule_files:
  - 'alerts/*.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
```

### Discord Notifications

Deploy notifications configured in `.github/workflows/deploy-notify.yml`:

```yaml
- name: Discord notification
  uses: Ilshidur/action-discord@master
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

## Performance Optimization

### Docker Build Cache

```bash
# Build with cache
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml build

# Build without cache (fresh build)
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml build --no-cache
```

### Resource Limits

Configure in docker-compose.yml:

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

## Future Enhancements

- **Kubernetes**: Migrate to K8s for better orchestration
- **CI/CD Pipeline**: Automated deployments via GitHub Actions
- **Blue-Green Deployments**: Zero-downtime deployments
- **Auto-scaling**: Horizontal scaling based on load
- **Centralized Logging**: ELK stack or similar
- **Secrets Management**: HashiCorp Vault or AWS Secrets Manager

## Related Documentation

- [Docker Configurations](./docker/README.md)
- [Caddy Configuration](./caddy/README.md)
- [Deployment Scripts](./scripts/README.md)

## Support

For infrastructure issues, contact the DevOps team or create an issue in the repository.

## License

Proprietary - Slimy.ai
