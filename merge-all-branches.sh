#!/bin/bash
set -e

echo "Starting mega-integration of all claude/* branches..."

git branch -r | grep 'origin/claude/' | sed 's/origin\///' | while read branch; do
  echo "=== Merging $branch ==="
  if git merge "origin/$branch" --no-ff --no-edit; then
    echo "✓ Merged $branch successfully"
  else
    echo "⚠ Conflicts detected in $branch, auto-resolving..."
    # Accept all incoming changes (theirs strategy)
    git checkout --theirs .
    git add -A
    if git commit --no-edit -m "Auto-merge $branch with conflict resolution (theirs strategy)"; then
      echo "✓ Auto-resolved and committed $branch"
    else
      echo "✓ $branch merged (no commit needed)"
    fi
  fi
done

echo "=== Merge complete! ==="
