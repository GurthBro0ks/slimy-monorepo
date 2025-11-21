#!/usr/bin/env bash
#
# smoke-test-staging.sh
# Run smoke tests against the staging stack to verify it's working
#
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ADMIN_API_BASE="${ADMIN_API_BASE:-http://localhost:3081}"
WEB_BASE="${WEB_BASE:-http://localhost:3001}"
TIMEOUT=10

# Test results
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Slimy Staging Smoke Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Testing against:"
echo "  Admin API: ${ADMIN_API_BASE}"
echo "  Web App:   ${WEB_BASE}"
echo ""

# Helper function to run a test
run_test() {
    local test_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local description="${4:-}"

    TESTS_RUN=$((TESTS_RUN + 1))

    echo -n "  [$TESTS_RUN] ${test_name}... "

    # Make the request
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (${response})"
        [ -n "$description" ] && echo -e "      ${description}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (got ${response}, expected ${expected_status})"
        [ -n "$description" ] && echo -e "      ${description}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Helper function to check if content contains a string
run_content_test() {
    local test_name="$1"
    local url="$2"
    local search_string="$3"
    local description="${4:-}"

    TESTS_RUN=$((TESTS_RUN + 1))

    echo -n "  [$TESTS_RUN] ${test_name}... "

    # Make the request and get content
    content=$(curl -s --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "")

    if echo "$content" | grep -q "$search_string"; then
        echo -e "${GREEN}✓ PASS${NC}"
        [ -n "$description" ] && echo -e "      ${description}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (content doesn't contain '${search_string}')"
        [ -n "$description" ] && echo -e "      ${description}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "${YELLOW}Admin API Health Checks${NC}"
echo ""

run_test \
    "Admin API health endpoint" \
    "${ADMIN_API_BASE}/api/health" \
    "200" \
    "Verifies admin-api is running and responding"

run_test \
    "Admin API diagnostics endpoint" \
    "${ADMIN_API_BASE}/api/diag" \
    "200" \
    "Verifies diagnostics endpoint is accessible"

run_test \
    "Usage summary endpoint (may require auth)" \
    "${ADMIN_API_BASE}/api/usage/summary" \
    "200|401" \
    "200 if public, 401 if auth required"

echo ""
echo -e "${YELLOW}Web App Health Checks${NC}"
echo ""

run_test \
    "Web app health endpoint" \
    "${WEB_BASE}/api/health" \
    "200" \
    "Verifies Next.js app is running"

run_test \
    "Homepage" \
    "${WEB_BASE}/" \
    "200" \
    "Verifies main page renders"

run_test \
    "Login page" \
    "${WEB_BASE}/login" \
    "200" \
    "Verifies auth pages are accessible"

echo ""
echo -e "${YELLOW}Feature Pages${NC}"
echo ""

run_test \
    "Chat page" \
    "${WEB_BASE}/chat" \
    "200" \
    "Public chat interface"

run_test \
    "Snail codes page" \
    "${WEB_BASE}/snail/codes" \
    "200|307|401" \
    "Protected route (may redirect to login)"

run_test \
    "Screenshots page" \
    "${WEB_BASE}/screenshots" \
    "200|307|401" \
    "Protected route (may redirect to login)"

run_test \
    "Club page" \
    "${WEB_BASE}/club" \
    "200|307|401" \
    "Protected route (may redirect to login)"

echo ""
echo -e "${YELLOW}Content Validation${NC}"
echo ""

run_content_test \
    "Homepage contains expected content" \
    "${WEB_BASE}/" \
    "Slimy" \
    "Checks for branding on homepage"

echo ""
echo -e "${YELLOW}Docker Container Status${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Check container health
if command -v docker &> /dev/null; then
    cd "${REPO_ROOT}"

    containers=("slimy-db-staging" "slimy-admin-api-staging" "slimy-web-staging")

    for container in "${containers[@]}"; do
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -n "  [$TESTS_RUN] Container ${container}... "

        status=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
        health=$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

        if [ "$status" = "running" ] && { [ "$health" = "healthy" ] || [ "$health" = "none" ]; }; then
            echo -e "${GREEN}✓ PASS${NC} (running, ${health})"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAIL${NC} (status: ${status}, health: ${health})"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    done
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Results${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "  Total:  ${TESTS_RUN}"
echo -e "  ${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "  ${RED}Failed: ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED - Stack is healthy!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED - Please investigate${NC}"
    echo ""
    echo "Troubleshooting commands:"
    echo "  View logs:    docker compose -f docker-compose.staging.yml logs"
    echo "  Check status: docker compose -f docker-compose.staging.yml ps"
    echo "  Restart:      ./scripts/deploy-staging.sh"
    echo ""
    exit 1
fi
