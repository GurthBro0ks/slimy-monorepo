# Club Data Retrieval

<cite>
**Referenced Files in This Document**   
- [route.ts](file://apps/web/app/api/club/latest/route.ts)
- [club.js](file://apps/admin-api/src/routes/club.js)
- [club.ts](file://apps/web/lib/api/club.ts)
- [admin-client.ts](file://apps/web/lib/api/admin-client.ts)
- [database.js](file://apps/admin-api/lib/database.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Request Structure](#request-structure)
3. [Response Schema](#response-schema)
4. [Error Responses](#error-responses)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Caching and Performance](#caching-and-performance)
7. [Frontend Usage Examples](#frontend-usage-examples)
8. [Database Query and Indexing](#database-query-and-indexing)

## Introduction
The `GET /api/guilds/:guildId/club/latest` endpoint retrieves the most recent club metrics for all members within a specified guild. This API is designed to provide real-time insights into member activity and performance, supporting analytics and leaderboard functionality across large communities. The endpoint is protected by JWT-based authentication and integrates with backend services through a proxy architecture.

**Section sources**
- [club.js](file://apps/admin-api/src/routes/club.js#L17-L46)

## Request Structure
The endpoint requires a valid guild ID as a path parameter and authenticates requests using JWT tokens. The request must include proper authorization headers issued by the authentication system.

### Parameters
- **guildId** (string, required): The unique identifier of the guild whose club data is being requested. This is passed as a URL path parameter.

### Authentication
- **Type**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- The token must contain valid claims granting access to the specified guild's resources.

### Example Request
```
GET /api/guilds/1176605506912141444/club/latest
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Section sources**
- [club.js](file://apps/admin-api/src/routes/club.js#L22-L24)

## Response Schema
On successful execution, the endpoint returns a JSON object containing club metrics for all members.

### Successful Response (200 OK)
```json
{
  "ok": true,
  "guildId": "1176605506912141444",
  "members": [
    {
      "memberKey": "member-001",
      "name": "SlimyKing",
      "simPower": 45000,
      "totalPower": 128000,
      "changePercent": 12.5,
      "lastSeenAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Indicates success status of the request |
| `guildId` | string | The ID of the guild for which data was retrieved |
| `members` | array | List of member metric objects |
| `memberKey` | string | Unique identifier for the member |
| `name` | string | Display name of the member |
| `simPower` | number | Simulation power score |
| `totalPower` | number | Total accumulated power score |
| `changePercent` | number/null | Percentage change from previous period (null if unavailable) |
| `lastSeenAt` | string/null | ISO timestamp of last activity |

**Section sources**
- [club.js](file://apps/admin-api/src/routes/club.js#L41-L45)
- [club.ts](file://apps/web/lib/api/club.ts#L15-L28)

## Error Responses
The endpoint returns standardized error responses for various failure conditions.

### 400 Bad Request - Missing Guild ID
```json
{
  "ok": false,
  "code": "MISSING_GUILD_ID",
  "message": "Guild ID is required"
}
```

### 401 Unauthorized - Invalid or Missing Token
Returned when the JWT is missing, malformed, or expired.

### 403 Forbidden - Insufficient Permissions
Returned when the authenticated user does not have access to the specified guild.

### 500 Internal Server Error
```json
{
  "ok": false,
  "code": "INTERNAL_ERROR",
  "message": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "ok": false,
  "code": "CONFIG_ERROR",
  "message": "Admin API not configured - use sandbox mode"
}
```

**Section sources**
- [route.ts](file://apps/web/app/api/club/latest/route.ts#L19-L27)
- [route.ts](file://apps/web/app/api/club/latest/route.ts#L31-L38)
- [admin-client.ts](file://apps/web/lib/api/admin-client.ts#L132-L136)

## Data Flow Architecture
The request flows through multiple layers from the frontend to the database, with proper abstraction and error handling at each stage.

```mermaid
sequenceDiagram
participant Frontend as Web Application
participant NextJS as Next.js API Route
participant AdminAPI as Admin API Service
participant DB as Database
Frontend->>NextJS : GET /api/club/latest?guildId=...
NextJS->>AdminAPI : Proxy GET /api/guilds/{guildId}/club/latest
AdminAPI->>DB : Query latest club metrics
DB-->>AdminAPI : Return raw member data
AdminAPI->>AdminAPI : Format response
AdminAPI-->>NextJS : JSON response
NextJS-->>Frontend : Forward response
```

**Diagram sources**
- [route.ts](file://apps/web/app/api/club/latest/route.ts#L42-L47)
- [club.js](file://apps/admin-api/src/routes/club.js#L28-L29)

**Section sources**
- [route.ts](file://apps/web/app/api/club/latest/route.ts#L42-L47)
- [club.js](file://apps/admin-api/src/routes/club.js#L28-L29)

## Caching and Performance
The endpoint leverages edge runtime with automatic revalidation to optimize performance and reduce backend load.

### Caching Configuration
- **Runtime**: Edge
- **Revalidation**: Every 30 seconds (`revalidate = 30`)
- This ensures that frequently accessed data is served quickly while maintaining reasonable freshness.

### Performance Implications
For large guilds with thousands of members:
- Memory usage increases linearly with member count
- Response time may increase due to data serialization overhead
- Database query performance depends on proper indexing

The edge runtime helps mitigate these issues by caching responses and reducing the number of direct calls to the admin API.

**Section sources**
- [route.ts](file://apps/web/app/api/club/latest/route.ts#L4-L5)

## Frontend Usage Examples
The API can be consumed using the provided client library or direct fetch calls.

### Using Club API Client
```typescript
import { fetchClubLatest } from '@/lib/api/club';

async function loadClubData() {
  try {
    const result = await fetchClubLatest('1176605506912141444');
    
    if (result.ok) {
      console.log(`Loaded ${result.members.length} members`);
      // Process member data
    } else {
      console.error('Failed to load club data:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### Direct Fetch Example
```javascript
const response = await fetch('/api/club/latest?guildId=1176605506912141444');
const data = await response.json();
```

**Section sources**
- [club.ts](file://apps/web/lib/api/club.ts#L145-L177)

## Database Query and Indexing
The underlying data retrieval relies on efficient database queries with proper indexing strategies.

### Query Pattern
The `getLatest()` function in `club-store.js` executes a database query to retrieve the most recent metrics for all members in a guild. While the exact SQL is not visible in the provided files, the pattern suggests a query that:
- Filters by `guildId`
- Orders by observation timestamp
- Selects latest record per member

### Indexing Strategy
To support high-performance queries on large datasets:
- **Primary Index**: On `guildId` and `member_key` combination
- **Time-based Index**: On `observed_at` for temporal queries
- **Composite Index**: Likely exists on `(guildId, observed_at)` to optimize the "latest" lookup

The database connection is managed through a connection pool using `mysql2/promise`, ensuring efficient resource utilization under load.

```mermaid
erDiagram
CLUB_METRICS {
string guildId PK
string member_key PK
number sim_power
number total_power
timestamp observed_at
timestamp last_seen_at
}
CLUB_METRICS ||--|| GUILDS : "belongs to"
CLUB_METRICS ||--|| MEMBERS : "tracks"
```

**Diagram sources**
- [database.js](file://apps/admin-api/lib/database.js#L31-L33)
- [club.js](file://apps/admin-api/src/routes/club.js#L28)

**Section sources**
- [database.js](file://apps/admin-api/lib/database.js#L31-L33)
- [club.js](file://apps/admin-api/src/routes/club.js#L28)