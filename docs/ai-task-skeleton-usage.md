# AI Task Skeleton Generator - Usage Guide

## Overview

The AI Task Skeleton Generator is a simple tool that creates standardized markdown files for AI-assisted development tasks. It helps maintain consistency across prompts for Claude Code, GitHub Copilot, Auto-Codex, and other AI assistants.

## Quick Start

### 1. Generate a New Task File

From the repository root, run:

```bash
./tools/ai-task-skeleton/new-task.sh <task-name>
```

**Example:**
```bash
./tools/ai-task-skeleton/new-task.sh fix-authentication-bug
```

This creates `docs/ai-tasks/fix-authentication-bug.md` with a pre-filled template.

### 2. Fill in the Template

Open the generated file and complete each section:

- **Goal**: What you want to accomplish
- **Constraints**: Rules and limitations (e.g., "no breaking changes")
- **Files Allowed to Touch**: Specific files/directories that can be modified
- **Plan**: Step-by-step approach
- **Acceptance Criteria**: Checkboxes for what defines "done"

### 3. Use with Your AI Assistant

#### For Claude Code / Claude CLI:
1. Copy the entire content of the generated file
2. Paste it at the start of your conversation
3. Claude will use it as context for the task

#### For GitHub Copilot / Cursor:
1. Open the generated markdown file in your editor
2. Keep it visible while working (or copy relevant sections)
3. Reference it in comments or prompts

#### For Auto-Codex / Blackbox:
1. Copy the entire template content
2. Paste it as the initial prompt
3. Follow up with specific questions or requests

## Template Structure

The generated file includes:

```markdown
# AI Task: [your-task-name]

## Goal
[What you're trying to achieve]

## Constraints
- [Limitations and rules]

## Files Allowed to Touch
- [Specific files/directories]

## Plan
1. [Step-by-step approach]

## Acceptance Criteria
- [ ] [What defines completion]
```

## Advanced Usage

### Running from Anywhere

Add the tools directory to your PATH or create an alias:

```bash
# In your .bashrc or .zshrc
alias new-ai-task='~/path/to/slimy-monorepo/tools/ai-task-skeleton/new-task.sh'
```

Then use:
```bash
new-ai-task implement-feature-x
```

### Task Naming Conventions

Use descriptive, kebab-case names:
- ✓ Good: `fix-auth-token-expiry`, `add-user-search`, `refactor-db-layer`
- ✗ Avoid: `task1`, `update`, `fix`

### Customizing the Template

To customize the template for your team's needs:
1. Edit `docs/ai-task-template.md`
2. Add or remove sections as needed
3. All future generated tasks will use the updated template

## Example Workflow

1. **Create task skeleton:**
   ```bash
   ./tools/ai-task-skeleton/new-task.sh add-rate-limiting
   ```

2. **Edit the generated file:**
   ```bash
   vim docs/ai-tasks/add-rate-limiting.md
   ```

3. **Fill in the details:**
   ```markdown
   ## Goal
   Add rate limiting to API endpoints to prevent abuse

   ## Constraints
   - Only modify packages/api
   - Must not break existing clients
   - Should use Redis for distributed rate limiting

   ## Files Allowed to Touch
   - packages/api/src/middleware/**
   - packages/api/src/config/rateLimit.ts
   - packages/api/tests/middleware/**

   ## Plan
   1. Create rate limiting middleware using express-rate-limit
   2. Configure Redis adapter for distributed limiting
   3. Apply middleware to API routes
   4. Add tests for rate limit scenarios
   5. Update API documentation

   ## Acceptance Criteria
   - [ ] Rate limiting middleware is implemented
   - [ ] Tests pass with 429 status codes for exceeded limits
   - [ ] Documentation is updated
   - [ ] Works in distributed environment with Redis
   ```

4. **Copy and use with AI:**
   - Copy the entire content
   - Paste into Claude Code, Copilot, or your AI assistant
   - Start working on the task with clear context

## Benefits

- **Consistency**: All team members use the same structure
- **Clarity**: AI assistants get complete context upfront
- **Traceability**: Tasks are documented and version controlled
- **Efficiency**: No need to rewrite context for each AI session

## Tips for Best Results

1. **Be specific in Goals**: "Add search" vs "Add full-text search with fuzzy matching"
2. **List actual file paths**: Use `packages/api/src/auth.ts` not "auth files"
3. **Make Plans actionable**: "Update schema" vs "Add email field to User model in schema.prisma"
4. **Write testable Criteria**: Things you can verify as done/not done

## Troubleshooting

### Script won't run
```bash
# Make sure it's executable
chmod +x tools/ai-task-skeleton/new-task.sh
```

### Template not found
```bash
# Verify the template exists
ls docs/ai-task-template.md
```

### File already exists
The script will prompt you to overwrite. Answer 'y' to replace or 'n' to abort.

## See Also

- Template file: `docs/ai-task-template.md`
- Generated tasks: `docs/ai-tasks/`
- Script source: `tools/ai-task-skeleton/new-task.sh`
