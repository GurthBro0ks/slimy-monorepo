# NUC Roles and Responsibilities

This document provides a clear breakdown of what each infrastructure host is responsible for in the Slimy.ai deployment.

## Quick Summary Table

| Host | Environment | Primary Role | Database | Key Services | Public Access |
|------|-------------|--------------|----------|--------------|---------------|
| **nuc1** | Development/Testing | Dev & Testing | MySQL 8 | admin-api, admin-ui, web | No (internal) |
| **nuc2** | Production | Production Edge | PostgreSQL 16 | admin-api, web, Caddy | Yes (via Caddy) |
| **laptop** | Management | Control Center | N/A | SSH, deployment tools | No |

---

## nuc1: Development and Testing Environment

### Primary Role
Development and testing environment for Slimy.ai applications before production deployment.

### Responsibilities

**Database:**
- MySQL 8.0 server
- Development and testing data
- Port 3306 (exposed on nuc1)

**Services Running:**
1. **admin-api** (port 3080)
   - Express.js REST API
   - Development/testing version
   - Connected to MySQL database

2. **admin-ui** (port 3081)
   - Admin interface
   - Next.js application
   - Development builds
   - **Note:** This service only runs on nuc1

3. **web** (port 3000)
   - Public web portal
   - Next.js application
   - Testing version

### Network Configuration
- All services on internal bridge network `slimy-net`
- No public internet exposure (internal development only)
- Services communicate via Docker network

### Docker Compose File
`infra/docker/docker-compose.slimy-nuc1.yml`

### Data Storage
- MySQL data: Docker volume `slimy-db-data`
- Admin API data: Docker volume `admin-api-data`
- Admin API uploads: Docker volume `admin-api-uploads`
- Admin UI modules: Docker volume `admin-ui-node-modules`
- Admin UI builds: Docker volume `admin-ui-build`

### Environment Files
- MySQL: Configured via `/opt/slimy/app/admin-api/.env.admin.production`
- admin-api: `/opt/slimy/app/admin-api/.env.admin.production`
- admin-ui: `/opt/slimy/app/admin-ui/.env.production`
- web: `/opt/slimy/test/slimyai-web/.env.production`

### Use Cases
- Testing new features before production
- Development of new services
- Database schema testing
- Integration testing
- UI/UX development

---

## nuc2: Production Environment

### Primary Role
Production edge server serving all public-facing Slimy.ai services with automatic SSL/TLS.

### Responsibilities

**Database:**
- PostgreSQL 16 (Alpine)
- Production data
- Port 5432 (exposed on nuc2)
- Automated backups to `/opt/slimy/backups/postgres`

**Services Running:**
1. **admin-api** (port 3080)
   - Express.js REST API
   - Production instance
   - Handles Discord OAuth
   - Connected to PostgreSQL database

2. **web** (port 3000)
   - Public web portal
   - Next.js application
   - Production builds

3. **caddy** (reverse proxy)
   - Automatic HTTPS/SSL
   - Domain routing
   - Network mode: host (ports 80/443)
   - Manages multiple domains

4. **loopback1455** (test service)
   - Simple HTTP test server
   - Port 1455
   - Health monitoring

### Network Configuration
- Primary network: `slimy-network`
- Caddy uses host networking for SSL (ports 80/443)
- Public internet exposure via Caddy reverse proxy

### Domains Served (via Caddy)
- `slimyai.xyz` / `www.slimyai.xyz` - Main portal
- `login.slimyai.xyz` - Login interface
- `panel.slimyai.xyz` - Admin panel
- `slime.chat` / `www.slime.chat` - Chat service
- `localhost:8080` - Local testing

### Docker Compose File
`infra/docker/docker-compose.slimy-nuc2.yml`

### Data Storage
- PostgreSQL data: External volume `postgres_data`
- Admin API data: `/opt/slimy/data/admin-api/data`
- Admin API uploads: `/opt/slimy/data/admin-api/uploads`
- Caddy data (SSL certs): External volume `caddy_data`
- Caddy config: External volume `caddy_config`
- Logs: `/opt/slimy/logs/admin-api` and `/opt/slimy/logs/web`

