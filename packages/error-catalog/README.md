# @slimy/error-catalog

Centralized error code catalog for Slimy.ai services. This package provides a standardized, type-safe way to define and work with error codes across all services.

## Overview

This package contains:
- **Error Code Definitions**: Comprehensive catalog of error codes organized by domain
- **Type-Safe Enums**: TypeScript enums for compile-time safety
- **Helper Functions**: Utilities for working with error codes
- **Metadata**: HTTP status codes, user messages, and descriptions for each error

## Installation

This package is part of the monorepo and can be added as a workspace dependency:

```json
{
  "dependencies": {
    "@slimy/error-catalog": "workspace:*"
  }
}
```

## Error Code Format

All error codes follow the pattern: `SLIMY_{DOMAIN}_{NUMBER}`

**Domains**:
- `AUTH` - Authentication & Authorization
- `DISCORD` - Discord Integration
- `SNAIL` - Snail Tools
- `MINECRAFT` - Minecraft Integration
- `INFRA` - Infrastructure (database, cache, network)
- `WEB` - Web Application
- `CHAT` - Chat/AI Services

**Example**: `SLIMY_AUTH_001`, `SLIMY_DISCORD_010`, `SLIMY_SNAIL_005`

## Usage

### Basic Usage

```typescript
import { ErrorCode, getErrorInfo, createErrorResponse } from '@slimy/error-catalog';

// Get error information
const errorInfo = getErrorInfo(ErrorCode.SLIMY_AUTH_001);
console.log(errorInfo.userMessage); // "Authentication required. Please log in to continue."
console.log(errorInfo.httpStatus);  // 401

// Create error response
const response = createErrorResponse(ErrorCode.SLIMY_AUTH_001);
return NextResponse.json(response, { status: errorInfo.httpStatus });
```

### Integration with Existing Error Classes

You can map your existing error classes to catalog codes:

```typescript
import { AppError } from '@/lib/errors';
import { ErrorCode, getErrorInfo } from '@slimy/error-catalog';

// Extend existing error class to use catalog codes
class CatalogError extends AppError {
  constructor(catalogCode: ErrorCode, details?: unknown) {
    const info = getErrorInfo(catalogCode);
    if (!info) {
      throw new Error(`Unknown error code: ${catalogCode}`);
    }

    super(info.userMessage, info.code, info.httpStatus, details);
    this.name = 'CatalogError';
  }
}

// Usage
throw new CatalogError(ErrorCode.SLIMY_AUTH_001);
```

### Mapping Internal Exceptions to Error Codes

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ErrorCode, getErrorInfo, createErrorResponse } from '@slimy/error-catalog';

function mapDatabaseError(error: unknown): ErrorCode {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return ErrorCode.SLIMY_WEB_008; // Concurrent modification
      case 'P2025': // Record not found
        return ErrorCode.SLIMY_WEB_001; // Resource not found
      case 'P1001': // Connection error
        return ErrorCode.SLIMY_INFRA_001; // Database connection failed
      default:
        return ErrorCode.SLIMY_INFRA_002; // Database query failed
    }
  }

  return ErrorCode.SLIMY_INFRA_002; // Generic database error
}

// Usage in API route
export async function GET() {
  try {
    const data = await prisma.user.findUniqueOrThrow({ where: { id: 1 } });
    return NextResponse.json(data);
  } catch (error) {
    const errorCode = mapDatabaseError(error);
    const errorInfo = getErrorInfo(errorCode);
    return NextResponse.json(
      createErrorResponse(errorCode),
      { status: errorInfo!.httpStatus }
    );
  }
}
```

### Discord Integration Example

```typescript
import { ErrorCode, getErrorInfo, createErrorResponse } from '@slimy/error-catalog';
import { DiscordAPIError } from 'discord.js';

async function fetchGuildMember(guildId: string, userId: string) {
  try {
    const member = await discord.guilds.cache.get(guildId)?.members.fetch(userId);
    if (!member) {
      throw new Error('Member not found');
    }
    return member;
  } catch (error) {
    let errorCode: ErrorCode;

    if (error instanceof DiscordAPIError) {
      switch (error.code) {
        case 10004: // Unknown guild
          errorCode = ErrorCode.SLIMY_DISCORD_001;
          break;
        case 10007: // Unknown member
          errorCode = ErrorCode.SLIMY_DISCORD_002;
          break;
        case 50013: // Missing permissions
          errorCode = ErrorCode.SLIMY_DISCORD_004;
          break;
        default:
          errorCode = ErrorCode.SLIMY_DISCORD_005;
      }
    } else {
      errorCode = ErrorCode.SLIMY_DISCORD_002;
    }

    const errorInfo = getErrorInfo(errorCode)!;
    throw new AppError(errorInfo.userMessage, errorInfo.code, errorInfo.httpStatus);
  }
}
```

### Rate Limiting Example

```typescript
import { ErrorCode, formatErrorMessage } from '@slimy/error-catalog';

