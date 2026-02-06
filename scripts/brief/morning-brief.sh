#!/usr/bin/env bash
# Morning Brief Generator
# Produces a clean, actionable status report across all repos
# Usage: ./morning-brief.sh [output-file]

set -uo pipefail

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OUTPUT_FILE="${1:-/tmp/morning-brief-${TIMESTAMP}.md}"
MONOREPO_ROOT="/opt/slimy/slimy-monorepo"
BOT_BUNDLE_ROOT="/opt/slimy/pm_updown_bot_bundle"

echo "🌅 Generating Morning Brief..."
echo "📍 Output: ${OUTPUT_FILE}"

# Start the brief
cat > "${OUTPUT_FILE}" << 'HEADER'
# ☀️ Morning Brief
HEADER

echo "" >> "${OUTPUT_FILE}"
echo "Generated: ${TIMESTAMP}" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"

# Function to add section
add_section() {
    local title="$1"
    echo "" >> "${OUTPUT_FILE}"
    echo "## ${title}" >> "${OUTPUT_FILE}"
    echo "" >> "${OUTPUT_FILE}"
}

# Function to check if repo exists and is git
check_repo() {
    local repo_path="$1"
    [[ -d "${repo_path}/.git" ]]
}

# Git Status Section
add_section "📦 Repository Status"