### Backup Configuration
- PostgreSQL backups: `/opt/slimy/backups/postgres`
- Admin API backups: `/opt/slimy/backups/admin-api`
- Backup retention: Typically 30 days (configurable)

### Environment Files
- PostgreSQL: `/opt/slimy/secrets/.env.db.slimy-nuc2`
- admin-api: `/opt/slimy/secrets/.env.admin.production`
- web: `/opt/slimy/secrets/.env.web.production`

### SSL/TLS Management
- Automatic certificate acquisition via Caddy
- Auto-renewal of Let's Encrypt certificates
- HTTPS enforced on all public domains
- HSTS headers configured

### Use Cases
- Serving production traffic
- Public API endpoints
- Discord OAuth authentication
- User-facing web portal
- Admin panel access

---

## laptop: Control Center

### Primary Role
Management and deployment control center for the Slimy.ai infrastructure.

### Responsibilities

**Primary Functions:**
1. **Deployment Management**
   - Initiating deployments to nuc1 and nuc2
   - Running deployment scripts
   - Managing git operations

2. **SSH Access Hub**
   - SSH connections to nuc1 and nuc2
   - Secure key storage
   - Remote administration

3. **Development Environment**
   - Code editing and development
   - Testing before deployment
   - Git repository management

4. **Monitoring and Maintenance**
   - Checking service health
   - Reviewing logs
   - Troubleshooting issues

### Typical Tools
- SSH client
- Git client
- Code editor (VSCode, etc.)
- Docker (for local testing)
- Deployment scripts

### Data Stored (Recommended Backups)
- SSH private keys (`~/.ssh/`)
- Git repositories (local clones)
- Deployment scripts
- Configuration templates
- Development environments
- Documentation

### Security Considerations
- Store SSH keys securely
- Use SSH agent for key management
- Keep laptop encrypted (full disk encryption)
- Regular system backups
- Secure password manager for secrets

---

## Infrastructure Components Not Currently Documented

### Missing Services

The following were mentioned in project requirements but are not currently documented in the repository:

1. **Minecraft Server**
   - No configuration found in repository
   - If running, likely on nuc1 or nuc2
   - Would require separate documentation

2. **Discord Bot**
   - Mentioned in monorepo structure (`apps/bot/`)
   - No deployment configuration found
   - May run on separate infrastructure or as systemd service

3. **VPS (if any)**
   - No VPS configuration documented
   - If external VPS exists, document separately

---

## Service Communication Matrix

### nuc1 (Development)

| Service | Connects To | Purpose |
|---------|-------------|---------|
| admin-api | MySQL (3306) | Database operations |
| admin-ui | admin-api (3080) | API calls |
| web | admin-api (3080) | Authentication, API proxying |

### nuc2 (Production)

| Service | Connects To | Purpose |
|---------|-------------|---------|
| admin-api | PostgreSQL (5432) | Database operations |
| web | admin-api (3080) | Authentication, API proxying |
| caddy | web (3000) | Public traffic routing |
| caddy | admin-api (3080) | API endpoint routing |

### External

| Source | Target | Purpose |
|--------|--------|---------|
| Internet | nuc2:443 (Caddy) | HTTPS public access |
| laptop | nuc1:22 (SSH) | Management |
| laptop | nuc2:22 (SSH) | Management |
| admin-api | Discord API | OAuth authentication |
| admin-api | OpenAI API | Chat/AI features (optional) |

---

## Disaster Recovery Roles

### nuc1 Failure

**Impact:**
- Development environment unavailable
- Testing blocked
- No impact on production (nuc2)

**Recovery:**
1. Deploy to new hardware
2. Restore MySQL database from backup
3. Restore Docker volumes
4. Resume development work

**Downtime:** Development only (no production impact)

### nuc2 Failure

**Impact:**
- **CRITICAL:** All public services down
- Website inaccessible
- API unavailable
- User-facing features offline

**Recovery Priority:** **URGENT**

**Recovery Steps:**
1. Provision new hardware
2. Install Docker and dependencies
3. Restore PostgreSQL database
4. Restore Caddy volumes (SSL certificates)
5. Restore application data
6. Deploy services
7. Verify DNS and domains
8. Test all public endpoints

