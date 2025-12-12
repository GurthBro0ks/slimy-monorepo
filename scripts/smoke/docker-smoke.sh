#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker-compose.yml"

log() { printf '%s\n' "$*"; }

cleanup_legacy_port() {
  local port="$1"
  local offenders
  offenders="$(docker ps --filter "publish=${port}" --format '{{.Names}}' 2>/dev/null || true)"
  if [[ -z "${offenders}" ]]; then
    return 0
  fi

  local allowed_re='^(slimy-db|slimy-admin-api|slimy-web|slimy-admin-ui|slimy-bot)$'
  while IFS= read -r name; do
    [[ -z "${name}" ]] && continue
    if [[ "${name}" =~ ${allowed_re} ]]; then
      log "Port ${port} in use by legacy container ${name}; removing container"
      docker rm -f "${name}" >/dev/null
    else
      log "Port ${port} is already allocated by non-legacy container: ${name}"
      return 1
    fi
  done <<<"${offenders}"

  # Re-check
  offenders="$(docker ps --filter "publish=${port}" --format '{{.Names}}' 2>/dev/null || true)"
  if [[ -n "${offenders}" ]]; then
    log "Port ${port} still in use after cleanup: ${offenders}"
    return 1
  fi
}

retry() {
  local name="$1"
  local cmd="$2"
  local attempts="${3:-60}"
  local sleep_s="${4:-2}"

  for ((i = 1; i <= attempts; i++)); do
    if eval "$cmd" >/dev/null 2>&1; then
      log "OK: $name"
      return 0
    fi
    sleep "$sleep_s"
  done

  log "FAIL: $name (timed out after $((attempts * sleep_s))s)"
  return 1
}

on_fail() {
  log ""
  log "=== docker compose ps ==="
  docker compose -f "$COMPOSE_FILE" ps || true
  log ""
  log "=== docker compose logs (tail=200) ==="
  docker compose -f "$COMPOSE_FILE" logs --tail=200 db admin-api web admin-ui || true
}

trap 'on_fail' ERR

if [[ ! -f "$COMPOSE_FILE" ]]; then
  log "Missing $COMPOSE_FILE (run from repo root)"
  exit 2
fi

cleanup_legacy_port 3080
cleanup_legacy_port 3000
cleanup_legacy_port 3001

if [[ ! -f .env && -f .env.docker.example ]]; then
  log "No .env found; creating from .env.docker.example (local-only, ignored by git)"
  cp .env.docker.example .env
fi

log "Bringing up baseline stack (db admin-api web admin-ui)..."
docker compose -f "$COMPOSE_FILE" up -d --build db admin-api web admin-ui

log "Waiting for endpoints..."
retry "admin-api /api/health" "curl -fsS http://127.0.0.1:3080/api/health" 60 2
retry "web /" "curl -fsS http://127.0.0.1:3000/" 60 2
retry "admin-ui /" "curl -fsS http://127.0.0.1:3001/" 60 2

log ""
log "PASS: Docker baseline smoke test"
