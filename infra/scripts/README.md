# Infrastructure Scripts

Deployment and utility scripts for Slimy.ai infrastructure

## Overview

This directory contains automation scripts for infrastructure management, including:
- Deployment automation
- Database backup and restore
- Health checks and monitoring
- Log management
- Maintenance tasks

## Current Status

⚠️ **PLACEHOLDER** - This directory is currently empty. Scripts need to be created for infrastructure automation.

## Proposed Scripts

### Deployment Scripts

#### deploy.sh
Deploy services to production with zero downtime.

```bash
#!/bin/bash
# Usage: ./deploy.sh [service-name]

set -e

SERVICE=${1:-all}
COMPOSE_FILE="infra/docker/docker-compose.slimy-nuc2.yml"

echo "🚀 Deploying $SERVICE..."

# Pull latest code
git pull origin main

# Build images
docker-compose -f $COMPOSE_FILE build $SERVICE

# Run migrations
if [ "$SERVICE" = "web" ] || [ "$SERVICE" = "all" ]; then
    docker-compose -f $COMPOSE_FILE exec web pnpm prisma migrate deploy
fi

if [ "$SERVICE" = "admin-api" ] || [ "$SERVICE" = "all" ]; then
    docker-compose -f $COMPOSE_FILE exec admin-api pnpm prisma migrate deploy
fi

# Restart services with no downtime
docker-compose -f $COMPOSE_FILE up -d --no-deps --build $SERVICE

echo "✅ Deployment complete!"
```

#### rollback.sh
Rollback to previous deployment.

```bash
#!/bin/bash
# Usage: ./rollback.sh [commit-hash]

COMMIT=${1}

if [ -z "$COMMIT" ]; then
    echo "Usage: ./rollback.sh [commit-hash]"
    exit 1
fi

echo "🔄 Rolling back to $COMMIT..."

git checkout $COMMIT
./deploy.sh

echo "✅ Rollback complete!"
```

### Database Scripts

#### backup-db.sh
Backup database to file.

```bash
#!/bin/bash
# Usage: ./backup-db.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/slimy/backups"
BACKUP_FILE="$BACKUP_DIR/db-backup-$DATE.sql"

echo "💾 Backing up database..."

# PostgreSQL backup
docker exec slimy-postgres pg_dump -U slimy slimy > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "db-backup-*.sql.gz" -mtime +30 -delete

echo "✅ Backup complete: ${BACKUP_FILE}.gz"
```

#### restore-db.sh
Restore database from backup.

```bash
#!/bin/bash
# Usage: ./restore-db.sh [backup-file]

BACKUP_FILE=${1}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-db.sh [backup-file]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database from $BACKUP_FILE"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted"
    exit 0
fi

echo "🔄 Restoring database..."

# Decompress if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker exec -i slimy-postgres psql -U slimy slimy
else
    docker exec -i slimy-postgres psql -U slimy slimy < $BACKUP_FILE
fi

echo "✅ Restore complete!"
```

#### migrate-db.sh
Run database migrations.

```bash
#!/bin/bash
# Usage: ./migrate-db.sh [service]

SERVICE=${1:-web}
COMPOSE_FILE="infra/docker/docker-compose.slimy-nuc2.yml"

echo "🔄 Running migrations for $SERVICE..."

docker-compose -f $COMPOSE_FILE exec $SERVICE pnpm prisma migrate deploy

echo "✅ Migrations complete!"
```

### Health Check Scripts

#### health-check.sh
Check health of all services.

```bash
#!/bin/bash
# Usage: ./health-check.sh

set -e

SERVICES=("web:3000" "admin-api:3080" "admin-ui:3081")
FAILED=0

echo "🏥 Checking service health..."

for SERVICE in "${SERVICES[@]}"; do
    NAME=${SERVICE%%:*}
    PORT=${SERVICE##*:}

    if curl -f -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
        echo "✅ $NAME is healthy"
    else
        echo "❌ $NAME is unhealthy"
        FAILED=$((FAILED + 1))
    fi
done

if [ $FAILED -gt 0 ]; then
    echo "❌ $FAILED service(s) failed health check"
    exit 1
else
    echo "✅ All services healthy"
fi
```

#### check-ssl.sh
Check SSL certificate expiration.

```bash
#!/bin/bash
# Usage: ./check-ssl.sh [domain]

DOMAIN=${1:-slimyai.xyz}

echo "🔒 Checking SSL certificate for $DOMAIN..."

EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | \
         openssl x509 -noout -enddate | cut -d= -f2)

EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "Certificate expires: $EXPIRY"
echo "Days remaining: $DAYS_LEFT"

if [ $DAYS_LEFT -lt 30 ]; then
    echo "⚠️  Certificate expires soon! ($DAYS_LEFT days)"
    exit 1
else
    echo "✅ Certificate is valid"
fi
```

### Monitoring Scripts

#### monitor.sh
Real-time monitoring of services.

```bash
#!/bin/bash
# Usage: ./monitor.sh

watch -n 5 '
echo "=== Service Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""
echo "=== Health Checks ==="
curl -s http://localhost:3000/api/health | jq .
curl -s http://localhost:3080/api/health | jq .
'
```

#### logs.sh
Aggregate logs from all services.

```bash
#!/bin/bash
# Usage: ./logs.sh [service]

SERVICE=${1:-all}
COMPOSE_FILE="infra/docker/docker-compose.slimy-nuc2.yml"

if [ "$SERVICE" = "all" ]; then
    docker-compose -f $COMPOSE_FILE logs -f
else
    docker-compose -f $COMPOSE_FILE logs -f $SERVICE
fi
```