**Downtime:** Minutes to hours (depending on backup restore speed)

### laptop Failure

**Impact:**
- Deployment capability temporarily lost
- Management access via SSH still possible from other machines

**Recovery:**
1. Set up new laptop
2. Restore SSH keys from secure backup
3. Clone git repositories
4. Install deployment tools
5. Resume operations

**Downtime:** Low impact (can deploy from another machine)

---

## Capacity Planning

### Current Usage (Estimated)

**nuc1:**
- CPU: Development workloads (moderate)
- RAM: ~4-8GB for all services
- Disk: ~50-100GB (MySQL data, Docker volumes)
- Network: Internal only

**nuc2:**
- CPU: Production workloads (variable based on traffic)
- RAM: ~8-16GB for all services
- Disk: ~100-500GB (PostgreSQL data, uploads, logs, backups)
- Network: Public internet (bandwidth depends on traffic)

### Scaling Considerations

**Vertical Scaling (Same Hardware, More Resources):**
- Increase RAM for database performance
- Add disk space for data growth
- Upgrade CPU for higher traffic

**Horizontal Scaling (Multiple Hosts):**
- Add load balancer in front of nuc2
- Deploy multiple web instances
- Use external managed database (RDS, etc.)
- Implement Redis for session storage
- Add CDN for static assets

---

## Maintenance Schedules

### Daily (Automated)
- Database backups (2-3 AM)
- Log rotation
- Health checks

### Weekly (Manual)
- Review logs for errors
- Check disk space
- Monitor backup sizes
- Review service health

### Monthly (Manual)
- Update Docker images
- Security patches
- Review and clean old backups
- Test backup restores

### Quarterly (Manual)
- Full disaster recovery test
- Security audit
- Performance review
- Capacity planning review

---

## Quick Reference Commands

### Check Status

**nuc1:**
```bash
# SSH into nuc1
ssh nuc1

# Check services
cd /home/user/slimy-monorepo/infra/docker
docker compose -f docker-compose.slimy-nuc1.yml ps

# View logs
docker logs slimy-admin-api -f
docker logs slimy-admin-ui -f
docker logs slimy-web -f
```

**nuc2:**
```bash
# SSH into nuc2
ssh nuc2

# Check services
cd /home/user/slimy-monorepo/infra/docker
docker compose -f docker-compose.slimy-nuc2.yml ps

# View logs
docker logs slimy-admin-api -f
docker logs slimy-web -f
docker logs slimy-caddy -f

# Check public endpoints
curl https://slimyai.xyz/api/health
curl https://login.slimyai.xyz/
```

### Restart Services

**nuc1:**
```bash
cd /home/user/slimy-monorepo/infra/docker
docker compose -f docker-compose.slimy-nuc1.yml restart admin-api
docker compose -f docker-compose.slimy-nuc1.yml restart web
```

**nuc2:**
```bash
cd /home/user/slimy-monorepo/infra/docker
docker compose -f docker-compose.slimy-nuc2.yml restart admin-api
docker compose -f docker-compose.slimy-nuc2.yml restart web
docker compose -f docker-compose.slimy-nuc2.yml restart caddy
```

### Deploy Updates

**From laptop:**
```bash
# Update code
cd ~/slimy-monorepo
git pull origin main

# Deploy to nuc2 (production)
ssh nuc2 'cd /home/user/slimy-monorepo && git pull && cd infra/docker && docker compose -f docker-compose.slimy-nuc2.yml up -d --build'

# Deploy to nuc1 (development)
ssh nuc1 'cd /home/user/slimy-monorepo && git pull && cd infra/docker && docker compose -f docker-compose.slimy-nuc1.yml up -d --build'
```

---

## Summary

- **nuc1** = Development and testing environment with MySQL, admin-ui, and testing versions of services
- **nuc2** = Production edge server with PostgreSQL, public-facing services, and Caddy reverse proxy
- **laptop** = Control center for deployment, management, and development

---

Last updated by Claude Code (2025-11-19)
