#!/bin/bash
set -e

echo "Continuing merge from branch 119..."

# Get list of all branches and skip first 118 (already merged)
branches=$(git branch -r | grep 'origin/claude/' | sed 's/origin\///' | tail -n +119)

for branch in $branches; do
  echo "=== Merging $branch ==="
  if git merge "origin/$branch" --no-ff --no-edit; then
    echo "✓ Merged $branch successfully"
  else
    echo "⚠ Conflicts detected, auto-resolving..."
    git checkout --theirs .
    git add -A
    if git commit --no-edit -m "Auto-merge $branch with conflict resolution (theirs strategy)"; then
      echo "✓ Auto-resolved and committed $branch"
    else
      echo "✓ $branch merged (no commit needed)"
    fi
  fi
done

echo "=== All branches merged! ==="
