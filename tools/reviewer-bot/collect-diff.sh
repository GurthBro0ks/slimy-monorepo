#!/usr/bin/env bash
#
# collect-diff.sh
# Collects git diff for code review and saves it to a file
#
# Usage:
#   ./collect-diff.sh [base-ref]
#
# Arguments:
#   base-ref  Optional. The base ref to diff against (default: origin/main)
#
# Output:
#   Saves diff to tools/reviewer-bot/latest.diff
#   Prints the path to the saved file
#

set -euo pipefail

# Default base ref
BASE_REF="${1:-origin/main}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/latest.diff"

# Ensure we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository" >&2
    exit 1
fi

# Check if base ref exists
if ! git rev-parse --verify "${BASE_REF}" > /dev/null 2>&1; then
    echo "Error: Base ref '${BASE_REF}' does not exist" >&2
    echo "Hint: You may need to run 'git fetch origin' first" >&2
    exit 1
fi

# Generate the diff
echo "Generating diff: ${BASE_REF}...HEAD" >&2
if ! git diff "${BASE_REF}...HEAD" > "${OUTPUT_FILE}"; then
    echo "Error: Failed to generate diff" >&2
    exit 1
fi

# Check if diff is empty
if [ ! -s "${OUTPUT_FILE}" ]; then
    echo "Warning: No changes detected between ${BASE_REF} and HEAD" >&2
    echo "The diff file is empty." >&2
fi

# Print success message and file path
echo "Diff saved to: ${OUTPUT_FILE}" >&2
echo "${OUTPUT_FILE}"
