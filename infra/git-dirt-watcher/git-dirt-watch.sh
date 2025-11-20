#!/bin/bash
# Git Dirt Watcher - Monitors repositories for uncommitted changes
# Posts notifications to Discord webhook when dirty repos are detected
#
# Usage:
#   git-dirt-watch.sh [repos-file]
#   DRY_RUN=1 git-dirt-watch.sh    # Prints to stdout instead of sending webhook
#
# Environment variables:
#   DISCORD_WEBHOOK_URL - Required. Discord webhook URL for notifications
#   DIRT_MAX_FILES - Optional. Max number of filenames to include (default: 10)
#   DRY_RUN - Optional. Set to 1 to skip webhook POST and print to stdout

set -euo pipefail

# Configuration
REPOS_FILE="${1:-./repos.txt}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
DIRT_MAX_FILES="${DIRT_MAX_FILES:-10}"
DRY_RUN="${DRY_RUN:-0}"
HOSTNAME="$(hostname)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Validate configuration
validate_config() {
    if [ ! -f "$REPOS_FILE" ]; then
        log_error "Repos file not found: $REPOS_FILE"
        exit 1
    fi

    if [ "$DRY_RUN" != "1" ] && [ -z "$DISCORD_WEBHOOK_URL" ]; then
        log_error "DISCORD_WEBHOOK_URL environment variable is required (unless DRY_RUN=1)"
        exit 1
    fi
}

# Escape JSON strings
json_escape() {
    local str="$1"
    # Replace special characters for JSON
    str="${str//\\/\\\\}"  # Backslash
    str="${str//\"/\\\"}"  # Double quote
    str="${str//$'\n'/\\n}"  # Newline
    str="${str//$'\r'/\\r}"  # Carriage return
    str="${str//$'\t'/\\t}"  # Tab
    echo "$str"
}

# Check a single repository for uncommitted changes
check_repo() {
    local repo_path="$1"

    # Expand tilde if present
    repo_path="${repo_path/#\~/$HOME}"

    # Skip if path doesn't exist
    if [ ! -d "$repo_path" ]; then
        log_warn "Path does not exist: $repo_path"
        return 1
    fi

    # Check if it's a git repository
    if ! git -C "$repo_path" rev-parse --git-dir >/dev/null 2>&1; then
        log_warn "Not a git repository: $repo_path"
        return 1
    fi

    # Get current branch
    local branch
    branch="$(git -C "$repo_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"

    # Get git status
    local status_output
    status_output="$(git -C "$repo_path" status --porcelain 2>/dev/null || true)"

    # If clean, return success (0 = clean)
    if [ -z "$status_output" ]; then
        return 0
    fi

    # Repository is dirty - collect details
    local file_count
    file_count="$(echo "$status_output" | wc -l | tr -d ' ')"

    # Get first N filenames
    local filenames=()
    local count=0
    while IFS= read -r line && [ "$count" -lt "$DIRT_MAX_FILES" ]; do
        # Extract filename (everything after first 3 characters)
        local filename="${line:3}"
        filenames+=("$filename")
        count=$((count + 1))
    done <<< "$status_output"

    # Build JSON array of filenames
    local files_json="["
    local first=true
    for filename in "${filenames[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            files_json+=","
        fi
        files_json+="\"$(json_escape "$filename")\""
    done
    files_json+="]"

    # Check if we have more files than shown
    local truncated=false
    if [ "$file_count" -gt "$DIRT_MAX_FILES" ]; then
        truncated=true
    fi

    # Return dirty repo data as JSON
    cat <<EOF
{
  "host": "$(json_escape "$HOSTNAME")",
  "repo_path": "$(json_escape "$repo_path")",
  "branch": "$(json_escape "$branch")",
  "file_count": $file_count,
  "truncated": $truncated,
  "filenames": $files_json
}
EOF

    return 2  # Return 2 to indicate dirty repo
}

