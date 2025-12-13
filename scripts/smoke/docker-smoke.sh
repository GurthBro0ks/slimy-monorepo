#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker-compose.yml"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-slimy-monorepo}"

log() { printf '%s\n' "$*"; }

preflight() {
  if ! command -v docker >/dev/null 2>&1; then
    log "ERROR: docker not found."
    log "Install Docker first:"
    log "  sudo bash scripts/host/setup-docker-mint.sh"
    exit 2
  fi

  if ! docker info >/dev/null 2>&1; then
    log "ERROR: docker daemon not reachable (is it running? permissions?)."
    log "Try:"
    log "  sudo systemctl enable --now docker"
    log "  sudo usermod -aG docker $USER  # then re-login or: newgrp docker"
    exit 2
  fi

  local root_source="" root_fstype="" root_line="" storage_driver=""
  root_line="$(findmnt -n -o SOURCE,FSTYPE / 2>/dev/null || true)"
  root_source="$(awk '{print $1}' <<<"$root_line")"
  root_fstype="$(awk '{print $2}' <<<"$root_line")"

  storage_driver="$(docker info 2>/dev/null | awk -F': ' 'BEGIN{IGNORECASE=1} /Storage Driver/ {print $2; exit}')"

  if [[ "${root_fstype:-}" == "overlay" || "${root_source:-}" == "/cow" ]]; then
    if [[ "${storage_driver:-}" != "vfs" ]]; then
      log "ERROR: Detected live-session overlay root (${root_source:-?} ${root_fstype:-?}) but Docker Storage Driver is '${storage_driver:-unknown}'."
      log "On /cow overlay roots, overlayfs mounts often fail with 'invalid argument'."
      log "Fix by forcing Docker to vfs:"
      log "  sudo bash scripts/host/fix-docker-overlay-root.sh"
      exit 2
    fi
  fi
}

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

preflight

docker compose -f "$COMPOSE_FILE" down --remove-orphans || true

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
log "Checking admin-ui /dashboard routing..."
dashboard_url="http://127.0.0.1:3001/dashboard"
dashboard_code="$(curl -sS -o /tmp/slimy-dashboard.html -w "%{http_code}" "$dashboard_url")"
if [[ "$dashboard_code" == "500" || "$dashboard_code" == "502" ]]; then
  log "FAIL: $dashboard_url (HTTP $dashboard_code)"
  cat /tmp/slimy-dashboard.html || true
  exit 1
fi
if [[ "$dashboard_code" != "200" && "$dashboard_code" != "302" && "$dashboard_code" != "307" && "$dashboard_code" != "308" ]]; then
  log "FAIL: $dashboard_url (expected 200 or redirect, got $dashboard_code)"
  cat /tmp/slimy-dashboard.html || true
  exit 1
fi
if [[ ! -s /tmp/slimy-dashboard.html ]]; then
  log "FAIL: $dashboard_url (empty response body)"
  exit 1
fi
log "OK: admin-ui /dashboard (HTTP $dashboard_code)"

retry "admin-ui -> admin-api bridge /api/admin-api/health" "curl -fsS http://127.0.0.1:3001/api/admin-api/health >/dev/null" 60 2
retry "admin-ui -> admin-api bridge /api/admin-api/diag" "curl -fsS http://127.0.0.1:3001/api/admin-api/diag >/dev/null" 60 2
retry "admin-ui catch-all /api/admin-api/api/health" "curl -fsS http://127.0.0.1:3001/api/admin-api/api/health >/dev/null" 60 2
retry "admin-ui catch-all /api/admin-api/api/diag" "curl -fsS http://127.0.0.1:3001/api/admin-api/api/diag >/dev/null" 60 2

log ""
log "Checking admin-ui catch-all real endpoint..."
real_url="http://127.0.0.1:3001/api/admin-api/api/usage"
real_code="$(curl -sS -o /tmp/slimy-real-endpoint.json -w "%{http_code}" "$real_url")"
if [[ "$real_code" != "200" && "$real_code" != "401" ]]; then
  log "FAIL: $real_url (expected 200 or 401, got $real_code)"
  cat /tmp/slimy-real-endpoint.json || true
  exit 1
fi
if [[ ! -s /tmp/slimy-real-endpoint.json ]]; then
  log "FAIL: $real_url (empty response body)"
  exit 1
fi
log "OK: admin-ui catch-all /api/admin-api/api/usage (HTTP $real_code)"

log ""
log "Checking admin-ui catch-all protected endpoint..."
protected_url="http://127.0.0.1:3001/api/admin-api/api/auth/me"
protected_code="$(curl -sS -o /tmp/slimy-protected-endpoint.json -w "%{http_code}" "$protected_url")"
if [[ "$protected_code" != "200" && "$protected_code" != "401" ]]; then
  log "FAIL: $protected_url (expected 200 or 401, got $protected_code)"
  cat /tmp/slimy-protected-endpoint.json || true
  exit 1
fi
if [[ ! -s /tmp/slimy-protected-endpoint.json ]]; then
  log "FAIL: $protected_url (empty response body)"
  exit 1
fi
log "OK: admin-ui catch-all /api/admin-api/api/auth/me (HTTP $protected_code)"

log ""
log "=== admin-ui -> admin-api bridge responses ==="
if command -v jq >/dev/null 2>&1; then
  log "--- /api/admin-api/health ---"
  curl -fsS http://127.0.0.1:3001/api/admin-api/health | jq .
  log "--- /api/admin-api/diag ---"
  curl -fsS http://127.0.0.1:3001/api/admin-api/diag | jq .
  log "--- /api/admin-api/api/usage ---"
  jq . /tmp/slimy-real-endpoint.json || cat /tmp/slimy-real-endpoint.json
  log "--- /api/admin-api/api/auth/me ---"
  jq . /tmp/slimy-protected-endpoint.json || cat /tmp/slimy-protected-endpoint.json
else
  log "--- /api/admin-api/health ---"
  curl -fsS http://127.0.0.1:3001/api/admin-api/health
  log ""
  log "--- /api/admin-api/diag ---"
  curl -fsS http://127.0.0.1:3001/api/admin-api/diag
  log ""
  log "--- /api/admin-api/api/usage ---"
  cat /tmp/slimy-real-endpoint.json || true
  log ""
  log "--- /api/admin-api/api/auth/me ---"
  cat /tmp/slimy-protected-endpoint.json || true
fi

log ""
log "PASS: Docker baseline smoke test"
