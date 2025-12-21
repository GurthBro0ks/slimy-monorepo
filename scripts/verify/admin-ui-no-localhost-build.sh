#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="$ROOT/apps/admin-ui"

MODE="${MODE:-docker}" # docker | local
STRICT="${STRICT:-1}"
BUILD="${BUILD:-0}"

# Scan ONLY public/static build output. Server-side bundles may contain harmless dev fallbacks.
PAT="${PAT:-(https?:)?//(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+|localhost%3a|127\\.0\\.0\\.1%3a|/api/admin-api/api/auth/(callback|login)}"

if [[ "$MODE" == "docker" ]]; then
  compose_cmd=(docker compose)
  if [[ -n "${COMPOSE_FILES:-}" ]]; then
    read -r -a extra <<<"$COMPOSE_FILES"
    compose_cmd+=("${extra[@]}")
  fi

  if [[ "$BUILD" == "1" ]]; then
    echo "[info] docker build admin-ui ..."
    "${compose_cmd[@]}" build admin-ui
  fi

  echo "[info] scanning admin-ui image public assets"
  set +e
  hits="$("${compose_cmd[@]}" run --rm --no-deps --entrypoint sh admin-ui -lc \
    "set -e; PAT='$PAT'; roots='/app/.next/static /app/apps/admin-ui/.next/static /app/public /app/apps/admin-ui/public'; for r in \$roots; do if [ -d \"\$r\" ]; then grep -RInE --binary-files=without-match -i \"\$PAT\" \"\$r\" && exit 10 || true; fi; done; exit 0" \
  )"
  code=$?
  set -e

  if [[ "$code" == "0" ]]; then
    echo "[PASS] no localhost/legacy routes in image public assets"
    exit 0
  fi

  echo "[FAIL] localhost/legacy route found in image public assets:"
  echo "$hits"
  [[ "$STRICT" == "1" ]] && exit 1
  echo "[WARN] matches found but STRICT=0"
  exit 0
fi

if [[ "$MODE" != "local" ]]; then
  echo "[FAIL] unknown MODE=$MODE (expected docker|local)"
  exit 2
fi

SCAN_DIRS=()
[[ -d "$APP_DIR/.next/static" ]] && SCAN_DIRS+=("$APP_DIR/.next/static")
[[ -d "$APP_DIR/out" ]] && SCAN_DIRS+=("$APP_DIR/out")

if [[ "$BUILD" == "1" ]]; then
  echo "[info] building @slimy/admin-ui ..."
  (cd "$ROOT" && pnpm --filter @slimy/admin-ui build)
  SCAN_DIRS=()
  [[ -d "$APP_DIR/.next/static" ]] && SCAN_DIRS+=("$APP_DIR/.next/static")
  [[ -d "$APP_DIR/out" ]] && SCAN_DIRS+=("$APP_DIR/out")
fi

if [[ ${#SCAN_DIRS[@]} -eq 0 ]]; then
  echo "[FAIL] no build output found (expected apps/admin-ui/.next/static or apps/admin-ui/out)"
  echo "       run: pnpm --filter @slimy/admin-ui build   (or re-run with MODE=local BUILD=1)"
  exit 2
fi

echo "[info] scanning: ${SCAN_DIRS[*]}"
hits="$(grep -RInE --binary-files=without-match -i "$PAT" "${SCAN_DIRS[@]}" || true)"

if [[ -n "$hits" ]]; then
  echo "[FAIL] localhost/legacy route found in build output:"
  echo "$hits"
  [[ "$STRICT" == "1" ]] && exit 1
  echo "[WARN] matches found but STRICT=0"
  exit 0
fi

echo "[PASS] no localhost/legacy routes in build output"
