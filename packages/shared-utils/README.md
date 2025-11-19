# @slimy/shared-utils

Common utility functions for Slimy.ai services

## Purpose

Provides reusable utility functions across all Slimy.ai applications, including:
- Date/time formatting and manipulation
- String manipulation and validation
- Array and object helpers
- Logging utilities
- Validation helpers
- Cryptographic utilities
- Common algorithms

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Utilities need to be extracted from:
- `apps/web/lib/utils/` - Web utilities
- `apps/admin-api/lib/` - API utilities
- `apps/admin-ui/lib/` - UI utilities
- Duplicate utility code across services

## Proposed Tech Stack

- **TypeScript** - Type-safe utilities
- **date-fns** - Date manipulation (optional)
- **lodash** - Object/array utilities (optional, or use native methods)
- **Pure functions** - Framework-agnostic

## Proposed API

### String Utilities

```typescript
import { capitalize, slugify, truncate, parseTemplate } from '@slimy/shared-utils';

// Capitalize first letter
capitalize('hello world'); // "Hello world"

// Create URL-friendly slug
slugify('Hello World!'); // "hello-world"

// Truncate with ellipsis
truncate('Long text here', 10); // "Long text..."

// Parse template string
parseTemplate('Hello {name}!', { name: 'Alice' }); // "Hello Alice!"
```

### Date Utilities

```typescript
import { formatDate, parseDate, isExpired, addDays } from '@slimy/shared-utils';

// Format date
formatDate(new Date(), 'yyyy-MM-dd'); // "2025-01-15"

// Parse date
parseDate('2025-01-15'); // Date object

// Check if expired
isExpired(new Date('2025-01-01')); // true/false

// Add days
addDays(new Date(), 7); // Date 7 days from now
```

### Array Utilities

```typescript
import { chunk, unique, groupBy, sortBy } from '@slimy/shared-utils';

// Chunk array
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Get unique values
unique([1, 2, 2, 3, 3]); // [1, 2, 3]

// Group by key
groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}], 'type');
// { a: [{type: 'a', val: 1}], b: [{type: 'b', val: 2}] }

// Sort by key
sortBy([{age: 30}, {age: 20}], 'age');
// [{age: 20}, {age: 30}]
```

### Object Utilities

```typescript
import { pick, omit, deepMerge, isEqual } from '@slimy/shared-utils';

// Pick specific keys
pick({ a: 1, b: 2, c: 3 }, ['a', 'c']); // { a: 1, c: 3 }

// Omit specific keys
omit({ a: 1, b: 2, c: 3 }, ['b']); // { a: 1, c: 3 }

// Deep merge objects
deepMerge({ a: { b: 1 } }, { a: { c: 2 } }); // { a: { b: 1, c: 2 } }

// Deep equality check
isEqual({ a: 1 }, { a: 1 }); // true
```

### Validation Utilities

```typescript
import { isEmail, isUrl, isUuid, validatePassword } from '@slimy/shared-utils';

// Email validation
isEmail('user@example.com'); // true

// URL validation
isUrl('https://slimyai.xyz'); // true

// UUID validation
isUuid('123e4567-e89b-12d3-a456-426614174000'); // true

// Password strength
validatePassword('MyP@ssw0rd!');
// { valid: true, strength: 'strong', errors: [] }
```

### Crypto Utilities

```typescript
import { hash, compare, generateId, randomString } from '@slimy/shared-utils';

// Hash data (SHA-256)
hash('some data'); // "abc123..."

// Generate unique ID
generateId(); // "cld7x9y2h0000..."

// Generate random string
randomString(16); // "a9Bc3Def..."
```

### Logging Utilities

```typescript
import { createLogger, LogLevel } from '@slimy/shared-utils';

// Create logger
const logger = createLogger({
  level: LogLevel.INFO,
  name: 'MyService',
});

logger.info('User logged in', { userId: '123' });
logger.error('Failed to process', { error: err });
logger.debug('Debug info', { data });
```

### Retry Utilities

```typescript
import { retry, withTimeout, withBackoff } from '@slimy/shared-utils';

// Retry operation
const result = await retry(
  async () => fetchData(),
  { maxAttempts: 3, delay: 1000 }
);

// With timeout
const result = await withTimeout(
  fetchData(),
  5000 // 5 seconds
);

// With exponential backoff
const result = await withBackoff(
  async () => fetchData(),
  { maxAttempts: 5, initialDelay: 1000 }
);
```

### Rate Limiting

```typescript
import { RateLimiter } from '@slimy/shared-utils';

// Create rate limiter
const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
});

// Check if allowed
if (await limiter.check(userId)) {
  // Process request
} else {
  // Rate limit exceeded
}
```

## Proposed Directory Structure

