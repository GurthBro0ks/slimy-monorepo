#!/bin/bash

################################################################################
# Local Development Bootstrap Script (EXAMPLE)
################################################################################
#
# ⚠️  WARNING: This is an EXAMPLE script for demonstration purposes.
#              Review and customize before using in your environment.
#
# Purpose:
#   Automate the initial setup of slimy-monorepo on a fresh development machine.
#
# What This Script Does:
#   - Checks for required tools (Node.js, pnpm, git)
#   - Clones the repository (or uses existing directory)
#   - Installs dependencies with pnpm
#   - Displays next steps for manual configuration
#
# What This Script Does NOT Do:
#   - Install Node.js, pnpm, or git (must be pre-installed)
#   - Set up PostgreSQL or Redis
#   - Create or configure .env files
#   - Obtain API keys or OAuth credentials
#   - Run database migrations
#
# Usage:
#   1. Review and customize the configuration variables below
#   2. Make executable: chmod +x bootstrap-local-dev.example.sh
#   3. Run: ./bootstrap-local-dev.example.sh
#
# Requirements:
#   - Node.js 20+ (22 recommended)
#   - pnpm 8+
#   - git
#   - Internet connection
#
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

################################################################################
# Configuration Variables
################################################################################

# Repository to clone
REPO_URL="${REPO_URL:-git@github.com:GurthBro0ks/slimy-monorepo.git}"

# Alternative HTTPS URL (if SSH keys not configured)
# REPO_URL="https://github.com/GurthBro0ks/slimy-monorepo.git"

# Directory to clone into (will be created if it doesn't exist)
TARGET_DIR="${TARGET_DIR:-$HOME/projects/slimy-monorepo}"

# Minimum required versions
MIN_NODE_VERSION=20
MIN_PNPM_VERSION=8

# Colors for output
COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${COLOR_BLUE}ℹ${COLOR_RESET} $1"
}

log_success() {
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"
}

log_warning() {
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} $1"
}

