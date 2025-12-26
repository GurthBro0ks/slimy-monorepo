#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FILE="$ROOT/CONTINUITY.md"

if [[ ! -f "$FILE" ]]; then
  echo "[FAIL] missing CONTINUITY.md at repo root"
  exit 2
fi

required_headings=(
  "# CONTINUITY LEDGER"
  "## Goal (success criteria)"
  "## Constraints / Non-negotiables"
  "## Key decisions"
  "## State"
  "### Done"
  "### Now"
  "### Next"
  "## Open questions (UNCONFIRMED if needed)"
  "## Working set (files/ids/commands)"
)

missing=0
for h in "${required_headings[@]}"; do
  if ! grep -qFx "$h" "$FILE"; then
    echo "[FAIL] missing heading: $h"
    missing=1
  fi
done

if [[ "$missing" == "1" ]]; then
  exit 1
fi

extract_between() {
  local start_regex="$1"
  local end_regex="$2"
  awk -v start="$start_regex" -v end="$end_regex" '
    $0 ~ start {p=1; next}
    p && $0 ~ end {exit}
    p {print}
  ' "$FILE" | sed -e '/^[[:space:]]*$/d'
}

echo "[PASS] CONTINUITY.md present + headings OK"
echo
echo "[info] snapshot (Goal / Now / Next / Open questions)"
echo
echo "Goal:"
extract_between '^## Goal \\(success criteria\\)$' '^## '
echo
echo "Now:"
extract_between '^### Now$' '^### Next$'
echo
echo "Next:"
extract_between '^### Next$' '^## '
echo
echo "Open questions:"
extract_between '^## Open questions \\(UNCONFIRMED if needed\\)$' '^## '
