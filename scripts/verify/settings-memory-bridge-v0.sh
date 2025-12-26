#!/usr/bin/env bash
set -euo pipefail

echo "[info] running admin-api regression: settings+memory v0"

pnpm --filter @slimy/admin-api test -- settings-memory-v0.test.js

echo "[PASS] settings+memory v0 regression test passed"

