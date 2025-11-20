# @slimy/shared-types

Shared TypeScript type definitions for Slimy.ai services

## Purpose

Provides centralized TypeScript type definitions across all Slimy.ai applications, including:
- API request/response types
- Domain entity types
- Utility types
- Type guards
- Branded types for type safety
- Shared interfaces

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Types need to be extracted from:
- Scattered type definitions across apps
- Duplicate types in multiple services
- Type definitions in `apps/*/types/` directories

## Proposed Tech Stack

- **TypeScript** - Type definitions only
- **No runtime dependencies** - Pure type definitions
- **Type utilities** - Advanced TypeScript type utilities

## Proposed API

### API Types

```typescript
import { ApiRequest, ApiResponse, ApiError } from '@slimy/shared-types';

// API request type
type LoginRequest = ApiRequest<{
  email: string;
  password: string;
}>;

// API response type
type LoginResponse = ApiResponse<{
  token: string;
  user: User;
}>;

// API error type
type LoginError = ApiError<'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED'>;
```

### Domain Types

```typescript
import { User, Guild, Snail, Item } from '@slimy/shared-types';

// Use shared domain types
const user: User = {
  id: '123',
  email: 'user@example.com',
  role: 'admin',
  createdAt: new Date(),
};

const snail: Snail = {
  id: '456',
  ownerId: user.id,
  name: 'Speedy',
  level: 10,
  stats: {
    strength: 50,
    defense: 30,
  },
};
```

### Utility Types

```typescript
import { Nullable, Optional, DeepPartial, DeepReadonly } from '@slimy/shared-types';

// Nullable type
type UserOrNull = Nullable<User>;
// User | null

// Optional fields
type PartialUser = Optional<User, 'email' | 'name'>;
// User with email and name as optional

// Deep partial (all fields optional recursively)
type DeepPartialUser = DeepPartial<User>;

// Deep readonly (all fields readonly recursively)
type ReadonlyUser = DeepReadonly<User>;
```

### Type Guards

```typescript
import { isUser, isSnail, isApiError } from '@slimy/shared-types';

// Type guards for runtime checking
if (isUser(data)) {
  // data is User
  console.log(data.email);
}

if (isSnail(data)) {
  // data is Snail
  console.log(data.name);
}

if (isApiError(response)) {
  // response is ApiError
  console.error(response.error.message);
}
```

### Branded Types

```typescript
import { UserId, GuildId, SnailId, Email } from '@slimy/shared-types';

// Branded types for type safety
type UserId = string & { __brand: 'UserId' };
type Email = string & { __brand: 'Email' };

// Can't accidentally mix up IDs
function getUser(userId: UserId): User {
  // ...
}

const userId: UserId = 'user-123' as UserId;
const guildId: GuildId = 'guild-456' as GuildId;

getUser(userId); // OK
getUser(guildId); // Type error! Can't pass GuildId where UserId expected
```

## Proposed Directory Structure

```
packages/shared-types/
├── src/
│   ├── index.ts              # Main exports
│   ├── api/                  # API types
│   │   ├── request.ts        # Request types
│   │   ├── response.ts       # Response types
│   │   ├── error.ts          # Error types
│   │   └── pagination.ts     # Pagination types
│   ├── entities/             # Domain entity types
│   │   ├── user.ts           # User types
│   │   ├── guild.ts          # Guild types
│   │   ├── snail.ts          # Snail types
│   │   └── item.ts           # Item types
│   ├── utilities/            # Utility types
│   │   ├── common.ts         # Common utilities (Nullable, Optional, etc.)
│   │   ├── deep.ts           # Deep utilities (DeepPartial, etc.)
│   │   └── branded.ts        # Branded types
│   ├── guards/               # Type guards
│   │   ├── user.ts           # User type guards
│   │   ├── snail.ts          # Snail type guards
│   │   └── api.ts            # API type guards
│   └── events/               # Event types
│       ├── snail.ts          # Snail event types
│       └── user.ts           # User event types
├── tests/
│   ├── guards.test.ts
│   └── utilities.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Migration Checklist

### Types to Extract

1. **From `apps/web/types/`**:
   - API types
   - Component prop types (that are reusable)
   - Domain types

2. **From `apps/admin-api/src/types/`**:
   - Request/response types
   - Database entity types
   - Service types

3. **From `apps/admin-ui/types/`**:
   - Shared UI types
   - API client types

### Example Types to Define

**User Types**:
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  discordId?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'moderator' | 'club' | 'user' | 'guest';

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserInput = Partial<CreateUserInput>;
```

