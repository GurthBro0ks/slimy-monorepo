# ADR-0001: Monorepo Structure for Multiple Applications

## Status

Accepted

## Date

2025-11-19

## Context

The slimy project consists of multiple related applications and services:
- Web application (Next.js frontend and API)
- Admin dashboard
- Discord bot
- Infrastructure configurations

These components share common dependencies, types, and business logic. We needed to decide on a repository structure that would:
- Facilitate code sharing and reuse
- Maintain clear boundaries between components
- Support independent deployment of services
- Enable efficient development workflows
- Simplify dependency management

## Decision

We will use a monorepo structure to house all applications (web, admin, bot) and infrastructure configurations in a single repository.

The monorepo will be organized with:
- Separate directories for each application under `apps/`
- Shared packages and utilities under `packages/` (if needed)
- Infrastructure and deployment configurations under `infra/`
- Centralized tooling configuration at the root
- A single package manager (pnpm) with workspace support

## Consequences

### Positive

- **Shared Code**: Easy to share types, utilities, and business logic across applications
- **Atomic Changes**: Changes that affect multiple apps can be made in a single commit/PR
- **Unified Versioning**: Dependencies can be managed centrally, reducing version conflicts
- **Simplified CI/CD**: Single pipeline can test and deploy all components
- **Developer Experience**: One clone, one install, everything works together
- **Refactoring**: Large-scale refactoring across apps is straightforward

### Negative

- **Repository Size**: Will grow larger over time as all code lives in one place
- **Build Times**: May require careful CI optimization to avoid running all tests for all apps
- **Permissions**: Cannot easily give different teams access to different apps (all-or-nothing)
- **Clone Time**: New developers must clone the entire repository
- **Tooling Complexity**: Requires workspace-aware tools (pnpm workspaces, turborepo, etc.)

### Neutral

- **Learning Curve**: Team needs to understand monorepo patterns and tooling
- **Git History**: All apps share a single git history
- **Deployment**: Each app can still be deployed independently despite being in one repo

## Alternatives Considered

- **Polyrepo (Multiple Repositories)**: Each application in its own repository
  - Rejected because: Would require complex dependency management, version synchronization, and duplicate configuration. Sharing code would require publishing internal packages.

- **Monolithic Application**: Single application with all features
  - Rejected because: Would not allow independent deployment of services. Discord bot and web app have different runtime requirements.

- **Hybrid Approach**: Core apps in monorepo, supporting services separate
  - Rejected because: Adds complexity without clear benefits. Infrastructure code benefits from being co-located with applications.

## References

- [Monorepo Tools Comparison](https://monorepo.tools/)
- pnpm Workspaces documentation
- Related to deployment decisions in ADR-0002
