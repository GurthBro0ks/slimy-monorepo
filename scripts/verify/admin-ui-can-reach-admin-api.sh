#!/usr/bin/env bash
set -euo pipefail

echo "[info] verifying admin-ui has admin-api upstream wiring"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

bash "$ROOT/scripts/verify/compose-config-valid.sh" >/dev/null

cfg="$(docker compose config)"

admin_ui_block="$(
  echo "$cfg" | awk '
    /^  admin-ui:$/ {p=1; print; next}
    p && /^  [A-Za-z0-9_-]+:$/ {exit}
    p {print}
  '
)"

if [[ -z "$admin_ui_block" ]]; then
  echo "[FAIL] docker compose config did not include an admin-ui service block"
  exit 1
fi

if ! echo "$admin_ui_block" | grep -qE '^[[:space:]]+ADMIN_API_INTERNAL_URL:'; then
  echo "[FAIL] admin-ui missing required environment variable: ADMIN_API_INTERNAL_URL"
  exit 1
fi

echo "[PASS] admin-ui includes ADMIN_API_INTERNAL_URL in compose config"
