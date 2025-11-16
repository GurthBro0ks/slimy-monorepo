# Contributing to SlimyAI Web

Thank you for your interest in contributing to SlimyAI Web! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment. We expect all contributors to:

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 22 or higher
- pnpm 10.20.0 or higher
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/slimyai-web.git
cd slimyai-web
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/GurthBro0ks/slimyai-web.git
```

### Install Dependencies

```bash
pnpm install
```

### Set Up Environment

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Fill in the required environment variables in `.env.local`

### Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Development Workflow

### Branching Strategy

We use a feature branch workflow:

1. **main** - Production-ready code
2. **feature/** - New features (e.g., `feature/add-user-preferences`)
3. **fix/** - Bug fixes (e.g., `fix/login-redirect`)
4. **docs/** - Documentation updates (e.g., `docs/update-readme`)
5. **refactor/** - Code refactoring (e.g., `refactor/api-client`)
6. **test/** - Test additions (e.g., `test/add-e2e-auth`)

### Creating a Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in your feature branch
2. Write or update tests as needed
3. Ensure all tests pass:

```bash
pnpm test
pnpm test:e2e
```

4. Run linting:

```bash
pnpm lint
```

5. Build the project to ensure it compiles:

```bash
pnpm build
```

### Committing Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

**Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**
```bash
git commit -m "feat(chat): add personality mode selector"
git commit -m "fix(codes): resolve deduplication bug"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(api): add guild endpoints tests"
```

### Keeping Your Branch Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Rebase your branch on top of main
git rebase upstream/main

# If there are conflicts, resolve them and continue
git rebase --continue
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use proper typing or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions/intersections
- Document complex types with JSDoc comments

**Example:**
```typescript
/**
 * Represents a code from a data source
 */
interface Code {
  code: string;
  source: string;
  ts: string;
  tags: string[];
  expires: string | null;
  region: string;
  description?: string;
}
```

### React Components

- Use functional components with hooks
- Use proper TypeScript typing for props
- Separate concerns (UI vs logic)
- Use meaningful component names

**Example:**
```typescript
interface MessageBubbleProps {
  message: Message;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MessageBubble({ message, onEdit, onDelete }: MessageBubbleProps) {
  // Component implementation
}
```

### File Organization

```
app/                    → Next.js pages and API routes
components/            → React components
  ui/                  → Reusable UI components
  [feature]/           → Feature-specific components
lib/                   → Business logic and utilities
  api/                 → API clients
  adapters/            → External service adapters
  [feature]/           → Feature-specific logic
types/                 → TypeScript type definitions
tests/                 → Test files
```

### Naming Conventions

- **Files:** kebab-case (`user-profile.tsx`, `api-client.ts`)
- **Components:** PascalCase (`UserProfile`, `MessageBubble`)
- **Functions:** camelCase (`getUserRole`, `fetchCodes`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Types/Interfaces:** PascalCase (`User`, `CodeSource`)

### ESLint

Follow the project's ESLint configuration. Run linting before committing:

```bash
pnpm lint          # Check for issues
pnpm lint --fix    # Auto-fix issues
```

## Testing

### Running Tests

```bash
# Unit and component tests
pnpm test

# With coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Watch mode (for development)
pnpm test:watch
```

### Writing Tests

#### Unit Tests

Place unit tests next to the files they test or in `tests/unit/`:

```typescript
// lib/dedupe.test.ts
import { describe, it, expect } from 'vitest';
import { deduplicate } from './dedupe';

describe('deduplicate', () => {
  it('should remove duplicate codes', () => {
    const codes = [
      { code: 'ABC123', source: 'snelp', /* ... */ },
      { code: 'ABC123', source: 'reddit', /* ... */ },
    ];

    const result = deduplicate(codes, 'newest');
    expect(result).toHaveLength(1);
  });
});
```

#### Component Tests

Use Testing Library for component tests:

```typescript
// components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### E2E Tests

Use Playwright for E2E tests:

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Login');

  // Assert user is logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

### Coverage Requirements

- Minimum coverage: 60% (goal: 80%+)
- Critical paths should have 100% coverage
- New features should include tests

## Submitting Changes

### Before Submitting

Ensure your changes:

- [ ] Follow the code style guidelines
- [ ] Include appropriate tests
- [ ] Pass all tests (`pnpm test`)
- [ ] Pass linting (`pnpm lint`)
- [ ] Build successfully (`pnpm build`)
- [ ] Are documented (code comments, JSDoc, README updates)
- [ ] Have meaningful commit messages

### Creating a Pull Request

1. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

2. Go to the GitHub repository and create a Pull Request

3. Fill out the PR template completely

4. Link related issues using `Fixes #123` or `Relates to #456`

5. Request reviews from maintainers

### PR Review Process

1. **Automated Checks:** CI/CD will run tests and linting
2. **Code Review:** Maintainers will review your code
3. **Feedback:** Address any feedback or requested changes
4. **Approval:** Once approved, your PR will be merged

### After Your PR is Merged

1. Delete your feature branch:

```bash
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

2. Update your local main branch:

```bash
git checkout main
git pull upstream main
```

## Reporting Bugs

### Before Reporting

- Check if the bug has already been reported
- Ensure you're using the latest version
- Verify the bug is reproducible

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 22.0.0]
- pnpm version: [e.g., 10.20.0]

**Additional context**
Any other relevant information.
```

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

### Feature Development Process

1. **Discussion:** Open an issue to discuss the feature
2. **Approval:** Wait for maintainer approval
3. **Implementation:** Create a PR with the feature
4. **Review:** Address feedback from code review
5. **Merge:** Feature is merged after approval

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues for similar questions
3. Open a new issue with the `question` label
4. Reach out to maintainers

## License

By contributing to SlimyAI Web, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to SlimyAI Web!** 🎉