async function checkRateLimit(userId: string): Promise<boolean> {
  const attempts = await redis.incr(`rate-limit:${userId}`);

  if (attempts === 1) {
    await redis.expire(`rate-limit:${userId}`, 60);
  }

  if (attempts > 10) {
    const message = formatErrorMessage(ErrorCode.SLIMY_AUTH_010);
    throw new AppError(message, ErrorCode.SLIMY_AUTH_010, 429);
  }

  return true;
}
```

### Client-Side Error Handling

```typescript
import type { ErrorCode } from '@slimy/error-catalog';

interface ApiErrorResponse {
  ok: false;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

async function handleApiError(response: Response) {
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();

    // Handle specific error codes
    switch (error.code) {
      case 'SLIMY_AUTH_001':
      case 'SLIMY_AUTH_003':
        // Redirect to login
        window.location.href = '/login';
        break;

      case 'SLIMY_DISCORD_001':
        // Show "server not found" UI
        showNotification('Server not found', 'error');
        break;

      default:
        // Show generic error
        showNotification(error.message, 'error');
    }
  }
}
```

### Logging with Error Codes

```typescript
import { ErrorCode, getErrorInfo } from '@slimy/error-catalog';

function logError(code: ErrorCode, context?: Record<string, unknown>) {
  const errorInfo = getErrorInfo(code);

  logger.error({
    errorCode: code,
    title: errorInfo?.title,
    httpStatus: errorInfo?.httpStatus,
    domain: errorInfo?.domain,
    internal: errorInfo?.internal,
    context,
    timestamp: new Date().toISOString(),
  });
}

// Usage
logError(ErrorCode.SLIMY_INFRA_001, {
  service: 'database',
  connectionString: 'postgresql://...',
});
```

## Helper Functions

### `getErrorInfo(code: ErrorCode | string): ErrorCodeInfo | undefined`

Retrieve complete error information for a given code.

```typescript
const info = getErrorInfo(ErrorCode.SLIMY_AUTH_001);
console.log(info?.title);        // "Missing Authentication Token"
console.log(info?.httpStatus);   // 401
console.log(info?.userMessage);  // "Authentication required..."
```

### `getErrorsByDomain(domain: ErrorDomain): ErrorCodeInfo[]`

Get all errors for a specific domain.

```typescript
import { ErrorDomain, getErrorsByDomain } from '@slimy/error-catalog';

const authErrors = getErrorsByDomain(ErrorDomain.AUTH);
console.log(authErrors.length); // 10
```

### `getErrorsByHttpStatus(httpStatus: number): ErrorCodeInfo[]`

Get all errors with a specific HTTP status.

```typescript
const notFoundErrors = getErrorsByHttpStatus(404);
// Returns all 404 errors across all domains
```

### `isValidErrorCode(code: string): boolean`

Check if a string is a valid error code.

```typescript
if (isValidErrorCode('SLIMY_AUTH_001')) {
  // Code exists in catalog
}
```

### `formatErrorMessage(code: ErrorCode, replacements?: Record<string, string>): string`

Format error message with dynamic values.

```typescript
const message = formatErrorMessage(
  ErrorCode.SLIMY_WEB_004,
  { limit: '10MB' }
);
// "File is too large. Maximum size is 10MB."
```

### `createErrorResponse(code: ErrorCode, details?: unknown): object`

Create a standardized error response.

```typescript
const response = createErrorResponse(ErrorCode.SLIMY_AUTH_001, {
  attemptedPath: '/admin',
});
// { ok: false, code: "SLIMY_AUTH_001", message: "...", details: {...} }
```

### `getCatalogStats(): object`

Get statistics about the error catalog.

```typescript
const stats = getCatalogStats();
console.log(stats.total);         // Total number of error codes
console.log(stats.byDomain);      // Count per domain
console.log(stats.byHttpStatus);  // Count per HTTP status
console.log(stats.internal);      // Number of internal errors
console.log(stats.public);        // Number of public errors
```

## API Route Pattern

Recommended pattern for Next.js API routes:

```typescript
import { NextResponse } from 'next/server';
import { ErrorCode, getErrorInfo, createErrorResponse } from '@slimy/error-catalog';
import { asyncHandler } from '@/lib/errors';

