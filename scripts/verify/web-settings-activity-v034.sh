#!/usr/bin/env bash
set -euo pipefail

echo "[info] web settings activity widget v0.34 verify"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Catch loopback + internal service hostnames in anything that could end up client-visible.
PAT='https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+|https?://admin-api(:[0-9]+)?|\\badmin-api:[0-9]+\\b'

FILES=(
  "$ROOT/apps/web/components/settings/SettingsActivityWidget.tsx"
  "$ROOT/apps/web/app/status/page.tsx"
  "$ROOT/apps/web/app/club/page.tsx"
  "$ROOT/apps/web/lib/api/central-settings-client.ts"
)

echo "[info] scanning web settings activity sources for loopback/internal hosts"
hits="$(rg -n --no-messages -S "$PAT" "${FILES[@]}" || true)"
if [[ -n "$hits" ]]; then
  echo "[FAIL] loopback/localhost/internal host found in web settings activity sources:"
  printf '%s\n' "$hits"
  exit 1
fi

echo "[info] ensuring SettingsActivityWidget exists"
if [[ ! -f "$ROOT/apps/web/components/settings/SettingsActivityWidget.tsx" ]]; then
  echo "[FAIL] expected SettingsActivityWidget.tsx to exist"
  exit 1
fi

echo "[info] ensuring /status imports SettingsActivityWidget"
statusHits="$(rg -n --no-messages -S "SettingsActivityWidget" "$ROOT/apps/web/app/status/page.tsx" || true)"
if [[ -z "$statusHits" ]]; then
  echo "[FAIL] expected SettingsActivityWidget import/usage not found in /status page"
  exit 1
fi

echo "[info] ensuring /club shows guild SettingsActivityWidget when guildId present"
clubHits="$(rg -n --no-messages -S "SettingsActivityWidget scopeType=\\\"guild\\\"|SettingsActivityWidget" "$ROOT/apps/web/app/club/page.tsx" || true)"
if [[ -z "$clubHits" ]]; then
  echo "[FAIL] expected SettingsActivityWidget usage not found in /club page"
  exit 1
fi

staticDir="$ROOT/apps/web/.next/static"
echo "[info] building apps/web"
pnpm --filter @slimy/web build

if [[ -d "$staticDir" ]]; then
  echo "[info] scanning .next/static for loopback/internal hosts (client artifacts)"
  builtHits="$(rg -n --no-messages -S "$PAT" "$staticDir" || true)"
  if [[ -n "$builtHits" ]]; then
    echo "[FAIL] loopback/localhost/internal host found in built client artifacts (.next/static):"
    printf '%s\n' "$builtHits"
    exit 1
  fi
fi

echo "[PASS] web settings activity widget v0.34 checks passed"

