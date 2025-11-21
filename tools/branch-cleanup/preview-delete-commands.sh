#!/usr/bin/env bash
# Slimy.ai branch cleanup – PREVIEW ONLY
# This script reads docs/branch-plan/BRANCH_CATALOG.yaml and prints suggested delete commands.
# It NEVER runs git branch -d or git push --delete for you.
# Review each branch carefully, delete only a few at a time, and re-run the script afterward.

set -euo pipefail

CATALOG="docs/branch-plan/BRANCH_CATALOG.yaml"
if [[ ! -f "$CATALOG" ]]; then
  echo "Catalog $CATALOG is missing. Run the planning step first." >&2
  exit 1
fi

python3 - <<'PY'
from pathlib import Path
import yaml
catalog = Path('docs/branch-plan/BRANCH_CATALOG.yaml')
data = yaml.safe_load(catalog.read_text())
branches = data.get('branches', [])
candidates = [b for b in branches if b.get('suggested_action') == 'CANDIDATE_DELETE']
if not candidates:
    print("echo 'No candidate delete branches in catalog.'")
else:
    print("echo '=== Slimy.ai Branch Cleanup – Delete Preview (no actions executed) ==='")
    for b in candidates:
        short = b.get('short_name') or b.get('name')
        category = b.get('category', 'unknown')
        age = b.get('last_commit_age_days')
        age_txt = f"{age}" if age is not None else '?'
        print(f"# candidate delete: {short} (category={category}, age={age_txt} days)")
        print(f"echo \"git push origin --delete {short} && git branch -D {short}\"")
        print()
PY