export const GET = asyncHandler(async (request: Request) => {
  // Validate authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    const errorInfo = getErrorInfo(ErrorCode.SLIMY_AUTH_001)!;
    return NextResponse.json(
      createErrorResponse(ErrorCode.SLIMY_AUTH_001),
      { status: errorInfo.httpStatus }
    );
  }

  // Check permissions
  if (!user.hasPermission('admin')) {
    const errorInfo = getErrorInfo(ErrorCode.SLIMY_AUTH_004)!;
    return NextResponse.json(
      createErrorResponse(ErrorCode.SLIMY_AUTH_004),
      { status: errorInfo.httpStatus }
    );
  }

  // Fetch data
  try {
    const data = await fetchSomeData();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    // Map to appropriate error code
    const errorCode = mapErrorToCode(error);
    const errorInfo = getErrorInfo(errorCode)!;

    // Log internal errors
    if (errorInfo.internal) {
      logger.error({ errorCode, error, userId: user.id });
    }

    return NextResponse.json(
      createErrorResponse(errorCode),
      { status: errorInfo.httpStatus }
    );
  }
});
```

## Migration Strategy

### Phase 1: Catalog Creation (Current)
- Create error catalog package
- Document all error codes
- No changes to existing code

### Phase 2: Gradual Integration
- Import error catalog in new features
- Use catalog codes for new API routes
- Maintain backward compatibility with existing error handling

### Phase 3: Mapping Layer
- Create mapping functions from existing errors to catalog codes
- Add error code to existing error responses (alongside old codes)
- Update client code to recognize both old and new codes

### Phase 4: Full Migration
- Replace all old error codes with catalog codes
- Update all API routes to use catalog
- Deprecate old error handling code

### Phase 5: Monitoring & Refinement
- Monitor error patterns in production
- Add new error codes as needed
- Refine error messages based on user feedback

## Best Practices

### DO ✅

- Use the catalog for all new features
- Log internal errors server-side, show generic messages to users
- Check the `internal` flag before exposing error details
- Use `formatErrorMessage()` for dynamic error content
- Map third-party errors (Prisma, Discord, etc.) to catalog codes
- Document when adding new error codes

### DON'T ❌

- Don't expose internal error details to users
- Don't create duplicate error codes
- Don't remove or change existing error codes (add new ones instead)
- Don't bypass the catalog for "quick fixes"
- Don't use magic strings - use the `ErrorCode` enum

## Adding New Error Codes

When you need a new error code:

1. **Choose the domain**: AUTH, DISCORD, SNAIL, MINECRAFT, INFRA, WEB, or CHAT
2. **Find next number**: Check `docs/error-codes.md` for the next available number
3. **Add to documentation**: Update `docs/error-codes.md` with full details
4. **Add to TypeScript**:
   - Add enum value to `ErrorCode`
   - Add entry to `ERROR_CATALOG`
5. **Test**: Verify the error code works as expected
6. **Document**: Note in your PR why the new code was needed

## TypeScript Types

```typescript
interface ErrorCodeInfo {
  code: string;
  title: string;
  description: string;
  httpStatus: number;
  userMessage: string;
  internal: boolean;
  domain: ErrorDomain;
}

enum ErrorDomain {
  AUTH = 'AUTH',
  DISCORD = 'DISCORD',
  SNAIL = 'SNAIL',
  MINECRAFT = 'MINECRAFT',
  INFRA = 'INFRA',
  WEB = 'WEB',
  CHAT = 'CHAT',
}

enum ErrorCode {
  SLIMY_AUTH_001 = 'SLIMY_AUTH_001',
  // ... all error codes
}
```

## Contributing

When contributing to this package:

1. Never modify existing error codes
2. Follow the naming convention strictly
3. Include all required metadata fields
4. Update both `docs/error-codes.md` and `src/codes.ts`
5. Add tests for new error codes
6. Document the use case in your PR

## Documentation

Full error code documentation: [`docs/error-codes.md`](../../docs/error-codes.md)

## License

UNLICENSED - Internal use only for Slimy.ai

---

**Version**: 1.0.0
**Maintained by**: Slimy.ai Platform Team
