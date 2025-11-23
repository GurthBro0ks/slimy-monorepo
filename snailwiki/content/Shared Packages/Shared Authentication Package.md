# Shared Authentication Package

<cite>
**Referenced Files in This Document**   
- [package.json](file://packages/shared-auth/package.json)
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [jwt.js](file://apps/admin-api/lib/jwt.js)
- [token.js](file://apps/admin-api/src/services/token.js)
- [auth.js](file://apps/admin-api/src/routes/auth.js)
- [oauth.js](file://apps/admin-api/src/services/oauth.js)
- [roles.js](file://apps/admin-api/src/lib/roles.js)
- [index.ts](file://apps/web/lib/auth/index.ts)
- [server.ts](file://apps/web/lib/auth/server.ts)
- [types.ts](file://apps/web/lib/auth/types.ts)
- [context.tsx](file://apps/web/lib/auth/context.tsx)
- [session.js](file://apps/admin-ui/lib/session.js)
- [route.ts](file://apps/web/app/api/auth/me/route.ts)
- [middleware.ts](file://apps/web/middleware.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Integration Patterns](#integration-patterns)
5. [Token Management](#token-management)
6. [Error Handling](#error-handling)
7. [Versioning and Compatibility](#versioning-and-compatibility)
8. [Testing Practices](#testing-practices)
9. [Security Considerations](#security-considerations)
10. [Extensibility Guidelines](#extensibility-guidelines)

## Introduction

The shared-auth package provides centralized authentication logic across the Slimy Monorepo, ensuring consistent authentication behavior across admin-api, web, and admin-ui applications. This documentation details the export interfaces, integration patterns, and best practices for using this critical shared component.

The authentication system is built around JWT-based session management with OAuth integration for Discord authentication. It provides a unified approach to user authentication, role-based access control, and session management across multiple applications in the monorepo.

**Section sources**
- [package.json](file://packages/shared-auth/package.json)

## Architecture Overview

The shared authentication system follows a centralized pattern where authentication logic is implemented in the admin-api service and consumed by client applications (web and admin-ui). The architecture consists of three main layers:

1. **Authentication Service Layer**: Implemented in admin-api, handling OAuth flows, JWT generation, and session management
2. **Middleware Layer**: Express middleware for server-side applications and Next.js middleware for client applications
3. **Client Consumption Layer**: React context providers and utility functions for managing authentication state in UI applications

```mermaid
graph TD
subgraph "Client Applications"
A[Web App] --> |HTTP Requests| B[Admin API]
C[Admin UI] --> |HTTP Requests| B
end
subgraph "Authentication Service"
B --> D[OAuth Handler]
D --> E[JWT Utilities]
E --> F[Session Store]
B --> G[RBAC Service]
end
subgraph "External Services"
D --> H[Discord API]
F --> I[Redis/Database]
end
A --> J[Next.js Middleware]
C --> K[React Context]
J --> B
K --> B
```

**Diagram sources**
- [auth.js](file://apps/admin-api/src/routes/auth.js)
- [middleware.ts](file://apps/web/middleware.ts)
- [session.js](file://apps/admin-ui/lib/session.js)

## Core Components

The shared authentication system consists of several core components that work together to provide a comprehensive authentication solution.

### JWT Utilities

The JWT utilities handle token creation, verification, and cookie management. The system uses HS256 algorithm for signing tokens with configurable secret keys and expiration times.

```mermaid
classDiagram
class JWTUtils {
+string COOKIE_NAME
+signSession(payload) string
+verifySession(token) object
+setAuthCookie(res, token) void
+clearAuthCookie(res) void
}
class TokenService {
+createSessionToken(user, guilds, role) object
+verifySessionToken(token) object
+getCookieOptions() object
}
JWTUtils --> TokenService : "delegates"
```

**Diagram sources**
- [jwt.js](file://apps/admin-api/lib/jwt.js)
- [token.js](file://apps/admin-api/src/services/token.js)

### Session Validation

Session validation is implemented through middleware that extracts and verifies authentication tokens from requests. The system supports multiple cookie names for backward compatibility and handles both JWT verification and session store validation.

```mermaid
flowchart TD
Start([Request Received]) --> ExtractCookie["Extract Auth Cookie"]
ExtractCookie --> CookieExists{"Cookie Exists?"}
CookieExists --> |No| SetUserNull["Set req.user = null"]
CookieExists --> |Yes| VerifyToken["Verify JWT Token"]
VerifyToken --> TokenValid{"Token Valid?"}
TokenValid --> |No| SetUserNull
TokenValid --> |Yes| HydrateUser["Hydrate User Object"]
HydrateUser --> CheckSessionStore["Check Session Store"]
CheckSessionStore --> StoreHasData{"Session Store Has Data?"}
StoreHasData --> |Yes| MergeSession["Merge Session Data"]
StoreHasData --> |No| ContinueWithJWT["Continue with JWT Data"]
MergeSession --> SetUser["Set req.user"]
ContinueWithJWT --> SetUser
SetUser --> NextMiddleware["Call Next Middleware"]
```

**Diagram sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [jwt.js](file://apps/admin-api/lib/jwt.js)

### OAuth Helpers

The OAuth helpers facilitate Discord authentication, handling the OAuth2 authorization code flow, token exchange, and user profile retrieval. The system includes state parameter validation to prevent CSRF attacks and parallel guild membership checks for performance optimization.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Auth as "Auth Service"
participant Discord as "Discord API"
Client->>Auth : GET /api/auth/login
Auth->>Client : Redirect to Discord OAuth URL
Client->>Discord : OAuth Authorization
Discord->>Client : Authorization Code
Client->>Auth : GET /api/auth/callback?code=...
Auth->>Discord : POST /oauth2/token
Discord->>Auth : Access Token
Auth->>Discord : GET /users/@me
Auth->>Discord : GET /users/@me/guilds
Auth->>Auth : Process User Data
Auth->>Auth : Determine User Role
Auth->>Auth : Create Session Token
Auth->>Client : Set Auth Cookie
Client->>Auth : GET /api/auth/me
Auth->>Client : Return User Data
```

**Diagram sources**
- [auth.js](file://apps/admin-api/src/routes/auth.js)
- [oauth.js](file://apps/admin-api/src/services/oauth.js)

**Section sources**
- [auth.js](file://apps/admin-api/src/routes/auth.js)
- [oauth.js](file://apps/admin-api/src/services/oauth.js)
- [roles.js](file://apps/admin-api/src/lib/roles.js)

## Integration Patterns

The shared authentication system is consumed by multiple applications in the monorepo using different integration patterns tailored to each application's architecture.

### Express Middleware Integration

In the admin-api application, authentication is implemented as Express middleware that can be applied to specific routes or globally. The middleware provides several functions for different authentication requirements:

```mermaid
classDiagram
class AuthMiddleware {
+attachSession(req, res, next) void
+requireAuth(req, res, next) void
+requireRole(minRole) function
+requireGuildMember(paramKey) function
+resolveUser(req) User
+readAuth(req, res, next) void
}
class RBACMiddleware {
+hasRole(userRole, minRole) boolean
+resolveRoleLevel(memberRoleIds) string
}
AuthMiddleware --> RBACMiddleware : "depends on"
```

**Diagram sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [rbac.js](file://apps/admin-api/src/services/rbac.js)

### Next.js API Route Integration

The web application consumes the authentication system through Next.js API routes that proxy requests to the admin-api authentication endpoints. This pattern allows the web application to maintain its server-side rendering capabilities while leveraging the centralized authentication service.

```mermaid
sequenceDiagram
participant Client as "Web Browser"
participant Web as "Web App"
participant Admin as "Admin API"
Client->>Web : GET /api/auth/me
Web->>Admin : GET /api/auth/me
Admin->>Web : User Data + Session
Web->>Web : Process User Data
Web->>Client : Return User Data
```

**Diagram sources**
- [route.ts](file://apps/web/app/api/auth/me/route.ts)
- [server.ts](file://apps/web/lib/auth/server.ts)

### Client-Side Integration

Both the web and admin-ui applications implement client-side authentication using React context providers that manage authentication state and provide utility functions for login, logout, and session refresh.

```mermaid
classDiagram
class AuthContext {
+user : User
+loading : boolean
+error : string
+login() void
+logout() void
+refresh() Promise
}
class SessionContext {
+user : User
+csrfToken : string
+loading : boolean
+refresh() Promise
+setCsrfToken(token) void
}
AuthContext --> AuthProvider : "provided by"
SessionContext --> SessionProvider : "provided by"
```

**Diagram sources**
- [context.tsx](file://apps/web/lib/auth/context.tsx)
- [session.js](file://apps/admin-ui/lib/session.js)

**Section sources**
- [context.tsx](file://apps/web/lib/auth/context.tsx)
- [session.js](file://apps/admin-ui/lib/session.js)
- [server.ts](file://apps/web/lib/auth/server.ts)

## Token Management

The token management system handles the creation, verification, and lifecycle of authentication tokens across the monorepo.

### Token Generation

Tokens are generated during the OAuth callback process and contain user information including ID, username, role, and guild memberships. The system creates both JWT tokens for session management and CSRF tokens for form protection.

```mermaid
flowchart TD
Start([OAuth Callback]) --> ExtractData["Extract User Data"]
ExtractData --> CreateCSRF["Generate CSRF Token"]
CreateCSRF --> BuildPayload["Build Token Payload"]
BuildPayload --> SignToken["Sign JWT Token"]
SignToken --> StoreSession["Store Session Data"]
StoreSession --> SetCookie["Set Auth Cookie"]
SetCookie --> Redirect["Redirect to Dashboard"]
```

**Diagram sources**
- [auth.js](file://apps/admin-api/src/routes/auth.js)
- [token.js](file://apps/admin-api/src/services/token.js)

### Token Verification

Token verification occurs on every authenticated request, validating the JWT signature and extracting user information. The system supports both direct JWT verification and session store validation for enhanced security.

```mermaid
flowchart TD
Start([Request Received]) --> ExtractToken["Extract Token from Cookie"]
ExtractToken --> VerifyJWT["Verify JWT Signature"]
VerifyJWT --> JWTValid{"JWT Valid?"}
JWTValid --> |No| Return401["Return 401 Unauthorized"]
JWTValid --> |Yes| ExtractUser["Extract User from Payload"]
ExtractUser --> CheckSessionStore["Check Session Store"]
CheckSessionStore --> StoreValid{"Session Valid?"}
StoreValid --> |No| UseJWTData["Use JWT Data Only"]
StoreValid --> |Yes| MergeData["Merge Session Data"]
MergeData --> SetUser["Set req.user"]
UseJWTData --> SetUser
SetUser --> Next["Call Next Middleware"]
```

**Diagram sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [jwt.js](file://apps/admin-api/lib/jwt.js)

**Section sources**
- [jwt.js](file://apps/admin-api/lib/jwt.js)
- [token.js](file://apps/admin-api/src/services/token.js)

## Error Handling

The authentication system implements comprehensive error handling to ensure robust operation and provide meaningful feedback during authentication failures.

### Authentication Error Types

The system defines several error types that can occur during the authentication process:

```mermaid
classDiagram
class AuthenticationError {
+message : string
+status : number
}
AuthenticationError <|-- TokenVerificationError
AuthenticationError <|-- SessionNotFoundError
AuthenticationError <|-- OAuthStateMismatchError
AuthenticationError <|-- TokenExchangeError
AuthenticationError <|-- CSRFTokenError
class TokenVerificationError {
+token : string
}
class SessionNotFoundError {
+userId : string
}
class OAuthStateMismatchError {
+expected : string
+actual : string
}
class TokenExchangeError {
+discordError : string
}
class CSRFTokenError {
+expected : string
+actual : string
}
```

**Diagram sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [auth.js](file://apps/admin-api/src/routes/auth.js)

### Error Handling Flow

The error handling flow ensures that authentication failures are properly logged and appropriate responses are returned to clients:

```mermaid
flowchart TD
Start([Authentication Error]) --> LogError["Log Error Details"]
LogError --> ClassifyError["Classify Error Type"]
ClassifyError --> TokenError{"Token Error?"}
ClassifyError --> SessionError{"Session Error?"}
ClassifyError --> OAuthError{"OAuth Error?"}
ClassifyError --> CSRFError{"CSRF Error?"}
TokenError --> |Yes| ClearCookie["Clear Auth Cookie"]
SessionError --> |Yes| ClearCookie
OAuthError --> |Yes| RedirectLogin["Redirect to Login"]
CSRFError --> |Yes| Return403["Return 403 Forbidden"]
ClearCookie --> Return401["Return 401 Unauthorized"]
RedirectLogin --> Return302["Return 302 Redirect"]
Return401 --> End
Return302 --> End
Return403 --> End
```

**Diagram sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [auth.js](file://apps/admin-api/src/routes/auth.js)

**Section sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [auth.js](file://apps/admin-api/src/routes/auth.js)

## Versioning and Compatibility

The shared-auth package follows semantic versioning principles to ensure backward compatibility and smooth upgrades across the monorepo.

### Versioning Strategy

The package uses semantic versioning (MAJOR.MINOR.PATCH) with the following guidelines:

- **MAJOR**: Breaking changes to the public API or authentication protocol
- **MINOR**: New features or enhancements that maintain backward compatibility
- **PATCH**: Bug fixes and security patches

### Backward Compatibility

The system maintains backward compatibility through several mechanisms:

1. **Cookie Name Fallback**: Support for multiple cookie names during transitions
2. **Graceful Token Expiration**: Gradual deprecation of old token formats
3. **Configuration Overrides**: Environment variables to control behavior during migrations

```mermaid
flowchart TD
Start([Version Upgrade]) --> AssessImpact["Assess Impact"]
AssessImpact --> BreakingChange{"Breaking Change?"}
BreakingChange --> |Yes| PlanMigration["Plan Migration Strategy"]
BreakingChange --> |No| ImplementFeature["Implement Feature"]
PlanMigration --> Communicate["Communicate to Teams"]
Communicate --> ImplementMigration["Implement Migration"]
ImplementMigration --> TestMigration["Test Migration"]
TestMigration --> DeployStaged["Deploy Staged"]
DeployStaged --> Monitor["Monitor for Issues"]
ImplementFeature --> TestFeature["Test Feature"]
TestFeature --> DeployFeature["Deploy Feature"]
DeployFeature --> End
Monitor --> End
```

**Section sources**
- [package.json](file://packages/shared-auth/package.json)

## Testing Practices

The authentication system includes comprehensive testing practices to ensure reliability and security.

### Unit Testing

Unit tests focus on individual functions and utilities, ensuring they behave correctly in isolation:

```mermaid
flowchart TD
Start([Unit Test]) --> Setup["Setup Test Environment"]
Setup --> MockDependencies["Mock Dependencies"]
MockDependencies --> Execute["Execute Function"]
Execute --> Verify["Verify Results"]
Verify --> Assert["Assert Expected Behavior"]
Assert --> Cleanup["Cleanup"]
Cleanup --> End
```

**Section sources**
- [auth.js](file://apps/admin-api/src/middleware/auth.js)
- [auth.test.js](file://apps/admin-api/src/middleware/auth.test.js)

### Integration Testing

Integration tests verify the complete authentication flow, from login to protected route access:

```mermaid
sequenceDiagram
participant Test as "Test Runner"
participant Client as "HTTP Client"
participant Server as "Auth Server"
Test->>Client : Start Test
Client->>Server : GET /api/auth/login
Server->>Client : Redirect to OAuth
Client->>Server : GET /api/auth/callback?code=...
Server->>Client : Set Auth Cookie
Client->>Server : GET /api/protected
Server->>Client : Return 200 OK
Client->>Test : Report Success
```

**Section sources**
- [auth-and-guilds.test.js](file://apps/admin-api/tests/auth-and-guilds.test.js)
- [auth-flow.test.js](file://apps/admin-api/tests/integration/auth-flow.test.js)

## Security Considerations

The authentication system implements several security measures to protect user data and prevent common vulnerabilities.

### Security Features

```mermaid
flowchart TD
Start([Security Features]) --> HTTPS["Enforce HTTPS in Production"]
Start --> SecureCookies["Secure, HttpOnly Cookies"]
Start --> CSRF["CSRF Protection with Tokens"]
Start --> StateValidation["OAuth State Parameter Validation"]
Start --> RateLimiting["Rate Limiting on Auth Endpoints"]
Start --> SecretRotation["JWT Secret Rotation Support"]
Start --> SessionExpiry["Configurable Session Expiry"]
Start --> RoleValidation["Strict Role Validation"]
```

**Section sources**
- [jwt.js](file://apps/admin-api/lib/jwt.js)
- [auth.js](file://apps/admin-api/src/routes/auth.js)
- [token.js](file://apps/admin-api/src/services/token.js)

### Token Security

The token security implementation follows best practices for JWT usage:

```mermaid
classDiagram
class TokenSecurity {
+algorithm : "HS256"
+minSecretLength : 32
+maxAgeSeconds : 43200
+cookieSecure : true
+cookieSameSite : "lax"
+cookieHttpOnly : true
}
class TokenValidation {
+verifySignature(token, secret) boolean
+checkExpiration(payload) boolean
+validateClaims(payload) boolean
+verifyCSRF(token, expected) boolean
}
TokenSecurity --> TokenValidation : "configures"
```

**Diagram sources**
- [jwt.js](file://apps/admin-api/lib/jwt.js)
- [token.js](file://apps/admin-api/src/services/token.js)

## Extensibility Guidelines

The shared-auth package is designed to be extensible, allowing for the addition of new authentication methods and features.

### Adding New Authentication Methods

To add a new authentication method, follow these steps:

```mermaid
flowchart TD
Start([New Auth Method]) --> DefineInterface["Define Public Interface"]
DefineInterface --> ImplementProvider["Implement Provider"]
ImplementProvider --> AddRoutes["Add API Routes"]
AddRoutes --> CreateMiddleware["Create Middleware"]
CreateMiddleware --> UpdateConfig["Update Configuration"]
UpdateConfig --> WriteTests["Write Tests"]
WriteTests --> Document["Document Changes"]
Document --> Publish["Publish New Version"]
```

### Extension Points

The system provides several extension points for customization:

```mermaid
classDiagram
class ExtensionPoints {
+Custom OAuth Providers
+Additional Token Claims
+Custom Role Hierarchies
+Session Storage Adapters
+Authentication Hooks
+Token Refresh Strategies
+CSRF Protection Methods
}
```

**Section sources**
- [package.json](file://packages/shared-auth/package.json)
- [auth.js](file://apps/admin-api/src/routes/auth.js)
- [oauth.js](file://apps/admin-api/src/services/oauth.js)