#!/usr/bin/env bash
set -euo pipefail

echo "[info] web runtime env required v0.37 verify"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

composeFile="$ROOT/docker-compose.yml"

echo "[info] checking docker-compose.yml web -> ADMIN_API_INTERNAL_URL is set"
webEnvHits="$(rg -n --no-messages -S '^[[:space:]]*ADMIN_API_INTERNAL_URL:[[:space:]]*\"?http://admin-api:3080\"?[[:space:]]*$' "$composeFile" || true)"
if [[ -z "$webEnvHits" ]]; then
  echo "[FAIL] docker-compose.yml missing web environment ADMIN_API_INTERNAL_URL=http://admin-api:3080"
  exit 1
fi

echo "[info] checking docker-compose.yml admin-api -> bot token env keys exist"
adminDiscordBotKey="$(rg -n --no-messages -S '^[[:space:]]*DISCORD_BOT_TOKEN:' "$composeFile" || true)"
if [[ -z "$adminDiscordBotKey" ]]; then
  echo "[FAIL] docker-compose.yml missing admin-api environment DISCORD_BOT_TOKEN"
  exit 1
fi
adminSlimyBotKey="$(rg -n --no-messages -S '^[[:space:]]*SLIMYAI_BOT_TOKEN:' "$composeFile" || true)"
if [[ -z "$adminSlimyBotKey" ]]; then
  echo "[FAIL] docker-compose.yml missing admin-api environment SLIMYAI_BOT_TOKEN"
  exit 1
fi

echo "[info] ensuring admin-api bot token fallback supports DISCORD_BOT_TOKEN"
fallbackHits="$(rg -n --no-messages -S 'DISCORD_BOT_TOKEN' "$ROOT/apps/admin-api/src/services/discord-shared-guilds.js" || true)"
if [[ -z "$fallbackHits" ]]; then
  echo "[FAIL] expected discord-shared-guilds getSlimyBotToken() to support DISCORD_BOT_TOKEN fallback"
  exit 1
fi

# Catch loopback + internal service hostnames in anything that could end up client-visible.
PAT='https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+|https?://admin-api(:[0-9]+)?|\\badmin-api:[0-9]+\\b|https?://slimy-admin-api(:[0-9]+)?|\\bslimy-admin-api:[0-9]+\\b'

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

echo "[PASS] web runtime env required v0.37 checks passed"
