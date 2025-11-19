# Slimy Operations Overview

## Introduction

This ops runbook provides guidance for monitoring, debugging, and maintaining the Slimy platform - a Discord bot ecosystem for the "Super Snail" mobile game community. Whether you're responding to an incident at 3am or doing routine maintenance, this guide assumes you're comfortable with Linux but new to this specific project.

## The Slimy Stack

Slimy is a full-stack web platform that integrates with Discord to provide game tools, analytics, and AI-powered features to the Super Snail gaming community.

### Core Services

1. **Web App** (`apps/web`) - Next.js 16 application
   - Customer-facing portal at slimyai.xyz and slime.chat
   - AI-powered chat interface ("Slime Chat")
   - Codes aggregator (merges from Snelp API + Reddit)
   - Screenshot analysis tools
   - Club analytics dashboard
   - Public stats and documentation

2. **Admin API** (`apps/admin-api`) - Express.js backend
   - Discord OAuth authentication
   - Guild management and bot tracking
   - Image processing pipeline
   - Task runner (backups, ingestion, verification)
   - Stats tracking and analytics

3. **Admin UI** (`apps/admin-ui`) - Next.js 14 dashboard
   - Guild health monitoring dashboard
   - Screenshot upload interface
   - Task runner controls
   - Usage statistics visualization

4. **Discord Bot** (`apps/bot`) - STUB ONLY
   - Currently scaffolding only, not yet implemented
   - Future Discord bot integration

### Infrastructure Services

- **PostgreSQL** - Primary database for web and admin-api
- **MySQL** - Alternative database on NUC1
- **Redis** - Caching layer (60s TTL for codes, diagnostics)
- **Caddy** - Reverse proxy with automatic TLS
- **Monitoring Stack** - Sentry, Prometheus, Grafana, Alertmanager

### External Minecraft Monitoring

The platform includes a `/api/bedrock-status` endpoint for monitoring Minecraft Bedrock Edition servers. This is routed through the web app and may connect to external Minecraft infrastructure.

## Architecture Diagram

```
┌─────────────┐
│   Laptop    │
│ (Developer) │
└──────┬──────┘
       │
       │ git push
       ▼
┌─────────────┐
│   GitHub    │
│ (CI/Deploy) │
└──────┬──────┘
       │
       │ deploy
       ▼
┌──────────────────────────────────────────────────────┐
│                   Production Hosts                    │
├──────────────────────┬───────────────────────────────┤
│     slimy-nuc1       │         slimy-nuc2            │
├──────────────────────┼───────────────────────────────┤
│                      │                               │
│  ┌──────────────┐    │    ┌────────────────────┐    │
│  │ MySQL :3306  │    │    │ PostgreSQL :5432   │    │
│  └──────────────┘    │    └────────────────────┘    │
│                      │                               │
│  ┌──────────────┐    │    ┌────────────────────┐    │
│  │ Admin API    │    │    │ Caddy (TLS Proxy)  │    │
│  │   :3080      │    │    │  :80, :443, :8080  │    │
│  └──────────────┘    │    └─────────┬──────────┘    │
│                      │              │                │
│  ┌──────────────┐    │              ├─ Web :3000    │
│  │ Admin UI     │    │              ├─ Admin API    │
│  │   :3081      │    │              │     :3080     │
│  └──────────────┘    │              └─ Loopback     │
│                      │                    :1455      │
│  ┌──────────────┐    │                               │
│  │ Web :3000    │    │    ┌────────────────────┐    │
│  └──────────────┘    │    │ Redis :6379        │    │
│                      │    └────────────────────┘    │
└──────────────────────┴───────────────────────────────┘
                                 │
                                 │ monitors?
                                 ▼
                      ┌─────────────────────┐
                      │ Minecraft Servers   │
                      │ (External/Planned)  │
                      │                     │
                      │ Java   :25565       │
                      │ Bedrock :19132      │
                      │                     │
                      │ Paper + Geyser      │
                      │ + squaremap         │
                      └─────────────────────┘
```

## Glossary

### Repositories & Projects

- **slimy-monorepo** - This repository; contains all apps, packages, and infra
- **apps/web** - Next.js customer-facing web application
- **apps/admin-api** - Express.js backend API service
- **apps/admin-ui** - Next.js admin dashboard
- **infra/** - Docker compose files, Caddyfile, monitoring configs

### Domains

- **slimyai.xyz** - Primary customer-facing domain (web app)
- **www.slimyai.xyz** - Alias to slimyai.xyz
- **login.slimyai.xyz** - Login portal (web app)
- **panel.slimyai.xyz** - Panel interface (web app)
- **slime.chat** - AI chat interface (web app)
- **www.slime.chat** - Alias to slime.chat
- **admin.slimyai.xyz** - Admin panel (ASSUMED - not in codebase)

### Internal Service Names

- **Web** - Next.js 16 app on port 3000
- **Admin API** - Express.js API on port 3080
- **Admin UI** - Next.js 14 dashboard on port 3081
- **Caddy** - Reverse proxy with automatic HTTPS
- **loopback1455** - Python HTTP server on port 1455 (purpose unclear)

### Deployment Paths (Examples - verify on your system)

- `/opt/slimy/app/*` - Application code
- `/opt/slimy/secrets/*` - Environment files (.env.*)
- `/opt/slimy/data/*` - Persistent data
- `/opt/slimy/backups/*` - Backup storage
- `/opt/slimy/logs/*` - Application logs
- `/var/backups/slimy/*` - System-level backups

### Database & Data

- **PostgreSQL** - Primary DB on slimy-nuc2 (port 5432)
- **MySQL** - Alternative DB on slimy-nuc1 (port 3306)
- **Redis** - Cache layer (port 6379)
- **Prisma** - ORM used by web and admin-api

### Game & Community

- **Super Snail** - Mobile game this platform serves
- **Codes** - In-game redemption codes aggregated from Snelp API and Reddit
- **Guild** - Discord server that has installed the bot
- **Club Analytics** - Screenshot-based game progression analysis
- **Snail Tools** - Collection of utilities for Super Snail players

### Monitoring

- **Sentry** - Error tracking and performance monitoring
- **Prometheus** - Metrics collection (scrapes `/api/metrics`)
- **Grafana** - Dashboards and visualization
- **Alertmanager** - Alert routing and notifications

## Quick Reference

### Common Tasks

- **Check service status:** See `02-services-cheatsheet.md`
- **Respond to incidents:** See `03-playbooks-common-incidents.md`
- **Minecraft operations:** See `04-minecraft-notes.md`

### Emergency Contacts

- Check your team's on-call rotation
- Escalate to product team if needed
- Documentation: `/docs/` and `/apps/web/docs/`

### Health Check URLs

Assuming services are running on slimy-nuc2 behind Caddy:

- Web: `https://slimyai.xyz/api/health`
- Admin API: `https://slimyai.xyz/api/health` (note: admin-api endpoints)
- Metrics: `https://slimyai.xyz/api/metrics`
- Bedrock Status: `https://slimyai.xyz/api/bedrock-status`

## Important Notes

1. **Never edit files in `/opt/slimy/app/` directly** - these are managed by deployment
2. **Always use environment files in `/opt/slimy/secrets/`** - never hardcode credentials
3. **Check docker-compose logs first** - most issues show up there
4. **Restart order matters** - db → redis → backend → web → caddy
5. **Keep Caddy running** - it handles HTTPS certificates automatically

## Next Steps

- Read the services cheatsheet to understand each component
- Review common incident playbooks
- Familiarize yourself with log locations
- Set up monitoring dashboard access
- Join the on-call rotation