# Check slimy-monorepo
if check_repo "${MONOREPO_ROOT}"; then
    echo "### slimy-monorepo" >> "${OUTPUT_FILE}"
    cd "${MONOREPO_ROOT}"
    
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "- **Branch:** \`${CURRENT_BRANCH}\`" >> "${OUTPUT_FILE}"
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        CHANGED_COUNT=$(git status --porcelain | wc -l | tr -d ' ')
        echo "- ⚠️ **Uncommitted changes:** ${CHANGED_COUNT} files" >> "${OUTPUT_FILE}"
    else
        echo "- ✅ **Working tree:** Clean" >> "${OUTPUT_FILE}"
    fi
    
    # Check for unpushed commits (skip if remote branch doesn't exist)
    if git rev-parse --verify --quiet "origin/${CURRENT_BRANCH}" >/dev/null 2>&1; then
        UNPUSHED=$(git log "origin/${CURRENT_BRANCH}..HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ')
        UNPUSHED=${UNPUSHED:-0}
        if [[ ${UNPUSHED} -gt 0 ]]; then
            echo "- 📤 **Unpushed commits:** ${UNPUSHED}" >> "${OUTPUT_FILE}"
        fi
    else
        echo "- 🆕 **New branch:** Not yet pushed to remote" >> "${OUTPUT_FILE}"
    fi
    
    # Recent commits (last 5)
    echo "- **Recent commits:**" >> "${OUTPUT_FILE}"
    git log --oneline -5 --no-decorate | sed 's/^/  - /' >> "${OUTPUT_FILE}"
    
    echo "" >> "${OUTPUT_FILE}"
fi

# Check pm_updown_bot_bundle
if check_repo "${BOT_BUNDLE_ROOT}"; then
    echo "### pm_updown_bot_bundle" >> "${OUTPUT_FILE}"
    cd "${BOT_BUNDLE_ROOT}"
    
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "- **Branch:** \`${CURRENT_BRANCH}\`" >> "${OUTPUT_FILE}"
    
    if [[ -n $(git status --porcelain) ]]; then
        CHANGED_COUNT=$(git status --porcelain | wc -l | tr -d ' ')
        echo "- ⚠️ **Uncommitted changes:** ${CHANGED_COUNT} files" >> "${OUTPUT_FILE}"
    else
        echo "- ✅ **Working tree:** Clean" >> "${OUTPUT_FILE}"
    fi
    
    if git rev-parse --verify --quiet "origin/${CURRENT_BRANCH}" >/dev/null 2>&1; then
        UNPUSHED=$(git log "origin/${CURRENT_BRANCH}..HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ')
        UNPUSHED=${UNPUSHED:-0}
        if [[ ${UNPUSHED} -gt 0 ]]; then
            echo "- 📤 **Unpushed commits:** ${UNPUSHED}" >> "${OUTPUT_FILE}"
        fi
    else
        echo "- 🆕 **New branch:** Not yet pushed to remote" >> "${OUTPUT_FILE}"
    fi
    
    echo "- **Recent commits:**" >> "${OUTPUT_FILE}"
    git log --oneline -5 --no-decorate | sed 's/^/  - /' >> "${OUTPUT_FILE}"
    
    echo "" >> "${OUTPUT_FILE}"
fi

# Recent Proof Packs
add_section "🧪 Recent Proof Packs"

if [[ -d /tmp ]]; then
    PROOF_DIRS=$(find /tmp -maxdepth 1 -type d -name "proof_*" -mtime -1 2>/dev/null || true)
    
    if [[ -n "${PROOF_DIRS}" ]]; then
        echo "Found proof packs from last 24h:" >> "${OUTPUT_FILE}"
        echo "" >> "${OUTPUT_FILE}"
        
        while IFS= read -r proof_dir; do
            if [[ -n "${proof_dir}" ]]; then
                PROOF_NAME=$(basename "${proof_dir}")
                PROOF_TIME=$(stat -c %y "${proof_dir}" 2>/dev/null | cut -d'.' -f1 || echo "unknown")
                
                # Check for PASS/FAIL markers
                if [[ -f "${proof_dir}/PASS" ]]; then
                    echo "- ✅ \`${PROOF_NAME}\` (${PROOF_TIME})" >> "${OUTPUT_FILE}"
                elif [[ -f "${proof_dir}/FAIL" ]]; then
                    echo "- ❌ \`${PROOF_NAME}\` (${PROOF_TIME})" >> "${OUTPUT_FILE}"
                else
                    echo "- ⚪ \`${PROOF_NAME}\` (${PROOF_TIME})" >> "${OUTPUT_FILE}"
                fi
            fi
        done <<< "${PROOF_DIRS}"
    else
        echo "No proof packs found in last 24h." >> "${OUTPUT_FILE}"
    fi
fi

echo "" >> "${OUTPUT_FILE}"

# Docker Status
add_section "🐳 Docker Status"

if command -v docker &> /dev/null; then
    RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" 2>/dev/null | wc -l | tr -d ' ')
    RUNNING_CONTAINERS=${RUNNING_CONTAINERS:-0}
    echo "- **Running containers:** ${RUNNING_CONTAINERS}" >> "${OUTPUT_FILE}"
    
    if [[ ${RUNNING_CONTAINERS} -gt 0 ]]; then
        echo "- **Active services:**" >> "${OUTPUT_FILE}"
        docker ps --format "  - {{.Names}} ({{.Status}})" >> "${OUTPUT_FILE}" 2>/dev/null || true
    fi
else
    echo "Docker not available." >> "${OUTPUT_FILE}"
fi

echo "" >> "${OUTPUT_FILE}"

# Recent TODOs/FIXMEs
add_section "📝 Recent TODOs"

cd "${MONOREPO_ROOT}"
# Count TODO/FIXME comments (faster than git log -p)
TODO_COUNT=$(grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" apps/ packages/ 2>/dev/null | wc -l | tr -d ' ')
TODO_COUNT=${TODO_COUNT:-0}

echo "Found ${TODO_COUNT} TODO/FIXME comments in codebase." >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"
echo "*(Run \`grep -r 'TODO\\|FIXME' apps/ packages/\` to see them)*" >> "${OUTPUT_FILE}"

echo "" >> "${OUTPUT_FILE}"

# Test Status (if available)
add_section "🧪 Test Status"

cd "${MONOREPO_ROOT}"
# Skipped in v1 - can be slow. Add back if needed.
echo "- ⏭️ Test runs skipped (add \`--with-tests\` flag to enable)" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"

# Action Items
add_section "✅ Suggested Actions"

echo "Based on this morning's brief:" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"

# Generate smart action items based on findings
cd "${MONOREPO_ROOT}"

# Check for uncommitted changes in monorepo
if [[ -n $(git status --porcelain) ]]; then
    CHANGES_COUNT=$(git status --porcelain | wc -l | tr -d ' ')
    echo "- 📝 Review and commit ${CHANGES_COUNT} uncommitted changes in monorepo" >> "${OUTPUT_FILE}"
fi

# Check for uncommitted changes in bot bundle (if exists)
if check_repo "${BOT_BUNDLE_ROOT}"; then
    cd "${BOT_BUNDLE_ROOT}"
    if [[ -n $(git status --porcelain) ]]; then
        BOT_CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
        echo "- 📝 Review and commit ${BOT_CHANGES} uncommitted changes in pm_updown_bot_bundle" >> "${OUTPUT_FILE}"
    fi
fi

# Check for failing proof packs
FAILED_PROOFS=$(find /tmp -maxdepth 1 -type f -name "proof_*/FAIL" -mtime -1 2>/dev/null | wc -l | tr -d ' ')
FAILED_PROOFS=${FAILED_PROOFS:-0}
if [[ ${FAILED_PROOFS} -gt 0 ]]; then
    echo "- 🔍 Investigate ${FAILED_PROOFS} failed proof pack(s)" >> "${OUTPUT_FILE}"
fi

# Check for PRs (placeholder - would need gh CLI)
if command -v gh &> /dev/null; then
    OPEN_PRS=$(gh pr list --limit 100 2>/dev/null | wc -l | tr -d ' ')
    OPEN_PRS=${OPEN_PRS:-0}
    if [[ ${OPEN_PRS} -gt 0 ]]; then
        echo "- 🔄 Review ${OPEN_PRS} open PR(s)" >> "${OUTPUT_FILE}"
    fi
fi

echo "" >> "${OUTPUT_FILE}"
echo "---" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"
echo "*Generated by morning-brief.sh v1.0*" >> "${OUTPUT_FILE}"

# Display the brief
echo ""
echo "✅ Morning brief generated successfully!"
echo "📄 Location: ${OUTPUT_FILE}"
echo ""
echo "Preview:"
echo "========================================"
head -30 "${OUTPUT_FILE}"
echo "========================================"
echo ""
echo "💡 Tip: Add this to your cron or run it manually each morning"
