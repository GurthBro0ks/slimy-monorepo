#!/bin/bash

# Changelog Generator
# Generates a markdown changelog from git commits grouped by conventional commit prefixes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/LATEST_CHANGELOG.md"

# Parse arguments
BASE_REF="${1:-}"

# Function to print usage
usage() {
    echo "Usage: $0 [base-ref]"
    echo ""
    echo "Arguments:"
    echo "  base-ref    Optional. Base tag or commit to start from (e.g., v1.0.0, HEAD~10)"
    echo "              If not provided, uses all commits from the beginning"
    echo ""
    echo "Output:"
    echo "  Generates ${OUTPUT_FILE}"
    echo ""
    echo "Examples:"
    echo "  $0                  # Generate changelog for all commits"
    echo "  $0 v1.0.0          # Generate changelog since tag v1.0.0"
    echo "  $0 HEAD~20         # Generate changelog for last 20 commits"
    exit 1
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}" >&2
    exit 1
fi

# Build git log command
if [ -n "$BASE_REF" ]; then
    # Verify the base ref exists
    if ! git rev-parse "$BASE_REF" > /dev/null 2>&1; then
        echo -e "${RED}Error: Base ref '$BASE_REF' not found${NC}" >&2
        exit 1
    fi
    GIT_RANGE="${BASE_REF}..HEAD"
    echo -e "${GREEN}Generating changelog from ${BASE_REF} to HEAD${NC}"
else
    GIT_RANGE="HEAD"
    echo -e "${GREEN}Generating changelog for all commits${NC}"
fi

# Temporary files for grouping commits
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

FEAT_FILE="${TEMP_DIR}/feat.txt"
FIX_FILE="${TEMP_DIR}/fix.txt"
DOCS_FILE="${TEMP_DIR}/docs.txt"
STYLE_FILE="${TEMP_DIR}/style.txt"
REFACTOR_FILE="${TEMP_DIR}/refactor.txt"
PERF_FILE="${TEMP_DIR}/perf.txt"
TEST_FILE="${TEMP_DIR}/test.txt"
BUILD_FILE="${TEMP_DIR}/build.txt"
CI_FILE="${TEMP_DIR}/ci.txt"
CHORE_FILE="${TEMP_DIR}/chore.txt"
REVERT_FILE="${TEMP_DIR}/revert.txt"
OTHER_FILE="${TEMP_DIR}/other.txt"

# Read commits and categorize them
while IFS= read -r line; do
    # Extract commit hash and message
    commit_hash=$(echo "$line" | cut -d'|' -f1)
    commit_msg=$(echo "$line" | cut -d'|' -f2-)

    # Categorize based on conventional commit prefix
    if [[ $commit_msg =~ ^feat(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$FEAT_FILE"
    elif [[ $commit_msg =~ ^fix(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$FIX_FILE"
    elif [[ $commit_msg =~ ^docs(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$DOCS_FILE"
    elif [[ $commit_msg =~ ^style(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$STYLE_FILE"
    elif [[ $commit_msg =~ ^refactor(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$REFACTOR_FILE"
    elif [[ $commit_msg =~ ^perf(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$PERF_FILE"
    elif [[ $commit_msg =~ ^test(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$TEST_FILE"
    elif [[ $commit_msg =~ ^build(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$BUILD_FILE"
    elif [[ $commit_msg =~ ^ci(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$CI_FILE"
    elif [[ $commit_msg =~ ^chore(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$CHORE_FILE"
    elif [[ $commit_msg =~ ^revert(\(.*\))?:\ (.+) ]]; then
        echo "- ${BASH_REMATCH[2]} (\`${commit_hash:0:7}\`)" >> "$REVERT_FILE"
    else
        echo "- ${commit_msg} (\`${commit_hash:0:7}\`)" >> "$OTHER_FILE"
    fi
done < <(git log --format="%H|%s" "$GIT_RANGE")

# Generate the changelog markdown
{
    echo "# Changelog"
    echo ""
    echo "Generated on: $(date '+%Y-%m-%d %H:%M:%S')"

    if [ -n "$BASE_REF" ]; then
        echo "Range: \`${BASE_REF}..HEAD\`"
    else
        echo "Range: All commits"
    fi

    echo ""

    # Features
    if [ -f "$FEAT_FILE" ] && [ -s "$FEAT_FILE" ]; then
        echo "## Features"
        echo ""
        cat "$FEAT_FILE"
        echo ""
    fi

    # Bug Fixes
    if [ -f "$FIX_FILE" ] && [ -s "$FIX_FILE" ]; then
        echo "## Bug Fixes"
        echo ""
        cat "$FIX_FILE"
        echo ""
    fi

    # Performance Improvements
    if [ -f "$PERF_FILE" ] && [ -s "$PERF_FILE" ]; then
        echo "## Performance Improvements"
        echo ""
        cat "$PERF_FILE"
        echo ""
    fi

    # Refactoring
    if [ -f "$REFACTOR_FILE" ] && [ -s "$REFACTOR_FILE" ]; then
        echo "## Refactoring"
        echo ""
        cat "$REFACTOR_FILE"
        echo ""
    fi

    # Documentation
    if [ -f "$DOCS_FILE" ] && [ -s "$DOCS_FILE" ]; then
        echo "## Documentation"
        echo ""
        cat "$DOCS_FILE"
        echo ""
    fi

    # Tests
    if [ -f "$TEST_FILE" ] && [ -s "$TEST_FILE" ]; then
        echo "## Tests"
        echo ""
        cat "$TEST_FILE"
        echo ""
    fi

    # Build System
    if [ -f "$BUILD_FILE" ] && [ -s "$BUILD_FILE" ]; then
        echo "## Build System"
        echo ""
        cat "$BUILD_FILE"
        echo ""
    fi

    # CI/CD
    if [ -f "$CI_FILE" ] && [ -s "$CI_FILE" ]; then
        echo "## CI/CD"
        echo ""
        cat "$CI_FILE"
        echo ""
    fi

    # Chores
    if [ -f "$CHORE_FILE" ] && [ -s "$CHORE_FILE" ]; then
        echo "## Chores"
        echo ""
        cat "$CHORE_FILE"
        echo ""
    fi

    # Style
    if [ -f "$STYLE_FILE" ] && [ -s "$STYLE_FILE" ]; then
        echo "## Style Changes"
        echo ""
        cat "$STYLE_FILE"
        echo ""
    fi

    # Reverts
    if [ -f "$REVERT_FILE" ] && [ -s "$REVERT_FILE" ]; then
        echo "## Reverts"
        echo ""
        cat "$REVERT_FILE"
        echo ""
    fi

    # Other/Uncategorized
    if [ -f "$OTHER_FILE" ] && [ -s "$OTHER_FILE" ]; then
        echo "## Other Changes"
        echo ""
        cat "$OTHER_FILE"
        echo ""
    fi

} > "$OUTPUT_FILE"

echo -e "${GREEN}✓ Changelog generated successfully!${NC}"
echo -e "${YELLOW}Output: ${OUTPUT_FILE}${NC}"
echo ""
echo "You can now:"
echo "  1. Review the changelog: cat ${OUTPUT_FILE}"
echo "  2. Copy it to your release notes"
echo "  3. Manually merge it into your project's CHANGELOG.md"
