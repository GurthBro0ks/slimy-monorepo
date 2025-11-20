# Slimy.ai Monorepo Documentation

This documentation is organized to help you quickly understand the monorepo structure, deployment procedures, and agent-driven improvements.

## Quick Navigation

- **[Overview](./overview/)** - High-level summaries, agent batch reports, and architectural decisions
- **[Apps](./apps/)** - Application-specific documentation (web, admin-api, admin-ui, bot)
- **[Infrastructure](./infra/)** - Docker deployment, NUC configuration, and infrastructure guides
- **[Development](./dev/)** - How to run tests, scripts, and local development workflows

## Current Agent Batch Status

Check [AGENT_STATUS.md](./AGENT_STATUS.md) for the latest agent processing status.

## Documentation Structure

```
docs/
├── README.md                    (this file)
├── STRUCTURE.md                 (repository structure reference)
├── AGENT_STATUS.md              (current agent batch status)
├── overview/
│   ├── README.md                (overview index)
│   └── ROUND_*.md               (agent batch summaries)
├── apps/
│   ├── README.md                (apps index)
│   ├── admin-import-build-errors.md
│   └── web-import-build-errors.md
├── infra/
│   ├── README.md                (infrastructure index)
│   └── DOCKER_DEPLOYMENT.md     (Docker & NUC deployment guide)
└── dev/
    └── README.md                (development workflows index)
```

## Getting Started

1. **New to the monorepo?** Start with [STRUCTURE.md](./STRUCTURE.md) to understand the repository layout
2. **Deploying to production?** See [infra/DOCKER_DEPLOYMENT.md](./infra/DOCKER_DEPLOYMENT.md)
3. **Running locally?** Check [dev/README.md](./dev/README.md) for development workflows
4. **Recent changes?** Review the latest [overview/ROUND_*.md](./overview/) document

## Agent Reports

Agent reports from automated improvement batches will be linked here as they become available:

- Agent 1 Report: _Pending_
- Agent 2 Report: _Pending_
- Agent 3 Report: _Pending_
- Agent 4 Report: _Pending_
- Agent 5 Report: _Pending_
- Agent 6 Report: _Pending_
- Agent 7 Report: [AGENT_7_REPORT.md](./AGENT_7_REPORT.md)
