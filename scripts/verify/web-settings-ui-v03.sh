#!/usr/bin/env bash
set -euo pipefail

echo "[info] web settings UI v0.3 verify"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PAT='https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+'

FILES=(
  "$ROOT/apps/web/app/settings/page.tsx"
  "$ROOT/apps/web/app/club/[guildId]/settings/page.tsx"
  "$ROOT/apps/web/lib/api/central-settings-client.ts"
)

echo "[info] scanning changed web client files for loopback"
hits="$(rg -n --no-messages -S "$PAT" "${FILES[@]}" || true)"
if [[ -n "$hits" ]]; then
  echo "[FAIL] loopback/localhost found in web settings UI sources:"
  printf '%s\n' "$hits"
  exit 1
fi

echo "[info] building apps/web"
pnpm --filter @slimy/web build

staticDir="$ROOT/apps/web/.next/static"
if [[ -d "$staticDir" ]]; then
  echo "[info] scanning .next/static for loopback (client artifacts)"
  builtHits="$(rg -n --no-messages -S "$PAT" "$staticDir" || true)"
  if [[ -n "$builtHits" ]]; then
    echo "[FAIL] loopback/localhost found in built client artifacts (.next/static):"
    printf '%s\n' "$builtHits"
    exit 1
  fi
fi

echo "[PASS] web settings UI v0.3 checks passed"

