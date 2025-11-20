# Code Review Prompt Template

Use this template when requesting AI-assisted code reviews for Slimy.ai changes.

---

## Context

You are reviewing code changes for **Slimy.ai**, a monorepo containing applications and shared packages. The repository structure includes:

- `apps/` - Runnable Slimy.ai applications (web, admin, bot, etc.)
- `packages/` - Shared libraries (configuration, database helpers, auth utilities, etc.)
- `infra/` - Deployment and operations tooling (Docker, Caddy, systemd, monitoring, backups)
- `docs/` - Design notes and architectural documentation
- `.github/workflows/` - CI/CD definitions

The stack uses:
- **pnpm** for package management (monorepo workspaces)
- TypeScript/JavaScript for most application code
- Standard Node.js tooling

---

## Review Instructions

Please review the following code changes and provide feedback on:

### 1. Security
- [ ] Check for common vulnerabilities (XSS, SQL injection, command injection, etc.)
- [ ] Verify proper input validation and sanitization
- [ ] Review authentication and authorization logic
- [ ] Check for exposure of sensitive data (credentials, tokens, keys)
- [ ] Assess dependencies for known security issues
- [ ] Verify secure defaults and configurations

### 2. Performance
- [ ] Identify potential performance bottlenecks
- [ ] Review database query efficiency
- [ ] Check for unnecessary computations or redundant operations
- [ ] Assess memory usage patterns
- [ ] Review caching strategies
- [ ] Check for proper async/await usage and promise handling

### 3. Maintainability
- [ ] Evaluate code clarity and readability
- [ ] Check for proper error handling and logging
- [ ] Review test coverage and quality
- [ ] Assess adherence to existing patterns and conventions
- [ ] Check for code duplication
- [ ] Verify proper documentation (comments, JSDoc, README updates)
- [ ] Review naming conventions (variables, functions, types)

### 4. Correctness
- [ ] Verify logic is sound and handles edge cases
- [ ] Check for potential race conditions or concurrency issues
- [ ] Review type safety (TypeScript types, null checks)
- [ ] Validate business logic against requirements

### 5. Architecture & Design
- [ ] Assess if changes follow existing architectural patterns
- [ ] Check for proper separation of concerns
- [ ] Review module boundaries and dependencies
- [ ] Verify changes align with monorepo structure conventions

---

## Diff to Review

```diff
[PASTE THE CONTENTS OF latest.diff HERE]
```

---

## Output Format

Please structure your review as follows:

### Summary
Brief overview of the changes and overall assessment.

### Critical Issues
Issues that must be addressed before merging (security vulnerabilities, bugs, breaking changes).

### Recommendations
Suggested improvements for code quality, performance, or maintainability.

### Positive Observations
What was done well in this changeset.

### Questions
Any clarifications needed about intent or implementation details.

---

## Notes

- Focus on substantive issues rather than minor style preferences
- Prioritize security and correctness over stylistic concerns
- Consider the broader context of the monorepo when evaluating changes
- Be constructive and specific in your feedback
