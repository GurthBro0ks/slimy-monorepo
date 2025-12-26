#!/usr/bin/env bash
set -euo pipefail

echo "[info] scanning client-adjacent sources for loopback/localhost"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PAT='https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+'

TARGETS=(
  "$ROOT/apps/admin-ui"
  "$ROOT/apps/bot"
  "$ROOT/packages/admin-api-client"
  "$ROOT/packages/contracts"
)

hits="$(
  rg -n --hidden --no-messages -S "$PAT" "${TARGETS[@]}" \
    --glob '**/*.{js,jsx,ts,tsx}' \
    --glob '!**/node_modules/**' \
    --glob '!**/.next/**' \
    --glob '!**/dist/**' \
    --glob '!**/.env*' \
    --glob '!**/*.md' \
    --glob '!**/tests/**' \
    --glob '!**/*.test.*' \
    --glob '!**/next.config.js' \
    --glob '!**/Dockerfile' \
    --glob '!**/AGENTS.md' \
    --glob '!**/pages/api/**' \
    --glob '!**/lib/oauth-origin.js' \
    --glob '!**/*.min.*' \
    --glob '!**/pnpm-lock.yaml' \
    --glob '!**/package-lock.json' \
    --glob '!**/yarn.lock' \
  || true
)"

if [[ -z "$hits" ]]; then
  echo "[PASS] no loopback/localhost found in scanned sources"
  exit 0
fi

# If there are matches, allow only in explicitly dev-only compose override files.
disallowed=""
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  case "$file" in
    */docker-compose.override.yml|*/docker-compose.dev.yml|*/docker-compose.local.yml)
      continue
      ;;
    *)
      disallowed+="${line}"$'\n'
      ;;
  esac
done <<<"$hits"

if [[ -n "$disallowed" ]]; then
  echo "[FAIL] loopback/localhost found in disallowed files:"
  printf '%s' "$disallowed"
  exit 1
fi

echo "[PASS] only dev-only compose override matches found"
