# @slimy/shared-db

Database clients, ORM helpers, and data access patterns for Slimy.ai

## Purpose

Provides centralized database access and utilities across all Slimy.ai applications, including:
- Prisma client factory and configuration
- Database connection pooling
- Migration utilities
- Query helpers and utilities
- Type-safe repository patterns
- Redis client management

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Code needs to be extracted from:
- `apps/admin-api/lib/database.js`
- `apps/web/lib/db.ts`
- `apps/admin-api/prisma/`
- `apps/web/prisma/`

## Proposed Tech Stack

- **Prisma ORM v6.x** - Type-safe database client
- **Redis v4.x** - Caching and session storage
- **MySQL 8** or **PostgreSQL 16** - Database engines
- **TypeScript** - Type safety
- **Connection pooling** - Efficient resource usage

## Proposed API

### Prisma Client

```typescript
import { getPrismaClient, closePrismaClient } from '@slimy/shared-db';

// Get Prisma client (singleton)
const prisma = getPrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ['query', 'error', 'warn'],
});

// Use Prisma client
const users = await prisma.user.findMany();

// Close connection (cleanup)
await closePrismaClient();
```

### Redis Client

```typescript
import { getRedisClient, closeRedisClient } from '@slimy/shared-db';

// Get Redis client
const redis = await getRedisClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
});

// Use Redis
await redis.set('key', 'value', { EX: 3600 });
const value = await redis.get('key');

// Close connection
await closeRedisClient();
```

### Repository Pattern

```typescript
import { BaseRepository } from '@slimy/shared-db';

// Create custom repository
class UserRepository extends BaseRepository<User> {
  constructor(prisma: PrismaClient) {
    super(prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.model.findMany({
      where: { status: 'active' },
    });
  }
}

// Use repository
const userRepo = new UserRepository(prisma);
const user = await userRepo.findByEmail('user@example.com');
```

### Transaction Helpers

```typescript
import { withTransaction, withRetry } from '@slimy/shared-db';

// Execute in transaction
await withTransaction(prisma, async (tx) => {
  await tx.user.create({ data: { email: 'user@example.com' } });
  await tx.profile.create({ data: { userId: user.id } });
});

// Retry on deadlock
await withRetry(async () => {
  await prisma.user.update({
    where: { id: '123' },
    data: { lastSeen: new Date() },
  });
}, { maxRetries: 3 });
```

### Query Helpers

```typescript
import { paginate, buildFilter } from '@slimy/shared-db';

// Pagination
const result = await paginate(prisma.user, {
  page: 1,
  pageSize: 20,
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
});
// Returns: { data: User[], total: number, page: number, pageSize: number }

// Build dynamic filters
const filter = buildFilter({
  status: 'active',
  role: ['admin', 'moderator'],
  createdAt: { gte: new Date('2024-01-01') },
});
const users = await prisma.user.findMany({ where: filter });
```

## Proposed Directory Structure