**Guild Types**:
```typescript
export interface Guild {
  id: string;
  name: string;
  description: string;
  discordGuildId: string;
  ownerId: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateGuildInput = Omit<Guild, 'id' | 'memberCount' | 'createdAt' | 'updatedAt'>;
export type UpdateGuildInput = Partial<CreateGuildInput>;
```

**API Types**:
```typescript
export interface ApiRequest<T = unknown> {
  body?: T;
  query?: Record<string, string>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError<Code extends string = string> {
  success: false;
  error: {
    code: Code;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T, E extends string = string> = ApiResponse<T> | ApiError<E>;
```

**Pagination Types**:
```typescript
export interface PaginationParams {
  page: number;
  pageSize: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
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
2. Extract common types from all apps
3. Define API request/response types
4. Define domain entity types
5. Create utility types
6. Implement type guards
7. Write tests for type guards
8. Update all apps to import from `@slimy/shared-types`
9. Remove duplicate type definitions
10. Enable strict TypeScript checking

## Type Guard Testing

```typescript
import { describe, it, expect } from 'vitest';
import { isUser } from '@slimy/shared-types';

describe('isUser', () => {
  it('should return true for valid user', () => {
    const user = {
      id: '123',
      email: 'test@example.com',
      name: 'Test',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(isUser(user)).toBe(true);
  });

  it('should return false for invalid user', () => {
    const notUser = { id: '123' };
    expect(isUser(notUser)).toBe(false);
  });
});
```

## Used By

- `@slimy/web` - All types
- `@slimy/admin-api` - All types
- `@slimy/admin-ui` - All types
- `@slimy/bot` - All types
- All shared packages - Domain types

## Related Packages

- `@slimy/shared-codes` - Enums used in types
- All packages - Everyone uses shared types

## Best Practices

### 1. Use Interfaces for Extensibility

```typescript
// Good: Interface can be extended
export interface User {
  id: string;
  email: string;
}

// Can extend in other packages
export interface AdminUser extends User {
  permissions: string[];
}
```

### 2. Use Type Aliases for Unions

```typescript
// Good: Type alias for union
export type UserRole = 'admin' | 'user' | 'guest';

// Use in interface
export interface User {
  role: UserRole;
}
```

### 3. Export Input/Output Types

```typescript
export interface User {
  id: string;
  email: string;
  password: string; // Hashed
  createdAt: Date;
}

// Input type (no id, createdAt, password is plain text)
export type CreateUserInput = Omit<User, 'id' | 'createdAt'> & {
  password: string; // Plain text
};

// Output type (no password)
export type UserOutput = Omit<User, 'password'>;
```

### 4. Use Branded Types for IDs

```typescript
export type UserId = string & { __brand: 'UserId' };
export type GuildId = string & { __brand: 'GuildId' };

// Can't mix up IDs
function getUser(id: UserId): User { /* ... */ }
function getGuild(id: GuildId): Guild { /* ... */ }

const userId = 'user-123' as UserId;
const guildId = 'guild-456' as GuildId;

getUser(userId); // OK
getUser(guildId); // Type error!
```

### 5. Document Complex Types

```typescript
/**
 * Represents a user in the system.
 *
 * @property id - Unique identifier (UUID v4)
 * @property email - User's email address (must be unique)
 * @property role - User's role (determines permissions)
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
}
```

## Advanced Types

### Conditional Types

```typescript
type IsAdmin<T extends User> = T['role'] extends 'admin' ? true : false;

type Admin = IsAdmin<{ role: 'admin' }>; // true
type Regular = IsAdmin<{ role: 'user' }>; // false
```

### Mapped Types

```typescript
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

type NullableUser = Nullable<User>;
// All fields can be null
```

### Template Literal Types

```typescript
type EventName = `snail:${SnailAction}`;
// "snail:feed" | "snail:battle" | "snail:rest"
```

## Future Enhancements

- **GraphQL Types**: Auto-generate from GraphQL schema
- **JSON Schema**: Generate JSON schemas from TypeScript types
- **Runtime Validation**: Use with Zod for runtime type checking
- **OpenAPI**: Generate OpenAPI specs from types
- **Database Types**: Sync with Prisma schema types

## License

Proprietary - Slimy.ai