log_error() {
    echo -e "${COLOR_RED}✗${COLOR_RESET} $1"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

get_version_number() {
    echo "$1" | grep -oE '[0-9]+' | head -1
}

################################################################################
# Prerequisite Checks
################################################################################

log_info "Starting slimy-monorepo local development bootstrap..."
echo ""

log_info "Checking prerequisites..."

# Check for git
if check_command git; then
    GIT_VERSION=$(git --version)
    log_success "git found: $GIT_VERSION"
else
    log_error "git not found!"
    echo "  Please install git: https://git-scm.com/downloads"
    exit 1
fi

# Check for Node.js
if check_command node; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(get_version_number "$NODE_VERSION")

    if [ "$NODE_MAJOR" -ge "$MIN_NODE_VERSION" ]; then
        log_success "Node.js found: $NODE_VERSION"
    else
        log_error "Node.js version $NODE_VERSION is too old (need v$MIN_NODE_VERSION+)"
        echo "  Please install Node.js $MIN_NODE_VERSION or later: https://nodejs.org/"
        exit 1
    fi
else
    log_error "Node.js not found!"
    echo "  Please install Node.js $MIN_NODE_VERSION or later: https://nodejs.org/"
    echo "  Recommended: Use nvm (Node Version Manager) to install Node.js"
    exit 1
fi

# Check for pnpm
if check_command pnpm; then
    PNPM_VERSION=$(pnpm --version)
    PNPM_MAJOR=$(get_version_number "$PNPM_VERSION")

    if [ "$PNPM_MAJOR" -ge "$MIN_PNPM_VERSION" ]; then
        log_success "pnpm found: $PNPM_VERSION"
    else
        log_error "pnpm version $PNPM_VERSION is too old (need v$MIN_PNPM_VERSION+)"
        echo "  Please upgrade pnpm: npm install -g pnpm"
        exit 1
    fi
else
    log_error "pnpm not found!"
    echo "  Please install pnpm: npm install -g pnpm"
    echo "  Or use: curl -fsSL https://get.pnpm.io/install.sh | sh -"
    exit 1
fi

echo ""

################################################################################
# Repository Clone/Navigation
################################################################################

if [ -d "$TARGET_DIR" ]; then
    log_warning "Directory $TARGET_DIR already exists"
    read -p "  Use existing directory? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Bootstrap cancelled by user"
        exit 1
    fi
    log_info "Using existing directory: $TARGET_DIR"
else
    log_info "Cloning repository..."
    log_info "  From: $REPO_URL"
    log_info "  To:   $TARGET_DIR"

    # Create parent directory if needed
    PARENT_DIR=$(dirname "$TARGET_DIR")
    mkdir -p "$PARENT_DIR"

    # Clone the repository
    if git clone "$REPO_URL" "$TARGET_DIR"; then
        log_success "Repository cloned successfully"
    else
        log_error "Failed to clone repository"
        echo "  If you're using SSH and haven't set up keys, try HTTPS:"
        echo "  REPO_URL='https://github.com/GurthBro0ks/slimy-monorepo.git' $0"
        exit 1
    fi
fi

# Navigate to repository
cd "$TARGET_DIR"
log_success "Changed directory to: $TARGET_DIR"
echo ""

################################################################################
# Dependency Installation
################################################################################

log_info "Installing dependencies with pnpm..."
log_info "This may take several minutes..."

if pnpm install; then
    log_success "Dependencies installed successfully"
else
    log_error "Failed to install dependencies"
    echo "  Try running manually: cd $TARGET_DIR && pnpm install"
    exit 1
fi

echo ""

################################################################################
# Success & Next Steps
################################################################################

log_success "Bootstrap completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${COLOR_GREEN}Next Steps (Manual Configuration Required)${COLOR_RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Set Up PostgreSQL Database"
echo "   • Install PostgreSQL 15+ (or run via Docker)"
echo "   • Create database and user:"
echo "     CREATE USER slimyai WITH PASSWORD 'password';"
echo "     CREATE DATABASE slimyai OWNER slimyai;"
echo ""
echo "2. Set Up Redis"
echo "   • Install Redis (or run via Docker)"
echo "   • Verify: redis-cli ping"
echo ""
echo "3. Configure Environment Variables"
echo "   • Copy example files:"
echo "     cd $TARGET_DIR"
echo "     cp apps/admin-api/.env.example apps/admin-api/.env"
echo ""
echo "   • Edit apps/admin-api/.env and set:"
echo "     - DATABASE_URL (PostgreSQL connection string)"
echo "     - DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET"
echo "     - JWT_SECRET & SESSION_SECRET (32+ random chars)"
echo "     - OPENAI_API_KEY (if using OpenAI features)"
echo ""
echo "4. Set Up Discord OAuth (Optional)"
echo "   • Go to: https://discord.com/developers/applications"
echo "   • Create application and add OAuth2 redirect:"
echo "     http://localhost:3080/auth/discord/callback"
echo ""
echo "5. Run Database Migrations"
echo "   cd $TARGET_DIR/apps/web"
echo "   pnpm db:generate"
echo "   pnpm db:migrate"
echo "   pnpm db:seed  # Optional: populate sample data"
echo ""
echo "6. Start Development Servers"
echo ""
echo "   Option A: Docker Compose (Recommended)"
echo "   cd $TARGET_DIR/apps/web"
echo "   bash quickstart.sh"
echo ""
echo "   Option B: Manual (run in separate terminals)"
echo "   cd $TARGET_DIR/apps/admin-api && pnpm dev  # Port 3080"
echo "   cd $TARGET_DIR/apps/web && pnpm dev        # Port 3000"
echo "   cd $TARGET_DIR/apps/admin-ui && pnpm dev   # Port 3081"
echo ""
echo "7. Access Applications"
echo "   • Web App:   http://localhost:3000"
echo "   • Admin API: http://localhost:3080"
echo "   • Admin UI:  http://localhost:3081"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For detailed instructions, see:"
echo "  $TARGET_DIR/docs/local-dev-bootstrap.md"
echo ""
log_success "Happy coding! 🚀"
