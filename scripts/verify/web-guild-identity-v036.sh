#!/usr/bin/env bash
set -euo pipefail

echo "[info] web guild identity v0.36 verify"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Catch loopback + internal service hostnames in anything that could end up client-visible.
PAT='https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+|https?://admin-api(:[0-9]+)?|\\badmin-api:[0-9]+\\b'

FILES=(
  "$ROOT/apps/web/lib/guildIdentity.ts"
  "$ROOT/apps/web/components/settings/ActiveClubPickerCard.tsx"
  "$ROOT/apps/web/components/settings/SettingsActivityWidget.tsx"
  "$ROOT/apps/web/app/settings/page.tsx"
)

echo "[info] scanning guild identity sources for loopback/internal hosts"
hits="$(rg -n --no-messages -S "$PAT" "${FILES[@]}" || true)"
if [[ -n "$hits" ]]; then
  echo "[FAIL] loopback/localhost/internal host found in guild identity sources:"
  printf '%s\n' "$hits"
  exit 1
fi

echo "[info] ensuring guildIdentity helper exists"
if [[ ! -f "$ROOT/apps/web/lib/guildIdentity.ts" ]]; then
  echo "[FAIL] expected apps/web/lib/guildIdentity.ts to exist"
  exit 1
fi

echo "[info] ensuring ActiveClubPickerCard imports guildIdentity"
pickerHits="$(rg -n --no-messages -S 'from "@/lib/guildIdentity"|getGuildIdentityMap' "$ROOT/apps/web/components/settings/ActiveClubPickerCard.tsx" || true)"
if [[ -z "$pickerHits" ]]; then
  echo "[FAIL] expected ActiveClubPickerCard to import/use guildIdentity"
  exit 1
fi

echo "[info] ensuring SettingsActivityWidget imports guildIdentity"
widgetHits="$(rg -n --no-messages -S 'from "@/lib/guildIdentity"|getGuildIdentityMap' "$ROOT/apps/web/components/settings/SettingsActivityWidget.tsx" || true)"
if [[ -z "$widgetHits" ]]; then
  echo "[FAIL] expected SettingsActivityWidget to import/use guildIdentity"
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

echo "[PASS] web guild identity v0.36 checks passed"
