#!/usr/bin/env bash
set -euo pipefail

echo "[info] web active guild scope v0.35 verify"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Catch loopback + internal service hostnames in anything that could end up client-visible.
PAT='https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+|https?://admin-api(:[0-9]+)?|\\badmin-api:[0-9]+\\b'

FILES=(
  "$ROOT/apps/web/app/settings/page.tsx"
  "$ROOT/apps/web/components/settings/ActiveClubPickerCard.tsx"
  "$ROOT/apps/web/components/settings/SettingsActivityWidget.tsx"
  "$ROOT/apps/web/lib/api/central-settings-client.ts"
)

echo "[info] scanning active guild scope sources for loopback/internal hosts"
hits="$(rg -n --no-messages -S "$PAT" "${FILES[@]}" || true)"
if [[ -n "$hits" ]]; then
  echo "[FAIL] loopback/localhost/internal host found in active guild scope sources:"
  printf '%s\n' "$hits"
  exit 1
fi

echo "[info] ensuring ActiveClubPickerCard exists + is used on /settings"
if [[ ! -f "$ROOT/apps/web/components/settings/ActiveClubPickerCard.tsx" ]]; then
  echo "[FAIL] expected ActiveClubPickerCard.tsx to exist"
  exit 1
fi
settingsHits="$(rg -n --no-messages -S "ActiveClubPickerCard" "$ROOT/apps/web/app/settings/page.tsx" || true)"
if [[ -z "$settingsHits" ]]; then
  echo "[FAIL] expected ActiveClubPickerCard usage not found in /settings page"
  exit 1
fi

echo "[info] ensuring activeGuildId key is referenced"
keyHits="$(rg -n --no-messages -S "activeGuildId" "$ROOT/apps/web/components/settings/ActiveClubPickerCard.tsx" "$ROOT/apps/web/components/settings/SettingsActivityWidget.tsx" || true)"
if [[ -z "$keyHits" ]]; then
  echo "[FAIL] expected activeGuildId key usage not found"
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

echo "[PASS] web active guild scope v0.35 checks passed"

