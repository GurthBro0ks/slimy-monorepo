#!/usr/bin/env bash
#
# Dev Environment Health Check Script for Slimy.ai
#
# This script verifies that your development environment has all necessary
# tools and configurations to work on the Slimy.ai monorepo.
#
# Usage: ./tools/dev-health/check-env.sh [--skip-network]
#

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
SKIP_NETWORK=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-network)
      SKIP_NETWORK=true
      shift
      ;;
  esac
done

# Helper functions
print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Slimy.ai Dev Environment Health Check${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_check() {
  echo -e "${BLUE}Checking:${NC} $1"
}

print_pass() {
  echo -e "  ${GREEN}✓ PASS:${NC} $1"
  ((PASS_COUNT++))
}

print_fail() {
  echo -e "  ${RED}✗ FAIL:${NC} $1"
  ((FAIL_COUNT++))
}

print_warn() {
  echo -e "  ${YELLOW}⚠ WARN:${NC} $1"
  ((WARN_COUNT++))
}

print_info() {
  echo -e "  ${BLUE}ℹ INFO:${NC} $1"
}

print_summary() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Summary${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  ${GREEN}Passed:${NC} $PASS_COUNT"
  echo -e "  ${RED}Failed:${NC} $FAIL_COUNT"
  echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
  echo ""

  if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ Your development environment is ready!${NC}"
    return 0
  else
    echo -e "${RED}✗ Your development environment needs attention.${NC}"
    echo -e "${YELLOW}See docs/dev-environment-health.md for troubleshooting.${NC}"
    return 1
  fi
}

# Check functions

check_node_version() {
  print_check "Node.js version"

  if ! command -v node &> /dev/null; then
    print_fail "Node.js is not installed"
    print_info "Install Node.js 20 or higher from https://nodejs.org/"
    return
  fi

  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

  print_info "Found Node.js v$NODE_VERSION"

  if [ "$NODE_MAJOR" -ge 20 ]; then
    print_pass "Node.js version $NODE_VERSION is >= 20"
  else
    print_fail "Node.js version $NODE_VERSION is < 20 (recommended: >= 20)"
    print_info "Consider upgrading to Node.js 20 LTS or higher"
  fi
}

check_pnpm() {
  print_check "pnpm package manager"

  if ! command -v pnpm &> /dev/null; then
    print_fail "pnpm is not installed"
    print_info "Install with: npm install -g pnpm"
    return
  fi

  PNPM_VERSION=$(pnpm --version)
  print_info "Found pnpm v$PNPM_VERSION"
  print_pass "pnpm is installed"
}

check_docker() {
  print_check "Docker daemon"

  if ! command -v docker &> /dev/null; then
    print_fail "Docker is not installed"
    print_info "Install Docker from https://docs.docker.com/get-docker/"
    return
  fi

  DOCKER_VERSION=$(docker --version | sed 's/Docker version //' | cut -d, -f1)
  print_info "Found Docker $DOCKER_VERSION"

  if docker info &> /dev/null; then
    print_pass "Docker daemon is running"
  else
    print_fail "Docker daemon is not running"
    print_info "Start Docker daemon with: sudo systemctl start docker"
  fi
}

check_git() {
  print_check "git version control"

  if ! command -v git &> /dev/null; then
    print_fail "git is not installed"
    print_info "Install git with your package manager"
    return
  fi

  GIT_VERSION=$(git --version | sed 's/git version //')
  print_info "Found git $GIT_VERSION"
  print_pass "git is installed"
}

check_nuc_connectivity() {
  if [ "$SKIP_NETWORK" = true ]; then
    print_check "NUC connectivity (skipped)"
    print_info "Use --skip-network to skip network checks"
    return
  fi

  print_check "NUC server connectivity (optional)"

  local nuc_hosts=("nuc1" "nuc2")
  local any_reachable=false

  for host in "${nuc_hosts[@]}"; do
    if ping -c 1 -W 2 "$host" &> /dev/null; then
      print_info "$host is reachable"
      any_reachable=true
    else
      print_info "$host is not reachable (this is OK for laptop-only dev)"
    fi
  done

  if [ "$any_reachable" = true ]; then
    print_pass "At least one NUC server is reachable"
  else
    print_warn "No NUC servers are reachable (normal for laptop development)"
    print_info "NUC connectivity is only needed for shared dev/staging environments"
  fi
}

check_workspace() {
  print_check "pnpm workspace configuration"

  if [ ! -f "package.json" ]; then
    print_fail "package.json not found - are you in the monorepo root?"
    return
  fi

  if [ ! -f "pnpm-workspace.yaml" ] && ! grep -q '"workspaces"' package.json; then
    print_warn "No workspace configuration found"
    return
  fi

  print_pass "Workspace configuration exists"
}

# Main execution

main() {
  print_header

  check_node_version
  echo ""

  check_pnpm
  echo ""

  check_git
  echo ""

  check_docker
  echo ""

  check_workspace
  echo ""

  check_nuc_connectivity
  echo ""

  print_summary
}

# Run main function
main
exit $?