```
packages/shared-utils/
├── src/
│   ├── index.ts              # Main exports
│   ├── string/               # String utilities
│   │   ├── capitalize.ts
│   │   ├── slugify.ts
│   │   ├── truncate.ts
│   │   └── template.ts
│   ├── date/                 # Date utilities
│   │   ├── format.ts
│   │   ├── parse.ts
│   │   ├── add.ts
│   │   └── compare.ts
│   ├── array/                # Array utilities
│   │   ├── chunk.ts
│   │   ├── unique.ts
│   │   ├── groupBy.ts
│   │   └── sortBy.ts
│   ├── object/               # Object utilities
│   │   ├── pick.ts
│   │   ├── omit.ts
│   │   ├── merge.ts
│   │   └── equal.ts
│   ├── validation/           # Validation utilities
│   │   ├── email.ts
│   │   ├── url.ts
│   │   ├── uuid.ts
│   │   └── password.ts
│   ├── crypto/               # Cryptographic utilities
│   │   ├── hash.ts
│   │   ├── id.ts
│   │   └── random.ts
│   ├── logger/               # Logging utilities
│   │   ├── logger.ts
│   │   └── formatters.ts
│   ├── async/                # Async utilities
│   │   ├── retry.ts
│   │   ├── timeout.ts
│   │   ├── backoff.ts
│   │   └── queue.ts
│   └── ratelimit/            # Rate limiting
│       └── limiter.ts
├── tests/
│   ├── string.test.ts
│   ├── date.test.ts
│   ├── array.test.ts
│   ├── object.test.ts
│   └── validation.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Migration Checklist

### Utilities to Extract

1. **From `apps/web/lib/utils.ts`**:
   - String helpers
   - Date formatters
   - Validation functions

2. **From `apps/admin-api/lib/`**:
   - Logger utilities
   - Retry logic
   - Hash functions

3. **From `apps/admin-ui/lib/`**:
   - Formatting utilities
   - Parsing utilities

### Dependencies to Install

```json
{
  "dependencies": {
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^2.0.0"
  }
}
```

**Note**: Consider whether to use lodash or implement native equivalents. Native implementations keep bundle size smaller.

### Integration Steps

1. Create package structure
2. Extract string utilities
3. Extract date utilities (consider date-fns)
4. Extract array/object utilities
5. Extract validation utilities
6. Implement logging utilities
7. Add async utilities (retry, timeout, etc.)
8. Write comprehensive tests (100% coverage)
9. Update all apps to import from `@slimy/shared-utils`
10. Remove duplicate utility code

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { slugify } from '@slimy/shared-utils';

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('foo bar baz')).toBe('foo-bar-baz');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello! World?')).toBe('hello-world');
  });
});
```

## Tree Shaking

Ensure utilities are tree-shakeable:

```typescript
// Good: Named exports
export function capitalize(str: string): string { /* ... */ }
export function slugify(str: string): string { /* ... */ }

// Import only what you need
import { capitalize } from '@slimy/shared-utils';
```

## Bundle Size

Keep utilities small and focused:
- No heavy dependencies unless absolutely necessary
- Prefer native methods when available
- Use tree-shaking friendly exports
- Avoid polyfills (let consumer decide)

## Used By

- `@slimy/web` - All utilities
- `@slimy/admin-api` - Logging, validation, async utilities
- `@slimy/admin-ui` - Formatting, string utilities
- `@slimy/bot` - String, date utilities
- Other shared packages - Various utilities

## Related Packages

- `@slimy/shared-config` - Uses validation utilities
- `@slimy/shared-types` - Type definitions for utilities

## Best Practices

### 1. Pure Functions

```typescript
// Good: Pure function
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Bad: Has side effects
export function capitalizeInPlace(obj: { str: string }): void {
  obj.str = obj.str.charAt(0).toUpperCase() + obj.str.slice(1);
}
```

### 2. Type Safety

```typescript
// Good: Type-safe
export function pick<T, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  // Implementation
}

// Type-safe usage
const user = { id: '123', name: 'Alice', age: 30 };
const picked = pick(user, ['id', 'name']); // Type: { id: string; name: string }
```

### 3. Handle Edge Cases

```typescript
export function slugify(str: string): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

### 4. Document Functions

```typescript
/**
 * Converts a string to a URL-friendly slug.
 *
 * @param str - The string to convert
 * @returns The slugified string
 *
 * @example
 * ```ts
 * slugify('Hello World!'); // "hello-world"
 * slugify('  Foo Bar  '); // "foo-bar"
 * ```
 */
export function slugify(str: string): string {
  // ...
}
```

### 5. Performance Conscious

```typescript
// Good: Efficient
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Bad: Inefficient (O(n²))
export function unique<T>(arr: T[]): T[] {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}
```

## Common Patterns

### Result Type

```typescript
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export function tryParse(json: string): Result<unknown> {
  try {
    return { success: true, value: JSON.parse(json) };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### Maybe Type

```typescript
export type Maybe<T> = T | null | undefined;

export function isDefined<T>(value: Maybe<T>): value is T {
  return value !== null && value !== undefined;
}
```

## Future Enhancements

- **Caching Utilities**: Memoization, cache invalidation
- **Debounce/Throttle**: Rate limiting for functions
- **Queue System**: Job queue utilities
- **Stream Utilities**: Async iterator helpers
- **File Utilities**: File system helpers (Node.js only)
- **HTTP Utilities**: Fetch helpers, request builders

## Benchmark

For performance-critical utilities, include benchmarks:

```typescript
// benchmark/slugify.bench.ts
import { bench } from 'vitest';
import { slugify } from '../src/string/slugify';

bench('slugify short string', () => {
  slugify('Hello World');
});

bench('slugify long string', () => {
  slugify('This is a very long string with many words');
});
```

## License

Proprietary - Slimy.ai
