#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${1:-docker-compose.yml}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "FAIL: compose file not found: $COMPOSE_FILE"
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "FAIL: docker is required for compose config validation"
  exit 2
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "FAIL: docker compose plugin is required (docker compose ...)"
  exit 2
fi

echo "[info] docker compose config ($COMPOSE_FILE)"

out="$(docker compose -f "$COMPOSE_FILE" config 2>&1)" || {
  echo "$out"
  echo "FAIL: docker compose config failed"
  exit 1
}

missing=()
for svc in db admin-api web admin-ui bot; do
  if ! echo "$out" | grep -qE "^  ${svc}:\$"; then
    missing+=("$svc")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "FAIL: docker compose config missing expected services:"
  printf " - %s\n" "${missing[@]}"
  exit 1
fi

echo "PASS: docker compose config is valid (services: db, admin-api, web, admin-ui, bot)"

