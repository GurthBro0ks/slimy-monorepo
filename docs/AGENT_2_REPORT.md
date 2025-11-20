# Agent 2: Typed HTTP Client & API Contract

## Executive Summary

**Status:** COMPLETE
**Date:** 2025-11-20
**Objective:** Create a unified, type-safe HTTP client shared between apps/web and apps/admin-api

## Current State Analysis

### What Exists

#### apps/web HTTP Stack (TypeScript)

**Location:** `apps/web/lib/`

1. **AdminApiClient** (`lib/api/admin-client.ts`)
   - Core HTTP client for web → admin-api communication
   - Features: timeout, error handling, streaming (SSE)
   - Response type: `ApiResponse<T>` (discriminated union)

2. **ApiClient** (`lib/api-client.ts`)
   - Wrapper around AdminApiClient
   - Additional features: retry logic, caching, interceptors
   - Retry: Exponential backoff (1s → 30s max) for 408, 429, 5xx
   - Cache: TTL-based for GET requests

3. **Error Handling** (`lib/errors.ts`)
   - Comprehensive error hierarchy: AppError, AuthenticationError, ValidationError, etc.
   - Structured error codes: UNAUTHORIZED, NETWORK_ERROR, TIMEOUT_ERROR, etc.
   - Utilities: toAppError(), logError(), asyncHandler()

4. **API Error Handler** (`lib/api-error-handler.ts`)
   - Zod validation error handling
   - Response helpers: successResponse(), errorResponse(), paginatedResponse()
   - Request parsing: parseRequestBody(), parseQueryParams()

#### apps/admin-api HTTP Usage (JavaScript)

**Location:** `apps/admin-api/src/`

1. **Raw fetch usage** in services:
   - `services/oauth.js` - Discord OAuth + API calls
   - `services/chat-bot.js` - OpenAI API calls
   - Various routes - Direct fetch to external services

2. **Error Handling** (`lib/errors.js`)
   - AppError base class (JavaScript)
   - formatErrorResponse() for consistent responses
   - Middleware: error-handler.js for Express

### Key Patterns Identified

#### Response Type (Discriminated Union)

```typescript
export interface ApiError {
  ok: false;
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
  status: number;
  headers: Headers;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
```

✅ **This pattern is excellent and will be preserved.**

#### Base URL Configuration

- apps/web: `process.env.NEXT_PUBLIC_ADMIN_API_BASE` (validated via Zod)
- apps/admin-api: Hardcoded URLs for external services (Discord, OpenAI)

#### Error Codes

Well-defined error codes across the stack:
- `NETWORK_ERROR` - Network/connectivity issues
- `TIMEOUT_ERROR` - Request timeout
- `UPSTREAM_ERROR` - Upstream service error
- `CONFIG_ERROR` - Configuration issue
- `VALIDATION_ERROR` - Request validation failure
- `UNAUTHORIZED` - Auth required
- And more...

### Gaps & Opportunities

1. **No shared HTTP client** - Each app implements its own fetch wrapper
2. **Inconsistent error handling** - admin-api uses throw, web uses ApiResponse
3. **No retry logic in admin-api** - External API calls can fail transiently
4. **JavaScript vs TypeScript** - admin-api would benefit from types
5. **Code duplication** - Similar fetch patterns repeated

## Target Architecture

### Design Principles

1. **Universal compatibility** - Works in Node.js (admin-api) and Browser (web)
2. **Type safety** - Full TypeScript with generic support
3. **Minimal dependencies** - Use native fetch, avoid external HTTP libraries
4. **Progressive enhancement** - Core client is simple, apps can extend
5. **Preserve existing patterns** - Keep ApiResponse<T> discriminated union

### Package Structure

```
packages/shared-http/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Main exports
│   ├── client.ts          # HttpClient class
│   ├── types.ts           # ApiResponse, ApiError, etc.
│   ├── errors.ts          # Error codes and utilities
│   └── retry.ts           # Retry logic helpers
└── dist/                  # Built output (ESM + CJS)
```

### Core API

#### HttpClient Class

```typescript
class HttpClient {
  constructor(config?: HttpClientConfig);

  // HTTP methods
  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;

  // Generic request
  request<T>(method: string, url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}
```

#### Configuration

```typescript
interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  retry?: RetryConfig;
  headers?: Record<string, string>;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface RequestConfig {
  timeout?: number;
  retry?: RetryConfig | false;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}
```

### Migration Strategy

#### Phase 1: Create Shared Package ✅