# Build Discord webhook payload
build_discord_payload() {
    local dirty_repos_json="$1"
    local repo_count="$2"

    # Build embed description
    local description="🚨 **$repo_count dirty repositories detected on \`$HOSTNAME\`**\n\n"

    # Add each repo as a field
    local fields="["
    local first=true

    echo "$dirty_repos_json" | while IFS= read -r repo_json; do
        [ -z "$repo_json" ] && continue

        # Parse JSON (simple extraction - assumes well-formed input)
        local repo_path branch file_count truncated filenames
        repo_path="$(echo "$repo_json" | grep -o '"repo_path":"[^"]*"' | cut -d'"' -f4 | head -1)"
        branch="$(echo "$repo_json" | grep -o '"branch":"[^"]*"' | cut -d'"' -f4 | head -1)"
        file_count="$(echo "$repo_json" | grep -o '"file_count":[0-9]*' | cut -d':' -f2 | head -1)"
        truncated="$(echo "$repo_json" | grep -o '"truncated":[a-z]*' | cut -d':' -f2 | head -1)"

        # Extract filenames array
        local files_list=""
        local files_array
        files_array="$(echo "$repo_json" | grep -o '"filenames":\[[^]]*\]' | sed 's/"filenames"://')"

        # Parse filenames from array (simple approach)
        files_list="$(echo "$files_array" | sed 's/\[//;s/\]//;s/"//g;s/,/\\n/g' | head -10)"

        if [ "$truncated" = "true" ]; then
            files_list="${files_list}\n... and more"
        fi

        if [ "$first" = true ]; then
            first=false
        else
            fields+=","
        fi

        fields+="{\"name\":\"📁 $(json_escape "$repo_path")\",\"value\":\"**Branch:** \`$branch\`\n**Files:** $file_count changed\n\`\`\`\n$files_list\n\`\`\`\",\"inline\":false}"
    done

    fields+="]"

    # Build complete Discord payload
    cat <<EOF
{
  "embeds": [
    {
      "title": "Git Dirt Detected",
      "description": "$description",
      "color": 15158332,
      "fields": $fields,
      "footer": {
        "text": "Git Dirt Watcher"
      },
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
  ]
}
EOF
}

# Send notification to Discord
send_discord_notification() {
    local payload="$1"

    if [ "$DRY_RUN" = "1" ]; then
        log_info "DRY_RUN mode: Would send to Discord:"
        echo "$payload"
        return 0
    fi

    local response
    local http_code

    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$DISCORD_WEBHOOK_URL" 2>&1)

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "204" ] || [ "$http_code" = "200" ]; then
        log_info "Discord notification sent successfully"
        return 0
    else
        log_error "Failed to send Discord notification (HTTP $http_code)"
        echo "$response" | head -n-1 >&2
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting git dirt watch on $HOSTNAME"
    log_info "Repos file: $REPOS_FILE"

    validate_config

    local dirty_repos=()
    local dirty_count=0

    # Read repos file line by line
    while IFS= read -r repo_path || [ -n "$repo_path" ]; do
        # Skip empty lines and comments
        [ -z "$repo_path" ] && continue
        [[ "$repo_path" =~ ^[[:space:]]*# ]] && continue

        # Trim whitespace
        repo_path="$(echo "$repo_path" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
        [ -z "$repo_path" ] && continue

        log_info "Checking: $repo_path"

        # Check repository
        local repo_data
        if repo_data="$(check_repo "$repo_path")"; then
            log_info "  ✓ Clean"
        elif [ $? -eq 2 ]; then
            log_warn "  ✗ Dirty"
            dirty_repos+=("$repo_data")
            dirty_count=$((dirty_count + 1))
        fi
    done < "$REPOS_FILE"

    # If no dirty repos, we're done
    if [ "$dirty_count" -eq 0 ]; then
        log_info "All repositories are clean!"
        return 0
    fi

    log_warn "Found $dirty_count dirty repositories"

    # Build simplified Discord notification
    local embed_fields=""
    for repo_data in "${dirty_repos[@]}"; do
        local repo_path branch file_count
        repo_path="$(echo "$repo_data" | grep -o '"repo_path":"[^"]*"' | cut -d'"' -f4)"
        branch="$(echo "$repo_data" | grep -o '"branch":"[^"]*"' | cut -d'"' -f4)"
        file_count="$(echo "$repo_data" | grep -o '"file_count":[0-9]*' | cut -d':' -f2)"

        # Get filenames
        local filenames_raw
        filenames_raw="$(echo "$repo_data" | grep -o '"filenames":\[[^]]*\]' | sed 's/"filenames"://;s/\[//;s/\]//;s/"//g')"

        # Format filenames list
        local files_display=""
        echo "$filenames_raw" | tr ',' '\n' | while IFS= read -r fname; do
            [ -z "$fname" ] && continue
            echo "- $fname"
        done > /tmp/files_$$.txt
        files_display="$(cat /tmp/files_$$.txt | head -${DIRT_MAX_FILES})"
        rm -f /tmp/files_$$.txt

        # Check if truncated
        local truncated
        truncated="$(echo "$repo_data" | grep -o '"truncated":[a-z]*' | cut -d':' -f2)"
        if [ "$truncated" = "true" ]; then
            files_display="${files_display}\n... and more"
        fi

        # Build field
        if [ -n "$embed_fields" ]; then
            embed_fields="${embed_fields},"
        fi
        embed_fields="${embed_fields}{\"name\":\"📁 ${repo_path}\",\"value\":\"**Branch:** \\\`${branch}\\\`\\n**Files:** ${file_count} changed\\n\\\`\\\`\\\`\\n${files_display}\\n\\\`\\\`\\\`\",\"inline\":false}"
    done

    # Build final payload
    local timestamp
    timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    local payload
    payload=$(cat <<EOF
{
  "embeds": [
    {
      "title": "Git Dirt Detected",
      "description": "🚨 **${dirty_count} dirty repositories detected on \\\`${HOSTNAME}\\\`**",
      "color": 15158332,
      "fields": [${embed_fields}],
      "footer": {
        "text": "Git Dirt Watcher"
      },
      "timestamp": "${timestamp}"
    }
  ]
}
EOF
)

    # Send notification
    send_discord_notification "$payload"
}

# Run main function
main "$@"
