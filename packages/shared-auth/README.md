# @slimy/shared-auth

Authentication and authorization utilities for Slimy.ai services

## Purpose

Provides reusable authentication and authorization logic across all Slimy.ai applications, including:
- JWT token generation and validation
- Session management
- OAuth provider integration (Discord, Google)
- Role-Based Access Control (RBAC)
- Password hashing and validation
- Cookie handling for web sessions

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Code needs to be extracted from:
- `apps/admin-api/lib/jwt.js`
- `apps/admin-api/lib/session.js`
- `apps/admin-api/middleware/auth.js`
- `apps/web/lib/auth/` (if applicable)

## Proposed Tech Stack

- **jsonwebtoken (v9.x)** - JWT creation and verification
- **bcrypt** - Password hashing
- **cookie** - Cookie parsing and serialization
- **TypeScript** - Type-safe interfaces
- **OAuth libraries** - For provider integration

## Proposed API

### JWT Utilities

```typescript
import { createToken, verifyToken, refreshToken } from '@slimy/shared-auth';

// Create JWT
const token = createToken({
  userId: '123',
  roles: ['admin'],
}, {
  expiresIn: '1h',
  secret: process.env.JWT_SECRET,
});

// Verify JWT
const payload = verifyToken(token, process.env.JWT_SECRET);

// Refresh token
const newToken = refreshToken(oldToken, process.env.JWT_SECRET);
```

### Session Management

```typescript
import { createSession, getSession, destroySession } from '@slimy/shared-auth';

// Create session
const sessionId = await createSession({
  userId: '123',
  expiresAt: Date.now() + 86400000, // 24 hours
});

// Get session
const session = await getSession(sessionId);

// Destroy session
await destroySession(sessionId);
```

### OAuth Integration

```typescript
import { DiscordOAuth, GoogleOAuth } from '@slimy/shared-auth';

// Discord OAuth
const discord = new DiscordOAuth({
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: 'https://slimyai.xyz/auth/discord/callback',
});

const authUrl = discord.getAuthUrl(['identify', 'guilds']);
const tokens = await discord.exchangeCode(code);
const user = await discord.getUser(tokens.access_token);

// Google OAuth
const google = new GoogleOAuth({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'https://slimyai.xyz/auth/google/callback',
});
```

### RBAC (Role-Based Access Control)

```typescript
import { checkPermission, hasRole } from '@slimy/shared-auth';

// Check permission
const canEdit = checkPermission(user, 'guild:edit');

// Check role
const isAdmin = hasRole(user, 'admin');

// Express middleware
import { requireRole, requirePermission } from '@slimy/shared-auth';

app.get('/admin', requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin only' });
});

app.post('/guild/:id', requirePermission('guild:edit'), (req, res) => {
  // Edit guild
});
```

### Password Utilities

```typescript
import { hashPassword, verifyPassword } from '@slimy/shared-auth';

// Hash password
const hash = await hashPassword('user-password');

// Verify password
const isValid = await verifyPassword('user-password', hash);
```

## Proposed Directory Structure

```
packages/shared-auth/
├── src/
│   ├── index.ts              # Main exports
│   ├── jwt.ts                # JWT utilities
│   ├── session.ts            # Session management
│   ├── password.ts           # Password hashing
│   ├── oauth/                # OAuth providers
│   │   ├── discord.ts
│   │   ├── google.ts
│   │   └── base.ts           # Base OAuth class
│   ├── rbac/                 # Role-based access control
│   │   ├── permissions.ts
│   │   ├── roles.ts
│   │   └── middleware.ts
│   ├── cookies/              # Cookie utilities
│   │   └── parser.ts
│   └── types/                # TypeScript types
│       ├── jwt.ts
│       ├── session.ts
│       └── oauth.ts
├── tests/
│   ├── jwt.test.ts
│   ├── session.test.ts
│   ├── password.test.ts
│   └── oauth.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Migration Checklist

### Code to Extract

1. **From `apps/admin-api/lib/jwt.js`**:
   - `generateToken()` → `createToken()`
   - `verifyToken()` → `verifyToken()`
   - `refreshToken()` → `refreshToken()`

2. **From `apps/admin-api/lib/session.js`**:
   - Session storage logic (Redis)
   - Session validation
   - Session expiration handling

3. **From `apps/admin-api/middleware/auth.js`**:
   - `authenticateJWT` middleware
   - Role checking middleware
   - Permission checking middleware

4. **From `apps/admin-api/src/routes/auth.js`**:
   - Discord OAuth flow
   - Token exchange logic
   - User profile fetching

### Dependencies to Install

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "cookie": "^0.6.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "@types/cookie": "^0.6.0",
    "vitest": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

### Integration Steps

1. Create package structure
2. Extract JWT utilities from admin-api
3. Extract session management logic
4. Extract OAuth provider code
5. Add TypeScript types
6. Write unit tests
7. Update `apps/admin-api` to import from `@slimy/shared-auth`
8. Update `apps/web` to import from `@slimy/shared-auth`
9. Remove duplicate code from apps

## Environment Variables

This package should accept configuration, not read env vars directly:

```typescript
// Bad (reads env directly)
const token = createToken(payload); // Uses process.env.JWT_SECRET internally

// Good (accepts config)
const token = createToken(payload, {
  secret: config.jwtSecret,
  expiresIn: config.jwtExpiresIn,
});
```

Apps should read env vars and pass config to shared-auth.

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Used By

- `@slimy/web` - Web app authentication
- `@slimy/admin-api` - API authentication and authorization
- `@slimy/admin-ui` - Admin dashboard auth
- `@slimy/bot` - Bot service authentication (future)

## Related Packages

- `@slimy/shared-config` - Configuration management
- `@slimy/shared-db` - Database access for session storage
- `@slimy/shared-codes` - Error codes for auth failures

## Security Considerations

1. **Secret Management**: Never hardcode secrets in this package
2. **Token Expiration**: Always validate token expiration
3. **Session Storage**: Use secure session storage (Redis with encryption)
4. **Password Hashing**: Use bcrypt with appropriate rounds (10-12)
5. **OAuth State**: Validate OAuth state parameter to prevent CSRF
6. **Cookie Security**: Set `httpOnly`, `secure`, `sameSite` flags

## Future Enhancements

- **Multi-factor Authentication (MFA)**: TOTP support
- **API Key Management**: Generate and validate API keys
- **Rate Limiting**: Token-based rate limiting
- **Audit Logging**: Track authentication events
- **SSO Support**: SAML or OpenID Connect integration

## License

Proprietary - Slimy.ai
