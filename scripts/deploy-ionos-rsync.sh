#!/bin/bash
# deploy-ionos-rsync.sh — Rsync-based deployment to IONOS for slimyai.xyz
#
# Usage:
#   ./scripts/deploy-ionos-rsync.sh [--dry-run]
#
# Prerequisites:
#   - SSH key configured for IONOS server
#   - IONOS_HOST env var (or defaults to slimyai.xyz)
#   - IONOS_USER env var (or defaults to root)
#   - IONOS_WEB_DIR env var (or defaults to /opt/slimy/web)
#   - Next.js standalone build in apps/web/.next/standalone

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"

# Configuration — override via env vars
IONOS_HOST="${IONOS_HOST:-slimyai.xyz}"
IONOS_USER="${IONOS_USER:-root}"
IONOS_WEB_DIR="${IONOS_WEB_DIR:-/opt/slimy/web}"
IONOS_PORT="${IONOS_PORT:-22}"

DRY_RUN=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
  echo "[DRY RUN] No files will be transferred."
fi

echo "=== IONOS Rsync Deploy ==="
echo "Host:   $IONOS_USER@$IONOS_HOST:$IONOS_PORT"
echo "Target: $IONOS_WEB_DIR"
echo ""

# Step 1: Build the web app
echo "[1/4] Building Next.js standalone..."
cd "$WEB_DIR"
if [ ! -f "package.json" ]; then
  echo "ERROR: apps/web/package.json not found" >&2
  exit 1
fi

pnpm run build 2>&1 | tail -5
echo "Build complete."

# Step 2: Verify standalone output exists
if [ ! -d ".next/standalone" ]; then
  echo "ERROR: .next/standalone not found — ensure output: 'standalone' in next.config" >&2
  exit 1
fi

# Step 3: Rsync to IONOS
echo ""
echo "[2/4] Syncing standalone build to IONOS..."
rsync -avz --delete $DRY_RUN \
  -e "ssh -p $IONOS_PORT -o StrictHostKeyChecking=accept-new" \
  .next/standalone/ \
  "$IONOS_USER@$IONOS_HOST:$IONOS_WEB_DIR/standalone/"

echo ""
echo "[3/4] Syncing static assets and public..."
rsync -avz --delete $DRY_RUN \
  -e "ssh -p $IONOS_PORT -o StrictHostKeyChecking=accept-new" \
  .next/static/ \
  "$IONOS_USER@$IONOS_HOST:$IONOS_WEB_DIR/standalone/.next/static/"

if [ -d "public" ]; then
  rsync -avz --delete $DRY_RUN \
    -e "ssh -p $IONOS_PORT -o StrictHostKeyChecking=accept-new" \
    public/ \
    "$IONOS_USER@$IONOS_HOST:$IONOS_WEB_DIR/standalone/public/"
fi

# Step 4: Restart the service on IONOS
if [[ -z "$DRY_RUN" ]]; then
  echo ""
  echo "[4/4] Restarting web service on IONOS..."
  ssh -p "$IONOS_PORT" "$IONOS_USER@$IONOS_HOST" \
    "cd $IONOS_WEB_DIR && (systemctl restart slimyai-web 2>/dev/null || (cd standalone && PORT=3000 node server.js &))"
  echo "Service restarted."
else
  echo ""
  echo "[4/4] Skipped restart (dry-run mode)."
fi

echo ""
echo "=== Deploy complete ==="
echo "Verify: curl -sI https://$IONOS_HOST/dashboard/supersnail"
