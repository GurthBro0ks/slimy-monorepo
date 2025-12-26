#!/usr/bin/env bash
set -euo pipefail

echo "[info] web settings UI v0.32 verify"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Catch loopback + internal service hostnames in anything that could end up client-visible.
PAT='https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+|https?://admin-api(:[0-9]+)?|\\badmin-api:[0-9]+\\b'

FILES=(
  "$ROOT/apps/web/app/settings/page.tsx"
  "$ROOT/apps/web/app/club/[guildId]/settings/page.tsx"
  "$ROOT/apps/web/components/settings/SettingsEditor.tsx"
  "$ROOT/apps/web/lib/api/central-settings-client.ts"
)

echo "[info] scanning web settings UI sources for loopback/internal hosts"
hits="$(rg -n --no-messages -S "$PAT" "${FILES[@]}" || true)"
if [[ -n "$hits" ]]; then
  echo "[FAIL] loopback/localhost/internal host found in web settings UI sources:"
  printf '%s\n' "$hits"
  exit 1
fi

echo "[info] ensuring settings pages use SettingsEditor"
importHits="$(rg -n --no-messages -S "from \"@/components/settings/SettingsEditor\"" \
  "$ROOT/apps/web/app/settings/page.tsx" \
  "$ROOT/apps/web/app/club/[guildId]/settings/page.tsx" || true)"
if [[ -z "$importHits" ]]; then
  echo "[FAIL] settings pages do not appear to import SettingsEditor"
  exit 1
fi

staticDir="$ROOT/apps/web/.next/static"
if [[ ! -d "$staticDir" ]]; then
  echo "[info] building apps/web (no existing .next/static)"
  pnpm --filter @slimy/web build
fi

if [[ -d "$staticDir" ]]; then
  echo "[info] scanning .next/static for loopback/internal hosts (client artifacts)"
  builtHits="$(rg -n --no-messages -S "$PAT" "$staticDir" || true)"
  if [[ -n "$builtHits" ]]; then
    echo "[FAIL] loopback/localhost/internal host found in built client artifacts (.next/static):"
    printf '%s\n' "$builtHits"
    exit 1
  fi
fi

echo "[PASS] web settings UI v0.32 checks passed"