1. Create `packages/shared-http` with TypeScript setup
2. Implement core HttpClient based on AdminApiClient
3. Export types: ApiResponse, ApiError, ApiSuccess
4. Include retry logic with exponential backoff
5. Add comprehensive error handling

#### Phase 2: Migrate apps/web (Low Risk)

1. Update AdminApiClient to use shared HttpClient internally
2. Keep existing ApiClient wrapper (web-specific features: caching, interceptors)
3. Update imports to use shared types
4. Validate: Run web tests and build

#### Phase 3: Adopt in apps/admin-api (Medium Risk)

1. Add @slimy/shared-http to admin-api dependencies
2. Migrate 1-2 services as proof of concept:
   - `services/oauth.js` → TypeScript with HttpClient
   - `services/chat-bot.js` → TypeScript with HttpClient
3. Keep error response format consistent
4. Validate: Run admin-api tests

#### Phase 4: Documentation & Cleanup

1. Update docs with usage examples
2. Add JSDoc comments to all public APIs
3. Create migration guide for remaining services
4. Mark legacy code paths

## Implementation Details

### Shared Types (packages/shared-http/src/types.ts)

```typescript
/**
 * Successful API response
 */
export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
  status: number;
  headers?: Headers;
}

/**
 * API error response
 */
export interface ApiError {
  ok: false;
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Discriminated union of success or error
 * Use pattern matching: if (response.ok) { response.data } else { response.code }
 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
```

### Error Codes (packages/shared-http/src/errors.ts)

```typescript
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  ABORT_ERROR = 'ABORT_ERROR',

  // Client errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Server errors
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Configuration
  CONFIG_ERROR = 'CONFIG_ERROR',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export function isRetryableError(error: ApiError): boolean {
  const retryableCodes = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT_ERROR,
  ];
  const retryableStatuses = [408, 429, 500, 502, 503, 504];

  return retryableCodes.includes(error.code as ErrorCode) ||
         (error.status !== undefined && retryableStatuses.includes(error.status));
}
```

### Retry Logic (packages/shared-http/src/retry.ts)

```typescript
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 30000,      // 30 seconds
  backoffMultiplier: 2,
};

export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

export async function withRetry<T>(
  fn: () => Promise<ApiResponse<T>>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<ApiResponse<T>> {
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const result = await fn();

    if (result.ok) {
      return result;
    }

    lastError = result;

    // Don't retry on last attempt
    if (attempt >= config.maxRetries) {
      break;
    }

    // Check if error is retryable
    if (!isRetryableError(lastError)) {
      break;
    }

    // Wait before retry
    const delay = calculateRetryDelay(attempt, config);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return lastError || {
    ok: false,
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'Request failed after all retries',
  };
}
```

### HttpClient Implementation (packages/shared-http/src/client.ts)

```typescript
export class HttpClient {
  private config: Required<HttpClientConfig>;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 30000,
      retry: config.retry || DEFAULT_RETRY_CONFIG,
      headers: config.headers || {},
    };
  }

  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const path = url.startsWith('/') ? url : `/${url}`;
    return `${this.config.baseUrl}${path}`;
  }

  async request<T = unknown>(
    method: string,
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = this.buildUrl(url);
    const timeout = config.timeout ?? this.config.timeout;
    const retryConfig = config.retry === false ? null :
                       (config.retry || this.config.retry);

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeoutId = timeout > 0
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      try {
        const response = await fetch(fullUrl, {
          method: method.toUpperCase(),
          headers: {
            ...this.config.headers,
            ...config.headers,
          },
          signal: config.signal || controller.signal,
          ...config,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          return await this.handleErrorResponse(response);
        }

        const data = await this.parseResponse<T>(response);

        return {
          ok: true,
          data,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        return this.handleError(error);
      }
    };

    if (retryConfig) {
      return withRetry(makeRequest, retryConfig);
    }

    return makeRequest();
  }

  async get<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, {
      ...config,
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  // ... similar for put, patch, delete
}
```

## Usage Examples

### In apps/web (Next.js API route)

```typescript
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  // ApiClient internally uses shared HttpClient via AdminApiClient
  const result = await apiClient.get('/api/guilds', {
    useCache: true,
    cacheTtl: 300000,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status || 500 });
  }

  return NextResponse.json(result.data);
}
```

### In apps/admin-api (service)

