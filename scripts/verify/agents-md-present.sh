#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

required_files=(
  "AGENTS.md"
  "CONTINUITY.md"
  "apps/admin-ui/AGENTS.md"
  "apps/admin-api/AGENTS.md"
  "apps/web/AGENTS.md"
  "apps/bot/AGENTS.md"
  "packages/AGENTS.md"
  "scripts/AGENTS.md"
  "docs/AGENTS.md"
)

missing=()
for rel in "${required_files[@]}"; do
  if [[ ! -f "$ROOT/$rel" ]]; then
    missing+=("$rel")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "[FAIL] missing required repo rule files:"
  for rel in "${missing[@]}"; do
    echo "- $rel"
  done
  exit 1
fi

echo "[PASS] required AGENTS.md + CONTINUITY.md files present (${#required_files[@]})"

