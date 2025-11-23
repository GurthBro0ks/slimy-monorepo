# Developer Onboarding Automation

<cite>
**Referenced Files in This Document**   
- [quickstart.sh](file://apps/web/quickstart.sh)
- [setup-env.sh](file://apps/web/setup-env.sh)
- [QUICKSTART.md](file://apps/web/QUICKSTART.md)
- [docker-compose.yml](file://apps/web/docker-compose.yml)
- [package.json](file://apps/web/package.json)
- [package.json](file://apps/admin-api/package.json)
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

## Introduction
This document provides comprehensive documentation for the developer onboarding automation system using the `quickstart.sh` script. The automation streamlines environment setup, dependency installation, and service configuration for the Slimy monorepo. It enables developers to quickly establish a consistent development environment with minimal manual configuration, reducing onboarding time and ensuring uniformity across development teams.

## Project Structure
The project follows a monorepo structure with multiple applications and shared packages. The developer onboarding automation is centered in the web application directory, which coordinates with the admin-api service and infrastructure components.

```mermaid
graph TD
A[Monorepo Root] --> B[apps/]
A --> C[packages/]
A --> D[infra/]
A --> E[scripts/]
B --> F[web/]
B --> G[admin-api/]
B --> H[admin-ui/]
B --> I[bot/]
F --> J[quickstart.sh]
F --> K[setup-env.sh]
F --> L[docker-compose.yml]
F --> M[QUICKSTART.md]
C --> N[shared-auth]
C --> O[shared-config]
C --> P[shared-db]
D --> Q[docker/]
```

**Diagram sources**
- [quickstart.sh](file://apps/web/quickstart.sh)
- [setup-env.sh](file://apps/web/setup-env.sh)
- [docker-compose.yml](file://apps/web/docker-compose.yml)

**Section sources**
- [quickstart.sh](file://apps/web/quickstart.sh)
- [setup-env.sh](file://apps/web/setup-env.sh)

## Core Components
The developer onboarding automation system consists of several core components that work together to create a seamless setup experience. The `quickstart.sh` script serves as the primary entry point, orchestrating the entire setup process. It handles environment variable configuration, dependency installation, Docker image building, and service startup with health verification.

The `setup-env.sh` script extracts essential credentials from the admin-api environment file and creates a Docker-specific environment configuration. This ensures that sensitive credentials are properly propagated to the containerized environment while maintaining security boundaries.

**Section sources**
- [quickstart.sh](file://apps/web/quickstart.sh#L1-L97)
- [setup-env.sh](file://apps/web/setup-env.sh#L1-L27)

## Architecture Overview
The onboarding automation follows a layered architecture that integrates local development setup with containerized services. The process begins with environment configuration, proceeds through dependency management, and concludes with container orchestration.

```mermaid
graph TD
A[Developer Runs quickstart.sh] --> B[Environment Setup]
B --> C[Dependency Installation]
C --> D[Docker Image Building]
D --> E[Service Orchestration]
E --> F[Health Verification]
F --> G[Ready State]
B --> B1[Check/Create .env.docker]
B1 --> B2[Extract Admin API Credentials]
B2 --> B3[Set Web App Configuration]
C --> C1[Check node_modules]
C1 --> C2[Install if Missing]
D --> D1[Build Docker Images]
E --> E1[Start Services via docker-compose]
F --> F1[Check Admin API Health]
F1 --> F2[Check Web App Health]
```

**Diagram sources**
- [quickstart.sh](file://apps/web/quickstart.sh#L1-L97)
- [docker-compose.yml](file://apps/web/docker-compose.yml#L1-L18)

## Detailed Component Analysis

### Quickstart Script Analysis
The `quickstart.sh` script automates the complete development environment setup process, ensuring consistency and reducing manual errors.

```mermaid
flowchart TD
Start([Start quickstart.sh]) --> CheckEnv["Check for .env.docker"]
CheckEnv --> EnvExists{Exists?}
EnvExists --> |No| CreateEnv["Create from admin-api .env"]
CreateEnv --> CopyFile["Copy .env.admin.production"]
CopyFile --> AddWebVars["Add Web-Specific Variables"]
AddWebVars --> ValidateCopy["Validate Copy Success"]
ValidateCopy --> |Failure| ExitError["Exit with Error"]
EnvExists --> |Yes| Continue["Continue Setup"]
Continue --> ExportVars["Export Environment Variables"]
ExportVars --> CheckDeps["Check admin-api Dependencies"]
CheckDeps --> DepsExist{node_modules Exists?}
DepsExist --> |No| InstallDeps["Install npm Dependencies"]
DepsExist --> |Yes| SkipInstall["Skip Installation"]
InstallDeps --> BackToWeb["Return to web Directory"]
BackToWeb --> BuildDocker["Build Docker Images"]
BuildDocker --> StartServices["Start Services with docker compose"]
StartServices --> WaitHealthy["Wait for Services"]
WaitHealthy --> CheckAdmin["Check Admin API Health"]
CheckAdmin --> AdminHealthy{Healthy?}
AdminHealthy --> |No| RetryCheck["Retry (30 attempts)"]
RetryCheck --> |Max Attempts| LogFailure["Show Logs & Exit"]
AdminHealthy --> |Yes| CheckWeb["Check Web App Health"]
CheckWeb --> WebHealthy{Responding?}
WebHealthy --> |No| WebRetry["Retry (30 attempts)"]
WebRetry --> |Max Attempts| WebLogFailure["Show Logs & Exit"]
WebHealthy --> |Yes| ShowSuccess["Display Success Message"]
ShowSuccess --> ShowEndpoints["List Service Endpoints"]
ShowEndpoints --> ShowCommands["List Useful Commands"]
ShowCommands --> End([Setup Complete])
```

**Diagram sources**
- [quickstart.sh](file://apps/web/quickstart.sh#L1-L97)

**Section sources**
- [quickstart.sh](file://apps/web/quickstart.sh#L1-L97)
- [QUICKSTART.md](file://apps/web/QUICKSTART.md#L1-L165)

### Environment Setup Component
The environment configuration component ensures proper credential propagation and service connectivity.

```mermaid
classDiagram
class QuickstartScript {
+checkEnvFile()
+createEnvFromAdminApi()
+exportEnvironmentVariables()
+installDependencies()
+buildDockerImages()
+startServices()
+verifyHealth()
+displayCompletionInfo()
}
class SetupEnvScript {
+ADMIN_ENV_PATH
+OUTPUT_ENV_PATH
+validateAdminEnv()
+extractCredentials()
+addWebConfiguration()
+writeEnvFile()
}
class DockerCompose {
+include_infrastructure
+include_admin_api
+include_web_app
+include_api_gateway
+environment_variables
}
QuickstartScript --> SetupEnvScript : "utilizes"
QuickstartScript --> DockerCompose : "orchestrates"
SetupEnvScript --> QuickstartScript : "complements"
```

**Diagram sources**
- [quickstart.sh](file://apps/web/quickstart.sh#L1-L97)
- [setup-env.sh](file://apps/web/setup-env.sh#L1-L27)
- [docker-compose.yml](file://apps/web/docker-compose.yml#L1-L18)

**Section sources**
- [setup-env.sh](file://apps/web/setup-env.sh#L1-L27)
- [docker-compose.yml](file://apps/web/docker-compose.yml#L1-L18)

## Dependency Analysis
The onboarding automation system has a clear dependency hierarchy that ensures proper setup sequence and service availability.

```mermaid
graph TD
A[quickstart.sh] --> B[admin-api Dependencies]
A --> C[Docker Engine]
A --> D[docker-compose]
A --> E[curl]
A --> F[jq]
B --> G[node_modules]
G --> H[npm]
C --> I[Docker Images]
I --> J[admin-api Image]
I --> K[web Image]
I --> L[infrastructure Images]
D --> M[docker-compose.yml]
M --> N[docker-compose.infrastructure.yml]
M --> O[docker-compose.admin-api.yml]
M --> P[docker-compose.web.yml]
M --> Q[docker-compose.api-gateway.yml]
A --> R[.env.admin.production]
R --> S[Credentials]
S --> T[SESSION_SECRET]
S --> U[DISCORD_CLIENT_ID]
S --> V[DISCORD_CLIENT_SECRET]
S --> W[DISCORD_BOT_TOKEN]
S --> X[OPENAI_API_KEY]
```

**Diagram sources**
- [quickstart.sh](file://apps/web/quickstart.sh#L1-L97)
- [package.json](file://apps/admin-api/package.json)
- [package.json](file://apps/web/package.json)

**Section sources**
- [quickstart.sh](file://apps/web/quickstart.sh#L31-L39)
- [package.json](file://apps/admin-api/package.json)
- [package.json](file://apps/web/package.json)

## Performance Considerations
The onboarding automation is designed for efficiency and reliability, with several performance considerations built into the process. The script minimizes redundant operations by checking for existing dependencies and configuration files before performing potentially time-consuming tasks. The health check mechanism uses exponential backoff principles with a maximum of 30 attempts and 2-second intervals, providing sufficient time for services to initialize while preventing indefinite waiting.

The Docker image building process leverages Docker's layer caching mechanism, ensuring that unchanged components do not require rebuilding. This significantly reduces setup time for subsequent runs. The parallel service startup via docker-compose optimizes resource utilization during the initialization phase.

## Troubleshooting Guide
This section provides guidance for resolving common issues encountered during the onboarding process.

```mermaid
flowchart TD
Problem["Setup Issue Encountered"] --> Identify["Identify Problem Type"]
Identify --> AdminAPI["Admin API Issues"]
Identify --> WebApp["Web App Issues"]
Identify --> Network["Network/Connectivity Issues"]
Identify --> Env["Environment Issues"]
AdminAPI --> CheckLogs["docker compose logs admin-api"]
CheckLogs --> PortConflict["Check Port 3080 Usage"]
CheckLogs --> DepsMissing["Verify Dependencies Installed"]
CheckLogs --> ConfigError["Validate .env.docker Credentials"]
WebApp --> CheckLogsWeb["docker compose logs web"]
CheckLogsWeb --> PingAdmin["docker compose exec web ping admin-api"]
CheckLogsWeb --> CheckEnvVar["printenv | grep ADMIN_API_BASE"]
Network --> DockerRunning["Verify Docker Daemon Running"]
Network --> ComposeVersion["Check docker-compose Version"]
Network --> Firewall["Check Firewall Settings"]
Env --> EnvFileExists["Verify .env.docker Exists"]
Env --> FilePermissions["Check File Permissions"]
Env --> SourceAvailable["Confirm admin-api .env Exists"]
```

**Section sources**
- [QUICKSTART.md](file://apps/web/QUICKSTART.md#L104-L133)
- [quickstart.sh](file://apps/web/quickstart.sh#L53-L68)
- [quickstart.sh](file://apps/web/quickstart.sh#L70-L83)

## Conclusion
The developer onboarding automation system centered around the `quickstart.sh` script provides a robust, reliable, and efficient method for setting up the development environment. By automating the configuration of environment variables, installation of dependencies, and orchestration of containerized services, the system significantly reduces onboarding time and ensures consistency across development environments.

The integration with Docker enables isolated, reproducible environments that mirror production conditions, while the health verification process ensures that services are fully operational before declaring setup completion. The comprehensive troubleshooting guidance and well-documented process make it easy for developers to resolve issues and understand the setup workflow.

This automation represents a significant improvement over manual setup processes, reducing the potential for configuration errors and ensuring that all developers work with identical environments, ultimately leading to more reliable development and testing outcomes.