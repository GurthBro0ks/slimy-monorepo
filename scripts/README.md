# Deployment Scripts

This directory contains scripts for deploying and managing the Slimy staging stack.

## Available Scripts

### `deploy-staging.sh`

Deploys the full staging stack (web + admin-api + database) using Docker Compose.

**Usage:**

```bash
./scripts/deploy-staging.sh
```

**What it does:**

1. Checks prerequisites (Docker, Compose)
2. Validates environment files exist
3. Creates necessary data directories
4. Builds and starts containers
5. Waits for services to become healthy
6. Displays service URLs and next steps

**Requirements:**

- Docker and Docker Compose installed
- Environment files: `.env.db.staging`, `.env.admin-api.staging`, `.env.web.staging`

### `down-staging.sh`

Stops and removes the staging stack containers.

**Usage:**

```bash
# Stop containers (preserve data)
./scripts/down-staging.sh

# Stop and remove volumes (deletes data)
./scripts/down-staging.sh --volumes

# Stop and remove images
./scripts/down-staging.sh --images
```

**Options:**

- `-v, --volumes` - Remove volumes (WARNING: deletes all staging data)
- `-i, --images` - Remove built images
- `-h, --help` - Show help message

### `smoke-test-staging.sh`

Runs smoke tests against the staging stack to verify all services are working.

**Usage:**

```bash
./scripts/smoke-test-staging.sh
```

**What it tests:**

- Container health status
- Admin API endpoints (`/api/health`, `/api/diag`, `/api/usage/summary`)
- Web app endpoints (homepage, login, feature pages)
- Protected routes (redirects/auth checks)
- Content validation

**Environment Variables:**

```bash
# Override default URLs for testing
ADMIN_API_BASE=http://staging.example.com:3081 ./scripts/smoke-test-staging.sh
WEB_BASE=http://staging.example.com:3001 ./scripts/smoke-test-staging.sh
```

**Exit Codes:**

- `0` - All tests passed
- `1` - One or more tests failed

## Typical Workflow

### Initial Deployment

```bash
# 1. Configure environment
cp .env.staging.example .env.db.staging
cp .env.staging.example .env.admin-api.staging
cp .env.staging.example .env.web.staging

# Edit files with your values
nano .env.db.staging
nano .env.admin-api.staging
nano .env.web.staging

# 2. Deploy
./scripts/deploy-staging.sh

# 3. Verify
./scripts/smoke-test-staging.sh
```

### Update Deployment

```bash
# Pull latest changes
git pull

# Rebuild and restart
./scripts/deploy-staging.sh

# Verify
./scripts/smoke-test-staging.sh
```

### Teardown

```bash
# Stop (preserve data)
./scripts/down-staging.sh

# Or completely remove (deletes data)
./scripts/down-staging.sh --volumes --images
```

## Documentation

For detailed deployment instructions, see:

- **[NUC Staging Deployment Guide](../docs/NUC_DEPLOY_STAGING.md)** - Complete deployment documentation
- **[Web-Backend Integration](../docs/WEB_BACKEND_INTEGRATION_SUMMARY.md)** - Architecture and integration details

## Troubleshooting

### Scripts won't execute

```bash
# Make sure scripts are executable
chmod +x scripts/*.sh
```

### Environment files missing

```bash
# Copy template and customize
cp .env.staging.example .env.db.staging
cp .env.staging.example .env.admin-api.staging
cp .env.staging.example .env.web.staging
```

### Docker not found

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Verify installation
docker --version
docker compose version
```

### Port conflicts

If ports 3001, 3081, or 5433 are already in use:

```bash
# Check what's using the port
sudo lsof -i :3001
sudo lsof -i :3081
sudo lsof -i :5433

# Stop conflicting service or change ports in docker-compose.staging.yml
```

## Contributing

When adding new scripts:

1. Use `#!/usr/bin/env bash` shebang
2. Add `set -euo pipefail` for error handling
3. Make executable: `chmod +x scripts/your-script.sh`
4. Document in this README
5. Add color output for better UX (see existing scripts)
