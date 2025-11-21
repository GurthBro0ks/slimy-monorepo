#!/usr/bin/env bash
#
# down-staging.sh
# Stop and remove the Slimy staging stack
#
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Stopping Slimy Staging Stack${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Change to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# Parse command line arguments
REMOVE_VOLUMES=false
REMOVE_IMAGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        -i|--images)
            REMOVE_IMAGES=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Stop and remove the Slimy staging stack"
            echo ""
            echo "Options:"
            echo "  -v, --volumes    Also remove volumes (WARNING: deletes data)"
            echo "  -i, --images     Also remove built images"
            echo "  -h, --help       Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Stop and remove containers
echo "Stopping and removing containers..."
docker compose -f docker-compose.staging.yml down

echo -e "${GREEN}✓ Containers stopped and removed${NC}"

# Remove volumes if requested
if [ "$REMOVE_VOLUMES" = true ]; then
    echo ""
    echo -e "${RED}WARNING: Removing volumes will delete all staging data!${NC}"
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Removing volumes..."
        docker compose -f docker-compose.staging.yml down -v
        echo -e "${GREEN}✓ Volumes removed${NC}"
    else
        echo "Volume removal cancelled"
    fi
fi

# Remove images if requested
if [ "$REMOVE_IMAGES" = true ]; then
    echo ""
    echo "Removing built images..."
    docker compose -f docker-compose.staging.yml down --rmi local
    echo -e "${GREEN}✓ Images removed${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Staging Stack Stopped${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "To restart: ./scripts/deploy-staging.sh"
echo ""

# Show remaining resources
RUNNING_CONTAINERS=$(docker compose -f docker-compose.staging.yml ps -q 2>/dev/null | wc -l)
if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
    echo -e "${YELLOW}Note: Some containers are still running:${NC}"
    docker compose -f docker-compose.staging.yml ps
fi
