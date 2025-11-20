#!/bin/bash

# AI Task Skeleton Generator
# Creates a new markdown file from the template for AI-assisted tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory (works regardless of where it's called from)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TEMPLATE_FILE="${REPO_ROOT}/docs/ai-task-template.md"
TASKS_DIR="${REPO_ROOT}/docs/ai-tasks"

# Function to display usage
usage() {
    echo "Usage: $0 <task-name>"
    echo ""
    echo "Creates a new AI task skeleton markdown file from the template."
    echo ""
    echo "Arguments:"
    echo "  task-name    Short name for the task (e.g., 'fix-auth-bug' or 'add-search-feature')"
    echo ""
    echo "Example:"
    echo "  $0 implement-dark-mode"
    echo ""
    exit 1
}

# Check if task name is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Task name is required${NC}"
    echo ""
    usage
fi

TASK_NAME="$1"

# Validate task name (alphanumeric, dashes, underscores only)
if ! [[ "$TASK_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo -e "${RED}Error: Task name must contain only letters, numbers, dashes, and underscores${NC}"
    exit 1
fi

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}Error: Template file not found at $TEMPLATE_FILE${NC}"
    exit 1
fi

# Create tasks directory if it doesn't exist
mkdir -p "$TASKS_DIR"

# Output file path
OUTPUT_FILE="${TASKS_DIR}/${TASK_NAME}.md"

# Check if file already exists
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}Warning: File already exists at $OUTPUT_FILE${NC}"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Copy template and replace [TASK_NAME] placeholder
sed "s/\[TASK_NAME\]/${TASK_NAME}/g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo -e "${GREEN}✓ Successfully created task skeleton at:${NC}"
echo "  $OUTPUT_FILE"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Edit the file and fill in the sections"
echo "  2. Copy the content and paste it into your AI assistant"
echo ""
echo "To view the file:"
echo "  cat $OUTPUT_FILE"
