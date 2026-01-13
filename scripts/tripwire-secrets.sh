#!/bin/bash
#
# Tripwire script: Check for plaintext secrets in Phase 9 codebase
# Outputs: OK_NO_SECRETS_MATCHED or lists suspicious patterns
#

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUSPICIOUS_FILES=()
PATTERNS_FOUND=0

echo "=== Tripwire: Secrets Detection ==="
echo "Scanning: $REPO_ROOT"
echo ""

# Patterns that should NOT be in PRODUCTION CODE
# (These are examples of secrets we want to catch)
# Note: .env files are OK, but secrets in code are not
PATTERNS=(
  # Plaintext tokens in code (beyond test/mock data)
  "tokenPlaintext.*=.*['\"][0-9a-f]"

  # AWS keys in code (AKIA pattern)
  "AKIA[0-9A-Z]{16}"

  # Private keys (RSA, PRIVATE KEY markers)
  "BEGIN PRIVATE KEY"
  "BEGIN RSA PRIVATE"
)

# Files/directories to exclude from scan
EXCLUDED_PATHS=(
  "node_modules"
  ".git"
  ".next"
  "dist"
  "coverage"
  "test-results"
  "playwright-report"
  "docs/reports"
  ".env"
  "jest.setup"
)

# Build exclude pattern
EXCLUDE_PATTERN=""
for path in "${EXCLUDED_PATHS[@]}"; do
  if [ -z "$EXCLUDE_PATTERN" ]; then
    EXCLUDE_PATTERN="-not -path */$path -not -path */$path/*"
  else
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN -not -path */$path -not -path */$path/*"
  fi
done

# Scan for each pattern
for pattern in "${PATTERNS[@]}"; do
  # Use grep with basic regex (not extended by default in scripts)
  # Exclude test files and documentation
  matches=$(
    find "$REPO_ROOT" \
      -type f \
      \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.env*" \) \
      $EXCLUDE_PATTERN \
      -not -path "*/test*" \
      -not -path "*/mock*" \
      2>/dev/null | \
      xargs grep -l "$pattern" 2>/dev/null || true
  )

  if [ ! -z "$matches" ]; then
    echo "⚠️  Pattern matched: $pattern"
    echo "$matches"
    echo ""
    PATTERNS_FOUND=$((PATTERNS_FOUND + 1))
  fi
done

# Specific check: ensure invite tokens are hashed (64 hex) not plaintext
echo "Checking: Database stores only hashes (not plaintext tokens)..."
hash_check=$(
  grep -r "tokenPlaintext" "$REPO_ROOT/apps/web/lib/owner" \
    --include="*.ts" \
    --exclude-dir=__tests__ \
    --exclude-dir=node_modules \
    2>/dev/null || true
)

# tokenPlaintext should only exist in:
# - Tests (validation tests)
# - API routes returning it ONCE to user (and it's never stored)
# - invite.ts (as return value, never stored)
if echo "$hash_check" | grep -q "prisma.*tokenPlaintext\|database.*tokenPlaintext\|store.*tokenPlaintext"; then
  echo "❌ ERROR: tokenPlaintext found in database operations!"
  PATTERNS_FOUND=$((PATTERNS_FOUND + 1))
else
  echo "✓ Token handling: Only hashes are stored"
fi

echo ""

# Final verdict
if [ $PATTERNS_FOUND -eq 0 ]; then
  echo "✅ OK_NO_SECRETS_MATCHED"
  exit 0
else
  echo "❌ SECRETS_DETECTED (found $PATTERNS_FOUND issues)"
  exit 1
fi
