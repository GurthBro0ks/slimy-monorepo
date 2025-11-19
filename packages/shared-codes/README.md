# @slimy/shared-codes

Error codes, enums, and protocol constants for Slimy.ai services

## Purpose

Provides centralized code definitions and constants across all Slimy.ai applications, including:
- HTTP status codes and API response codes
- Error code definitions with descriptions
- Shared enums (user roles, statuses, etc.)
- Protocol constants
- Type-safe constant access

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Constants need to be extracted from:
- Hardcoded strings across apps
- Magic numbers and strings
- Scattered enum definitions
- API response codes

## Proposed Tech Stack

- **TypeScript** - Type-safe enums and constants
- **No runtime dependencies** - Pure TypeScript types and constants

## Proposed API

### Error Codes

```typescript
import { ErrorCode, getErrorMessage } from '@slimy/shared-codes';

// Use error codes
throw new Error(ErrorCode.UNAUTHORIZED);
// Or with helper
const message = getErrorMessage(ErrorCode.UNAUTHORIZED);
// "Unauthorized access"

// Available error codes
ErrorCode.INTERNAL_SERVER_ERROR  // "INTERNAL_SERVER_ERROR"
ErrorCode.UNAUTHORIZED           // "UNAUTHORIZED"
ErrorCode.FORBIDDEN              // "FORBIDDEN"
ErrorCode.NOT_FOUND              // "NOT_FOUND"
ErrorCode.VALIDATION_ERROR       // "VALIDATION_ERROR"
ErrorCode.DATABASE_ERROR         // "DATABASE_ERROR"
```

### HTTP Status Codes

```typescript
import { HttpStatus } from '@slimy/shared-codes';

// Use HTTP status codes
res.status(HttpStatus.OK).json({ data });
res.status(HttpStatus.CREATED).json({ id });
res.status(HttpStatus.BAD_REQUEST).json({ error });

// Available status codes
HttpStatus.OK                    // 200
HttpStatus.CREATED               // 201
HttpStatus.NO_CONTENT            // 204
HttpStatus.BAD_REQUEST           // 400
HttpStatus.UNAUTHORIZED          // 401
HttpStatus.FORBIDDEN             // 403
HttpStatus.NOT_FOUND             // 404
HttpStatus.CONFLICT              // 409
HttpStatus.INTERNAL_SERVER_ERROR // 500
```

### User Roles

```typescript
import { UserRole } from '@slimy/shared-codes';

// Use user roles
if (user.role === UserRole.ADMIN) {
  // Admin-only logic
}

// Available roles
UserRole.ADMIN       // "admin"
UserRole.MODERATOR   // "moderator"
UserRole.CLUB        // "club"
UserRole.USER        // "user"
UserRole.GUEST       // "guest"
```

### Entity Status

```typescript
import { EntityStatus } from '@slimy/shared-codes';

// Use entity statuses
const user = {
  status: EntityStatus.ACTIVE,
};

// Available statuses
EntityStatus.ACTIVE      // "active"
EntityStatus.INACTIVE    // "inactive"
EntityStatus.PENDING     // "pending"
EntityStatus.BANNED      // "banned"
EntityStatus.DELETED     // "deleted"
```

### Snail-Specific Codes

```typescript
import { SnailStatus, SnailAction } from '@slimy/shared-codes';

// Snail statuses
SnailStatus.IDLE         // "idle"
SnailStatus.FEEDING      // "feeding"
SnailStatus.BATTLING     // "battling"
SnailStatus.RESTING      // "resting"

// Snail actions
SnailAction.FEED         // "feed"
SnailAction.BATTLE       // "battle"
SnailAction.REST         // "rest"
SnailAction.UPGRADE      // "upgrade"
```

### API Response Codes

```typescript
import { ApiResponse } from '@slimy/shared-codes';

// Standardized API responses
res.json(ApiResponse.success(data));
// { success: true, data: ... }

res.json(ApiResponse.error(ErrorCode.NOT_FOUND, 'User not found'));
// { success: false, error: { code: "NOT_FOUND", message: "User not found" } }

res.json(ApiResponse.paginated(items, { page: 1, total: 100 }));
// { success: true, data: [...], pagination: { page: 1, total: 100 } }
```

### Constants

```typescript
import { Constants } from '@slimy/shared-codes';

// Use constants
if (username.length < Constants.MIN_USERNAME_LENGTH) {
  throw new Error('Username too short');
}

// Available constants
Constants.MIN_USERNAME_LENGTH     // 3
Constants.MAX_USERNAME_LENGTH     // 20
Constants.MIN_PASSWORD_LENGTH     // 8
Constants.MAX_GUILD_NAME_LENGTH   // 50
Constants.SESSION_TIMEOUT_MS      // 86400000 (24 hours)
Constants.RATE_LIMIT_WINDOW_MS    // 60000 (1 minute)
Constants.MAX_REQUESTS_PER_WINDOW // 100
```

## Proposed Directory Structure

