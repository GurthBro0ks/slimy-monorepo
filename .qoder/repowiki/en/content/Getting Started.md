# Getting Started

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [package.json](file://package.json)
- [docker-compose.yml](file://docker-compose.yml)
- [apps/admin-api/.env.example](file://apps/admin-api/.env.example)
- [apps/web/.env.example](file://apps/web/.env.example)
- [apps/bot/.env.example](file://apps/bot/.env.example)
- [docs/DEV_WORKFLOW.md](file://docs/DEV_WORKFLOW.md)
- [docs/DEV_SANITY_CHECK.md](file://docs/DEV_SANITY_CHECK.md)
- [apps/web/setup-env.sh](file://apps/web/setup-env.sh)
- [apps/web/quickstart.sh](file://apps/web/quickstart.sh)
- [apps/admin-api/Dockerfile](file://apps/admin-api/Dockerfile)
</cite>

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Environment Configuration](#environment-configuration)
4. [Starting the System with Docker](#starting-the-system-with-docker)
5. [Running Applications in Development Mode](#running-applications-in-development-mode)
6. [Accessing the Applications](#accessing-the-applications)
7. [Common Setup Issues and Troubleshooting](#common-setup-issues-and-troubleshooting)

## Prerequisites

Before setting up the slimy-monorepo platform, ensure your development environment meets the following requirements:

- **Node.js**: Version 20 or higher. The platform leverages modern JavaScript features and requires a recent Node.js version for compatibility.
- **pnpm**: Install globally using `npm install -g pnpm`. This monorepo uses pnpm workspaces for efficient dependency management across multiple applications.
- **Git**: Required for cloning the repository and managing version control.
- **Docker and Docker Compose**: Essential for running the full system with all services (database, API, frontend, bot). Docker ensures consistent environments across development and production.

Verify your installations with the following commands:
```bash
node --version    # Should show v20.x or higher
pnpm --version    # Should show pnpm version
docker --version  # Should show Docker version
docker-compose --version  # Should show Docker Compose version
```

**Section sources**
- [README.md](file://README.md#L7-L9)
- [docs/DEV_WORKFLOW.md](file://docs/DEV_WORKFLOW.md#L7-L9)

## Repository Setup

To begin working with the slimy-monorepo platform, follow these steps to clone the repository and install dependencies:

1. **Clone the repository**:
```bash
git clone https://github.com/GurthBro0ks/slimy-monorepo.git
cd slimy-monorepo
```

2. **Install all dependencies**:
```bash
pnpm install
```
This command installs dependencies for all workspace packages and applications defined in the monorepo. The `pnpm-workspace.yaml` file configures the workspace to include all apps and packages.

3. **Generate Prisma clients** (required for database operations):
```bash
pnpm prisma:generate
```
This generates Prisma clients for applications that use Prisma ORM (admin-api and web). The Prisma schema files are located in their respective `prisma/` directories.

The monorepo structure organizes components as follows:
- `apps/`: Contains runnable applications (web, admin-api, admin-ui, bot)
- `packages/`: Shared libraries and utilities used across applications
- `infra/`: Infrastructure and deployment configurations
- `docs/`: Project documentation and guides

**Section sources**
- [README.md](file://README.md#L14-L17)
- [package.json](file://package.json#L4-L7)
- [docs/DEV_WORKFLOW.md](file://docs/DEV_WORKFLOW.md#L22-L26)

## Environment Configuration

Proper environment configuration is crucial for the platform to function correctly. Each application requires specific environment variables, typically defined in `.env` files.

### Admin API Configuration

1. Copy the example environment file:
```bash
cp apps/admin-api/.env.example apps/admin-api/.env
```

2. Edit the `.env` file with appropriate values. Key variables include:
- `PORT`: Server port (default: 3080)
- `DATABASE_URL`: MySQL connection string
- `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`: Discord OAuth credentials
- `DISCORD_REDIRECT_URI`: OAuth callback URL
- `SESSION_SECRET` and `JWT_SECRET`: Security secrets (minimum 32 characters)
- `CORS_ORIGIN`: Allowed origin for CORS (e.g., http://localhost:3000)
- `CLIENT_URL`: Frontend URL for redirects

The Admin API requires these variables to handle authentication, database connections, and external service integrations.

### Web Application Configuration

1. Copy the example environment file:
```bash
cp apps/web/.env.example apps/web/.env
```

2. Configure the following key variables:
- `NEXT_PUBLIC_ADMIN_API_BASE`: Base URL for the Admin API (e.g., http://localhost:3080)
- `NEXT_PUBLIC_SNELP_CODES_URL`: URL for Snelp codes API
- `NEXT_PUBLIC_DISCORD_CLIENT_ID`: Discord client ID (if different from Admin API)

### Bot Configuration

1. Copy the example environment file:
```bash
cp apps/bot/.env.example apps/bot/.env
```

2. Set the `DISCORD_BOT_TOKEN` variable with your Discord bot token.

### Environment Setup Script

The platform includes a setup script to automate environment configuration for Docker deployments:

```bash
# Run from apps/web directory
./setup-env.sh
```

This script extracts credentials from the admin-api `.env.admin.production` file and creates a `.env.docker` file with necessary variables for Docker Compose. It ensures consistent configuration across services.

**Section sources**
- [apps/admin-api/.env.example](file://apps/admin-api/.env.example)
- [apps/web/.env.example](file://apps/web/.env.example)
- [apps/bot/.env.example](file://apps/bot/.env.example)
- [apps/web/setup-env.sh](file://apps/web/setup-env.sh)
- [docs/DEV_WORKFLOW.md](file://docs/DEV_WORKFLOW.md#L32-L39)

## Starting the System with Docker

The slimy-monorepo platform can be started as a complete system using Docker Compose, which orchestrates all services including the database, API, frontend, and bot.

### Using the Quickstart Script

The easiest way to start the system is using the provided quickstart script:

```bash
# From the apps/web directory
./quickstart.sh
```

This script automates the entire setup process:
1. Checks for and creates the `.env.docker` file if missing
2. Installs admin-api dependencies if needed
3. Builds Docker images for all services
4. Starts services in detached mode
5. Waits for services to become healthy
6. Provides connection information and useful commands

### Manual Docker Compose Setup

Alternatively, you can start the system manually:

1. Ensure your environment variables are set in a `.env` file at the root or use the generated `.env.docker`.

2. Build and start all services:
```bash
docker compose build
docker compose up -d
```

3. Verify service health:
```bash
docker compose ps
```

The `docker-compose.yml` file defines the following services:
- **db**: MySQL 8.0 database with persistent volume
- **admin-api**: Backend API service on port 3080
- **web**: Web frontend on port 3000
- **admin-ui**: Admin dashboard on port 3001
- **bot**: Discord bot service

Each service has health checks configured to ensure proper startup order. The database must be healthy before the admin-api starts, and the admin-api must be healthy before the web and admin-ui services start.

To monitor service logs:
```bash
# View logs for a specific service
docker compose logs admin-api
docker compose logs web

# Follow logs in real-time
docker compose logs -f
```

To stop the services:
```bash
docker compose down
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [apps/web/quickstart.sh](file://apps/web/quickstart.sh)
- [apps/admin-api/Dockerfile](file://apps/admin-api/Dockerfile)

## Running Applications in Development Mode

For development, you can run individual applications with hot reloading enabled, allowing for faster iteration.

### Starting Individual Applications

Use the following commands from the repository root to start applications in development mode:

```bash
# Start the web application (Next.js)
pnpm dev:web

# Start the admin API (Express server)
pnpm dev:admin-api

# Start the admin UI (Next.js dashboard)
pnpm dev:admin-ui

# Start the bot application
pnpm dev:bot
```

These commands are defined in the root `package.json` file and use pnpm filters to run the `dev` script in the respective application directories.

### Development Server Details

- **Web Application**: Runs on http://localhost:3000 with Next.js development features including hot reloading and Turbopack.
- **Admin API**: Runs on http://localhost:3080 with automatic restart on file changes.
- **Admin UI**: Runs on http://localhost:3081 with Next.js development features.
- **Bot**: Placeholder implementation that can be extended as needed.

### Running Multiple Applications

To work on multiple applications simultaneously, open separate terminal windows or use a process manager:

```bash
# Terminal 1
pnpm dev:web

# Terminal 2  
pnpm dev:admin-api

# Terminal 3
pnpm dev:admin-ui
```

This allows you to develop the frontend and backend concurrently, with automatic reloading when code changes are detected.

**Section sources**
- [package.json](file://package.json#L9-L12)
- [docs/DEV_WORKFLOW.md](file://docs/DEV_WORKFLOW.md#L57-L117)

## Accessing the Applications

Once the system is running, you can access the various applications through their respective endpoints.

### Web Interface

The main web interface is accessible at:
- **URL**: http://localhost:3000
- **Features**: Public dashboard, usage statistics, snail tools, club analytics, and authentication via Discord.

The web application serves as the primary user interface for the platform, providing access to various features and data visualizations.

### Admin UI

The admin dashboard is accessible at:
- **URL**: http://localhost:3081
- **Features**: Administrative controls, diagnostics, guild management, and system monitoring.

This interface is intended for administrators and provides deeper insights and control over the system.

### Discord Bot Interaction

The Discord bot can be interacted with once properly configured:
1. Invite the bot to your Discord server using the OAuth2 URL from the Discord Developer Portal.
2. Use bot commands as defined in the application's command structure.
3. The bot listens for events and messages according to its implementation in `apps/bot/src/`.

### API Endpoints

The admin-api exposes various REST endpoints for programmatic access:
- **Health check**: GET /api/health
- **Authentication**: POST /api/auth/login, POST /api/auth/logout
- **Guild data**: GET /api/guilds/:guildId
- **Usage statistics**: GET /api/guilds/:guildId/usage
- **Club analytics**: GET /api/guilds/:guildId/club/latest

These endpoints can be tested using tools like curl or Postman.

**Section sources**
- [docs/DEV_SANITY_CHECK.md](file://docs/DEV_SANITY_CHECK.md#L28-L40)
- [apps/admin-api/.env.example](file://apps/admin-api/.env.example#L35-L42)

## Common Setup Issues and Troubleshooting

This section addresses common issues encountered during setup and their solutions.

### Database Connection Problems

**Symptoms**: Admin API fails to start, database queries time out, Prisma errors.

**Solutions**:
1. Ensure the MySQL container is running:
```bash
docker compose ps | grep db
```

2. Verify database credentials in your `.env` file match those in `docker-compose.yml`:
- `MYSQL_USER`: Default is `slimyai`
- `MYSQL_PASSWORD`: Default is `slimypassword`
- `MYSQL_DATABASE`: Default is `slimyai`

3. Check database connectivity:
```bash
# Connect to the database container
docker exec -it slimy-db mysql -u slimyai -p

# When prompted, enter the password from your .env file
```

4. If using a local database instead of Docker, ensure the `DATABASE_URL` points to the correct host and port.

### Redis Configuration Issues

**Note**: While Redis is referenced in the codebase (`apps/admin-api/lib/cache/redis.js`), it is not currently configured in the `docker-compose.yml` file. If Redis functionality is required:

1. Add a Redis service to `docker-compose.yml`:
```yaml
redis:
  image: redis:7
  container_name: slimy-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  networks:
    - slimy-network

volumes:
  redis_data:
```

2. Update the admin-api `.env` file with Redis connection details:
```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Port Conflicts

**Symptoms**: "Port already in use" errors when starting services.

**Solutions**:
1. Identify processes using the conflicting ports:
```bash
# Check port 3000 (web)
lsof -i :3000

# Check port 3080 (admin-api)
lsof -i :3080

# Check port 3306 (database)
lsof -i :3306
```

2. Stop the conflicting processes:
```bash
# Kill process by PID
kill -9 <PID>

# Or kill by port
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

3. Alternatively, change the ports in `docker-compose.yml`:
```yaml
services:
  web:
    ports:
      - "3001:3000"  # Map host port 3001 to container port 3000
  admin-api:
    ports:
      - "3081:3080"  # Map host port 3081 to container port 3080
```

### Docker-Related Issues

**Image Build Failures**:
1. Clear Docker build cache:
```bash
docker builder prune --all
```

2. Ensure all required files are present:
```bash
ls -la apps/admin-api/Dockerfile
ls -la pnpm-lock.yaml
```

3. Build with verbose output:
```bash
docker compose build --no-cache
```

**Container Startup Failures**:
1. Check container logs:
```bash
docker compose logs admin-api
docker compose logs web
```

2. Verify environment variables are being passed correctly:
```bash
docker compose run admin-api env
```

3. Ensure health checks are passing:
```bash
curl http://localhost:3080/api/health
```

### Network Configuration

**Docker Network Issues**:
1. Ensure all services are on the same network (`slimy-network` as defined in `docker-compose.yml`).

2. If services cannot communicate, recreate the network:
```bash
docker compose down
docker network prune
docker compose up -d
```

3. For host machine access to services, ensure ports are properly mapped in `docker-compose.yml`.

**Environment Variable Issues**:
1. Ensure `.env` files are in the correct location and properly formatted.
2. Verify that variables are being loaded by checking container environment:
```bash
docker compose run admin-api env | grep DATABASE_URL
```

3. Use the exact variable names as expected by the applications (case-sensitive).

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [docs/DEV_SANITY_CHECK.md](file://docs/DEV_SANITY_CHECK.md#L51-L55)
- [docs/DEV_WORKFLOW.md](file://docs/DEV_WORKFLOW.md#L287-L295)