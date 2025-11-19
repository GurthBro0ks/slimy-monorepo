#!/bin/bash

# Deployment Checklist Generator
# Usage: ./new-checklist.sh [short-name]
# Example: ./new-checklist.sh "user-auth-fix"

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="${SCRIPT_DIR}/checklist-template.md"
HISTORY_DIR="${SCRIPT_DIR}/../../docs/deploy-checklists/history"

# Validate template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}Error: Template file not found at ${TEMPLATE_FILE}${NC}"
    exit 1
fi

# Get short name from argument or prompt
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter a short name for this deployment (e.g., 'user-auth-fix'):${NC}"
    read -r SHORT_NAME
else
    SHORT_NAME="$1"
fi

# Validate short name
if [ -z "$SHORT_NAME" ]; then
    echo -e "${RED}Error: Short name cannot be empty${NC}"
    exit 1
fi

# Sanitize the short name (remove spaces, special chars)
SHORT_NAME=$(echo "$SHORT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Get git info
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown-branch")
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown-commit")
GIT_COMMIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Create history directory if it doesn't exist
mkdir -p "$HISTORY_DIR"

# Generate output filename
OUTPUT_FILE="${HISTORY_DIR}/${TIMESTAMP}-${SHORT_NAME}.md"

# Copy template and replace placeholders
echo -e "${GREEN}Generating deployment checklist...${NC}"
cp "$TEMPLATE_FILE" "$OUTPUT_FILE"

# Replace placeholders using sed
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|<!-- TIMESTAMP -->|$(date '+%Y-%m-%d %H:%M:%S %Z')|g" "$OUTPUT_FILE"
    sed -i '' "s|<!-- BRANCH -->|\`${GIT_BRANCH}\`|g" "$OUTPUT_FILE"
    sed -i '' "s|<!-- COMMIT -->|\`${GIT_COMMIT}\` (\`${GIT_COMMIT_SHORT}\`)|g" "$OUTPUT_FILE"
else
    # Linux
    sed -i "s|<!-- TIMESTAMP -->|$(date '+%Y-%m-%d %H:%M:%S %Z')|g" "$OUTPUT_FILE"
    sed -i "s|<!-- BRANCH -->|\`${GIT_BRANCH}\`|g" "$OUTPUT_FILE"
    sed -i "s|<!-- COMMIT -->|\`${GIT_COMMIT}\` (\`${GIT_COMMIT_SHORT}\`)|g" "$OUTPUT_FILE"
fi

# Output success message
echo -e "${GREEN}✓ Checklist created successfully!${NC}"
echo ""
echo -e "${GREEN}File:${NC} $OUTPUT_FILE"
echo -e "${GREEN}Branch:${NC} $GIT_BRANCH"
echo -e "${GREEN}Commit:${NC} $GIT_COMMIT_SHORT"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open the checklist: $OUTPUT_FILE"
echo "2. Fill out all sections before deployment"
echo "3. Check off items as you complete them"
echo "4. Store the completed checklist in version control"
echo ""
