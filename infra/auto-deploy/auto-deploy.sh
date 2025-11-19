#!/usr/bin/env bash
#
# auto-deploy.sh
# Generic auto-deploy script for slimy-monorepo services
#
# This script monitors a Git repository for changes and automatically
# deploys when the remote branch has new commits.
#
# Usage:
#   DEPLOY_CONFIG=/path/to/config.yml ./auto-deploy.sh
#   or just: ./auto-deploy.sh (uses ./deploy-host-config.yml)
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

# Load environment variables from .env if it exists
if [[ -f "$(dirname "$0")/.env" ]]; then
  # shellcheck disable=SC1091
  source "$(dirname "$0")/.env"
fi

# Default config file path
CONFIG_FILE="${DEPLOY_CONFIG:-$(dirname "$0")/deploy-host-config.yml}"

# Optional settings from environment
SKIP_TESTS="${SKIP_TESTS:-0}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

# ============================================================================
# Logging Functions
# ============================================================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log_info() {
  log "INFO: $*"
}

log_warn() {
  log "WARN: $*"
}

log_error() {
  log "ERROR: $*"
}

log_success() {
  log "SUCCESS: $*"
}

# ============================================================================
# Notification Functions
# ============================================================================

send_discord_notification() {
  local message="$1"
  local status="${2:-info}"

  if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
    return 0
  fi

  local color="3447003"  # blue
  case "$status" in
    success) color="3066993" ;;  # green
    error) color="15158332" ;;   # red
    warning) color="15105570" ;; # orange
  esac

  local payload
  payload=$(cat <<EOF
{
  "embeds": [{
    "title": "Auto-Deploy Notification",
    "description": "$message",
    "color": $color,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
  }]
}
EOF
)

  curl -s -H "Content-Type: application/json" -d "$payload" "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1 || true
}

# ============================================================================
# YAML Parsing (simple key extraction)
# ============================================================================

parse_yaml_value() {
  local file="$1"
  local key="$2"

  # Simple YAML parser - extracts value for a key
  # This is basic and assumes simple YAML structure
  grep "^[[:space:]]*${key}:" "$file" | head -n1 | sed "s/^[[:space:]]*${key}:[[:space:]]*//;s/['\"]//g" || echo ""
}

# ============================================================================
# Git Operations
# ============================================================================

check_repo_updates() {
  local repo_path="$1"
  local branch="$2"

  cd "$repo_path" || {
    log_error "Cannot access repository: $repo_path"
    return 1
  }

  log_info "Checking repository: $repo_path (branch: $branch)"

  # Fetch latest changes from remote
  log_info "Fetching from remote..."
  if ! git fetch origin "$branch" 2>&1; then
    log_error "Failed to fetch from remote"
    return 1
  fi

  # Get local and remote commit hashes
  local local_commit
  local remote_commit

  local_commit=$(git rev-parse HEAD)
  remote_commit=$(git rev-parse "origin/$branch")

  log_info "Local commit:  $local_commit"
  log_info "Remote commit: $remote_commit"

  if [[ "$local_commit" == "$remote_commit" ]]; then
    log_info "Repository is up to date. No deployment needed."
    return 2  # Special code: no updates
  fi

  # Check if we're behind
  if ! git merge-base --is-ancestor HEAD "origin/$branch"; then
    log_warn "Local branch has diverged from remote. Manual intervention may be needed."
    return 1
  fi

  log_info "New commits available on remote. Proceeding with deployment."
  return 0
}

pull_changes() {
  local branch="$1"

  log_info "Pulling changes from origin/$branch..."
  if ! git pull origin "$branch" 2>&1; then
    log_error "Failed to pull changes"
    return 1
  fi

  log_success "Successfully pulled latest changes"
  return 0
}

# ============================================================================
# Build & Test Operations
# ============================================================================

