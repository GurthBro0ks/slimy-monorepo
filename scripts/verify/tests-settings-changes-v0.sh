#!/usr/bin/env bash
set -euo pipefail

echo "[info] running admin-api tests: settings-changes-v0"

pnpm --filter @slimy/admin-api test -- settings-sync-events-v02.test.js

echo "[PASS] settings-changes-v0 tests passed"
