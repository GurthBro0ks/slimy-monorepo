#!/usr/bin/env bash
set -euo pipefail

# This script verifies that the isolated trader UI only references the trader domain
# by checking for the known invite-only footer text.
BASE_URL=${BASE_URL:-https://trader.slimyai.xyz}
PATH_TO_CHECK=/trader/register
ISOLATION_PATTERN=${ISOLATION_PATTERN:-Invite-only registration for trader.slimyai.xyz}

response=$(curl -fsSL "${BASE_URL}${PATH_TO_CHECK}")

if echo "$response" | grep -qF "$ISOLATION_PATTERN"; then
  echo "OK_ISOLATED: pattern \"$ISOLATION_PATTERN\" found"
  exit 0
else
  echo "FAIL_ISOLATED: pattern \"$ISOLATION_PATTERN\" missing"
  exit 1
fi