run_command() {
  local command="$1"
  local description="$2"

  if [[ -z "$command" ]] || [[ "$command" == "null" ]]; then
    log_info "No $description command configured, skipping."
    return 0
  fi

  log_info "Running $description: $command"

  # Use eval to handle complex shell commands
  if eval "$command" 2>&1; then
    log_success "$description completed successfully"
    return 0
  else
    log_error "$description failed with exit code $?"
    return 1
  fi
}

# ============================================================================
# Main Deployment Logic
# ============================================================================

deploy_host() {
  local config_file="$1"

  log_info "========================================="
  log_info "Starting auto-deploy process"
  log_info "========================================="

  # Parse configuration
  local repo_path
  local branch
  local build_command
  local test_command
  local deploy_command

  repo_path=$(parse_yaml_value "$config_file" "repo_path")
  branch=$(parse_yaml_value "$config_file" "branch")
  build_command=$(parse_yaml_value "$config_file" "build_command")
  test_command=$(parse_yaml_value "$config_file" "test_command")
  deploy_command=$(parse_yaml_value "$config_file" "deploy_command")

  # Validate required fields
  if [[ -z "$repo_path" ]] || [[ -z "$branch" ]]; then
    log_error "Configuration missing required fields (repo_path, branch)"
    send_discord_notification "Auto-deploy failed: Invalid configuration" "error"
    return 1
  fi

  log_info "Configuration loaded:"
  log_info "  Repository: $repo_path"
  log_info "  Branch: $branch"
  log_info "  Build command: ${build_command:-<none>}"
  log_info "  Test command: ${test_command:-<none>}"
  log_info "  Deploy command: ${deploy_command:-<none>}"

  # Check for updates
  if ! check_repo_updates "$repo_path" "$branch"; then
    local exit_code=$?
    if [[ $exit_code -eq 2 ]]; then
      # No updates available
      log_info "No action taken."
      return 0
    else
      # Error occurred
      send_discord_notification "Auto-deploy failed: Could not check for updates in $repo_path" "error"
      return 1
    fi
  fi

  # New commits available, proceed with deployment
  send_discord_notification "New commits detected in $repo_path on branch $branch. Starting deployment..." "info"

  # Pull changes
  if ! pull_changes "$branch"; then
    send_discord_notification "Auto-deploy failed: Could not pull changes in $repo_path" "error"
    return 1
  fi

  # Run tests (unless skipped)
  if [[ "$SKIP_TESTS" != "1" ]]; then
    if ! run_command "$test_command" "tests"; then
      send_discord_notification "Auto-deploy aborted: Tests failed in $repo_path" "error"
      return 1
    fi
  else
    log_warn "Tests skipped (SKIP_TESTS=1)"
  fi

  # Run build
  if ! run_command "$build_command" "build"; then
    send_discord_notification "Auto-deploy aborted: Build failed in $repo_path" "error"
    return 1
  fi

  # Run deployment
  if ! run_command "$deploy_command" "deployment"; then
    send_discord_notification "Auto-deploy failed: Deployment command failed in $repo_path" "error"
    return 1
  fi

  log_success "========================================="
  log_success "Auto-deploy completed successfully!"
  log_success "========================================="

  send_discord_notification "Auto-deploy completed successfully for $repo_path on branch $branch" "success"

  return 0
}

# ============================================================================
# Entry Point
# ============================================================================

main() {
  log_info "Auto-deploy script starting..."
  log_info "Using configuration file: $CONFIG_FILE"

  # Check if config file exists
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log_error "Configuration file not found: $CONFIG_FILE"
    log_error "Please create a configuration file or set DEPLOY_CONFIG environment variable."
    exit 1
  fi

  # Run deployment
  if deploy_host "$CONFIG_FILE"; then
    log_info "Auto-deploy script finished successfully."
    exit 0
  else
    log_error "Auto-deploy script finished with errors."
    exit 1
  fi
}

# Run main function
main "$@"
