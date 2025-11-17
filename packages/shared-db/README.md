# @slimy/shared-db

Shared database package using Prisma ORM for the Slimy monorepo.

## Setup

### 1. Install dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Set up environment variables

Create a `.env` file in this package directory or in your app:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/slimy_db?schema=public"
```

### 3. Run migrations

Initialize the database with the schema:

```bash
cd packages/shared-db
npx prisma migrate dev --name init
```

Or use the package script:

```bash
pnpm db:migrate
```

### 4. Seed the database

Populate the database with initial data:

```bash
npx prisma db seed
```

Or use the package script:

```bash
pnpm db:seed
```

## Database Models

- **User**: User accounts with email, username, and profile information
- **Session**: User authentication sessions with token and expiration
- **Guild**: Discord guild/server information

## Available Scripts

- `pnpm build` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations in development
- `pnpm db:migrate:deploy` - Deploy migrations to production
- `pnpm db:seed` - Seed the database with initial data
- `pnpm db:studio` - Open Prisma Studio (database GUI)

## Usage

Import the Prisma client in your application:

```typescript
import { prisma } from '@slimy/shared-db/lib/db';

// Query users
const users = await prisma.user.findMany();

// Create a session
const session = await prisma.session.create({
  data: {
    userId: user.id,
    token: 'abc123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});
```

## Development

### View database with Prisma Studio

```bash
pnpm db:studio
```

### Create a new migration

After modifying the schema:

```bash
npx prisma migrate dev --name your_migration_name
```

### Reset database

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Run all migrations
4. Run the seed script
