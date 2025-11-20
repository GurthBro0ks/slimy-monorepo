# Changelog Generator

A simple tool to generate changelogs from git commit history using conventional commit formatting.

## Overview

This tool reads git commit history and automatically groups commits by their conventional commit prefix (feat, fix, chore, docs, etc.), then outputs a formatted markdown changelog.

## Usage

### Basic Usage

Generate a changelog for all commits:

```bash
./tools/changelog/generate-changelog.sh
```

### Generate Changelog Since a Tag

Generate a changelog for commits since a specific git tag:

```bash
./tools/changelog/generate-changelog.sh v1.0.0
```

### Generate Changelog for Recent Commits

Generate a changelog for the last N commits:

```bash
./tools/changelog/generate-changelog.sh HEAD~20
```

### Generate Changelog Between Two Refs

Generate a changelog between any two git references:

```bash
./tools/changelog/generate-changelog.sh origin/main
```

## Output

The script generates a file at `tools/changelog/LATEST_CHANGELOG.md` with the following structure:

- **Features** - New features (commits starting with `feat:`)
- **Bug Fixes** - Bug fixes (commits starting with `fix:`)
- **Performance Improvements** - Performance improvements (commits starting with `perf:`)
- **Refactoring** - Code refactoring (commits starting with `refactor:`)
- **Documentation** - Documentation changes (commits starting with `docs:`)
- **Tests** - Test changes (commits starting with `test:`)
- **Build System** - Build system changes (commits starting with `build:`)
- **CI/CD** - CI/CD changes (commits starting with `ci:`)
- **Chores** - Maintenance tasks (commits starting with `chore:`)
- **Style Changes** - Code style changes (commits starting with `style:`)
- **Reverts** - Reverted commits (commits starting with `revert:`)
- **Other Changes** - Commits that don't follow conventional commit format

Each entry includes the commit message and short hash for reference.

## Conventional Commit Format

This tool expects commits to follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[(optional scope)]: <description>
```

Examples:
- `feat: add user authentication`
- `fix(api): resolve null pointer exception`
- `docs: update installation guide`
- `chore(deps): bump lodash from 4.17.19 to 4.17.21`

## How to Use the Generated Changelog

After running the script:

1. **Review the output:**
   ```bash
   cat tools/changelog/LATEST_CHANGELOG.md
   ```

2. **Copy to GitHub Release:**
   - Go to your repository's Releases page
   - Click "Draft a new release"
   - Paste the contents of `LATEST_CHANGELOG.md` into the description
   - You can use the template from `generate-changelog-template.md` as a starting point

3. **Manually merge into existing CHANGELOG.md:**
   ```bash
   # Review the generated changelog
   cat tools/changelog/LATEST_CHANGELOG.md

   # Manually copy relevant sections into your project's CHANGELOG.md
   # (This tool intentionally does NOT modify existing CHANGELOG.md files)
   ```

4. **Include in release documentation:**
   - Copy sections into release notes
   - Add to project documentation
   - Share with team members

## Examples

### Example 1: Release Changelog

```bash
# Assuming your last release was tagged as v1.2.0
./tools/changelog/generate-changelog.sh v1.2.0

# Review the output
cat tools/changelog/LATEST_CHANGELOG.md

# Copy the relevant sections to your new v1.3.0 release notes
```

### Example 2: Sprint Summary

```bash
# Generate changelog for the last 2 weeks of commits (approximately)
./tools/changelog/generate-changelog.sh HEAD~50

# Use the output for sprint review or team updates
cat tools/changelog/LATEST_CHANGELOG.md
```

### Example 3: Feature Branch Review

```bash
# While on a feature branch, compare against main
git checkout feature/new-dashboard
./tools/changelog/generate-changelog.sh origin/main

# Review what changes this branch introduces
cat tools/changelog/LATEST_CHANGELOG.md
```

## Tips

- **Commit Message Quality:** The quality of your changelog depends on the quality of your commit messages. Use clear, descriptive conventional commit messages.
- **Scope Labels:** Use scope labels in commits (e.g., `feat(auth):`, `fix(api):`) for more granular categorization.
- **Cleanup:** The generated `LATEST_CHANGELOG.md` is meant to be a working file. Review and edit it before publishing.
- **Version Tags:** Tag your releases consistently (e.g., `v1.0.0`, `v1.1.0`) to make it easy to generate changelogs between versions.

## Troubleshooting

**Error: Not in a git repository**
- Make sure you're running the script from within a git repository

**Error: Base ref 'X' not found**
- Verify the tag or commit reference exists: `git tag` or `git log --oneline`

**Empty changelog generated**
- Check if there are commits in the specified range: `git log <base-ref>..HEAD`
- Verify your commits follow the conventional commit format

## See Also

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [generate-changelog-template.md](./generate-changelog-template.md) - GitHub release template
