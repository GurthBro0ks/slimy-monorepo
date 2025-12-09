# Shared Database Access Package

<cite>
**Referenced Files in This Document**   
- [database.js](file://apps/admin-api/lib/database.js)
- [database.js](file://apps/admin-api/src/lib/database.js)
- [db.ts](file://apps/web/lib/db.ts)
- [schema.prisma](file://apps/admin-api/prisma/schema.prisma)
- [schema.prisma](file://apps/web/prisma/schema.prisma)
- [fix-shadow-permissions.sh](file://scripts/infra/fix-shadow-permissions.sh)
- [allow-shadow-db.sh](file://scripts/infra/allow-shadow-db.sh)
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
The shared-db package is designed to encapsulate database access patterns and Prisma client initialization across the platform, ensuring consistent database connections, transaction handling, and ORM usage between admin-api, web, and background services. This document provides a comprehensive analysis of the current database access implementations across the monorepo and outlines the requirements for the shared-db package.

## Project Structure

```mermaid
graph TD
A[shared-db] --> B[package.json]
C[admin-api] --> D[lib/database.js]
C --> E[src/lib/database.js]
F[web] --> G[lib/db.ts]
H[prisma] --> I[schema.prisma]
H --> J[migrations/]
K[scripts/infra] --> L[allow-shadow-db.sh]
K --> M[fix-shadow-permissions.sh]
```

**Diagram sources**
- [package.json](file://packages/shared-db/package.json)
- [database.js](file://apps/admin-api/lib/database.js)
- [database.js](file://apps/admin-api/src/lib/database.js)
- [db.ts](file://apps/web/lib/db.ts)

**Section sources**
- [package.json](file://packages/shared-db/package.json)

## Core Components

The shared-db package will consolidate database access patterns currently implemented across multiple applications. Key components include Prisma client initialization, connection pooling, transaction management, and error handling. The package will provide a unified interface for database operations while maintaining the specific requirements of each service.

**Section sources**
- [database.js](file://apps/admin-api/lib/database.js)
- [database.js](file://apps/admin-api/src/lib/database.js)
- [db.ts](file://apps/web/lib/db.ts)

## Architecture Overview

```mermaid
graph TD
subgraph "Applications"
A[admin-api]
B[web]
C[background services]
end
subgraph "Shared Database Package"
D[Prisma Client]
E[Connection Pool]
F[Transaction Manager]
G[Error Handler]
H[Metrics Integration]
end
subgraph "Database"
I[MySQL]
J[Shadow Databases]
end
A --> D
B --> D
C --> D
D --> E
D --> F
D --> G
D --> H
E --> I
F --> I
G --> I
H --> I
D --> J
```

**Diagram sources**
- [database.js](file://apps/admin-api/src/lib/database.js)
- [db.ts](file://apps/web/lib/db.ts)
- [schema.prisma](file://apps/admin-api/prisma/schema.prisma)

## Detailed Component Analysis

### Database Client Initialization

The shared-db package will standardize Prisma client initialization across all services. Currently, different applications implement their own initialization logic with varying configurations.

```mermaid
classDiagram
class DatabaseClient {
-prisma : PrismaClient
-isInitialized : boolean
+initialize() : Promise~boolean~
+getClient() : PrismaClient
+close() : Promise~void~
+testConnection() : Promise~boolean~
+getHealth() : Promise~HealthStatus~
}
class HealthStatus {
+healthy : boolean
+responseTime : number
+error? : string
}
class ConnectionConfig {
+url : string
+logLevel : string[]
+connectionLimit : number
}
DatabaseClient --> ConnectionConfig : "uses"
```

**Diagram sources**
- [database.js](file://apps/admin-api/src/lib/database.js#L6-72)
- [db.ts](file://apps/web/lib/db.ts#L7-43)

**Section sources**
- [database.js](file://apps/admin-api/src/lib/database.js)
- [db.ts](file://apps/web/lib/db.ts)

### Transaction Management

The shared-db package will provide consistent transaction handling across services. The current implementation in admin-api demonstrates a robust transaction pattern that should be standardized.

```mermaid
sequenceDiagram
participant App as Application
participant DB as DatabaseClient
participant Prisma as PrismaClient
participant Metrics as Monitoring
App->>DB : tx(fn)
DB->>Prisma : getConnection()
DB->>Prisma : beginTransaction()
DB->>App : Execute transaction function
alt Success
App->>DB : Return result
DB->>Prisma : commit()
DB->>Metrics : recordDatabaseQuery(duration)
DB->>App : Return result
else Failure
App->>DB : Throw error
DB->>Prisma : rollback()
DB->>Metrics : recordError()
DB->>App : Throw error
end
DB->>Prisma : releaseConnection()
```

**Diagram sources**
- [database.js](file://apps/admin-api/lib/database.js#L41-57)

### Connection Pooling and Lifecycle Management

The shared-db package will manage connection pooling and lifecycle events consistently across services. The implementation will combine the best practices from existing applications.

```mermaid
flowchart TD
Start([Initialize]) --> Config{"Configuration Valid?"}
Config --> |No| ReadEnv["Read DB_URL from environment"]
Config --> |Yes| CreatePool["Create Connection Pool"]
ReadEnv --> CreatePool
CreatePool --> Test{"Test Connection"}
Test --> |Success| Success["Mark as initialized"]
Test --> |Failure| Warn["Log warning"]
Warn --> ReadOnly["Continue in read-only mode"]
Success --> End([Ready])
ReadOnly --> End
```

**Diagram sources**
- [database.js](file://apps/admin-api/lib/database.js#L18-29)
- [database.js](file://apps/admin-api/lib/database.js#L63-79)

### Error Handling and Resilience

The shared-db package will implement comprehensive error handling for database outages and connection issues, ensuring graceful degradation and proper monitoring.

```mermaid
stateDiagram-v2
[*] --> Disconnected
Disconnected --> Connecting : "initialize()"
Connecting --> Connected : "connection successful"
Connecting --> Reconnecting : "connection failed"
Connected --> Disconnected : "connection lost"
Reconnecting --> Connected : "reconnection successful"
Reconnecting --> Reconnecting : "retry after delay"
Connected --> Connected : "heartbeat check"
Disconnected --> Disconnected : "retry after delay"
note right of Reconnecting
Implements exponential backoff
Logs connection attempts
Emits health events
end note
```

**Diagram sources**
- [database.js](file://apps/admin-api/lib/database.js#L63-79)
- [db.ts](file://apps/web/lib/db.ts#L47-54)

## Dependency Analysis

```mermaid
graph TD
A[shared-db] --> B[@prisma/client]
A --> C[monitoring/metrics]
A --> D[config]
E[admin-api] --> A
F[web] --> A
G[background services] --> A
B --> H[MySQL Database]
A --> H
I[Prisma Migrations] --> A
J[Shadow Database Scripts] --> A
```

**Diagram sources**
- [package.json](file://packages/shared-db/package.json)
- [database.js](file://apps/admin-api/src/lib/database.js#L2)
- [db.ts](file://apps/web/lib/db.ts#L7)
- [allow-shadow-db.sh](file://scripts/infra/allow-shadow-db.sh)
- [fix-shadow-permissions.sh](file://scripts/infra/fix-shadow-permissions.sh)

**Section sources**
- [package.json](file://packages/shared-db/package.json)
- [database.js](file://apps/admin-api/src/lib/database.js)
- [db.ts](file://apps/web/lib/db.ts)
- [allow-shadow-db.sh](file://scripts/infra/allow-shadow-db.sh)
- [fix-shadow-permissions.sh](file://scripts/infra/fix-shadow-permissions.sh)

## Performance Considerations

The shared-db package will incorporate performance optimizations from existing implementations, including query instrumentation, connection pooling, and indexing strategies. The package will provide built-in metrics collection for database queries and connection management, enabling monitoring and optimization of database performance across all services.

**Section sources**
- [database.js](file://apps/admin-api/src/lib/database.js#L23-37)
- [schema.prisma](file://apps/admin-api/prisma/schema.prisma)

## Troubleshooting Guide

The shared-db package will include comprehensive troubleshooting capabilities, including health checks, connection testing, and detailed error reporting. When database connectivity issues occur, the package will provide clear diagnostic information to aid in resolution.

**Section sources**
- [db.ts](file://apps/web/lib/db.ts#L47-80)
- [database.js](file://apps/admin-api/lib/database.js#L63-79)

## Conclusion

The shared-db package will unify database access patterns across the platform, providing consistent initialization, connection management, transaction handling, and error resilience. By consolidating the best practices from existing implementations, the package will ensure reliable and performant database access for all services while simplifying maintenance and reducing code duplication.