#!/usr/bin/env bash
set -euo pipefail

echo "[info] running admin-api regression: settings sync events v0.2"

pnpm --filter @slimy/admin-api test -- settings-sync-events-v02.test.js

echo "[PASS] settings sync events v0.2 regression test passed"

