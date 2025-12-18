#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

log() { printf '%s\n' "$*"; }

ENV_FILE="${ENV_FILE:-.env.local}"

compose() {
  if [[ -f "$ENV_FILE" ]]; then
    docker compose --env-file "$ENV_FILE" "$@"
  else
    docker compose "$@"
  fi
}

if [[ ! -f docker-compose.yml ]]; then
  log "ERROR: docker-compose.yml not found (run from repo root)"
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  log "ERROR: docker not found"
  exit 2
fi

if ! docker info >/dev/null 2>&1; then
  log "ERROR: docker daemon not reachable"
  exit 2
fi

log "Applying admin-api Prisma migrations (docker)..."

# Ensure required services are up (no rebuild; use `docker compose up -d --build` separately if needed).
compose up -d db admin-api >/dev/null

# Retry a few times to handle "db not ready yet" on fresh boots.
attempts=30
for ((i = 1; i <= attempts; i++)); do
  if compose exec -T admin-api sh -lc 'cd /app/apps/admin-api && pnpm -s prisma migrate deploy'; then
    log "OK: admin-api Prisma migrations applied"
    exit 0
  fi
  log "Retrying migrations (${i}/${attempts})..."
  sleep 2
done

log "ERROR: prisma migrate deploy did not succeed after ${attempts} attempts"
exit 1
