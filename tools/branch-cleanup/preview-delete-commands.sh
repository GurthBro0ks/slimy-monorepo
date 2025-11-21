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
import yaml, json

catalog = Path('docs/branch-plan/BRANCH_CATALOG.yaml')
data = yaml.safe_load(catalog.read_text())
branches = data.get('branches', [])
candidates = [b for b in branches if b.get('suggested_action') == 'CANDIDATE_DELETE']
triage_path = Path('docs/branch-plan/KEEP_REVIEW_TRIAGE_CACHE.json')
triage_data = json.loads(triage_path.read_text()) if triage_path.exists() else None

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

print()

if not triage_data:
    print("echo 'Triage cache docs/branch-plan/KEEP_REVIEW_TRIAGE_CACHE.json not found; run the KEEP_REVIEW triage step.'")
else:
    triage_deletes = [b for b in triage_data.get('branches', []) if b.get('triage_decision') in ('TRIAGE_DELETE_SAFE_DOCS', 'TRIAGE_DELETE_SAFE_TESTS')]
    if not triage_deletes:
        print("echo 'No TRIAGE_DELETE_SAFE_DOCS/TESTS suggestions found in triage cache.'")
    else:
        print("echo '--- TRIAGE_DELETE_SAFE_DOCS/TESTS suggestions ---'")
        for b in triage_deletes:
            short = b.get('short_name') or b.get('name')
            decision = b.get('triage_decision')
            print(f"# {decision}: {short}")
            print(f"echo \"git push origin --delete {short} && git branch -D {short}\"")
            print()
PY
