# @slimy/shared-http

Shared HTTP client for the Slimy monorepo. Works in both Node.js and Browser environments.

## Features

- **Type-safe**: Full TypeScript support with `ApiResponse<T>` discriminated union
- **Automatic retry**: Exponential backoff for transient failures
- **Universal**: Works in Node.js 18+ and all modern browsers
- **Structured errors**: Consistent error codes and messages
- **Timeout support**: Configurable timeouts with AbortController
- **Zero dependencies**: Uses native `fetch` API

## Installation

This package is part of the Slimy monorepo and uses pnpm workspaces:

```bash
pnpm add @slimy/shared-http@workspace:*
```

## Usage

### Basic Example

```typescript
import { HttpClient } from '@slimy/shared-http';

const client = new HttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 10000,
});

const result = await client.get('/users/123');

if (result.ok) {
  console.log('User:', result.data);
} else {
  console.error('Error:', result.code, result.message);
}
```

### With TypeScript

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const result = await client.get<User>('/users/123');

if (result.ok) {
  // TypeScript knows result.data is User
  console.log(result.data.name);
} else {
  // TypeScript knows result has code and message
  console.error(result.code, result.message);
}
```

### POST Request

```typescript
const result = await client.post('/users', {
  name: 'Alice',
  email: 'alice@example.com',
});

if (result.ok) {
  console.log('Created user:', result.data);
}
```

### Custom Configuration

```typescript
import { HttpClient, ErrorCode } from '@slimy/shared-http';

const client = new HttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  },
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

// Disable retry for a specific request
const result = await client.get('/users', {
  retry: false,
});

// Custom timeout for a single request
const slowResult = await client.get('/slow-endpoint', {
  timeout: 60000, // 60 seconds
});
```

### Error Handling

```typescript
import { ErrorCode, isRetryableError } from '@slimy/shared-http';

const result = await client.get('/data');

if (!result.ok) {
  // Check specific error codes
  if (result.code === ErrorCode.UNAUTHORIZED) {
    // Redirect to login
  } else if (result.code === ErrorCode.NOT_FOUND) {
    // Show 404 page
  } else if (isRetryableError(result)) {
    // Error was retried but still failed
    console.error('Service temporarily unavailable');
  }
}
```

## API Reference

### HttpClient

#### Constructor

```typescript
new HttpClient(config?: HttpClientConfig)
```

#### Methods

- `get<T>(url, config?)` - GET request
- `post<T>(url, data?, config?)` - POST request
- `put<T>(url, data?, config?)` - PUT request
- `patch<T>(url, data?, config?)` - PATCH request
- `delete<T>(url, config?)` - DELETE request
- `request<T>(method, url, config?)` - Generic request

### Types

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

type ApiResponse<T> = ApiSuccess<T> | ApiError;

interface ApiSuccess<T> {
  ok: true;
  data: T;
  status: number;
  headers?: Headers;
}

interface ApiError {
  ok: false;
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}
```

### Error Codes

```typescript
enum ErrorCode {
  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  ABORT_ERROR = 'ABORT_ERROR',

  // Client (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',

  // Server (5xx)
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Other
  CONFIG_ERROR = 'CONFIG_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

## Retry Behavior

The client automatically retries failed requests with exponential backoff:

- **Retryable errors**: Network errors, timeouts, 408, 429, 500, 502, 503, 504
- **Default config**: 3 retries, starting at 1s delay, max 30s, 2x multiplier
- **Delays**: 1s → 2s → 4s → 8s (example progression)

Disable retry for specific requests:

```typescript
const result = await client.get('/data', { retry: false });
```

## Timeout Handling

Requests timeout using AbortController:

```typescript
// Global timeout (30s default)
const client = new HttpClient({ timeout: 10000 });

// Per-request timeout
await client.get('/data', { timeout: 5000 });

// Manual abort
const controller = new AbortController();
client.get('/data', { signal: controller.signal });
// Later: controller.abort();
```

## Development

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm type-check
```

### Test

```bash
pnpm test
```

## License

Private - Part of the Slimy monorepo