```
packages/shared-codes/
├── src/
│   ├── index.ts              # Main exports
│   ├── errors/               # Error codes
│   │   ├── codes.ts          # Error code constants
│   │   ├── messages.ts       # Error messages
│   │   └── types.ts          # Error types
│   ├── http/                 # HTTP codes
│   │   └── status.ts         # HTTP status codes
│   ├── enums/                # Shared enums
│   │   ├── roles.ts          # User roles
│   │   ├── status.ts         # Entity statuses
│   │   └── snail.ts          # Snail-specific enums
│   ├── constants/            # Constants
│   │   ├── validation.ts     # Validation constants
│   │   ├── timeouts.ts       # Timeout constants
│   │   └── limits.ts         # Limit constants
│   ├── api/                  # API helpers
│   │   ├── response.ts       # Response builders
│   │   └── types.ts          # API types
│   └── types/                # TypeScript types
│       └── index.ts
├── tests/
│   ├── errors.test.ts
│   ├── response.test.ts
│   └── constants.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Migration Checklist

### Code to Extract

1. **From all apps**:
   - Hardcoded status strings (e.g., `'active'`, `'pending'`)
   - Magic numbers (e.g., `3000`, `100`)
   - Role strings (e.g., `'admin'`, `'user'`)
   - HTTP status codes (e.g., `200`, `404`)

2. **Create standardized enums**:
   - User roles
   - Entity statuses
   - Error codes
   - Snail-specific codes

3. **Document all constants**:
   - What they represent
   - Why those specific values
   - Where they're used

### Example Migration

**Before (apps/admin-api/src/routes/auth.js)**:
```javascript
// Hardcoded status codes and messages
if (!user) {
  return res.status(404).json({
    success: false,
    error: 'User not found',
  });
}

if (user.role !== 'admin') {
  return res.status(403).json({
    success: false,
    error: 'Forbidden',
  });
}

return res.status(200).json({
  success: true,
  data: user,
});
```

**After (with @slimy/shared-codes)**:
```typescript
import { HttpStatus, ErrorCode, UserRole, ApiResponse } from '@slimy/shared-codes';

if (!user) {
  return res.status(HttpStatus.NOT_FOUND).json(
    ApiResponse.error(ErrorCode.NOT_FOUND, 'User not found')
  );
}

if (user.role !== UserRole.ADMIN) {
  return res.status(HttpStatus.FORBIDDEN).json(
    ApiResponse.error(ErrorCode.FORBIDDEN, 'Admin access required')
  );
}

return res.status(HttpStatus.OK).json(
  ApiResponse.success(user)
);
```

### Dependencies to Install

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^2.0.0"
  }
}
```

### Integration Steps

1. Create package structure
2. Define all error codes
3. Define HTTP status codes
4. Define shared enums (roles, statuses, etc.)
5. Define constants (limits, timeouts, etc.)
6. Create API response builders
7. Write unit tests
8. Update all apps to import from `@slimy/shared-codes`
9. Replace hardcoded strings/numbers with shared codes
10. Ensure type safety across all services

## Error Code Categories

### Authentication & Authorization
```typescript
export enum AuthErrorCode {
  UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  FORBIDDEN = 'AUTH_FORBIDDEN',
  INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
}
```

### Validation
```typescript
export enum ValidationErrorCode {
  INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
}
```

### Database
```typescript
export enum DatabaseErrorCode {
  CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  QUERY_FAILED = 'DB_QUERY_FAILED',
  DUPLICATE_ENTRY = 'DB_DUPLICATE_ENTRY',
  NOT_FOUND = 'DB_NOT_FOUND',
}
```

### Business Logic
```typescript
export enum BusinessErrorCode {
  INSUFFICIENT_FUNDS = 'BIZ_INSUFFICIENT_FUNDS',
  INVALID_STATE = 'BIZ_INVALID_STATE',
  LIMIT_EXCEEDED = 'BIZ_LIMIT_EXCEEDED',
  OPERATION_NOT_ALLOWED = 'BIZ_OPERATION_NOT_ALLOWED',
}
```

## API Response Standardization

All API responses should follow a consistent format:

### Success Response
```typescript
{
  success: true,
  data: T,
  meta?: {
    // Optional metadata
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Paginated Response
```typescript
{
  success: true,
  data: T[],
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number
  }
}
```

## Testing

```bash
# Run tests
pnpm test

# Check type exports
pnpm type-check
```

## Used By

- `@slimy/web` - API responses, error handling
- `@slimy/admin-api` - All error codes and responses
- `@slimy/admin-ui` - Display error messages
- `@slimy/bot` - Command responses
- `@slimy/shared-auth` - Auth error codes
- `@slimy/shared-db` - Database error codes
- `@slimy/shared-snail` - Snail-specific codes

## Related Packages

- All packages - Everyone uses shared codes

## Best Practices

### 1. Use Descriptive Names
```typescript
// Good
ErrorCode.USER_NOT_FOUND
ErrorCode.INVALID_EMAIL_FORMAT

// Bad
ErrorCode.ERROR_1
ErrorCode.ERR_USR
```

### 2. Categorize Codes
Group related codes together:
- Auth codes: `AUTH_*`
- Validation codes: `VALIDATION_*`
- Database codes: `DB_*`
- Business codes: `BIZ_*`

### 3. Provide Messages
Always provide human-readable messages:
```typescript
export const ErrorMessages = {
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email format',
};
```

### 4. Type Safety
Export TypeScript types for all codes:
```typescript
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
```

### 5. Documentation
Document what each code means and when to use it:
```typescript
/**
 * User not found in database
 * Use when: User ID doesn't exist in users table
 * HTTP Status: 404
 */
USER_NOT_FOUND = 'USER_NOT_FOUND',
```

## Internationalization (Future)

For multi-language support, separate codes from messages:

```typescript
// codes.ts
export const ErrorCode = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
};

// messages.en.ts
export const ErrorMessages = {
  USER_NOT_FOUND: 'User not found',
};

// messages.es.ts
export const ErrorMessages = {
  USER_NOT_FOUND: 'Usuario no encontrado',
};
```

## Future Enhancements

- **Event Codes**: Codes for event bus messages
- **Metrics Codes**: Codes for metrics and monitoring
- **Audit Codes**: Codes for audit logging
- **i18n Support**: Multi-language error messages
- **Code Registry**: Central registry of all codes with documentation

## License

Proprietary - Slimy.ai
