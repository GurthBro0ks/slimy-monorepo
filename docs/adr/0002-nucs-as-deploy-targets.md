# ADR-0002: NUCs as Deployment Targets

## Status

Accepted

## Date

2025-11-19

## Context

The project has access to Intel NUC machines (NUC1 and NUC2) that can serve as deployment infrastructure. We needed to decide how to best utilize these machines in our development and deployment workflow.

Two primary approaches were considered:
1. Use NUCs as primary development machines where developers SSH in and work directly
2. Use NUCs as deployment targets that receive automated deployments

Key considerations:
- Developer experience and workflow preferences
- Deployment automation and reliability
- Environment consistency and reproducibility
- Resource utilization and isolation
- Security and access control

## Decision

We will use NUC1 and NUC2 as deployment targets, not as primary development machines.

Specifically:
- Developers work on their local machines or cloud development environments
- Code changes are committed and pushed to the repository
- NUCs automatically pull and deploy changes via automated deployment pipelines
- Git-dirt watcher monitors working directory state and triggers appropriate actions
- Each NUC can host multiple services (web, bot, admin) using Docker containers or systemd services

## Consequences

### Positive

- **Developer Flexibility**: Developers can use their preferred local setup and tools
- **Automated Deployments**: Reduces manual deployment steps and human error
- **Environment Parity**: Deployments are consistent and reproducible via automation
- **Resource Efficiency**: NUCs are fully utilized for running services, not sitting idle
- **Multiple Environments**: Can easily support staging/production environments on different NUCs
- **Git Integration**: Deployment state directly tied to git commits, enabling rollbacks
- **Monitoring**: Git-dirt watcher provides visibility into deployment state

### Negative

- **Initial Setup Complexity**: Requires setting up CI/CD pipelines and deployment automation
- **Debugging**: Cannot easily test directly on production-like hardware during development
- **Deployment Latency**: Changes require commit + push + deploy cycle rather than instant local changes
- **Network Dependency**: Deployments require network connectivity to git repository

### Neutral

- **Infrastructure as Code**: Deployment configurations must be codified (already a best practice)
- **Container Usage**: Encourages containerization for consistent environments
- **Monitoring Requirements**: Need to monitor NUC health and deployment status

## Alternatives Considered

- **NUCs as Development Machines**: Developers SSH into NUCs for development
  - Rejected because: Poor developer experience, resource contention, difficult to maintain personal development preferences, single point of failure

- **Manual Deployment to NUCs**: Developers manually deploy when needed
  - Rejected because: Error-prone, inconsistent, doesn't scale, lacks audit trail

- **Cloud-Only Deployment**: Don't use NUCs, deploy everything to cloud
  - Rejected because: NUCs are available hardware, cloud costs money, good for learning deployment practices

## References

- Git-dirt watcher implementation (to be documented)
- Docker deployment configurations in `infra/`
- Related to monorepo structure in ADR-0001
