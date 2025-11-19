# Code Style Guide

This document outlines the coding conventions and best practices for the Slimy.ai monorepo. Following these guidelines ensures consistency across the codebase and makes collaboration easier.

## Table of Contents

- [TypeScript & JavaScript Conventions](#typescript--javascript-conventions)
- [React & Next.js Best Practices](#react--nextjs-best-practices)
- [Node.js & Express Conventions](#nodejs--express-conventions)
- [File and Folder Naming](#file-and-folder-naming)
- [Testing Conventions](#testing-conventions)
- [Database & Prisma Guidelines](#database--prisma-guidelines)
- [Security Best Practices](#security-best-practices)
- [Error Handling](#error-handling)

## TypeScript & JavaScript Conventions

### General TypeScript Rules

- **Always use TypeScript** for new files (`.ts`, `.tsx`)
- **Enable strict mode** - all TypeScript configs have `strict: true`
- **Avoid `any`** - use `unknown` if the type is truly unknown, then narrow it
- **Use type inference** where possible, but add explicit types for function parameters and return values

```typescript
// Good: Explicit types for parameters and return
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Good: Inferred type for simple variables
const userName = "Alice"; // string inferred

// Avoid: Using any
function processData(data: any) { } // Don't do this

// Better: Use unknown and narrow
function processData(data: unknown) {
  if (typeof data === "string") {
    // TypeScript knows data is a string here
  }
}
```

### Naming Conventions

- **Variables and functions**: `camelCase`
  ```typescript
  const userCount = 10;
  function getUserById(id: string) { }
  ```

- **Classes and interfaces**: `PascalCase`
  ```typescript
  class UserService { }
  interface UserProfile { }
  ```

- **Type aliases**: `PascalCase`
  ```typescript
  type UserId = string;
  type UserData = { id: UserId; name: string };
  ```

- **Enums**: `PascalCase` for the enum, `SCREAMING_SNAKE_CASE` for members
  ```typescript
  enum ErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND"
  }
  ```

- **Constants**: `SCREAMING_SNAKE_CASE` for true constants
  ```typescript
  const MAX_RETRY_ATTEMPTS = 3;
  const API_BASE_URL = "https://api.example.com";
  ```

- **Private class members**: Prefix with `_` or use TypeScript's `private` keyword
  ```typescript
  class UserService {
    private _cache: Map<string, User>;
    // or
    #cache: Map<string, User>; // Private field syntax
  }
  ```

### Import Organization

Organize imports in the following order:

1. React and framework imports
2. External library imports (node_modules)
3. Internal imports from shared packages
4. Internal imports from local modules (using `@/` alias)
5. Type-only imports (if separate)
6. CSS/style imports

```typescript
// 1. React/Framework
import React, { useState, useEffect } from 'react';
import { NextResponse } from 'next/server';

// 2. External libraries
import { AlertCircle } from 'lucide-react';
import { describe, it, expect } from 'vitest';

// 3. Shared packages
import { validateConfig } from 'shared-config';

// 4. Internal (using @ alias)
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppError } from '@/lib/errors';
import { Logger } from '@/lib/monitoring/logger';

// 5. Type-only imports (if needed separately)
import type { User, UserProfile } from '@/types';

// 6. Styles
import './styles.css';
```

### Path Aliases

Use the `@/` path alias for all internal imports within an app:

```typescript
// Good
import { Dashboard } from '@/components/analytics/Dashboard';
import { apiClient } from '@/lib/api-client';

// Avoid: Relative paths for distant files
import { Dashboard } from '../../../components/analytics/Dashboard';
```

### JSDoc Comments

Add JSDoc comments for:
- Public functions and methods
- Exported types and interfaces
- Complex algorithms or business logic

```typescript
/**
 * Calculates the total price of items in a cart, including tax.
 *
 * @param items - Array of cart items
 * @param taxRate - Tax rate as a decimal (e.g., 0.08 for 8%)
 * @returns Total price with tax applied
 *
 * @example
 * ```typescript
 * const total = calculateTotal([{ price: 100 }], 0.08);
 * // Returns 108
 * ```
 */
export function calculateTotal(items: CartItem[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}
```

## React & Next.js Best Practices

### Component Structure

#### File Organization

- One component per file
- File name matches component name (PascalCase)
- Props interface named `{ComponentName}Props`
- Use named exports (not default exports) for better refactoring

```typescript
// components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

Button.displayName = 'Button';
```

#### Client vs Server Components

- Default to Server Components in Next.js App Router
- Use `'use client'` directive only when needed (hooks, event handlers, browser APIs)
- Place the directive at the top of the file

```typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### Component Patterns

#### Compound Components

Use compound components for related UI elements:

```typescript
// Card.tsx
export function Card({ children, className }: CardProps) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn("card-header", className)}>{children}</div>;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("card-content", className)}>{children}</div>;
}

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

#### Forwarding Refs

Use `React.forwardRef` for components that need ref access:

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input ref={ref} className={className} {...props} />
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### Hooks

- Custom hooks start with `use` prefix
- Keep hooks focused and single-purpose
- Extract complex logic from components into hooks

```typescript
// lib/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Next.js API Routes

- Use Next.js 13+ App Router conventions (`app/api/*/route.ts`)
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`, etc.
- Use `NextResponse` for responses
- Add caching with `revalidate` constant

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const users = await fetchUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handle POST
}
```

### Styling with Tailwind CSS

- Use Tailwind utility classes
- Use `cn()` helper for conditional classes
- Use CVA (class-variance-authority) for component variants
- Define custom colors in `tailwind.config.ts`

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-purple-600 text-white hover:bg-purple-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

## Node.js & Express Conventions

### Express Application Structure

- Use the router pattern for route organization
- Apply middleware at appropriate levels (app, router, route)
- Use async/await instead of callbacks

```typescript
// routes/users.ts
import express from 'express';
import { asyncHandler } from '@/lib/async-handler';

const router = express.Router();

// Route-level middleware
router.use(authMiddleware);

// Route handlers with asyncHandler wrapper
router.get('/', asyncHandler(async (req, res) => {
  const users = await userService.findAll();
  res.json({ users });
}));

router.post('/',
  validateUserSchema,
  asyncHandler(async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json({ user });
  })
);

export default router;
```

### Middleware Organization

- Keep middleware functions focused and single-purpose
- Place middleware in `/middleware` directory
- Use clear, descriptive names

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '@/lib/errors';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    throw new AuthenticationError('Authentication required');
  }
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      throw new AuthorizationError('Insufficient permissions');
    }
    next();
  };
}
```

### Error Handling

- Use custom error classes (see [Error Handling](#error-handling))
- Use `asyncHandler` wrapper for async route handlers
- Centralized error handler middleware

```typescript
// lib/async-handler.ts
import { Request, Response, NextFunction } from 'express';

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// middleware/error-handler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error', { error: err });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

## File and Folder Naming

### Apps Directory (`apps/`)

Each app follows this structure:

```
apps/
├── web/                      # Next.js customer portal
│   ├── app/                  # Next.js App Router (pages & layouts)
│   │   ├── (auth)/          # Route groups (parentheses)
│   │   ├── api/             # API routes
│   │   │   └── users/
│   │   │       └── route.ts # Named route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx     # Named page.tsx
│   │   └── layout.tsx
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   ├── analytics/       # Feature-specific components
│   │   ├── chat/
│   │   └── club/
│   ├── lib/                 # Utilities, hooks, helpers
│   │   ├── api-client.ts
│   │   ├── errors.ts
│   │   ├── hooks/
│   │   ├── monitoring/
│   │   └── utils.ts
│   ├── tests/               # Test files
│   │   ├── components/
│   │   ├── unit/
│   │   ├── api/
│   │   └── e2e/
│   ├── prisma/              # Database schema and migrations
│   │   └── schema.prisma
│   └── public/              # Static assets
│
├── admin-api/               # Express.js backend
│   ├── src/
│   │   ├── routes/          # Express route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── lib/             # Utilities
│   │   └── types/           # TypeScript types
│   ├── lib/                 # Legacy JavaScript utilities
│   └── server.js            # Entry point
│
└── admin-ui/                # Next.js admin dashboard
    └── (similar to web/)
```

### Packages Directory (`packages/`)

Shared packages follow a consistent structure:

```
packages/
├── shared-config/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared-auth/
│   ├── src/
│   │   ├── index.ts
│   │   ├── jwt.ts
│   │   └── oauth.ts
│   └── package.json
│
└── shared-db/
    ├── src/
    │   ├── index.ts
    │   ├── prisma.ts
    │   └── redis.ts
    └── package.json
```

### Naming Rules

| Item | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `Dashboard.tsx`, `UserProfile.tsx` |
| Utility functions | camelCase | `formatDate.ts`, `apiClient.ts` |
| Hooks | camelCase with `use` prefix | `useDebounce.ts`, `useAuth.ts` |
| Types/Interfaces | PascalCase | `UserData.ts`, `ApiResponse.ts` |
| Constants | SCREAMING_SNAKE_CASE | `API_ENDPOINTS.ts`, `MAX_RETRIES.ts` |
| Test files | Same as source + `.test` | `Dashboard.test.tsx`, `utils.test.ts` |
| API routes (Next.js) | lowercase + `route.ts` | `app/api/users/route.ts` |
| Pages (Next.js) | lowercase + `page.tsx` | `app/dashboard/page.tsx` |
| Folders | kebab-case | `user-profile/`, `api-client/` |

## Testing Conventions

### Test File Organization

- Place tests in `tests/` directory mirroring source structure
- OR place test files adjacent to source with `.test` suffix
- Use descriptive test file names: `{feature}.test.ts`

```
apps/web/
├── components/
│   └── Dashboard.tsx
└── tests/
    ├── components/
    │   └── Dashboard.test.tsx       # Component tests
    ├── unit/
    │   └── lib/
    │       └── utils.test.ts         # Unit tests
    └── api/
        └── users/
            └── route.test.ts         # API route tests
```

### Test Structure

Use Vitest with the following patterns:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Feature or Component Name', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, initialize test data
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Subfeature or method', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### Component Testing

Use React Testing Library for component tests:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should apply variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-red-600');
  });
});
```

### Mocking

Use Vitest's mocking utilities:

```typescript
// Mock an entire module
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Import the mocked module
import { apiClient } from '@/lib/api-client';

// Use in tests
describe('fetchUsers', () => {
  it('should fetch users from API', async () => {
    const mockUsers = [{ id: '1', name: 'Alice' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockUsers });

    const users = await fetchUsers();

    expect(users).toEqual(mockUsers);
    expect(apiClient.get).toHaveBeenCalledWith('/users');
  });
});
```

### Test Coverage

- Aim for at least 60% coverage (enforced in CI)
- Focus on critical paths and edge cases
- Don't test implementation details
- Test behavior, not internal state

## Database & Prisma Guidelines

### Schema Conventions

- Use `camelCase` for TypeScript models and fields
- Use `snake_case` for database tables and columns
- Map between them using `@map()` and `@@map()`

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

### Migrations

- Create migrations for all schema changes
- Use descriptive migration names
- Never edit existing migrations (create new ones)

```bash
# Create a migration
pnpm db:migrate dev --name add_user_email_verification

# Deploy migrations (production)
pnpm db:migrate:prod
```

### Prisma Client Usage

- Generate client after schema changes: `pnpm db:generate`
- Use a singleton pattern for the Prisma client
- Handle errors appropriately

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Usage in application
import { prisma } from '@/lib/prisma';

async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}
```

## Security Best Practices

### Input Validation

- **Always validate input** using Zod or similar libraries
- **Sanitize user input** to prevent XSS
- **Use parameterized queries** to prevent SQL injection (Prisma does this automatically)

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().min(13).max(120),
});

export async function createUser(input: unknown) {
  // Validate input
  const data = userSchema.parse(input);

  // Safe to use validated data
  return prisma.user.create({ data });
}
```

### Authentication & Authorization

- **Never store passwords in plain text** - use bcrypt or similar
- **Use JWT tokens** with appropriate expiration times
- **Implement rate limiting** on sensitive endpoints
- **Use httpOnly, secure, and sameSite cookies** for sessions

```typescript
// Setting secure cookies
res.cookie('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});
```

### Rate Limiting

- Apply rate limiting to all public endpoints
- Use stricter limits for sensitive operations (auth, password reset)

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
});

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts
  message: 'Too many login attempts, please try again later',
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
```

### Security Headers

- Use Helmet middleware for Express apps
- Configure CSP (Content Security Policy) appropriately

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Avoid unsafe-inline if possible
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Environment Variables & Secrets

- **Never commit `.env` files** (they're in `.gitignore`)
- Use `.env.example` to document required variables
- Validate environment variables on startup
- Use different secrets for different environments

## Error Handling

### Custom Error Classes

Use custom error classes for consistent error handling:

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}
```

### Error Responses

Provide consistent error response formats:

```typescript
// API Error Response Format
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Example usage
function errorResponse(error: AppError): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error instanceof ValidationError && { details: error.errors }),
    },
  };
}
```

### Logging

- Log errors with appropriate context
- Use different log levels (debug, info, warn, error)
- Never log sensitive information (passwords, tokens, etc.)

```typescript
import { logger } from '@/lib/monitoring/logger';

try {
  const result = await riskyOperation();
  logger.info('Operation successful', { result });
} catch (error) {
  logger.error('Operation failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    // Include relevant context, but not sensitive data
    userId: req.user?.id,
    operation: 'riskyOperation',
  });
  throw error;
}
```

---

Following these conventions will help maintain code quality, improve collaboration, and make the codebase more maintainable. When in doubt, look at existing code in the repository for examples!
