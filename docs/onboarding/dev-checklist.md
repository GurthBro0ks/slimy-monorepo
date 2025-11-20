# Developer Onboarding Checklist

Welcome to the slimy-monorepo project! This checklist will help you get up to speed with our codebase and development workflow.

## Prerequisites

- [ ] Git installed and configured
- [ ] Node.js (v18+) and pnpm installed
- [ ] Docker and Docker Compose installed
- [ ] Access to the GitHub repository
- [ ] Invited to project communication channels (Discord/Slack)

## Local Development Setup

- [ ] Clone the repository: `git clone <repo-url>`
- [ ] Install dependencies: `pnpm install`
- [ ] Copy environment files: `cp .env.example .env` (for each app as needed)
- [ ] Set up local database with Docker: `docker-compose up -d`
- [ ] Run database migrations: `pnpm db:migrate` or per-app migrations
- [ ] Verify the build works: `pnpm build`
- [ ] Start the development server: `pnpm dev`
- [ ] Access the local applications:
  - [ ] Web app (typically http://localhost:3000)
  - [ ] Admin UI (check app-specific README)
  - [ ] Admin API (check app-specific README)

## Understanding the Monorepo Layout

- [ ] Read the main [README.md](../../README.md) to understand the project overview
- [ ] Review [docs/STRUCTURE.md](../STRUCTURE.md) to understand the monorepo structure
- [ ] Explore the `/apps` directory structure:
  - [ ] `apps/web` - Main web application
  - [ ] `apps/admin-ui` - Admin panel interface
  - [ ] `apps/admin-api` - Admin API backend
- [ ] Understand the `/packages` directory (shared code, utilities, types)
- [ ] Review the workspace configuration in `pnpm-workspace.yaml`
- [ ] Familiarize yourself with the build tooling (Vite, TypeScript, etc.)

## Reading Key Documentation

- [ ] Read [apps/web/CONTRIBUTING.md](../../apps/web/CONTRIBUTING.md) for contribution guidelines
- [ ] Review code style and formatting standards
- [ ] Understand the testing strategy (unit, integration, e2e)
- [ ] Check for any security guidelines or best practices documentation
- [ ] Review the Git workflow (branching strategy, PR process)
- [ ] Read any technical architecture documentation
- [ ] Understand the Discord bot integration (if applicable to your role)

## Development Workflow

- [ ] Set up your IDE with recommended extensions (ESLint, Prettier, etc.)
- [ ] Run the test suite: `pnpm test`
- [ ] Run linting: `pnpm lint`
- [ ] Verify pre-commit hooks are working
- [ ] Create a feature branch following naming conventions
- [ ] Make a small test commit to verify your setup

## Your First Contribution

- [ ] Browse the "good first issue" label in GitHub Issues
- [ ] Pick a starter task (documentation fix, small bug, or feature)
- [ ] Ask questions in the team chat if anything is unclear
- [ ] Create a draft PR early to get feedback on approach
- [ ] Request code review from team members
- [ ] Address review comments
- [ ] Merge your first PR! 🎉

## Additional Setup (As Needed)

- [ ] Set up local Redis instance (if needed)
- [ ] Configure API keys for third-party services (Discord, etc.)
- [ ] Join relevant team meetings or standups
- [ ] Add yourself to CODEOWNERS (if applicable)
- [ ] Set up monitoring/logging access (if applicable)

## Resources

- Main README: [README.md](../../README.md)
- Project Structure: [docs/STRUCTURE.md](../STRUCTURE.md)
- Contributing Guide: [apps/web/CONTRIBUTING.md](../../apps/web/CONTRIBUTING.md)
- Team Chat: [Your team communication channel]
- Issue Tracker: [GitHub Issues]

## Notes

Use this checklist as a personal guide. Keep a copy and check off items as you complete them. Don't hesitate to ask questions - we're here to help!

---

**Pro Tips:**
- Take your time with each step
- Document any setup issues you encounter (they might help improve onboarding!)
- Pair with a team member for your first few tasks
- Ask "why" questions to understand the architecture decisions
