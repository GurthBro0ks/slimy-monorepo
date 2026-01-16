#!/bin/bash
# Smoke test: Verify /api/owner/me returns 401 for unauthenticated requests
# Usage: bash scripts/smoke/verify-owner-me-unauth.sh

set -e

BASE_URL="${BASE_URL:-https://trader.slimyai.xyz}"
ENDPOINT="/api/owner/me"

echo "Testing: $BASE_URL$ENDPOINT (unauthenticated)"
echo "Expected: HTTP 401"
echo ""

# Make request without auth cookies
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$ENDPOINT")

echo "Result: HTTP $HTTP_CODE"

if [ "$HTTP_CODE" = "401" ]; then
  echo "✓ PASS: Correctly returns 401 Unauthorized"
  exit 0
elif [ "$HTTP_CODE" = "403" ]; then
  echo "⚠ ACCEPTABLE: Returns 403 Forbidden (less ideal than 401)"
  exit 0
else
  echo "✗ FAIL: Expected 401 or 403, got $HTTP_CODE"
  exit 1
fi
