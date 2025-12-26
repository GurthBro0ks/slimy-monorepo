#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
NO_CACHE="${NO_CACHE:-0}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "FAIL: compose file not found: $COMPOSE_FILE"
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "FAIL: docker is required"
  exit 2
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "FAIL: docker compose plugin is required (docker compose ...)"
  exit 2
fi

build_cmd=(docker compose -f "$COMPOSE_FILE" build)
if [[ "$NO_CACHE" == "1" ]]; then
  build_cmd+=(--no-cache)
fi
build_cmd+=(bot)

echo "[info] building bot image (${COMPOSE_FILE})"
"${build_cmd[@]}"

echo "[info] verifying bot runtime deps import"
docker compose -f "$COMPOSE_FILE" run --rm --no-deps --entrypoint node bot -e "const pkgs=['discord.js','@slimy/contracts','@slimy/admin-api-client']; Promise.all(pkgs.map((p)=>import(p))).then(()=>{console.log('PASS: bot runtime deps import ok');}).catch((e)=>{console.error(e); console.error('FAIL: bot runtime deps import failed'); process.exit(1);});"

