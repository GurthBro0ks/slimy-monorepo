#!/usr/bin/env bash
set -euo pipefail

echo "[info] verify settings sync clients v0.1 (bot + admin-ui wiring)"

pnpm --filter @slimy/contracts build
pnpm --filter @slimy/admin-api-client build
pnpm --filter @slimy/bot build

# Covers:
# - memory kind policy enforcement (shared contracts)
# - internal bot auth regression
# - authz negative tests
bash scripts/verify/settings-memory-bridge-v0.sh

echo "[PASS] settings sync clients v0.1 checks passed"

