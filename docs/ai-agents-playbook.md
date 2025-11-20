# AI Agents Playbook

**For: Claude Code, Cursor, GitHub Copilot, Continue, and other AI coding assistants**

This guide helps AI coding agents (and human developers) work safely and effectively with the slimy-monorepo. Follow these rules to avoid breaking production, corrupting data, or introducing security vulnerabilities.

---

## Table of Contents

1. [What AI Is Allowed To Do Here](#what-ai-is-allowed-to-do-here)
2. [What AI Should NEVER Do](#what-ai-should-never-do)
3. [Recommended Tools](#recommended-tools)
4. [Example Prompts for Common Tasks](#example-prompts-for-common-tasks)
5. [Reviewing AI-Generated Code](#reviewing-ai-generated-code)
6. [Emergency Stop: Reverting Bad Changes](#emergency-stop-reverting-bad-changes)

---

## What AI Is Allowed To Do Here

### ✅ Safe Operations

**Code Generation & Refactoring:**
- Generate new source files in `apps/*/src/`, `packages/*/src/`
- Refactor existing TypeScript/JavaScript code
- Add new routes, controllers, components, utilities
- Write unit tests in `*.test.ts`, `*.spec.ts`, or `__tests__/` directories
- Update documentation in `docs/` or `README.md` files
- Add type definitions in `*.d.ts` files

**Configuration & Build:**
- Modify `package.json` scripts (but verify dependencies carefully)
- Update TypeScript configs (`tsconfig.json`)
- Adjust build tooling (Vite, Next.js configs) with review
- Add or update `.env.example` files (but never actual `.env` files)

**Infrastructure as Code:**
- Update Docker configs in `infra/docker/`
- Modify Caddy configurations in `infra/caddy/`
- Edit systemd unit files in `infra/systemd/`
- Update CI/CD workflows in `.github/workflows/`

**Dependencies:**
- Add new npm packages via `pnpm add <package>` (after discussing with team)
- Update dependency versions (but run tests afterward!)

**Documentation:**
- Create/update markdown files in `docs/`
- Write inline code comments
- Generate API documentation

---

## What AI Should NEVER Do

### 🚫 Forbidden Operations

**Data & State:**
- **NEVER** modify files in `apps/*/data/` directories
  - This includes `apps/web/data/codes/`, `apps/web/data/rate-limits/`, `apps/admin-api/data/`
  - These contain production runtime state and user data
- **NEVER** edit `snail-events.json` or similar JSON data stores without explicit permission
- **NEVER** modify production database directly (no raw SQL against prod!)
- **NEVER** commit real `.env` files with secrets

**Critical Configuration:**
- **NEVER** change database connection strings without review
- **NEVER** modify authentication/authorization logic without security review
- **NEVER** disable security checks (CORS, rate limiting, input validation)
- **NEVER** hardcode API keys, tokens, or passwords

**Destructive Operations:**
- **NEVER** run `rm -rf` or equivalent destructive commands
- **NEVER** force-push to `main` or `master` branches
- **NEVER** delete migration files in database migration directories
- **NEVER** modify `.git/` directory directly

**Dependencies & Build:**
- **NEVER** run `pnpm install` with `--force` or `--legacy-peer-deps` without explicit permission
- **NEVER** delete `pnpm-lock.yaml` or `node_modules/` without team discussion
- **NEVER** downgrade security-critical packages

**Production Systems:**
- **NEVER** deploy to production without human approval
- **NEVER** modify monitoring/alerting configs in `infra/monitoring/` without review
- **NEVER** change backup retention policies in `infra/backups/`
- **NEVER** edit firewall rules or security groups

---

## Recommended Tools

### Primary AI Coding Assistants

1. **Claude Code** (Anthropic)
   - Best for: Complex refactors, architectural discussions, multi-file changes
   - Use when: You need to understand context across the monorepo

2. **GitHub Copilot**
   - Best for: Inline completions, boilerplate generation, test writing
   - Use when: Writing repetitive code or common patterns

3. **Cursor**
   - Best for: Fast iterative development, quick fixes
   - Use when: Rapid prototyping or debugging specific functions

4. **Continue**
   - Best for: Open-source alternative, customizable workflows
   - Use when: You want self-hosted or privacy-focused assistance

5. **Codeium / Tabnine**
   - Best for: Free alternatives to Copilot
   - Use when: Budget constraints or offline coding

### AI-Assisted Code Review

- **CodeRabbit**: Automated PR reviews
- **Sourcery**: Python/JS code quality suggestions
- **Cody (Sourcegraph)**: Enterprise-grade code intelligence

---

## Example Prompts for Common Tasks

### Small Bugfix

```
Fix the type error in apps/web/src/components/SnailCard.tsx where
`snailId` is typed as string but should be number. Update all
references and ensure tests pass.
```

**Expected AI behavior:**
- Read the file
- Identify the type mismatch
- Fix the type annotation
- Check for related files
- Run `pnpm test` to verify
- Show diff before committing

---

### Medium Refactor

```
Refactor apps/admin-api/src/routes/users.ts to use async/await
instead of callbacks. Extract database queries into a separate
service file at apps/admin-api/src/services/userService.ts.
Maintain backward compatibility and add tests.
```

**Expected AI behavior:**
- Create new service file
- Extract logic with proper error handling
- Update route handlers
- Add unit tests for service
- Update integration tests
- Show comprehensive diff

---

### Large Feature Implementation

```
Add a new "Snail Leaderboard" feature to apps/web:
1. Create API endpoint in apps/admin-api for leaderboard data
2. Add a new page at apps/web/src/pages/leaderboard.tsx
3. Create reusable LeaderboardCard component
4. Add tests for both API and UI
5. Update navigation to include leaderboard link

Use the existing snail data model in packages/shared-snail.
Follow the current auth patterns in packages/shared-auth.
```

**Expected AI behavior:**
- Ask clarifying questions about requirements
- Break down into subtasks
- Implement incrementally
- Run tests after each major step
- Request review before finalizing

---

### Database Migration

```
Create a Prisma migration to add a 'lastActiveAt' timestamp
column to the User model. Update the login handler to set
this field. Do NOT run the migration automatically.
```

**Expected AI behavior:**
- Generate migration file
- Update Prisma schema
- Modify application code
- Generate migration preview
- **STOP and ask before running migration**

---

### Adding Dependencies

```
Add Zod validation to apps/admin-api for input validation.
Install zod, create validation schemas for user endpoints,
and update route handlers to use schemas.
```

**Expected AI behavior:**
- Run `pnpm add zod` in admin-api workspace
- Create `src/schemas/` directory
- Generate validation schemas
- Update existing routes
- Add tests for validation
- Update `pnpm-lock.yaml`

---

### Documentation

```
Generate API documentation for apps/admin-api/src/routes/snails.ts
in OpenAPI 3.0 format. Save to docs/api/snails-endpoints.md.
```

**Expected AI behavior:**
- Read route definitions
- Extract parameters, responses, auth requirements
- Generate formatted markdown
- Include example requests/responses
- No code changes, just documentation

---

## Reviewing AI-Generated Code

### Before Accepting Changes

**Always review these aspects:**

1. **Diff Inspection**
   ```bash
   git diff
   git diff --staged
   ```
   - Check every changed line
   - Look for unintended modifications
   - Verify no secrets were added

2. **Type Safety**
   ```bash
   pnpm typecheck          # Run TypeScript compiler
   pnpm lint               # Run ESLint
   ```
   - Ensure no `any` types were introduced unnecessarily
   - Check for proper null/undefined handling

3. **Tests**
   ```bash
   pnpm test               # Run all tests
   pnpm test:watch         # Interactive test runner
   ```
   - All existing tests still pass
   - New code has test coverage
   - Edge cases are tested

4. **Security**
   - No hardcoded credentials
   - Input validation is present
   - SQL injection prevention (use parameterized queries)
   - XSS prevention (sanitize user input)
   - Authentication/authorization checks intact

5. **Performance**
   - No N+1 query problems
   - Appropriate use of indexes
   - No unnecessary re-renders (React)
   - Proper caching where applicable

6. **Dependencies**
   ```bash
   pnpm audit              # Check for vulnerabilities
   ```
   - Only necessary packages added
   - No abandoned/vulnerable packages
   - License compatibility verified

### Red Flags to Watch For

- **Mass file changes**: AI shouldn't modify 50+ files for a small feature
- **Deleted tests**: AI removed tests instead of fixing them
- **Disabled linting**: `// eslint-disable` comments everywhere
- **Commented code**: Large blocks of old code commented out instead of removed
- **TODO comments**: "TODO: Fix this later" without a plan
- **Console logs**: `console.log()` left in production code
- **Hardcoded values**: Magic numbers, URLs, or config values in code

---

## Emergency Stop: Reverting Bad Changes

### If AI Made Unwanted Changes

**Step 1: Assess the Damage**
```bash
git status              # See what files changed
git diff                # Review all unstaged changes
git diff --staged       # Review staged changes
```

**Step 2: Selective Undo**

**Discard unstaged changes to specific file:**
```bash
git restore path/to/file.ts
```

**Discard ALL unstaged changes:**
```bash
git restore .
```

**Unstage a file (keep changes, but remove from commit):**
```bash
git restore --staged path/to/file.ts
```

**Unstage everything:**
```bash
git restore --staged .
```

**Step 3: Undo Last Commit (if already committed)**

**Undo commit, keep changes in working directory:**
```bash
git reset --soft HEAD~1
```

**Undo commit AND discard all changes:**
```bash
git reset --hard HEAD~1
```

**Step 4: Recovery from Pushed Commits**

**If you pushed to feature branch (safe):**
```bash
git revert <commit-hash>     # Creates new commit that undoes changes
git push
```

**If you pushed to main/master (DANGER):**
1. **DO NOT force push!**
2. Contact team lead immediately
3. Use `git revert` to create a new commit that undoes changes
4. Never use `git push --force` on shared branches

**Step 5: Nuclear Option (local only)**

**Blow everything away and start fresh:**
```bash
git reset --hard origin/main    # Match remote main branch
git clean -fdx                  # Remove all untracked files
pnpm install                    # Reinstall dependencies
```

### Recovering Lost Work

**See all recent commits (even after reset):**
```bash
git reflog
```

**Restore from reflog:**
```bash
git checkout <commit-hash>      # Go back to that state
git switch -c recovery-branch   # Create new branch from there
```

---

## Best Practices Summary

### DO:
- ✅ Test changes before committing
- ✅ Review diffs line-by-line
- ✅ Ask AI to explain complex changes
- ✅ Use feature branches for experiments
- ✅ Run linters and type checkers
- ✅ Keep commits small and focused
- ✅ Write descriptive commit messages

### DON'T:
- ❌ Blindly accept all AI suggestions
- ❌ Skip testing "trivial" changes
- ❌ Commit secrets or credentials
- ❌ Modify production data directories
- ❌ Disable security checks
- ❌ Force-push to shared branches
- ❌ Trust AI for security-critical code without review

---

## Additional Resources

- **Monorepo Structure**: See `docs/STRUCTURE.md`
- **Environment Setup**: Check `.env.example` files in each app
- **Testing Guide**: See individual app READMEs
- **Deployment**: See `apps/web/DEPLOYMENT.md`
- **Monitoring**: See `apps/admin-api/MONITORING_README.md`

---

## Questions or Issues?

If AI behavior seems problematic:
1. Stop and assess the changes
2. Use `git diff` to understand what happened
3. Consult this guide for recovery steps
4. Ask team members for help if uncertain

**Remember**: AI is a powerful tool, but you are ultimately responsible for the code that goes into production. Review everything, test thoroughly, and when in doubt, ask for human review.

---

*Last Updated: 2025-11-19*
*Maintained by: Slimy.ai Development Team*
