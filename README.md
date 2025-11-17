# Slimy Monorepo

This repository is the future home for all Slimy.ai applications and shared packages. It currently contains only scaffolding while we prepare to import existing projects such as **slimyai-web** and **slimyai_setup**. Each app and package below will eventually host the migrated code and build tooling managed through a pnpm workspace.

## Getting Started

- Install pnpm if you have not already.
- Run `pnpm install` once dependencies are added in future commits.
- Use the root scripts (`pnpm lint`, `pnpm build`, `pnpm test`) as orchestration entry points once real logic is wired up.

## Structure

- `apps/` holds runnable Slimy.ai applications (web, admin, bot, etc.).
- `packages/` keeps shared libraries such as configuration, database helpers, auth utilities, and other reusable pieces.
- `tests/` contains top-level tests (backend API tests, frontend component tests, and E2E tests).
- `infra/` captures deployment and operations tooling (Caddy, Docker, systemd units, monitoring, backups, and scripts).
- `docs/` tracks design notes and architectural documentation.
- `.github/workflows/` contains CI definitions to validate monorepo changes.

More detailed ownership expectations live in `docs/STRUCTURE.md`.

## Testing

Comprehensive testing setup with Vitest and Playwright:

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:backend      # Backend API tests
pnpm test:frontend     # Frontend component tests
pnpm test:e2e          # End-to-end tests (requires dev server)

# Coverage and watch mode
pnpm test:coverage     # Generate coverage reports
pnpm test:watch        # Watch mode
pnpm test:ui           # Interactive UI
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.
