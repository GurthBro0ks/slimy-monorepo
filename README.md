# Slimy Monorepo

This repository is the future home for all Slimy.ai applications and shared packages. It currently contains only scaffolding while we prepare to import existing projects such as **slimyai-web** and **slimyai_setup**. Each app and package below will eventually host the migrated code and build tooling managed through a pnpm workspace.

## CI Status

The repository includes automated CI testing via GitHub Actions. See [docs/CI.md](docs/CI.md) for details on what's tested and how to extend the pipeline.

## Getting Started

1. Install [pnpm](https://pnpm.io/) if you haven't already: `npm install -g pnpm`
2. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/GurthBro0ks/slimy-monorepo.git
   cd slimy-monorepo
   pnpm install
   ```
3. Generate Prisma clients:
   ```bash
   pnpm prisma:generate
   ```

## Development Quickstart

For detailed development workflows, see [docs/DEV_WORKFLOW.md](docs/DEV_WORKFLOW.md). For a ready-to-run local checklist, see [docs/DEV_SANITY_CHECK.md](docs/DEV_SANITY_CHECK.md).

### Core Commands

```bash
# Start individual apps in development mode
pnpm dev:web          # Main web app (http://localhost:3000)
pnpm dev:admin-api    # Admin API server (http://localhost:3080)
pnpm dev:admin-ui     # Admin dashboard (http://localhost:3081)
pnpm dev:bot          # Bot application (TBD)

# Run tests
pnpm test:all         # Run all tests across the workspace
pnpm test:web         # Test web app only
pnpm test:admin-api   # Test admin API only

# Build and lint
pnpm build            # Build all apps
pnpm lint             # Lint all apps
```

## Development Quickstart

Essential commands to get up and running:

```bash
# Install all dependencies
pnpm install

# Generate Prisma clients (required for admin-api and web)
pnpm prisma:generate

# Start individual apps
pnpm dev:web         # Web dashboard → http://localhost:3000
pnpm dev:admin-api   # Admin API → http://localhost:3080
pnpm dev:admin-ui    # Admin UI → http://localhost:3081
pnpm dev:bot         # Bot (placeholder)

# Run tests
pnpm test:all        # All workspaces
pnpm test:web        # Web app only
pnpm test:admin-api  # Admin API only

# Build all apps
pnpm build
```

For detailed setup instructions, environment configuration, and troubleshooting, see **[docs/DEV_WORKFLOW.md](docs/DEV_WORKFLOW.md)**.

## Architecture & Infrastructure

To understand how the services work together and what each one does:

- **[Infrastructure Overview](docs/INFRA_OVERVIEW.md)** - System architecture, data flows, and service communication
- **[Services Matrix](docs/SERVICES_MATRIX.md)** - Detailed reference table with ports, commands, and dependencies

## Development Quickstart

For detailed development instructions, see **[docs/DEV_WORKFLOW.md](docs/DEV_WORKFLOW.md)**.

### Essential Commands

```bash
# Install all dependencies
pnpm install

# Generate Prisma clients (required for web & admin-api)
pnpm prisma:generate

# Start applications in development mode
pnpm dev:web         # Public web app → http://localhost:3000
pnpm dev:admin-api   # Admin API → http://localhost:3080
pnpm dev:admin-ui    # Admin dashboard → http://localhost:3081
pnpm dev:bot         # Bot application (placeholder)

# Run tests
pnpm test:all        # All apps
pnpm test:web        # Web app only
pnpm test:admin-api  # Admin API only

# Build & lint
pnpm build           # Build all apps
pnpm lint            # Lint all code
```

### First-Time Setup

```bash
# 1. Clone and install
git clone https://github.com/GurthBro0ks/slimy-monorepo.git
cd slimy-monorepo
pnpm install

# 2. Configure environment
cp apps/admin-api/.env.example apps/admin-api/.env
# Edit .env files as needed

# 3. Generate database clients
pnpm prisma:generate

# 4. Start developing!
pnpm dev:web
```

## Development & Quality

We maintain code quality through automated checks and clear workflows:

- **[Deprecation Workflow](docs/deprecation-workflow.md)** - How to safely mark, track, and remove obsolete code from the monorepo
- **[CI Documentation](docs/CI.md)** - Automated testing and validation pipeline

### Code Quality Commands

```bash
# Check for deprecated code usage
pnpm run lint:deprecations

# Run all linting
pnpm run lint

# Run all tests
pnpm run test:all
```

## Structure

- `apps/` holds runnable Slimy.ai applications (web, admin, bot, etc.).
- `packages/` keeps shared libraries such as configuration, database helpers, auth utilities, and other reusable pieces.
- `infra/` captures deployment and operations tooling (Caddy, Docker, systemd units, monitoring, backups, and scripts).
- `docs/` tracks design notes and architectural documentation.
- `.github/workflows/` will contain CI definitions to validate monorepo changes.

More detailed ownership expectations live in `docs/STRUCTURE.md`.
