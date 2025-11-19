# Release Process

This document describes how to cut releases, tag versions, and communicate changes for the Slimy.ai monorepo once the codebase reaches a stable state.

## Versioning Strategy

We follow a **semantic-ish versioning** approach adapted for our current beta/pre-1.0 phase:

- **Format**: `v0.MINOR.PATCH`
- **Pre-1.0 (current phase)**: `v0.x.y`
  - `MINOR` increments for new features, significant changes, or breaking API changes
  - `PATCH` increments for bug fixes, small improvements, and non-breaking changes
- **Post-1.0 (future)**: Traditional semantic versioning `vMAJOR.MINOR.PATCH`
  - `MAJOR` for breaking changes
  - `MINOR` for new features (backward compatible)
  - `PATCH` for bug fixes (backward compatible)

### Version Numbering Examples

- `v0.1.0` – Initial beta release
- `v0.1.1` – Bug fix on top of v0.1.0
- `v0.2.0` – New feature or significant change
- `v1.0.0` – First stable production release (future)

---

## Release Workflow

### 1. Preparing for a Release

Before cutting a release, ensure the codebase is in a releasable state:

1. **All CI checks pass**
   - Navigate to the [GitHub Actions page](../../.github/workflows/)
   - Verify `test.yml` and any other relevant workflows are green on `main`
   - Address any failing tests or linting issues

2. **Code review complete**
   - All pull requests merged into `main` should be reviewed and approved
   - No outstanding blocking issues or critical bugs

3. **Local testing**
   - Verify apps build successfully: `pnpm build`
   - Run test suites: `pnpm test`
   - Test critical user flows in local/staging environment

### 2. Cutting a Release Branch

Release branches provide a stable snapshot for final verification and hotfixes:

```bash
# Ensure you're on the latest main
git checkout main
git pull origin main

# Create a release branch (use next version number)
git checkout -b release/v0.x.0

# Push the release branch
git push -u origin release/v0.x.0
```

**Naming convention**: `release/vX.Y.Z` (e.g., `release/v0.2.0`)

### 3. Tagging a Release

Once the release branch is verified and ready:

```bash
# Ensure you're on the release branch
git checkout release/v0.x.0

# Create an annotated tag with release notes summary
git tag -a v0.x.0 -m "Release v0.x.0

- Feature: Add user authentication
- Feature: Implement snail tracking dashboard
- Fix: Resolve database connection pooling issue
- Docs: Update deployment guide"

# Push the tag to GitHub
git push origin v0.x.0
```

**Important**: Use **annotated tags** (`-a`) for releases, not lightweight tags. Annotated tags include metadata like tagger name, date, and message.

### 4. Merging Back to Main

After tagging, merge the release branch back to `main`:

```bash
git checkout main
git merge --no-ff release/v0.x.0 -m "Merge release v0.x.0"
git push origin main

# Optionally delete the release branch after merge
git branch -d release/v0.x.0
git push origin --delete release/v0.x.0
```

---

## Preparing Release Notes

### Changelog

If a `CHANGELOG.md` file exists in the repository root:

1. Add a new section at the top for the release version
2. Organize changes by category:
   - **Added** – new features
   - **Changed** – changes to existing functionality
   - **Deprecated** – features marked for removal
   - **Removed** – features removed in this release
   - **Fixed** – bug fixes
   - **Security** – security-related changes

**Example**:

```markdown
## [0.2.0] - 2025-11-19

### Added
- User authentication with Discord OAuth
- Snail tracking dashboard in admin-ui

### Fixed
- Database connection pooling timeout issues
- Memory leak in websocket connections

### Changed
- Updated admin API to use JWT tokens instead of sessions
```

### Discord Announcement Template

Use this template to announce releases in the team/community Discord:

```
🚀 **Release v0.x.0 is live!**

**What's New:**
- ✨ [Feature]: Brief description
- 🐛 [Fix]: Brief description
- 📚 [Docs]: Brief description

**Deployment Status:**
- ✅ Production NUCs updated
- ✅ Web app restarted and verified
- ✅ Admin API health checks passing

**Breaking Changes:** [None / List any breaking changes]

**Migration Notes:** [Any required actions for users/admins]

Full release notes: [Link to GitHub release or changelog]
```

Customize the emoji and formatting based on your Discord server's preferences.

---

## Release Checklist

Use this checklist for every release to ensure consistency and completeness:

### Pre-Release

- [ ] All CI workflows pass (`.github/workflows/test.yml`, etc.)
- [ ] Code review completed for all merged PRs
- [ ] Local build and tests successful (`pnpm build && pnpm test`)
- [ ] Critical user flows tested in staging/local environment
- [ ] Breaking changes documented (if any)
- [ ] Migration guide prepared (if needed)

### Release Branch & Tagging

- [ ] Create release branch: `release/vX.Y.Z`
- [ ] Update version numbers in relevant `package.json` files (if applicable)
- [ ] Update `CHANGELOG.md` with release notes (if file exists)
- [ ] Create annotated git tag: `vX.Y.Z`
- [ ] Push tag to GitHub

### Deployment

- [ ] Deploy to production NUCs (see `infra/scripts/` for deployment scripts)
- [ ] Verify services restarted successfully:
  - [ ] Web app (`apps/web`)
  - [ ] Admin API (`apps/admin-api`)
  - [ ] Bot services (`apps/bot`)
  - [ ] Other critical services
- [ ] Check health endpoints and monitoring dashboards
- [ ] Verify database migrations applied (if any)
- [ ] Test critical flows on production:
  - [ ] User login/authentication
  - [ ] Core feature functionality
  - [ ] Admin dashboard access

### Post-Release

- [ ] Merge release branch back to `main`
- [ ] Create GitHub Release with release notes (optional but recommended)
- [ ] Announce in Discord using template above
- [ ] Update any external documentation (wiki, help center, etc.)
- [ ] Monitor error tracking and logs for first 24 hours
- [ ] Delete release branch (optional, after merge)

### Rollback Plan (If Issues Arise)

- [ ] Identify the issue severity
- [ ] If critical, revert to previous tag: `git revert <commit>` or redeploy previous version
- [ ] Communicate rollback in Discord
- [ ] Open incident post-mortem issue in GitHub

---

## Hotfixes

For urgent fixes that cannot wait for the next planned release:

1. Branch from the **latest release tag** (not `main`):
   ```bash
   git checkout -b hotfix/v0.x.1 v0.x.0
   ```

2. Apply the minimal fix required

3. Test thoroughly

4. Tag the hotfix:
   ```bash
   git tag -a v0.x.1 -m "Hotfix v0.x.1: Fix critical auth bug"
   git push origin v0.x.1
   ```

5. Merge hotfix into both the release branch (if it still exists) and `main`:
   ```bash
   git checkout main
   git merge --no-ff hotfix/v0.x.1
   git push origin main
   ```

6. Deploy and follow the release checklist abbreviated for hotfixes

---

## Future Enhancements

As the project matures, consider:

- **Automated changelog generation** from commit messages or PR labels
- **GitHub Releases** with downloadable artifacts (if applicable)
- **Release candidates** (e.g., `v0.3.0-rc.1`) for larger releases
- **Canary deployments** to a subset of NUCs before full rollout
- **Version automation** using tools like `semantic-release` or `changesets`

---

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- Deployment scripts: `infra/scripts/`
- CI workflows: `.github/workflows/`
