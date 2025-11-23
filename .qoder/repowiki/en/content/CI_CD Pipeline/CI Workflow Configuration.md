# CI Workflow Configuration

<cite>
**Referenced Files in This Document**
- [ci.yml](file://apps/web/.github/workflows/ci.yml)
- [playwright.config.ts](file://apps/web/playwright.config.ts)
- [package.json](file://apps/web/package.json)
- [vitest.config.ts](file://apps/web/vitest.config.ts)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml)
- [Dockerfile](file://apps/web/Dockerfile)
- [next.config.js](file://apps/web/next.config.js)
- [check-bundle-size.ts](file://apps/web/scripts/check-bundle-size.ts)
- [aggregate-codes-workflow.yml](file://apps/web/aggregate-codes-workflow.yml)
- [docker-compose.yml](file://apps/web/docker-compose.yml)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the GitHub Actions CI workflow for the Next.js application in the monorepo. It covers the pipeline stages (code checkout, environment setup, dependency installation with pnpm, linting, type checking, unit tests, E2E tests, build, and bundle size checks), the matrix strategy for Node.js versions, the build and Docker image creation process, caching mechanisms, Playwright integration for end-to-end testing, and reporting of test results. It also provides troubleshooting guidance and best practices for extending the CI configuration.

## Project Structure
The CI workflow is defined under the Next.js application’s GitHub Actions workflows directory. The workflow orchestrates jobs for linting, type checking, unit tests, E2E tests, and build/bundle size verification. The Next.js app uses standalone output and is configured to run with pnpm in a monorepo workspace.

```mermaid
graph TB
A["Repository Root"] --> B["apps/web/.github/workflows/ci.yml"]
B --> C["Lint Job"]
B --> D["Type Check Job"]
B --> E["Unit Tests Job"]
B --> F["E2E Tests Job"]
B --> G["Build & Bundle Size Job"]
G --> H["Next.js Build"]
H --> I["Bundle Analyzer Artifact"]
G --> J["Bundle Size Check"]
J --> K["Size Limit Action"]
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [package.json](file://apps/web/package.json#L1-L83)

## Core Components
- CI workflow definition and jobs
- Playwright configuration for E2E tests
- Test runners and coverage configuration
- pnpm workspace configuration
- Next.js build and standalone output
- Dockerfile for multi-stage build and production image
- Bundle size monitoring script and size limit action

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [playwright.config.ts](file://apps/web/playwright.config.ts#L1-L36)
- [vitest.config.ts](file://apps/web/vitest.config.ts#L1-L50)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml#L1-L14)
- [next.config.js](file://apps/web/next.config.js#L1-L7)
- [Dockerfile](file://apps/web/Dockerfile#L1-L79)
- [check-bundle-size.ts](file://apps/web/scripts/check-bundle-size.ts#L1-L224)

## Architecture Overview
The CI pipeline is composed of independent jobs that run in parallel on Ubuntu runners. Each job sets up Node.js and pnpm, restores dependency caches, installs dependencies, and executes the appropriate scripts. E2E tests use Playwright with a local web server started by the test runner. Build and bundle size checks produce artifacts for analysis and enforce limits.

```mermaid
sequenceDiagram
participant GH as "GitHub Actions Runner"
participant WC as "Checkout"
participant NS as "Node Setup"
participant PS as "pnpm Setup"
participant AC as "Artifacts Cache"
participant PI as "Install Dependencies"
participant LT as "Lint"
participant TC as "Type Check"
participant UT as "Unit Tests"
participant PW as "Playwright E2E"
participant NB as "Next.js Build"
participant BS as "Bundle Size Check"
participant SA as "Size Limit Action"
GH->>WC : "actions/checkout@v4"
GH->>NS : "actions/setup-node@v4 (node-version)"
GH->>PS : "pnpm/action-setup@v4 (version)"
GH->>AC : "actions/cache@v4 (pnpm store)"
GH->>PI : "pnpm install --frozen-lockfile"
GH->>LT : "pnpm lint"
GH->>TC : "pnpm tsc --noEmit"
GH->>UT : "pnpm test : coverage"
GH->>PW : "pnpm exec playwright install --with-deps"
GH->>PW : "pnpm test : e2e"
GH->>NB : "pnpm build"
GH->>BS : "pnpm build : check"
GH->>SA : "andresz1/size-limit-action@v1"
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [playwright.config.ts](file://apps/web/playwright.config.ts#L1-L36)
- [package.json](file://apps/web/package.json#L1-L83)

## Detailed Component Analysis

### CI Workflow Definition and Matrix Strategy
- The workflow triggers on pushes and pull requests to the main branch.
- Jobs are defined for linting, type checking, unit tests, E2E tests, and build/bundle size checks.
- There is no explicit matrix strategy for Node.js versions in the current workflow. All jobs use Node.js 22 in the workflow file. If a matrix is desired, it can be added at the job level to test multiple Node.js versions.

Key behaviors:
- Environment setup uses actions/setup-node with Node.js 22.
- pnpm is installed via pnpm/action-setup with version 10.
- Dependency caching uses actions/cache with the pnpm store path derived from pnpm store path.
- Dependency installation uses pnpm install with the frozen lockfile flag to ensure deterministic installs.

Best practice note:
- To add a matrix for Node.js versions, define strategy.matrix.node-version in each job and reference ${{ matrix.node-version }} in the setup-node step.

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)

### Dependency Installation with pnpm and Caching
- pnpm store directory is determined and cached using actions/cache to speed up subsequent runs.
- pnpm install runs with --frozen-lockfile to ensure reproducible builds.
- pnpm workspace configuration allows monorepo-wide dependency management.

```mermaid
flowchart TD
Start(["Job Start"]) --> Checkout["actions/checkout@v4"]
Checkout --> SetupNode["actions/setup-node@v4<br/>node-version: 22"]
SetupNode --> SetupPnpm["pnpm/action-setup@v4<br/>version: 10"]
SetupPnpm --> GetStore["Get pnpm store path"]
GetStore --> CacheRestore["actions/cache@v4<br/>restore pnpm store"]
CacheRestore --> Install["pnpm install --frozen-lockfile"]
Install --> Proceed["Run selected job steps"]
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml#L1-L14)

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml#L1-L14)

### Linting and Type Checking
- Lint job runs ESLint against the monorepo workspace.
- Type check job runs TypeScript compiler with no emit to validate types.

```mermaid
flowchart TD
LStart(["Lint Job"]) --> LInstall["Install dependencies"]
LInstall --> LRun["Run ESLint"]
LRun --> LEnd(["Lint Complete"])
TStart(["Type Check Job"]) --> TInstall["Install dependencies"]
TInstall --> TRun["Run TypeScript (no emit)"]
TRun --> TEnd(["Type Check Complete"])
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [package.json](file://apps/web/package.json#L1-L83)

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [package.json](file://apps/web/package.json#L1-L83)

### Unit Tests and Coverage Reporting
- Unit tests job runs Vitest with coverage enabled.
- Coverage results are uploaded to Codecov with flags and names configured.

```mermaid
sequenceDiagram
participant UJ as "Unit Tests Job"
participant UV as "Vitest"
participant UC as "Coverage"
participant CV as "Codecov"
UJ->>UV : "pnpm test : coverage"
UV-->>UC : "Generate coverage reports"
UJ->>CV : "codecov/codecov-action@v4<br/>upload coverage"
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [vitest.config.ts](file://apps/web/vitest.config.ts#L1-L50)

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [vitest.config.ts](file://apps/web/vitest.config.ts#L1-L50)

### E2E Testing with Playwright
- E2E job installs Playwright browsers with dependencies, runs Playwright tests, and uploads the Playwright report on failure.
- Playwright configuration sets test directory, parallelism, retries, workers, reporter, and web server settings for local development and CI.

```mermaid
sequenceDiagram
participant EJ as "E2E Tests Job"
participant PW as "Playwright"
participant PC as "playwright.config.ts"
participant AR as "Artifacts"
EJ->>PW : "pnpm exec playwright install --with-deps"
EJ->>PC : "Define projects, reporter, webServer"
EJ->>PW : "pnpm test : e2e"
PW-->>EJ : "Results"
EJ->>AR : "Upload playwright-report on failure"
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [playwright.config.ts](file://apps/web/playwright.config.ts#L1-L36)
- [package.json](file://apps/web/package.json#L1-L83)

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [playwright.config.ts](file://apps/web/playwright.config.ts#L1-L36)
- [package.json](file://apps/web/package.json#L1-L83)

### Build and Bundle Size Checks
- Build job runs Next.js build with environment variables for admin API base and external codes URL.
- Bundle size check validates thresholds using a custom script and posts a comment on pull requests with size-limit action.
- On main branch, bundle analysis artifacts are uploaded for inspection.

```mermaid
flowchart TD
BStart(["Build Job"]) --> BInstall["Install dependencies"]
BInstall --> BBuild["pnpm build"]
BBuild --> BCheck["pnpm build:check"]
BCheck --> BAnalyze{"Branch == main?"}
BAnalyze --> |Yes| BAnalyzeRun["ANALYZE=true pnpm build"]
BAnalyzeRun --> BUpload["Upload bundle-analysis artifact"]
BAnalyze --> |No| BEnd["Skip analysis"]
BCheck --> BLimit["andresz1/size-limit-action@v1"]
BLimit --> BEnd
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [check-bundle-size.ts](file://apps/web/scripts/check-bundle-size.ts#L1-L224)
- [package.json](file://apps/web/package.json#L1-L83)

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [check-bundle-size.ts](file://apps/web/scripts/check-bundle-size.ts#L1-L224)
- [package.json](file://apps/web/package.json#L1-L83)

### Docker Image Creation
- Multi-stage Dockerfile:
  - Base stage sets Node.js 22 slim image and enables Corepack with pnpm 10.
  - Deps stage copies workspace files and installs dependencies with pnpm.
  - Builder stage copies dependencies and app, generates Prisma client, and builds Next.js app.
  - Runner stage creates non-root user, copies static assets and standalone server, exposes port 3000, and starts the server.

```mermaid
graph TB
subgraph "Base Stage"
B1["node:22-slim"]
B2["Enable Corepack & pnpm 10"]
end
subgraph "Deps Stage"
D1["Copy workspace files"]
D2["pnpm install --frozen-lockfile --prod=false"]
end
subgraph "Builder Stage"
S1["Copy node_modules, apps/web, packages"]
S2["Generate Prisma client"]
S3["pnpm --filter @slimy/web build"]
end
subgraph "Runner Stage"
R1["Create non-root user"]
R2["Copy public, .next/standalone, static"]
R3["Expose 3000, CMD node apps/web/server.js"]
end
B1 --> D1 --> S1 --> R1
B2 --> D2 --> S2 --> S3 --> R2
```

**Diagram sources**
- [Dockerfile](file://apps/web/Dockerfile#L1-L79)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml#L1-L14)
- [next.config.js](file://apps/web/next.config.js#L1-L7)

**Section sources**
- [Dockerfile](file://apps/web/Dockerfile#L1-L79)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml#L1-L14)
- [next.config.js](file://apps/web/next.config.js#L1-L7)

### Integration with Playwright and Test Reporting
- Playwright configuration defines:
  - Test directory for E2E specs.
  - Parallel execution and retry policy.
  - Reporter selection based on CI environment.
  - Web server command to build and start the Next.js app locally for tests.
  - Trace, screenshot, and video capture policies.
- CI workflow uploads Playwright report artifacts on failure for debugging.

```mermaid
flowchart TD
PStart(["Playwright Config"]) --> PDir["Set testDir to tests/e2e"]
PDir --> PPar["fullyParallel, retries, workers"]
PPar --> PRep["reporter: github in CI"]
PRep --> PWeb["webServer: build & start"]
PWeb --> PUse["use: baseURL, trace, screenshots, video"]
PUse --> PEnd(["E2E Execution"])
```

**Diagram sources**
- [playwright.config.ts](file://apps/web/playwright.config.ts#L1-L36)
- [package.json](file://apps/web/package.json#L1-L83)

**Section sources**
- [playwright.config.ts](file://apps/web/playwright.config.ts#L1-L36)
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)

### Matrix Strategy for Node.js Versions
- Current workflow does not define a matrix strategy for Node.js versions.
- To support multiple Node.js versions, add strategy.matrix.node-version to each job and reference ${{ matrix.node-version }} in setup-node.

[No sources needed since this section provides general guidance]

## Dependency Analysis
- The CI workflow depends on:
  - actions/checkout, actions/setup-node, pnpm/action-setup, actions/cache for environment setup and caching.
  - codecov/codecov-action for coverage reporting.
  - andresz1/size-limit-action for bundle size enforcement.
  - Playwright for E2E testing.
  - Next.js standalone output for production image.
- The Dockerfile depends on pnpm workspace configuration and Next.js standalone output.

```mermaid
graph TB
CI["CI Workflow"] --> Node["setup-node@v4"]
CI --> Pnpm["pnpm/action-setup@v4"]
CI --> Cache["actions/cache@v4"]
CI --> Codecov["codecov-action@v4"]
CI --> SizeLimit["size-limit-action@v1"]
CI --> PW["Playwright"]
CI --> Next["Next.js Build"]
Next --> Standalone["standalone output"]
Docker["Dockerfile"] --> Next
Docker --> PnpmWS["pnpm-workspace.yaml"]
```

**Diagram sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [Dockerfile](file://apps/web/Dockerfile#L1-L79)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml#L1-L14)
- [next.config.js](file://apps/web/next.config.js#L1-L7)

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [Dockerfile](file://apps/web/Dockerfile#L1-L79)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml#L1-L14)
- [next.config.js](file://apps/web/next.config.js#L1-L7)

## Performance Considerations
- Use pnpm store caching to minimize network overhead and improve install times.
- Keep Node.js and pnpm versions consistent across jobs to maximize cache hits.
- Run Playwright browsers installation once per job to avoid repeated downloads.
- Use standalone output for Next.js to reduce runtime dependencies in the production image.
- Limit bundle sizes with size-limit action and bundle analyzer to prevent regressions.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Dependency installation failures:
  - Ensure pnpm install uses --frozen-lockfile and that pnpm store cache keys match lockfiles.
  - Verify pnpm-workspace.yaml includes required packages for monorepo resolution.
- E2E test failures:
  - Confirm Playwright browsers are installed with dependencies.
  - Check Playwright web server command and baseURL configuration.
  - Review uploaded playwright-report artifact for failing scenarios.
- Coverage upload failures:
  - Verify Codecov token secret is configured and coverage file path is correct.
- Bundle size regressions:
  - Inspect bundle-analysis artifact on main branch.
  - Adjust thresholds via environment variables in the size-limit action.
- Docker build failures:
  - Ensure Corepack is enabled and pnpm version matches the Dockerfile.
  - Verify Prisma client generation runs before Next.js build.

**Section sources**
- [ci.yml](file://apps/web/.github/workflows/ci.yml#L1-L243)
- [playwright.config.ts](file://apps/web/playwright.config.ts#L1-L36)
- [vitest.config.ts](file://apps/web/vitest.config.ts#L1-L50)
- [check-bundle-size.ts](file://apps/web/scripts/check-bundle-size.ts#L1-L224)
- [Dockerfile](file://apps/web/Dockerfile#L1-L79)

## Conclusion
The CI workflow provides a robust pipeline for linting, type checking, unit tests, E2E tests, and build/bundle size verification. It leverages pnpm caching, standalone Next.js output, and Playwright for reliable end-to-end testing. The Dockerfile supports multi-stage builds for efficient production images. Extending the workflow with a Node.js matrix and additional environments can further strengthen CI coverage.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Appendix A: Related Workflows
- An additional workflow aggregates codes periodically and stores snapshots as artifacts. This demonstrates artifact usage and scheduled jobs.

**Section sources**
- [aggregate-codes-workflow.yml](file://apps/web/aggregate-codes-workflow.yml#L1-L85)

### Appendix B: Docker Compose Overview
- The main docker-compose file includes infrastructure, admin API, web application, API gateway, and monitoring stacks for development and testing.

**Section sources**
- [docker-compose.yml](file://apps/web/docker-compose.yml#L1-L18)