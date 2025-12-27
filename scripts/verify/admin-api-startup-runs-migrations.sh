#!/usr/bin/env bash
set -euo pipefail

echo "[info] verifying admin-api runs prisma migrations on startup"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKERFILE="$ROOT/apps/admin-api/Dockerfile"

if [[ ! -f "$DOCKERFILE" ]]; then
  echo "[FAIL] missing Dockerfile: $DOCKERFILE"
  exit 2
fi

if ! rg -n --fixed-strings "prisma migrate deploy" "$DOCKERFILE" >/dev/null; then
  echo "[FAIL] admin-api Dockerfile does not run 'prisma migrate deploy' before starting"
  exit 1
fi

echo "[PASS] admin-api Dockerfile includes prisma migrate deploy"

