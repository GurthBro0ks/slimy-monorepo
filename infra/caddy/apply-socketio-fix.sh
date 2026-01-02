#!/bin/bash
# Apply Socket.IO route fix to Caddyfile
# Run this script with: sudo ./apply-socketio-fix.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/Caddyfile.admin-socketio-fix"
TARGET_FILE="/etc/caddy/Caddyfile"
BACKUP_FILE="/etc/caddy/Caddyfile.bak-$(date +%Y%m%d-%H%M%S)"

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "ERROR: Source file not found: $SOURCE_FILE"
  exit 1
fi

echo "Backing up current Caddyfile to $BACKUP_FILE..."
cp "$TARGET_FILE" "$BACKUP_FILE"

echo "Copying new Caddyfile..."
cp "$SOURCE_FILE" "$TARGET_FILE"

echo "Validating Caddy config..."
if caddy validate --config "$TARGET_FILE" 2>/dev/null; then
  echo "Config valid. Reloading Caddy..."
  systemctl reload caddy
  echo "Done! Socket.IO route fix applied."
else
  echo "ERROR: Config validation failed! Restoring backup..."
  cp "$BACKUP_FILE" "$TARGET_FILE"
  exit 1
fi
