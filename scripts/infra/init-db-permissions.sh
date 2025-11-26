#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${DB_CONTAINER_NAME:-slimy-db}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-${DATABASE_PASSWORD:-super-secret-app-password}}"
ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-${DB_ROOT_PASSWORD:-$APP_DB_PASSWORD}}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Container $CONTAINER_NAME is not running; start it before applying permissions." >&2
  exit 1
fi

SQL=$(cat <<SQL
CREATE DATABASE IF NOT EXISTS slimyai_prod;
CREATE USER IF NOT EXISTS 'slimy'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON slimyai_prod.* TO 'slimy'@'%';
FLUSH PRIVILEGES;
SQL
)

docker exec -i "$CONTAINER_NAME" mysql -uroot -p"$ROOT_PASSWORD" -e "$SQL"