```
packages/shared-db/
├── src/
│   ├── index.ts              # Main exports
│   ├── prisma/               # Prisma utilities
│   │   ├── client.ts         # Client factory
│   │   ├── transaction.ts    # Transaction helpers
│   │   ├── middleware.ts     # Prisma middleware
│   │   └── extensions.ts     # Prisma extensions
│   ├── redis/                # Redis utilities
│   │   ├── client.ts         # Redis client factory
│   │   └── cache.ts          # Caching utilities
│   ├── repositories/         # Repository patterns
│   │   ├── base.ts           # Base repository class
│   │   └── types.ts          # Repository types
│   ├── query/                # Query helpers
│   │   ├── pagination.ts
│   │   ├── filtering.ts
│   │   └── sorting.ts
│   ├── migrations/           # Migration utilities
│   │   └── runner.ts         # Migration runner
│   └── types/                # TypeScript types
│       ├── client.ts
│       └── config.ts
├── prisma/                   # Shared Prisma schema (optional)
│   └── schema.prisma
├── tests/
│   ├── client.test.ts
│   ├── repository.test.ts
│   └── query.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Migration Checklist

### Code to Extract

1. **From `apps/admin-api/lib/database.js`**:
   - Database connection logic
   - Connection pooling configuration
   - Error handling wrappers

2. **From `apps/web/lib/db.ts`**:
   - Prisma client singleton
   - Edge runtime compatibility (if applicable)

3. **From Prisma Schemas**:
   - Potentially merge `apps/admin-api/prisma/schema.prisma` and `apps/web/prisma/schema.prisma`
   - Or keep separate but share client utilities

### Prisma Schema Strategy

**Option 1: Shared Schema** (Recommended for single DB)
- Move schema to `packages/shared-db/prisma/schema.prisma`
- Apps reference this schema
- Single source of truth

**Option 2: Multiple Schemas** (For multi-DB architecture)
- Keep separate schemas in each app
- Share only client utilities
- Different DBs for web vs admin-api

### Dependencies to Install

```json
{
  "dependencies": {
    "@prisma/client": "^6.19.0",
    "redis": "^4.6.8",
    "prisma": "^6.19.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "vitest": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

### Integration Steps

1. Create package structure
2. Extract Prisma client factory
3. Extract Redis client factory
4. Add query helpers (pagination, filtering)
5. Implement repository base class
6. Add transaction helpers
7. Write unit tests (with test containers for integration tests)
8. Update `apps/admin-api` to use `@slimy/shared-db`
9. Update `apps/web` to use `@slimy/shared-db`
10. Remove duplicate database code from apps

## Environment Variables

This package should NOT read env vars directly. Apps pass configuration:

```typescript
// Bad
const prisma = getPrismaClient(); // Reads process.env.DATABASE_URL internally

// Good
const prisma = getPrismaClient({
  datasourceUrl: config.databaseUrl,
  log: config.databaseLogLevel,
});
```

## Prisma Workflow

### Generate Client

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema changes (dev)
pnpm prisma db push

# Create migration (prod)
pnpm prisma migrate dev --name add_new_field

# Run migrations
pnpm prisma migrate deploy
```

### Studio

```bash
# Open Prisma Studio
pnpm prisma studio
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with test database
pnpm test:integration

# Run tests with coverage
pnpm test:coverage
```

### Test Database Strategy

Use test containers for integration tests:

```typescript
import { startTestDatabase, stopTestDatabase } from '@slimy/shared-db/test';

beforeAll(async () => {
  const dbUrl = await startTestDatabase();
  prisma = getPrismaClient({ datasourceUrl: dbUrl });
});

afterAll(async () => {
  await closePrismaClient();
  await stopTestDatabase();
});
```

## Used By

- `@slimy/web` - Customer data access
- `@slimy/admin-api` - Admin data operations
- `@slimy/admin-ui` - Dashboard queries (via API)
- `@slimy/bot` - Bot data persistence
- `@slimy/shared-auth` - Session storage (Redis)

## Related Packages

- `@slimy/shared-config` - Database configuration
- `@slimy/shared-types` - Database entity types

## Performance Considerations

### Connection Pooling

Configure connection pool size based on environment:

```typescript
const prisma = getPrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool
  connectionLimit: 10, // Serverless: 1-5, Server: 10-20
});
```

### Query Optimization

1. **Use `select` to fetch only needed fields**:
   ```typescript
   // Bad
   const users = await prisma.user.findMany();

   // Good
   const users = await prisma.user.findMany({
     select: { id: true, email: true, name: true },
   });
   ```

2. **Use `include` carefully** (can cause N+1 queries):
   ```typescript
   // Consider using explicit joins or separate queries
   ```

3. **Use indexes** on frequently queried fields

### Caching Strategy

Use Redis for caching expensive queries:

```typescript
import { withCache } from '@slimy/shared-db';

const users = await withCache(
  'active-users',
  async () => prisma.user.findMany({ where: { status: 'active' } }),
  { ttl: 3600 } // 1 hour
);
```

## Database Support

### MySQL 8
- Primary development database
- Used in `docker-compose.slimy-nuc1.yml`
- Good for horizontal scaling

### PostgreSQL 16
- Production database
- Used in `docker-compose.slimy-nuc2.yml`
- Better JSON support
- Advanced features (full-text search, etc.)

## Middleware

Add Prisma middleware for common tasks:

```typescript
import { addLoggingMiddleware, addTimestampMiddleware } from '@slimy/shared-db';

const prisma = getPrismaClient({ datasourceUrl: config.databaseUrl });

// Add logging
addLoggingMiddleware(prisma, logger);

// Add automatic timestamps
addTimestampMiddleware(prisma);
```

## Extensions

Create Prisma extensions for custom functionality:

```typescript
import { softDeleteExtension } from '@slimy/shared-db';

const prisma = getPrismaClient({ datasourceUrl: config.databaseUrl })
  .$extends(softDeleteExtension);

// Now has soft delete methods
await prisma.user.softDelete({ where: { id: '123' } });
```

## Future Enhancements

- **Read Replicas**: Support read/write splitting
- **Sharding**: Horizontal partitioning support
- **Change Data Capture**: Stream DB changes to event bus
- **Backup Utilities**: Automated backup and restore
- **Schema Validation**: Runtime schema validation
- **Multi-tenancy**: Tenant-aware queries

## License

Proprietary - Slimy.ai
