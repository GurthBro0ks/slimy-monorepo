#!/usr/bin/env bash
#
# deploy-staging.sh
# Deploy the Slimy staging stack to a Docker-enabled host
#
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Slimy Staging Stack Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Change to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

echo -e "${YELLOW}[1/5]${NC} Checking prerequisites..."

# Check if docker and docker compose are available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: docker is not installed or not in PATH${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}ERROR: docker compose is not available${NC}"
    echo "Please install Docker Compose v2 or ensure 'docker compose' works"
    exit 1
fi

echo -e "  ✓ Docker found: $(docker --version)"
echo -e "  ✓ Docker Compose found: $(docker compose version --short)"
echo ""

echo -e "${YELLOW}[2/5]${NC} Checking environment files..."

# Check for required env files
REQUIRED_ENV_FILES=(
    ".env.db.staging"
    ".env.admin-api.staging"
    ".env.web.staging"
)

MISSING_FILES=()
for env_file in "${REQUIRED_ENV_FILES[@]}"; do
    if [ ! -f "${env_file}" ]; then
        MISSING_FILES+=("${env_file}")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}ERROR: Missing required environment files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo -e "  - ${file}"
    done
    echo ""
    echo "Please copy .env.staging.example and create these files:"
    echo "  cp .env.staging.example .env.db.staging"
    echo "  cp .env.staging.example .env.admin-api.staging"
    echo "  cp .env.staging.example .env.web.staging"
    echo ""
    echo "Then edit each file with appropriate staging values."
    exit 1
fi

echo -e "  ✓ All required environment files found"
echo ""

echo -e "${YELLOW}[3/5]${NC} Creating data directories..."

# Create necessary directories for volumes
mkdir -p data/admin-api-staging
mkdir -p data/uploads-staging
mkdir -p logs/admin-api-staging
mkdir -p logs/web-staging
mkdir -p backups/postgres-staging

echo -e "  ✓ Data directories created"
echo ""

echo -e "${YELLOW}[4/5]${NC} Building and starting containers..."
echo ""

# Build and start the stack
docker compose -f docker-compose.staging.yml up -d --build

echo ""
echo -e "  ✓ Containers started"
echo ""

echo -e "${YELLOW}[5/5]${NC} Waiting for services to be healthy..."
echo ""

# Wait for services to become healthy
MAX_WAIT=120  # seconds
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check health status of all services
    UNHEALTHY=$(docker compose -f docker-compose.staging.yml ps --format json | \
                jq -r 'select(.Health != "healthy" and .Health != "") | .Service' 2>/dev/null || true)

    if [ -z "$UNHEALTHY" ]; then
        echo -e "${GREEN}✓ All services are healthy!${NC}"
        break
    fi

    echo -e "  Waiting for services: ${UNHEALTHY}"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}Warning: Services did not become healthy within ${MAX_WAIT}s${NC}"
    echo "Check logs with: docker compose -f docker-compose.staging.yml logs"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services are running at:"
echo ""
echo -e "  ${GREEN}Web App:${NC}       http://localhost:3001"
echo -e "  ${GREEN}Admin API:${NC}     http://localhost:3081"
echo -e "  ${GREEN}Database:${NC}      postgresql://localhost:5433"
echo ""
echo "Useful commands:"
echo ""
echo "  View logs:        docker compose -f docker-compose.staging.yml logs -f"
echo "  View status:      docker compose -f docker-compose.staging.yml ps"
echo "  Stop stack:       ./scripts/down-staging.sh"
echo "  Restart service:  docker compose -f docker-compose.staging.yml restart <service>"
echo ""
echo "Health check endpoints:"
echo ""
echo "  Admin API:  http://localhost:3081/api/health"
echo "  Web App:    http://localhost:3001/api/health"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Run smoke tests: ./scripts/smoke-test-staging.sh"
echo "  2. Test login flow at: http://localhost:3001/login"
echo "  3. Check protected routes: http://localhost:3001/snail/codes"
echo ""
