#!/usr/bin/env bash
set -euo pipefail

ROOT_ENV_FILE="/opt/slimy/secrets/.env.db.slimy-nuc2"
ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"

if [[ -z "$ROOT_PASSWORD" ]]; then
  if [[ -f "$ROOT_ENV_FILE" ]]; then
    ROOT_PASSWORD=$(grep -E '^MYSQL_ROOT_PASSWORD=' "$ROOT_ENV_FILE" | head -n1 | cut -d'=' -f2-)
  elif [[ -f .env ]]; then
    ROOT_PASSWORD=$(grep -E '^MYSQL_ROOT_PASSWORD=' .env | head -n1 | cut -d'=' -f2-)
  fi
fi

if [[ -z "$ROOT_PASSWORD" ]]; then
  echo "MYSQL_ROOT_PASSWORD not found. Export it or add it to $ROOT_ENV_FILE" >&2
  exit 1
fi

SQL=$(cat <<'SQL'
GRANT ALL PRIVILEGES ON `prisma_migrate_shadow_db_%`.* TO 'slimy'@'%';
GRANT ALL PRIVILEGES ON `slimyai_%`.* TO 'slimy'@'%';
FLUSH PRIVILEGES;
SQL
)

docker exec -i slimy-db mysql -uroot -p"$ROOT_PASSWORD" -e "$SQL"

echo "✅ Permissions updated. User 'slimy' can now create Prisma shadow databases."
