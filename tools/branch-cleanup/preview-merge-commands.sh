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
import yaml, json

catalog = Path('docs/branch-plan/BRANCH_CATALOG.yaml')
data = yaml.safe_load(catalog.read_text())
canonical = data.get('canonical_foundation_branch')
canonical_short = canonical.replace('origin/','',1) if canonical and canonical.startswith('origin/') else canonical
branches = data.get('branches', [])
triage_path = Path('docs/branch-plan/KEEP_REVIEW_TRIAGE_CACHE.json')
triage_data = json.loads(triage_path.read_text()) if triage_path.exists() else None

print("echo '=== Slimy.ai Branch Cleanup – Merge Preview (no git commands executed) ==='")

printed = False
for b in branches:
    if b.get('suggested_action') != 'CANDIDATE_MERGE':
        continue
    printed = True
    short = b.get('short_name') or b.get('name')
    category = b.get('category', 'unknown')
    ahead = b.get('ahead_of_canonical', b.get('ahead')) or 0
    behind = b.get('behind_canonical', b.get('behind')) or 0
    print(f"# candidate merge: {short} (category={category}, ahead={ahead}, behind={behind})")
    print(f"echo \"git checkout {canonical_short} && git pull && git merge --no-ff {short} && echo 'Merged {short} into {canonical_short}'\"")
    print()
if not printed:
    print("echo 'No CANDIDATE_MERGE branches recorded in catalog.'")

print()

if not triage_data:
    print("echo 'Triage cache docs/branch-plan/KEEP_REVIEW_TRIAGE_CACHE.json not found; run the KEEP_REVIEW triage step.'")
else:
    triage_merges = [b for b in triage_data.get('branches', []) if b.get('triage_decision') == 'TRIAGE_MERGE_SMALL_FEATURE']
    if not triage_merges:
        print("echo 'No TRIAGE_MERGE_SMALL_FEATURE suggestions found in triage cache.'")
    else:
        print("echo '--- TRIAGE_MERGE_SMALL_FEATURE suggestions ---'")
        for b in triage_merges:
            short = b.get('short_name') or b.get('name')
            print(f"# TRIAGE_MERGE_SMALL_FEATURE: {short}")
            print(f"echo \"git checkout {canonical_short} && git pull && git merge --no-ff {short}\"")
            print()
PY
