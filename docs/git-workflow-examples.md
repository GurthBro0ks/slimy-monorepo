# Git Workflow Examples

This document provides concrete examples of common Git workflows for the Slimy.ai monorepo. Use these as templates for your daily development tasks.

## Table of Contents

- [Small Bug Fix](#small-bug-fix)
- [New Feature Development](#new-feature-development)
- [Emergency Hotfix](#emergency-hotfix)
- [Updating Your Branch](#updating-your-branch)
- [Resolving Merge Conflicts](#resolving-merge-conflicts)
- [Common Scenarios](#common-scenarios)

## Small Bug Fix

**Scenario**: You've discovered a bug in the user authentication flow that needs to be fixed.

### Step 1: Create a Bug Fix Branch

```bash
# Make sure you're on the latest main branch
git checkout main
git pull origin main

# Create a new branch for the bug fix
git checkout -b fix/auth-redirect-loop

# Verify you're on the new branch
git branch
```

### Step 2: Make Your Changes

Edit the necessary files to fix the bug. For example:

```bash
# Make changes to the authentication code
# Test your fix locally
cd apps/web
pnpm test
pnpm build
```

### Step 3: Commit Your Changes

```bash
# Check what files have changed
git status

# Add the changed files
git add apps/web/lib/auth.ts
git add apps/web/tests/unit/lib/auth.test.ts

# Commit with a descriptive message following conventional commits
git commit -m "$(cat <<'EOF'
fix(web): resolve infinite redirect loop in auth flow

The authentication middleware was causing an infinite redirect loop
when the session cookie was expired. Added proper session validation
and redirect logic to handle expired sessions gracefully.

Closes #456
EOF
)"
```

### Step 4: Push and Create a Pull Request

```bash
# Push your branch to the remote repository
git push -u origin fix/auth-redirect-loop

# Open a PR on GitHub using the Bug Fix template
# Fill in:
# - Issue: #456
# - Bug Description: Infinite redirect loop with expired sessions
# - Root Cause: Missing session validation
# - Solution: Added session checks before redirecting
# - Testing: Added unit test for expired session handling
```

### Step 5: Address Review Feedback

```bash
# Make requested changes
# ... edit files ...

# Add and commit the changes
git add .
git commit -m "fix(web): address PR feedback on session timeout handling"

# Push the new commit
git push

# The PR will automatically update
```

### Step 6: Merge and Clean Up

After approval and passing CI checks:

```bash
# Merge via GitHub UI (use "Squash and merge")

# Delete your local branch
git checkout main
git pull origin main
git branch -d fix/auth-redirect-loop

# Delete the remote branch (usually done automatically by GitHub)
git push origin --delete fix/auth-redirect-loop
```

---

## New Feature Development

**Scenario**: You're building a new analytics dashboard for the admin UI.

### Step 1: Create a Feature Branch

```bash
# Start from the latest main
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/analytics-dashboard

# Verify
git branch
```

### Step 2: Break Down the Work

For large features, make incremental commits:

```bash
# First, create the basic component structure
# ... create Dashboard.tsx ...

git add apps/admin-ui/components/analytics/Dashboard.tsx
git commit -m "feat(admin-ui): add basic Analytics Dashboard component structure"

# Next, add data fetching logic
# ... create hooks and API calls ...

git add apps/admin-ui/lib/hooks/useAnalytics.ts
git add apps/admin-ui/lib/api/analytics.ts
git commit -m "feat(admin-ui): implement analytics data fetching with useAnalytics hook"

# Then, add charts and visualizations
# ... add chart components ...

git add apps/admin-ui/components/analytics/ChartCard.tsx
git add apps/admin-ui/components/analytics/MetricsGrid.tsx
git commit -m "feat(admin-ui): add chart components and metrics grid to dashboard"

# Add tests
git add apps/admin-ui/tests/components/analytics/
git commit -m "test(admin-ui): add unit tests for analytics dashboard components"

# Update documentation
git add docs/features/analytics-dashboard.md
git commit -m "docs(admin-ui): document analytics dashboard usage and API"
```

### Step 3: Keep Your Branch Updated

While working on a long-running feature, regularly sync with main:

```bash
# Fetch the latest changes
git fetch origin main

# Rebase your branch on top of main
git rebase origin/main

# If there are conflicts, resolve them (see "Resolving Merge Conflicts" below)

# Force push your rebased branch (only do this on your own feature branches!)
git push --force-with-lease
```

### Step 4: Push and Create a Pull Request

```bash
# Push your completed feature
git push -u origin feature/analytics-dashboard

# Open a PR on GitHub using the Feature PR template
# Fill in all sections:
# - Overview: What the dashboard does
# - Motivation: Why we need it
# - Implementation: High-level architecture
# - Configuration: Any new env vars
# - Testing: What tests were added
# - Documentation: Link to docs
# - Screenshots: Before/after images of the UI
# - Performance: Any performance considerations
# - Security: Any security implications
```

### Step 5: Iterate Based on Feedback

```bash
# Pull the latest from your branch (in case reviews were done on GitHub)
git pull

# Make requested changes
# ... edit files ...

# Commit and push
git add .
git commit -m "feat(admin-ui): refactor chart rendering based on PR feedback"
git push

# Repeat until approved
```

### Step 6: Merge and Clean Up

```bash
# After approval, merge via GitHub (squash and merge)

# Update your local main and delete the feature branch
git checkout main
git pull origin main
git branch -d feature/analytics-dashboard
```

---

## Emergency Hotfix

**Scenario**: A critical security vulnerability has been discovered in production and needs immediate fixing.

### ⚠️ Important Notes for Server Hotfixes

- **Always push changes to GitHub ASAP** after deploying to the server
- Never leave server-only commits unpushed for extended periods
- Document the hotfix thoroughly in commit messages and incident reports

### Step 1: Assess the Situation

```bash
# SSH into the production server (if applicable)
ssh user@production-server

# OR work locally if the fix can be tested locally first
# Start from main
git checkout main
git pull origin main
```

### Step 2: Create a Hotfix Branch

```bash
# Create a hotfix branch with clear naming
git checkout -b hotfix/critical-auth-bypass

# Verify
git branch
```

### Step 3: Implement the Fix

```bash
# Make the minimal necessary changes to fix the issue
# ... edit files ...

# Test thoroughly in a staging environment if possible
cd apps/web
pnpm test
pnpm build

# If testing on production server, test carefully:
# - Make backup of current code
# - Test in isolated environment if possible
# - Have rollback plan ready
```

### Step 4: Commit the Hotfix

```bash
# Add the changes
git add apps/web/lib/auth.ts

# Commit with detailed explanation
git commit -m "$(cat <<'EOF'
fix(web): patch critical authentication bypass vulnerability

CRITICAL: Fixed authentication bypass that allowed unauthorized access
to admin endpoints by validating JWT signature before role checks.

Changes:
- Added JWT signature validation in auth middleware
- Moved role check after signature verification
- Added test case for malformed JWT tokens

Incident: INC-2024-001
Severity: Critical
Affected: Production since v2.1.0
EOF
)"
```

### Step 5: Deploy and Push Immediately

```bash
# If deploying directly to server:
# 1. Deploy the fix
# 2. Verify it works
# 3. IMMEDIATELY push to GitHub

# Push to remote repository
git push -u origin hotfix/critical-auth-bypass

# Create a PR immediately (even if merging without review in emergency)
# Use Bug Fix template and mark as [HOTFIX]
# Title: "[HOTFIX] Critical authentication bypass vulnerability"
```

### Step 6: Follow Up

```bash
# After immediate fix is deployed:
# 1. Create PR for code review (post-facto if necessary)
# 2. Notify team of the incident and fix
# 3. Schedule post-mortem meeting
# 4. Update security documentation
# 5. Consider if other systems are affected

# Merge the PR
# Delete the hotfix branch
git checkout main
git pull origin main
git branch -d hotfix/critical-auth-bypass
```

### Emergency Deployment Checklist

- [ ] Minimal change to fix the issue
- [ ] Tested in staging (if time permits)
- [ ] Backup of current production state
- [ ] Rollback plan prepared
- [ ] Fix deployed to production
- [ ] Fix verified working
- [ ] **Code pushed to GitHub immediately**
- [ ] Team notified
- [ ] PR created (even if post-merge)
- [ ] Incident documented
- [ ] Post-mortem scheduled

---

## Updating Your Branch

### Rebasing on Main

```bash
# Fetch the latest changes from remote
git fetch origin

# Option 1: Rebase (keeps linear history)
git checkout feature/my-feature
git rebase origin/main

# Option 2: Merge (preserves branch history)
git merge origin/main

# Push your updated branch
# If you rebased, you'll need --force-with-lease
git push --force-with-lease

# If you merged, regular push works
git push
```

### Pulling Changes from Your Own Branch

```bash
# If someone else pushed to your branch, or you worked from another machine
git checkout feature/my-feature
git pull origin feature/my-feature

# If you've rebased locally, you may need:
git pull --rebase origin feature/my-feature
```

---

## Resolving Merge Conflicts

### Scenario: Conflict During Rebase

```bash
# You're rebasing and encounter a conflict
git rebase origin/main

# Git will pause and show which files have conflicts
# Edit the conflicted files - look for conflict markers:
# <<<<<<< HEAD
# ... your changes ...
# =======
# ... incoming changes ...
# >>>>>>> main

# After resolving conflicts in each file:
git add path/to/resolved-file.ts

# Continue the rebase
git rebase --continue

# If you made a mistake and want to start over:
git rebase --abort

# After successful rebase, push
git push --force-with-lease
```

### Scenario: Conflict During Merge

```bash
# You're merging main into your branch and encounter conflicts
git merge origin/main

# Resolve conflicts in each file (remove conflict markers)
# Then add the resolved files
git add path/to/resolved-file.ts

# Commit the merge
git commit -m "merge: resolve conflicts with main"

# Push the merge commit
git push
```

---

## Common Scenarios

### Scenario: Forgot to Create a Branch

```bash
# You made changes directly on main (oops!)
# Don't commit yet!

# Create a new branch with your current changes
git checkout -b feature/my-forgotten-feature

# Your changes are now on the new branch
git add .
git commit -m "feat(web): add feature I forgot to branch for"
git push -u origin feature/my-forgotten-feature

# Clean up main
git checkout main
git reset --hard origin/main
```

### Scenario: Need to Update Commit Message

```bash
# Last commit only (not yet pushed)
git commit --amend -m "feat(web): corrected commit message"

# If already pushed, you'll need:
git push --force-with-lease

# For older commits (more complex):
git rebase -i HEAD~3  # Interactive rebase for last 3 commits
# Change "pick" to "reword" for commits you want to change
# Save and close, then edit each message
```

### Scenario: Made Commit on Wrong Branch

```bash
# You committed to main instead of a feature branch
git log  # Note the commit hash

# Create the correct branch with the commit
git checkout -b feature/correct-branch

# Go back to main and remove the commit
git checkout main
git reset --hard HEAD~1  # Removes last commit

# Push the feature branch
git checkout feature/correct-branch
git push -u origin feature/correct-branch
```

### Scenario: Need to Temporarily Save Work

```bash
# You need to switch branches but don't want to commit yet
git stash save "WIP: working on dashboard component"

# Switch branches and do other work
git checkout other-branch
# ... do work ...

# Come back and restore your work
git checkout feature/dashboard
git stash list  # See all stashes
git stash pop   # Restore most recent stash

# Or restore a specific stash
git stash apply stash@{1}
```

### Scenario: Accidentally Deleted a Branch

```bash
# Find the commit hash of the deleted branch
git reflog

# Look for the commit that was at the tip of the branch
# Create a new branch from that commit
git checkout -b recovered-branch <commit-hash>
```

### Scenario: Pull Request Needs Updates After Force Push to Main

```bash
# Main was force-pushed (rare, but happens)
# Your PR now has conflicts

# Fetch the latest
git fetch origin

# Reset your branch to start from new main
git checkout feature/my-feature
git rebase origin/main

# Resolve any conflicts
# Then force push your branch
git push --force-with-lease
```

---

## Best Practices Summary

1. **Always create a branch** before making changes
2. **Commit often** with clear, descriptive messages
3. **Keep branches up to date** by regularly rebasing on main
4. **Test before pushing** - run lints, tests, and builds
5. **Push to GitHub ASAP** - especially for hotfixes
6. **Use meaningful branch names** that describe the work
7. **Never force push to main** - only to your own feature branches
8. **Delete merged branches** to keep the repository clean
9. **Review your own changes** before requesting reviews from others
10. **Document emergency changes** thoroughly for future reference

---

## Getting Help

If you encounter issues with Git workflows:

1. Check Git status and read error messages carefully: `git status`
2. Review this guide for similar scenarios
3. Ask a team member for help
4. Create an issue in the repository for workflow improvements

For more information, see:
- [CONTRIBUTING.md](../CONTRIBUTING.md) - General contribution guidelines
- [Code Style Guide](code-style-guide.md) - Coding conventions
