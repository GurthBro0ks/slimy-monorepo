# Codes Aggregator: API Specification

This document defines the API endpoints, data schemas, caching rules, and service states for the Codes Aggregator feature.

## 1. Endpoints

### `GET /api/codes`

Retrieves a list of aggregated codes.

**Query Parameters:**

*   `filter` (optional, string): Filters the codes. Possible values: `active`, `past7`, `all`. Defaults to `active`.
*   `page` (optional, integer): The page number for pagination. Defaults to `1`.
*   `limit` (optional, integer): The number of items per page. Defaults to `20`.

## 2. Request/Response Schemas

### Request Schema

The `GET /api/codes` endpoint does not have a request body.

### Response Schema

The response will be a JSON object with the following structure:

```json
{
  "data": [
    // Array of Code objects
  ],
  "pagination": {
    "total_items": 100,
    "total_pages": 5,
    "current_page": 1,
    "page_size": 20
  }
}
```

### `Code` Object Schema

```typescript
type Code = {
  code: string; // UPPERCASE; dashes preserved
  title?: string;
  description?: string;
  rewards?: string[];
  region?: 'global'|'na'|'eu'|'asia'|string|null;
  expires_at?: string|null;   // ISO 8601
  first_seen_at: string;      // ISO 8601
  last_seen_at: string;       // ISO 8601
  sources: Array<{
    site: 'discord'|'reddit'|'twitter'|'wiki'|'pocketgamer'|'snelp';
    url?: string;
    post_id?: string;         // tweet id, reddit id, discord message id
    confidence: number;       // 0..1 (weight by source)
    fetched_at: string;       // ISO 8601
  }>;
  verified: boolean;
  tags?: string[];
};
```

## 3. Caching Rules

*   **Client-side:** The API responses will include `Cache-Control` headers to enable client-side caching.
*   **Server-side:** The aggregated data will be cached on the server with a Time-to-Live (TTL) of 10-15 minutes. A `stale-while-revalidate` policy of 24 hours will be used to ensure that stale data can be served while fresh data is being fetched.

## 4. Pagination

The API will use page-based pagination. The `page` and `limit` query parameters can be used to control the pagination. The response will include a `pagination` object with details about the total number of items, total pages, current page, and page size.

## 5. Service States

The service will expose the status of each adapter to provide visibility into the health of the data aggregation process. The possible states for each adapter are:

*   `ok`: The adapter is functioning correctly.
*   `degraded`: The adapter is experiencing intermittent failures.
*   `failed`: The adapter has failed completely.
*   `not_configured`: The adapter has not been configured (e.g., missing API keys).
