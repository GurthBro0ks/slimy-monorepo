#!/usr/bin/env bash
# WARNING: Preview only. This script just ECHOS merge review commands.
# Copy-paste the commands you actually want to run after reviewing diff & tests.

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
canonical = data.get('canonical_foundation_branch')
canonical_short = canonical.replace('origin/','',1) if canonical and canonical.startswith('origin/') else canonical
branches = data.get('branches', [])
print("echo '=== Slimy.ai Branch Cleanup – Merge Preview (no git commands executed) ==='")
printed = False
for b in branches:
    if b.get('suggested_action') != 'CANDIDATE_MERGE':
        continue
    printed = True
    short = b.get('short_name') or b.get('name')
    category = b.get('category', 'unknown')
    ahead = b.get('ahead_of_canonical', 0)
    behind = b.get('behind_canonical', 0)
    print(f"# candidate merge: {short} (category={category}, ahead={ahead}, behind={behind})")
    print(f"echo \"git checkout {canonical_short} && git pull && git merge --no-ff {short} && echo 'Merged {short} into {canonical_short}'\"")
    print()
if not printed:
    print("echo 'No CANDIDATE_MERGE branches recorded in catalog.'")
PY
