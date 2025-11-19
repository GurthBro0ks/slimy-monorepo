# Contributing to Slimy.ai

Thank you for your interest in contributing to the Slimy.ai monorepo! This document provides guidelines and instructions for setting up your development environment and contributing code.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Monorepo Structure](#monorepo-structure)
- [Branching Model](#branching-model)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Additional Resources](#additional-resources)

## Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 22 or later
- **pnpm**: Version 10.22.0 or later
  ```bash
  npm install -g pnpm@10.22.0
  ```
- **Docker**: Latest stable version (for local deployment and testing)
- **Docker Compose**: Latest stable version
- **Git**: Latest stable version

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd slimy-monorepo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```
   This will install dependencies for all workspaces in the monorepo.

3. **Set up environment variables**

   Each app has its own environment configuration:

   - **apps/web**: Copy `.env.example` to `.env` and fill in the required values
   - **apps/admin-api**: Copy `.env.admin.example` to `.env.admin` and configure
   - **apps/admin-ui**: Copy `.env.example` to `.env` and configure

   Required environment variables include:
   - Database connection strings (`DATABASE_URL` or individual `DB_*` variables)
   - OAuth credentials (Discord: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`)
   - API keys (`OPENAI_API_KEY`, etc.)
   - Security tokens (`JWT_SECRET`, `SESSION_SECRET`)

4. **Set up the database**

   For the web app (using Prisma):
   ```bash
   cd apps/web
   pnpm db:generate    # Generate Prisma client
   pnpm db:migrate     # Run migrations
   ```

5. **Verify installation**
   ```bash
   # From the root directory
   pnpm lint           # Lint all workspaces
   pnpm build          # Build all workspaces
   pnpm test           # Run all tests
   ```

### Running the Development Servers

Each app can be run independently:

```bash
# Web app (Next.js customer portal)
cd apps/web
pnpm dev              # Runs on port 3000 with Turbopack

# Admin API (Express.js backend)
cd apps/admin-api
pnpm dev

# Admin UI (Next.js admin dashboard)
cd apps/admin-ui
pnpm dev              # Runs on port 3001
```

### Docker Development

To run the entire stack with Docker:

```bash
docker-compose up --build
```

This will start all services with proper networking and volume mounts.

## Monorepo Structure

This repository uses **pnpm workspaces** to manage multiple applications and shared packages:

```
slimy-monorepo/
├── apps/
│   ├── web/              # Customer-facing Next.js portal (Next 16, React 19)
│   ├── admin-api/        # Express.js backend API (Node 22)
│   ├── admin-ui/         # Admin Next.js dashboard (Next 14, React 18)
│   └── bot/              # Conversational bot services
├── packages/
│   ├── shared-config/    # Configuration loaders and validation
│   ├── shared-db/        # Database clients and ORM helpers
│   ├── shared-auth/      # Authentication and authorization utilities
│   ├── shared-snail/     # Core domain logic
│   └── shared-codes/     # Error codes, enums, protocol constants
└── docs/                 # Documentation
```

### Workspace Dependencies

Shared packages can be used across apps by referencing them in `package.json`:

```json
{
  "dependencies": {
    "shared-config": "workspace:*",
    "shared-auth": "workspace:*"
  }
}
```

## Branching Model

### Branch Naming

We use the following branch naming conventions:

- **Feature branches**: `feature/<short-description>` or `claude/<description>-<session-id>`
  - Example: `feature/user-authentication`
  - Example: `claude/add-dashboard-widgets-abc123`
- **Bug fixes**: `fix/<issue-number>-<short-description>` or `bugfix/<description>`
  - Example: `fix/123-login-redirect`
  - Example: `bugfix/cors-headers`
- **Hotfixes**: `hotfix/<critical-issue>`
  - Example: `hotfix/security-patch`
- **Refactoring**: `refactor/<area>`
  - Example: `refactor/api-error-handling`
- **Documentation**: `docs/<topic>`
  - Example: `docs/api-documentation`

### Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes** with regular commits (see [Commit Guidelines](#commit-guidelines))

3. **Keep your branch up to date**:
   ```bash
   git fetch origin main
   git rebase origin/main
   ```

4. **Push your branch**:
   ```bash
   git push -u origin feature/my-new-feature
   ```

5. **Open a Pull Request** (see [Pull Request Process](#pull-request-process))

### Branch Protection

- Direct pushes to `main` are restricted
- All changes must go through Pull Requests
- PRs require:
  - Passing CI/CD checks (lint, build, tests)
  - Code review approval
  - No merge conflicts

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **chore**: Routine tasks, maintenance (dependencies, configs)
- **test**: Adding or updating tests
- **refactor**: Code changes that neither fix bugs nor add features
- **docs**: Documentation changes
- **perf**: Performance improvements
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **ci**: Changes to CI/CD configuration

### Scope

The scope indicates which part of the codebase is affected:

- **web**: Changes to `apps/web`
- **admin-api**: Changes to `apps/admin-api`
- **admin-ui**: Changes to `apps/admin-ui`
- **bot**: Changes to `apps/bot`
- **shared-***: Changes to shared packages
- **docker**: Docker configuration changes
- **root**: Root-level configuration

### Examples

```bash
feat(web): add user dashboard with analytics widgets
fix(admin-api): resolve CORS header configuration for production
chore(web): upgrade Next.js to version 16.0.2
test(web): add unit tests for CodesCache connection handling
refactor(admin-api): extract rate limiting into middleware
docs(root): add contribution guidelines and code style guide
```

### Commit Message Best Practices

- Use the imperative mood ("add feature" not "added feature")
- Keep the subject line under 72 characters
- Capitalize the subject line
- Don't end the subject line with a period
- Separate subject from body with a blank line
- Use the body to explain **why** and **what**, not **how**
- Reference issue numbers in the footer: `Closes #123`

## Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass**:
   ```bash
   pnpm test
   ```

2. **Run linters and fix issues**:
   ```bash
   pnpm lint
   ```

3. **Verify your build succeeds**:
   ```bash
   pnpm build
   ```

4. **Update documentation** if you've changed APIs or added features

5. **Add or update tests** for your changes

### Creating a Pull Request

1. **Push your branch** to the remote repository

2. **Open a PR** on GitHub using the appropriate template:
   - Use the **Feature PR template** for new features
   - Use the **Bug Fix PR template** for bug fixes

3. **Fill out the PR template completely**:
   - **Overview**: What does this PR do?
   - **Motivation**: Why is this change needed?
   - **Implementation**: How did you implement it?
   - **Testing**: What tests did you add/update?
   - **Configuration**: Are there new environment variables?
   - **Documentation**: What docs did you update?
   - **Screenshots**: If UI changes, include before/after screenshots
   - **Performance/Security**: Any impact on performance or security?

4. **Request reviewers** (typically 1-2 team members)

5. **Ensure CI checks pass** (linting, tests, build)

### PR Title Guidelines

PR titles should follow the same format as commit messages:

```
feat(web): add real-time notifications to user dashboard
fix(admin-api): correct rate limiting for chat endpoints
```

### Code Review Expectations

- **Respond to feedback promptly** (within 1-2 business days)
- **Address all comments** before requesting re-review
- **Ask questions** if you don't understand a comment
- **Keep discussions respectful and constructive**
- **Mark conversations as resolved** after addressing them

### Merging

- **Squash and merge** is preferred for feature branches
- The final commit message should be clean and descriptive
- Delete your branch after merging

## Testing Requirements

### Test Coverage

- **Minimum coverage**: 60% for branches, functions, lines, and statements
- **New features**: Must include unit tests and, where applicable, integration tests
- **Bug fixes**: Must include a test that would have caught the bug

### Running Tests

```bash
# Run all tests across the monorepo
pnpm test

# Run tests for a specific app
cd apps/web
pnpm test              # Run all tests
pnpm test:coverage     # With coverage report
pnpm test:e2e          # Run Playwright E2E tests
```

### Testing Frameworks

- **Vitest**: Unit and component tests (apps/web)
  - Config: `vitest.config.ts`
  - Test patterns: `tests/**/*.test.{ts,tsx}`
  - Environment: jsdom for components, node for API tests
- **Playwright**: End-to-end tests
- **React Testing Library**: Component testing

### Writing Tests

See [Code Style Guide - Testing Conventions](docs/code-style-guide.md#testing-conventions) for detailed guidelines.

## Additional Resources

- **[Code Style Guide](docs/code-style-guide.md)**: TypeScript, React, and Node.js conventions
- **[Git Workflow Examples](docs/git-workflow-examples.md)**: Step-by-step examples for common scenarios
- **[Architecture Documentation](docs/STRUCTURE.md)**: Detailed structure and architecture

### Getting Help

- Open an issue for bugs or feature requests
- Ask questions in team channels
- Review existing PRs for examples

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Assume positive intent

---

Thank you for contributing to Slimy.ai! Your efforts help make this project better for everyone.