```typescript
import { HttpClient } from '@slimy/shared-http';

const discordClient = new HttpClient({
  baseUrl: 'https://discord.com/api/v10',
  timeout: 10000,
  retry: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },
});

export async function fetchUserGuilds(accessToken: string) {
  const result = await discordClient.get('/users/@me/guilds', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!result.ok) {
    // Handle error consistently
    throw new AppError(
      result.message,
      result.code,
      result.status || 500,
      result.details
    );
  }

  return result.data;
}
```

## Testing Strategy

### Unit Tests (packages/shared-http)

1. **HttpClient tests**
   - Request methods (GET, POST, PUT, PATCH, DELETE)
   - URL building (relative, absolute, with baseUrl)
   - Timeout handling
   - Signal/abort handling

2. **Retry logic tests**
   - Exponential backoff calculation
   - Retry on retryable errors
   - No retry on non-retryable errors
   - Max retries respected

3. **Error handling tests**
   - Network errors
   - Timeout errors
   - HTTP error responses
   - JSON parsing errors

### Integration Tests

1. **apps/web**
   - Existing test suites should pass
   - API route tests with mocked admin-api

2. **apps/admin-api**
   - Service tests with mocked external APIs
   - Error handling consistency

## Follow-up Tasks

### Immediate (Completed)

- [x] Create packages/shared-http package
- [x] Implement HttpClient with retry logic
- [x] Export shared types and utilities
- [x] Add TypeScript configuration
- [x] Update apps/web to use shared types
- [x] Run web build to validate

### Near-term (Recommended)

- [ ] Migrate apps/admin-api services to TypeScript
- [ ] Add unit tests for shared-http package
- [ ] Migrate oauth.js to use HttpClient
- [ ] Migrate chat-bot.js to use HttpClient
- [ ] Add JSDoc comments to all public APIs

### Long-term (Optional)

- [ ] Add request/response interceptors to HttpClient
- [ ] Support streaming responses (SSE)
- [ ] Add OpenTelemetry tracing
- [ ] Create admin-api service migration guide
- [ ] Consider GraphQL client integration

## Known Limitations & Trade-offs

### What Was NOT Changed

1. **ApiClient wrapper in apps/web**
   - Kept as-is with caching and web-specific features
   - This is intentional - caching is browser/Next.js specific

2. **Admin-api services**
   - Still using raw fetch (migration is gradual)
   - Still JavaScript (TypeScript migration is optional)

3. **Error handling in admin-api**
   - Still throws errors (Express convention)
   - ApiResponse pattern is optional for internal services

### Design Trade-offs

1. **Universal vs Optimized**
   - Chose universal (Node + Browser) over environment-specific optimization
   - Trade-off: Some browser-specific optimizations (like caching) stay in apps/web

2. **Simple vs Feature-rich**
   - Chose simple core with app-level extensions
   - Trade-off: Apps need to add their own caching, interceptors, etc.

3. **Gradual vs Big-bang Migration**
   - Chose gradual migration with backward compatibility
   - Trade-off: Temporary code duplication during transition

## Risks & Mitigations

### Risk: Breaking existing functionality

**Mitigation:**
- AdminApiClient internally uses shared HttpClient
- ApiClient wrapper unchanged
- All existing tests pass

### Risk: Node.js vs Browser compatibility

**Mitigation:**
- Use native fetch (available in Node 18+)
- Test in both environments
- Avoid browser-only APIs (localStorage, window, etc.)

### Risk: TypeScript complexity in JavaScript admin-api

**Mitigation:**
- Keep migration optional
- Provide JavaScript examples
- HttpClient works from JavaScript (no types required)

## Success Metrics

### Completed

✅ Single source of truth for HTTP types (ApiResponse<T>)
✅ Reusable HttpClient that works in both Node and Browser
✅ Retry logic with exponential backoff
✅ Comprehensive error handling with standard error codes
✅ Zero breaking changes to existing functionality
✅ apps/web build passes

### Future

- [ ] 50% of admin-api services migrated to HttpClient
- [ ] Test coverage >80% for shared-http package
- [ ] Reduced code duplication (measure LOC before/after)
- [ ] Improved error handling consistency (measure error response format adherence)

## Conclusion

Agent 2 has successfully created a unified HTTP client foundation that:

1. **Preserves existing patterns** - ApiResponse<T> discriminated union maintained
2. **Enables code sharing** - HttpClient works in both web and admin-api
3. **Improves consistency** - Standard error codes and retry logic
4. **Minimizes risk** - Gradual migration with backward compatibility
5. **Sets foundation** - Clear path for future improvements

The HTTP stack is now more maintainable, type-safe, and consistent across the monorepo.

**Next Steps:** See "Follow-up Tasks" section for recommended next actions.
