# Shared Configuration Package

<cite>
**Referenced Files in This Document**   
- [config.js](file://apps/admin-api/src/config.js)
- [env.js](file://apps/web/lib/env.js)
- [env.ts](file://apps/web/lib/env.ts)
- [config.ts](file://apps/web/lib/config.ts)
- [schemas.js](file://apps/admin-api/src/lib/validation/schemas.js)
- [schemas.ts](file://apps/admin-api/src/lib/validation/schemas.ts)
- [package.json](file://packages/shared-config/package.json)
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
The shared-config package is designed to standardize environment configuration management across all applications in the monorepo. Although the package itself currently lacks implementation, the configuration patterns are already established across the admin-api, web, and bot services. This document details how these applications handle environment variables, validation, and configuration loading, providing a blueprint for the future implementation of the shared-config package.

## Project Structure

```mermaid
graph TD
A[shared-config] --> B[package.json]
C[admin-api] --> D[src/config.js]
C --> E[src/lib/validation/schemas.js]
F[web] --> G[lib/env.js]
F --> H[lib/config.ts]
F --> I[lib/env.ts]
```

**Diagram sources**
- [package.json](file://packages/shared-config/package.json)
- [config.js](file://apps/admin-api/src/config.js)
- [env.js](file://apps/web/lib/env.js)
- [config.ts](file://apps/web/lib/config.ts)

**Section sources**
- [package.json](file://packages/shared-config/package.json)
- [config.js](file://apps/admin-api/src/config.js)
- [env.js](file://apps/web/lib/env.js)
- [config.ts](file://apps/web/lib/config.ts)

## Core Components

The configuration system in the monorepo consists of several key components that will be consolidated into the shared-config package:

1. **Environment Variable Validation**: Using Zod for runtime type checking and validation
2. **Configuration Loading**: Centralized configuration objects with default values
3. **Environment Detection**: Helpers for determining NODE_ENV and related behaviors
4. **Feature Detection**: Utilities to check for optional service availability

The current implementation shows a clear pattern of separating environment variable validation from application configuration, with the web application using a more comprehensive approach with Zod validation.

**Section sources**
- [env.js](file://apps/web/lib/env.js)
- [config.js](file://apps/admin-api/src/config.js)
- [config.ts](file://apps/web/lib/config.ts)

## Architecture Overview

```mermaid
graph TD
subgraph "Application Layer"
A[Admin API]
B[Web App]
C[Bot Service]
end
subgraph "Configuration Layer"
D[Environment Variables]
E[Validation Schemas]
F[Config Objects]
end
subgraph "Shared Package"
G[shared-config]
end
A --> E
A --> F
B --> E
B --> F
C --> E
C --> F
G --> E
G --> F
D --> E
E --> F
F --> A
F --> B
F --> C
style G fill:#f9f,stroke:#333
style E fill:#bbf,stroke:#333
style F fill:#bfb,stroke:#333
```

**Diagram sources**
- [env.js](file://apps/web/lib/env.js)
- [config.js](file://apps/admin-api/src/config.js)
- [config.ts](file://apps/web/lib/config.ts)

## Detailed Component Analysis

### Environment Validation Analysis

The configuration system implements robust environment variable validation using Zod, particularly in the web application. The validation process separates server-side and client-side environment variables, ensuring that sensitive configuration remains server-only while public configuration is safely exposed to the client.

```mermaid
classDiagram
class EnvironmentValidator {
+NODE_ENV : string
+OPENAI_API_KEY : string | undefined
+OPENAI_API_BASE : string
+MCP_BASE_URL : string | undefined
+MCP_API_KEY : string | undefined
+REDIS_URL : string | undefined
+REDIS_HOST : string | undefined
+REDIS_PORT : number | undefined
+REDIS_PASSWORD : string | undefined
+CI : boolean
+PLAYWRIGHT_DEBUG : boolean
+NEXT_PUBLIC_APP_URL : string
+NEXT_PUBLIC_ADMIN_API_BASE : string
+NEXT_PUBLIC_SNELP_CODES_URL : string
+NEXT_PUBLIC_PLAUSIBLE_DOMAIN : string | undefined
+NEXT_PUBLIC_CDN_DOMAIN : string | undefined
+validateServerEnv() : ServerEnv
+validateClientEnv() : ClientEnv
+isProduction() : boolean
+isDevelopment() : boolean
+isTest() : boolean
+getAppUrl() : string
+hasOpenAI() : boolean
+hasMCP() : boolean
+hasRedis() : boolean
+hasDocsImport() : boolean
}
class ConfigManager {
+cacheConfig : CacheConfig
+rateLimitConfig : RateLimitConfig
+apiClientConfig : ApiClientConfig
+codesConfig : CodesConfig
+chatConfig : ChatConfig
+openAIConfig : OpenAIConfig
+clubConfig : ClubConfig
+featureFlagsConfig : FeatureFlagsConfig
+paginationConfig : PaginationConfig
+storageConfig : StorageConfig
+monitoringConfig : MonitoringConfig
+securityConfig : SecurityConfig
+buildConfig : BuildConfig
+config : Config
}
EnvironmentValidator --> ConfigManager : "provides validated env"
ConfigManager --> EnvironmentValidator : "consumes env values"
```

**Diagram sources**
- [env.js](file://apps/web/lib/env.js)
- [config.ts](file://apps/web/lib/config.ts)

### Configuration Schema Analysis

The configuration schema design follows a modular approach with typed constants. Each configuration category is defined as a separate object with specific properties and default values. The web application's implementation is particularly comprehensive, covering multiple aspects of the application including caching, rate limiting, API clients, and feature flags.

```mermaid
flowchart TD
Start([Configuration Initialization]) --> LoadEnv["Load Environment Variables"]
LoadEnv --> ValidateEnv["Validate with Zod Schemas"]
ValidateEnv --> CheckMissing["Check for Missing Required Vars"]
CheckMissing --> |Missing| Warn["Log Warning"]
CheckMissing --> |All Present| ProcessConfig["Process Configuration"]
ProcessConfig --> ParseTypes["Parse Boolean/List Values"]
ParseTypes --> ResolveDefaults["Apply Default Values"]
ResolveDefaults --> CreateConfig["Create Configuration Object"]
CreateConfig --> ExportConfig["Export Configuration"]
ExportConfig --> End([Configuration Ready])
style Warn fill:#ffcccc,stroke:#ff0000
style ExportConfig fill:#ccffcc,stroke:#00cc00
```

**Diagram sources**
- [config.js](file://apps/admin-api/src/config.js)
- [env.js](file://apps/web/lib/env.js)

### Admin API Configuration Analysis

The admin-api implements a straightforward configuration system with environment variable loading and basic validation. It defines configuration categories for Discord authentication, JWT handling, CSRF protection, network settings, role management, and UI integration. The configuration includes helper functions for parsing boolean and list values from environment variables.

```mermaid
sequenceDiagram
participant App as "Application"
participant Config as "config.js"
participant Env as "Environment Variables"
App->>Config : Require config
Config->>Env : Read DISCORD_CLIENT_ID
Env-->>Config : Value or ""
Config->>Env : Read DISCORD_CLIENT_SECRET
Env-->>Config : Value or ""
Config->>Env : Read JWT_SECRET
Env-->>Config : Value or ""
Config->>Config : Parse boolean values
Config->>Config : Parse list values
Config->>Config : Resolve origins
Config->>App : Return config object
App->>Config : Check for missing auth vars
Config->>App : Return missing vars list
App->>Console : Log warning if missing
```

**Diagram sources**
- [config.js](file://apps/admin-api/src/config.js)

## Dependency Analysis

```mermaid
graph TD
A[shared-config] --> B[Zod]
C[admin-api] --> D[shared-config]
E[web] --> D[shared-config]
F[bot] --> D[shared-config]
D --> G[TypeScript]
D --> H[Node.js]
style A fill:#f9f,stroke:#333
style D fill:#f9f,stroke:#333
style B fill:#ffcc00,stroke:#333
style G fill:#00ccff,stroke:#333
style H fill:#00ff00,stroke:#333
```

**Diagram sources**
- [package.json](file://packages/shared-config/package.json)
- [config.js](file://apps/admin-api/src/config.js)
- [env.js](file://apps/web/lib/env.js)

## Performance Considerations

The current configuration implementation has several performance implications that should be considered for the shared package:

1. **Validation Overhead**: Environment validation occurs at module load time, which adds startup cost but ensures configuration validity early
2. **Memory Usage**: Configuration objects are created once and reused, minimizing memory overhead during application runtime
3. **Type Safety**: The use of Zod and TypeScript provides compile-time and runtime type safety, reducing configuration-related errors
4. **Caching**: Configuration values are computed once and cached in module scope, avoiding repeated parsing

The shared-config package should maintain these performance characteristics while potentially optimizing the validation process for production environments.

## Troubleshooting Guide

Common configuration issues and their solutions:

**Section sources**
- [config.js](file://apps/admin-api/src/config.js)
- [env.js](file://apps/web/lib/env.js)
- [schemas.js](file://apps/admin-api/src/lib/validation/schemas.js)

### Missing Environment Variables
When required environment variables are missing, applications log warnings but continue to run with fallback values. To resolve:
1. Check the appropriate .env file for the environment
2. Verify variable names match the expected format
3. Ensure the .env file is being loaded by the application
4. Check for typos in variable names

### Type Mismatch Errors
When environment variables have incorrect types (e.g., string instead of number), the validation system will throw errors. To resolve:
1. Verify the expected type in the validation schema
2. Convert the environment variable to the correct type
3. Check for whitespace or special characters in the value
4. Use the appropriate parsing function (parseBoolean, parseList, etc.)

### Environment-Specific Configuration Issues
When configuration behaves differently across environments:
1. Check for environment-specific .env files (.env.production, .env.development)
2. Verify NODE_ENV is set correctly
3. Check for conditional logic based on environment
4. Ensure secrets are properly managed and not committed to version control

## Conclusion

The shared-config package will consolidate the existing configuration patterns from across the monorepo into a standardized, reusable solution. The current implementations in admin-api and web applications demonstrate effective approaches to environment variable management, validation, and configuration loading that should be incorporated into the shared package. Key features to include are Zod-based validation, environment detection helpers, typed configuration objects, and support for both server and client environments. The package should maintain backward compatibility while providing a consistent interface for all applications in the monorepo.