#!/usr/bin/env bash
set -euo pipefail

echo "[info] web club routing polish v0.38 verify"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Catch loopback + internal service hostnames in anything that could end up client-visible.
PAT='https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+|https?://admin-api(:[0-9]+)?|\\badmin-api:[0-9]+\\b|https?://slimy-admin-api(:[0-9]+)?|\\bslimy-admin-api:[0-9]+\\b'

echo "[info] ensuring /club has explicit UX state handling"
clubFile="$ROOT/apps/web/app/club/page.tsx"
if [[ ! -f "$clubFile" ]]; then
  echo "[FAIL] expected $clubFile to exist"
  exit 1
fi

clubHits="$(rg -n --no-messages -S 'data-testid="club-state-unauth"|data-testid="club-state-no-guild"|data-testid="club-url-override"|data-testid="club-debug"' "$clubFile" || true)"
if [[ -z "$clubHits" ]]; then
  echo "[FAIL] expected /club page to include explicit state + debug test ids"
  exit 1
fi

echo "[info] ensuring ActiveClubPickerCard supports manual guild ID fallback"
pickerFile="$ROOT/apps/web/components/settings/ActiveClubPickerCard.tsx"
pickerHits="$(rg -n --no-messages -S 'data-testid="activeclub-manual-guildid"|activeclub-continue-with-id' "$pickerFile" || true)"
if [[ -z "$pickerHits" ]]; then
  echo "[FAIL] expected ActiveClubPickerCard to include manual guild ID fallback"
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

echo "[PASS] web club routing polish v0.38 checks passed"

