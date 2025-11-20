# Reviewer Bot Workflow

This document explains how to use the local reviewer bot workflow to get AI-assisted code reviews for your changes.

## Overview

The reviewer bot workflow is a **local, manual process** that helps you collect code changes and submit them to an AI assistant (like Claude) for review. It is **not** automated CI - you run the scripts yourself and manually interact with the AI.

## Prerequisites

- Git repository with committed changes on a feature branch
- Access to an AI assistant (Claude, ChatGPT, etc.)
- Bash shell environment

## Workflow Steps

### Step 1: Collect Your Diff

Run the `collect-diff.sh` script to generate a diff file:

```bash
# From the repository root
./tools/reviewer-bot/collect-diff.sh
```

**Options:**

```bash
# Compare against a specific base ref (default is origin/main)
./tools/reviewer-bot/collect-diff.sh origin/develop

# Or any other ref
./tools/reviewer-bot/collect-diff.sh main
```

**Output:**

The script will save your diff to `tools/reviewer-bot/latest.diff` and print the file path.

**Tips:**

- Make sure you've fetched the latest changes: `git fetch origin`
- Ensure your changes are committed (the script compares committed changes)
- If the diff is empty, you may be comparing the wrong refs or have no changes

### Step 2: Prepare the Review Prompt

1. Open the template file:
   ```bash
   cat tools/reviewer-bot/REVIEW_PROMPT_TEMPLATE.md
   ```

2. Copy the entire template content

3. Open your generated diff:
   ```bash
   cat tools/reviewer-bot/latest.diff
   ```

4. Replace the placeholder `[PASTE THE CONTENTS OF latest.diff HERE]` in the template with your actual diff content

### Step 3: Submit to AI for Review

1. Open your AI assistant interface (Claude, ChatGPT, etc.)

2. Paste the complete prompt (template + diff) into a new conversation

3. Wait for the AI to analyze the changes and provide feedback

### Step 4: Review the Feedback

The AI will structure its response with:

- **Summary** - Overview of changes
- **Critical Issues** - Must-fix problems (security, bugs)
- **Recommendations** - Suggested improvements
- **Positive Observations** - What was done well
- **Questions** - Clarifications needed

### Step 5: Capture and Act on Feedback

**Recommended approach:**

1. **Save the review** - Copy the AI's feedback to a file or your PR description
   ```bash
   # Example: save to a review notes file
   echo "Review feedback from $(date)" > review-notes.md
   # Then paste the AI feedback
   ```

2. **Address critical issues** - Fix security vulnerabilities and bugs immediately

3. **Consider recommendations** - Evaluate suggested improvements and implement what makes sense

4. **Document decisions** - If you choose not to implement a suggestion, document why

5. **Re-run the workflow** - After making changes, you can run the workflow again to verify fixes

## Example: Complete Workflow

```bash
# 1. Ensure you're on your feature branch with committed changes
git checkout feature/my-new-feature
git status  # Verify changes are committed

# 2. Fetch latest from origin
git fetch origin

# 3. Generate the diff
./tools/reviewer-bot/collect-diff.sh origin/main

# 4. View the template
cat tools/reviewer-bot/REVIEW_PROMPT_TEMPLATE.md

# 5. View your diff
cat tools/reviewer-bot/latest.diff

# 6. Copy both, merge them, and paste into Claude/ChatGPT

# 7. Save the review feedback
# (Manually copy the AI response and save it)

# 8. Address the feedback
# (Make code changes as needed)

# 9. Optionally re-review
git add .
git commit -m "Address review feedback"
./tools/reviewer-bot/collect-diff.sh origin/main
# Repeat the review process
```

## Tips and Best Practices

### For Better Reviews

- **Small, focused changes** - Smaller diffs get better reviews
- **Clear commit messages** - Help the AI understand intent
- **Include context** - Add notes about what you're trying to achieve
- **Ask specific questions** - You can customize the template with specific concerns

### Managing Large Diffs

If your diff is very large (>1000 lines):

1. Consider reviewing in chunks - create multiple smaller branches
2. Focus the AI on specific areas by editing the template
3. Break the review into multiple sessions

### Integrating with Your Workflow

- **Before opening a PR** - Run the review to catch issues early
- **After addressing PR comments** - Verify fixes with another review
- **For architectural changes** - Use the review to validate design decisions
- **Learning tool** - Study the feedback to improve your coding practices

## Troubleshooting

### "Error: Base ref does not exist"

**Solution:** Run `git fetch origin` to ensure you have the latest refs

### "Warning: No changes detected"

**Causes:**
- You're comparing the same refs
- No changes have been committed
- You're on the base branch itself

**Solution:** Verify you're on the correct branch with `git status` and that changes are committed

### Diff is too large for AI

**Solution:**
- Break changes into smaller commits/branches
- Review critical files first
- Use file filtering: `git diff origin/main...HEAD -- path/to/specific/file.ts`

### AI gives generic feedback

**Solution:**
- Add more context to your prompt about what you changed and why
- Ask specific questions in the template
- Include relevant background from PR description or issue

## Files Reference

- **Script:** `tools/reviewer-bot/collect-diff.sh`
- **Template:** `tools/reviewer-bot/REVIEW_PROMPT_TEMPLATE.md`
- **Output:** `tools/reviewer-bot/latest.diff` (generated, git-ignored)
- **This doc:** `docs/reviewer-bot-workflow.md`

## Future Enhancements

This is a simple, manual workflow. Potential improvements:

- Script to automatically merge template + diff
- Integration with PR workflows (automated comments)
- Support for incremental reviews (only changed files since last review)
- Local LLM integration for offline reviews
- Review history tracking

For now, the manual approach keeps things simple and gives you full control over the review process.