### Maintenance Scripts

#### cleanup.sh
Clean up Docker resources.

```bash
#!/bin/bash
# Usage: ./cleanup.sh

echo "🧹 Cleaning up Docker resources..."

# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes (WARNING: data loss)
read -p "Remove unused volumes? (yes/no): " CONFIRM
if [ "$CONFIRM" = "yes" ]; then
    docker volume prune -f
fi

# Remove unused networks
docker network prune -f

# Show disk usage
docker system df

echo "✅ Cleanup complete!"
```

#### rotate-logs.sh
Rotate application logs.

```bash
#!/bin/bash
# Usage: ./rotate-logs.sh

LOG_DIR="/opt/slimy/logs"
MAX_SIZE_MB=100
MAX_AGE_DAYS=30

echo "📋 Rotating logs..."

# Compress logs larger than MAX_SIZE_MB
find $LOG_DIR -type f -size +${MAX_SIZE_MB}M -name "*.log" -exec gzip {} \;

# Delete compressed logs older than MAX_AGE_DAYS
find $LOG_DIR -type f -name "*.log.gz" -mtime +$MAX_AGE_DAYS -delete

echo "✅ Log rotation complete!"
```

#### update-dependencies.sh
Update dependencies for all packages.

```bash
#!/bin/bash
# Usage: ./update-dependencies.sh

echo "📦 Updating dependencies..."

# Update root dependencies
pnpm update

# Update all workspace dependencies
pnpm -r update

# Check for outdated packages
pnpm outdated -r

echo "✅ Dependencies updated!"
```

### Setup Scripts

#### setup-dev.sh
Set up development environment.

```bash
#!/bin/bash
# Usage: ./setup-dev.sh

set -e

echo "🛠️  Setting up development environment..."

# Install dependencies
pnpm install

# Copy environment templates
cp apps/web/.env.example apps/web/.env
cp apps/admin-api/.env.example apps/admin-api/.env
cp apps/admin-ui/.env.example apps/admin-ui/.env

echo "📝 Please edit .env files with your configuration"

# Start development databases
docker-compose -f infra/docker/docker-compose.slimy-nuc1.yml up -d mysql

# Wait for database
sleep 10

# Run migrations
pnpm -r run db:migrate

echo "✅ Development environment ready!"
echo "Run 'pnpm dev' to start development servers"
```

#### setup-prod.sh
Set up production environment.

```bash
#!/bin/bash
# Usage: ./setup-prod.sh

set -e

echo "🚀 Setting up production environment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

# Create directories
mkdir -p /opt/slimy/backups
mkdir -p /opt/slimy/logs
mkdir -p /opt/slimy/data

# Set permissions
chown -R 1000:1000 /opt/slimy

# Create Docker volumes
docker volume create slimy-postgres-data

# Copy environment files
echo "📝 Please set up production .env files"

# Set up cron jobs
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/slimy/scripts/backup-db.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/slimy/scripts/cleanup.sh") | crontab -

echo "✅ Production environment ready!"
```

## Cron Jobs

Add to crontab for automated tasks:

```bash
# Backup database daily at 2 AM
0 2 * * * /opt/slimy/infra/scripts/backup-db.sh

# Clean up Docker weekly
0 3 * * 0 /opt/slimy/infra/scripts/cleanup.sh

# Rotate logs daily
0 4 * * * /opt/slimy/infra/scripts/rotate-logs.sh

# Health check every 5 minutes
*/5 * * * * /opt/slimy/infra/scripts/health-check.sh
```

## Monitoring Integration

### Prometheus Alerting

Create alerts for script failures:

```yaml
# prometheus-alerts.yml
groups:
  - name: backup
    rules:
      - alert: BackupFailed
        expr: backup_success{job="slimy"} == 0
        for: 1h
        annotations:
          summary: "Database backup failed"
```

### Logging

All scripts should log to:
- `/opt/slimy/logs/scripts/`

Log format:
```
[YYYY-MM-DD HH:MM:SS] [LEVEL] message
```

## Error Handling

All scripts should:
1. Use `set -e` to exit on error
2. Validate inputs
3. Log errors to file
4. Send notifications on failure (email, Discord, etc.)

## Best Practices

1. **Idempotency**: Scripts should be safe to run multiple times
2. **Validation**: Always validate inputs and state
3. **Logging**: Log all actions and errors
4. **Notifications**: Alert on failures
5. **Backups**: Always backup before destructive operations
6. **Testing**: Test scripts in development first
7. **Documentation**: Document what each script does
8. **Permissions**: Use minimal required permissions

## Security

1. **Secrets**: Never hardcode secrets in scripts
2. **Permissions**: Set restrictive file permissions (700)
3. **Sudo**: Avoid sudo when possible
4. **Validation**: Sanitize all inputs
5. **Logging**: Don't log sensitive data

## Testing Scripts

Test scripts in development:

```bash
# Dry run mode
./script.sh --dry-run

# Verbose mode
./script.sh --verbose

# Test with sample data
./script.sh --test
```

## Future Enhancements

- **Ansible Playbooks**: Automate infrastructure provisioning
- **Terraform**: Infrastructure as code
- **CI/CD Integration**: Run scripts via GitHub Actions
- **Monitoring Dashboard**: Visualize script execution
- **Slack/Discord Notifications**: Real-time alerts
- **Automated Testing**: Test scripts in CI
- **Blue-Green Deployments**: Zero-downtime deployments

## Related Documentation

- [Main Infrastructure README](../README.md)
- [Docker Configuration](../docker/README.md)
- [Caddy Configuration](../caddy/README.md)

## License

Proprietary - Slimy.ai
