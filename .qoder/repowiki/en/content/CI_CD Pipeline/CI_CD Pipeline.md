# CI/CD Pipeline

<cite>
**Referenced Files in This Document**   
- [ci.yml](file://apps/web/.github/workflows/ci.yml)
- [playwright.config.ts](file://apps/web/playwright.config.ts)
- [deploy-to-server.sh](file://apps/web/deploy-to-server.sh)
- [quickstart.sh](file://apps/web/quickstart.sh)
- [setup-env.sh](file://apps/web/setup-env.sh)
- [Dockerfile](file://apps/web/Dockerfile)
- [DEPLOYMENT.md](file://apps/web/DEPLOYMENT.md)
- [QUICKSTART.md](file://apps/web/QUICKSTART.md)
- [package.json](file://apps/web/package.json)
- [vitest.config.ts](file://apps/web/vitest.config.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [GitHub Actions Workflow](#github-actions-workflow)
3. [Docker-Based Build Process](#docker-based-build-process)
4. [Deployment Scripts](#deployment-scripts)
5. [Testing Strategy](#testing-strategy)
6. [Quickstart Automation](#quickstart-automation)
7. [Rollback Procedures](#rollback-procedures)
8. [Deployment Verification](#deployment-verification)
9. [Best Practices](#best-practices)

## Introduction
The CI/CD pipeline for the Slimy monorepo is designed to automate the build, test, and deployment processes for the web application. This documentation provides a comprehensive overview of the automated build and deployment system, focusing on the GitHub Actions workflow, Docker-based build process, deployment scripts, testing strategy, quickstart automation, rollback procedures, and deployment verification steps. The pipeline ensures consistent and reliable deployments while simplifying developer onboarding through automation.

## GitHub Actions Workflow

The GitHub Actions workflow defined in `ci.yml` orchestrates the continuous integration process for the web application. It consists of multiple jobs that run on push and pull request events to the main branch.

```mermaid
graph TD
A[Push/Pull Request to Main] --> B[Lint Job]
A --> C[Type Check Job]
A --> D[Unit Tests Job]
A --> E[E2E Tests Job]
A --> F[Build & Bundle Size Job]
B --> G[Checkout Code]
G --> H[Setup Node.js]
H --> I[Setup pnpm]
I --> J[Cache Dependencies]
J --> K[Install Dependencies]
K --> L[Run ESLint]
C --> G
D --> G
E --> G
F --> G
L --> M[Success/Failure]
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml)

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml)

## Docker-Based Build Process

The Docker-based build process for the web application is defined in the `Dockerfile`. It uses a multi-stage build approach to optimize the final image size and ensure a clean build environment.

```mermaid
graph TD
A[Base Stage] --> B[Node.js 22-slim]
B --> C[Install pnpm]
C --> D[Dependencies Stage]
D --> E[Copy Package Files]
E --> F[Install Dependencies]
F --> G[Builder Stage]
G --> H[Copy Dependencies]
H --> I[Copy Source Code]
I --> J[Generate Prisma Client]
J --> K[Build Application]
K --> L[Runner Stage]
L --> M[Copy Built Artifacts]
M --> N[Set Up Non-Root User]
N --> O[Run Server]
```

**Diagram sources**
- [Dockerfile](file://apps/web/Dockerfile)

**Section sources**
- [Dockerfile](file://apps/web/Dockerfile)
- [package.json](file://apps/web/package.json)

## Deployment Scripts

The deployment scripts automate the process of deploying and updating the web application on the server. The `deploy-to-server.sh` script handles the entire deployment process, from repository update to service verification.

```mermaid
graph TD
A[Start Deployment] --> B[Update Repository]
B --> C[Check Admin API Status]
C --> D[Configure docker-compose.yml]
D --> E[Update Caddyfile]
E --> F[Reload Caddy]
F --> G[Build and Start Docker Container]
G --> H[Wait for Health Check]
H --> I[Test Deployment]
I --> J[Create systemd Service]
J --> K[Display Summary]
```

**Diagram sources**
- [deploy-to-server.sh](file://apps/web/deploy-to-server.sh)

**Section sources**
- [deploy-to-server.sh](file://apps/web/deploy-to-server.sh)
- [DEPLOYMENT.md](file://apps/web/DEPLOYMENT.md)

## Testing Strategy

The testing strategy includes unit, integration, and end-to-end tests using Playwright. The tests are organized in the `tests` directory and executed as part of the CI pipeline.

```mermaid
graph TD
A[Unit Tests] --> B[Vitest]
B --> C[Coverage Report]
C --> D[Upload to Codecov]
A --> E[Integration Tests]
E --> F[Jest]
F --> G[Supertest]
G --> H[API Endpoints]
A --> I[End-to-End Tests]
I --> J[Playwright]
J --> K[Browser Automation]
K --> L[Multiple Browsers]
L --> M[Chromium]
M --> N[Report Generation]
N --> O[Upload on Failure]
```

**Diagram sources**
- [vitest.config.ts](file://apps/web/vitest.config.ts)
- [playwright.config.ts](file://apps/web/playwright.config.ts)

**Section sources**
- [vitest.config.ts](file://apps/web/vitest.config.ts)
- [playwright.config.ts](file://apps/web/playwright.config.ts)
- [package.json](file://apps/web/package.json)

## Quickstart Automation

The quickstart automation simplifies developer onboarding by providing a script that sets up the entire development environment with a single command. The `quickstart.sh` script automates the process of creating environment variables, installing dependencies, and starting services.

```mermaid
graph TD
A[Run quickstart.sh] --> B[Check .env.docker]
B --> C[Create .env.docker from admin-api .env]
C --> D[Export Environment Variables]
D --> E[Check admin-api Dependencies]
E --> F[Install Dependencies]
F --> G[Build Docker Images]
G --> H[Start Services]
H --> I[Wait for Health Check]
I --> J[Verify Admin API Health]
J --> K[Verify Web App Health]
K --> L[Display Completion Message]
```

**Diagram sources**
- [quickstart.sh](file://apps/web/quickstart.sh)
- [setup-env.sh](file://apps/web/setup-env.sh)

**Section sources**
- [quickstart.sh](file://apps/web/quickstart.sh)
- [setup-env.sh](file://apps/web/setup-env.sh)
- [QUICKSTART.md](file://apps/web/QUICKSTART.md)

## Rollback Procedures

The rollback procedures are designed to quickly revert to a previous stable version in case of deployment issues. The process involves stopping the current services and restarting the previous version.

```mermaid
graph TD
A[Identify Issue] --> B[Stop Current Services]
B --> C[Check Previous Version]
C --> D[Restart Previous Version]
D --> E[Verify Health Check]
E --> F[Monitor Application]
F --> G[Investigate Issue]
G --> H[Fix and Redeploy]
```

**Section sources**
- [deploy-to-server.sh](file://apps/web/deploy-to-server.sh)
- [DEPLOYMENT.md](file://apps/web/DEPLOYMENT.md)

## Deployment Verification

The deployment verification process ensures that the application is running correctly after deployment. It includes health checks, route verification, and functionality testing.

```mermaid
graph TD
A[Wait for Container Health] --> B[Test Web App]
B --> C[Curl http://localhost:3001]
C --> D[Test through Caddy]
D --> E[Curl https://admin.slimyai.xyz]
E --> F[Test API Proxy]
F --> G[Curl https://admin.slimyai.xyz/api/health]
G --> H[Display Summary]
H --> I[Verify All Services]
```

**Section sources**
- [deploy-to-server.sh](file://apps/web/deploy-to-server.sh)
- [QUICKSTART.md](file://apps/web/QUICKSTART.md)

## Best Practices

The best practices for contributing to the codebase and navigating the CI/CD process include following the defined workflows, writing comprehensive tests, and using the provided automation scripts.

**Section sources**
- [DEPLOYMENT.md](file://apps/web/DEPLOYMENT.md)
- [QUICKSTART.md](file://apps/web/QUICKSTART.md)
- [CONTRIBUTING.md](file://CONTRIBUTING.md)