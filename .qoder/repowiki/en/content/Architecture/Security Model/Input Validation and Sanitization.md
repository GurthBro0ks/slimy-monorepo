# Input Validation and Sanitization

<cite>
**Referenced Files in This Document**   
- [security.js](file://apps/admin-api/src/middleware/security.js)
- [index.ts](file://packages/shared-auth/src/index.ts)
- [index.test.ts](file://packages/shared-auth/src/index.test.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [SanitizeInput Middleware Overview](#sanitizeinput-middleware-overview)
3. [Sanitization Rules and Patterns](#sanitization-rules-and-patterns)
4. [String and Object Sanitization Functions](#string-and-object-sanitization-functions)
5. [Suspicious Pattern Detection](#suspicious-pattern-detection)
6. [Data Reattachment and Error Handling](#data-reattachment-and-error-handling)
7. [Attack Payload Examples](#attack-payload-examples)
8. [Security and Data Integrity Balance](#security-and-data-integrity-balance)
9. [Integration with Security Layers](#integration-with-security-layers)

## Introduction
The slimy-monorepo platform implements a comprehensive input validation and sanitization system to protect against various web-based attacks. This document details the sanitizeInput middleware and related security mechanisms that process incoming requests to remove malicious content while maintaining application functionality.

**Section sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L97-L284)

## SanitizeInput Middleware Overview
The sanitizeInput middleware recursively processes request body, query parameters, and URL parameters to remove potentially malicious content. It operates as an Express.js middleware function that intercepts requests before they reach route handlers, ensuring all input data is cleaned before processing.

The middleware systematically examines all request components:
- Request body (req.body)
- Query parameters (req.query)
- URL parameters (req.params)

Each component is processed through recursive sanitization functions that handle nested objects and arrays, ensuring comprehensive protection against injection attacks.

```mermaid
flowchart TD
A[Incoming Request] --> B{SanitizeInput Middleware}
B --> C[Sanitize Request Body]
B --> D[Sanitize Query Parameters]
B --> E[Sanitize URL Parameters]
C --> F[Recursive Object Traversal]
D --> F
E --> F
F --> G[Cleaned Request Data]
G --> H[Route Handler]
```

**Diagram sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L190-L205)

**Section sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L98-L207)

## Sanitization Rules and Patterns
The sanitization system implements multiple rules to remove various types of malicious content:

### Malicious Content Removal
- **Script tags**: Complete removal of `<script>` tags and their contents using regex pattern `/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi`
- **Iframe tags**: Removal of `<iframe>` tags with `/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi`
- **Object/embed/form tags**: Elimination of `<object>`, `<embed>`, and `<form>` tags via `/<(object|embed|form)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi`
- **JavaScript/VBScript protocols**: Stripping of `javascript:`, `vbscript:`, and `data:` protocols with `/(javascript|vbscript|data):/gi`
- **Path traversal attempts**: Removal of `../` patterns using `/\.\.[\/\\]/g`
- **Control characters**: Elimination of null bytes and control characters via `/[\x00-\x1F\x7F]/g`

### Additional Security Measures
- Event handler attributes (on* attributes) are removed
- Style tags containing JavaScript are eliminated
- Meta refresh redirects are stripped
- Basic SQL injection patterns are neutralized
- Template injection attempts (e.g., `{{content}}`) are removed
- Whitespace is trimmed and normalized

```mermaid
flowchart TD
A[Input String] --> B{Check Content Type}
B --> |String| C[Apply Regex Sanitization]
B --> |Array| D[Process Each Element]
B --> |Object| E[Sanitize Keys and Values]
C --> F[Remove Script Tags]
C --> G[Remove JS Protocols]
C --> H[Remove Path Traversal]
C --> I[Remove Control Characters]
F --> J[Cleaned String]
G --> J
H --> J
I --> J
J --> K[Return Sanitized Data]
```

**Diagram sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L100-L144)

**Section sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L100-L144)

## String and Object Sanitization Functions
The sanitization system employs two primary functions that work together to clean input data.

### sanitizeString Function
The `sanitizeString` function handles individual string inputs with comprehensive cleaning:

- Validates input type before processing
- Applies multiple regex patterns to remove malicious content
- Handles edge cases like null, undefined, and non-string inputs
- Trims whitespace and normalizes the string

### sanitizeObject Function
The `sanitizeObject` function provides recursive processing for complex data structures:

- Handles strings by delegating to sanitizeString
- Processes arrays by mapping each element through sanitization
- Handles objects by recursively sanitizing both keys and values
- Implements recursion depth limiting (maxDepth = 10) to prevent infinite loops
- Includes safeguards against denial-of-service attacks by limiting array size (1000 elements) and object keys (100 keys)
- Sanitizes object keys to prevent injection through property names

The recursive nature allows the system to handle deeply nested JSON structures commonly found in modern web applications.

```mermaid
classDiagram
class sanitizeString {
+sanitizeString(str : string) : string
-removeScriptTags(str : string) : string
-removeJsProtocols(str : string) : string
-removePathTraversal(str : string) : string
-removeControlChars(str : string) : string
}
class sanitizeObject {
+sanitizeObject(obj : any, maxDepth : int, currentDepth : int) : any
-handleString(obj : string) : string
-handleArray(obj : Array) : Array
-handleObject(obj : Object) : Object
-sanitizeKey(key : string) : string
}
sanitizeObject --> sanitizeString : "uses"
```

**Diagram sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L100-L188)

**Section sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L100-L188)

## Suspicious Pattern Detection
The system includes proactive detection of suspicious patterns that may indicate attack attempts:

- **SQL injection attempts**: Detection of patterns like "union select" using `/union.*select/i`
- **Base64 encoding**: Identification of base64-encoded content with `/base64/i`
- **Code execution**: Detection of eval calls via `/eval\(/i`
- **Directory traversal**: Monitoring for `../` patterns with `/\.\./`
- **Script injection**: Detection of script tags using `/<script/i`

These patterns are checked in a dedicated security logging middleware that analyzes the stringified request data (body, query, and params). When suspicious patterns are detected, the system logs a warning with relevant security information including IP address, user agent, request method, and path.

The detection occurs after sanitization, serving as a monitoring and alerting mechanism rather than a blocking measure, allowing the system to maintain availability while gathering intelligence on potential attacks.

```mermaid
flowchart TD
A[Incoming Request] --> B[Sanitization]
B --> C[Stringify Request Data]
C --> D{Check Suspicious Patterns}
D --> |Match Found| E[Log Security Warning]
D --> |No Match| F[Continue Processing]
E --> G[Include IP, User Agent, Method, Path]
G --> H[Security Log]
F --> H
```

**Diagram sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L238-L259)

**Section sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L238-L259)

## Data Reattachment and Error Handling
After sanitization, cleaned data is reattached to the request object, replacing the original input:

- Sanitized request body is assigned to `req.body`
- Cleaned query parameters are assigned to `req.query`
- Processed URL parameters are assigned to `req.params`

The system implements a resilient error handling strategy:

- All sanitization operations are wrapped in try-catch blocks
- If sanitization fails, a warning is logged but processing continues
- The original request flow is maintained even when sanitization encounters errors
- This approach prioritizes application availability while still providing security protection

The error handling ensures that transient issues with the sanitization process do not result in service disruption, maintaining the principle of graceful degradation in security systems.

```mermaid
sequenceDiagram
participant Client
participant Middleware
participant Sanitizer
participant Logger
participant RouteHandler
Client->>Middleware : Send Request
Middleware->>Sanitizer : Call sanitizeObject()
Sanitizer->>Sanitizer : Process body, query, params
alt Sanitization Success
Sanitizer-->>Middleware : Return cleaned data
Middleware->>Middleware : Attach to req object
else Sanitization Error
Sanitizer--x Middleware : Throw error
Middleware->>Logger : Log warning
Logger-->>Middleware : Acknowledge
end
Middleware->>RouteHandler : next()
RouteHandler->>Client : Send Response
```

**Diagram sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L191-L204)

**Section sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L191-L204)

## Attack Payload Examples
The sanitization system neutralizes various attack payloads:

### XSS Attack Attempts
- `<script>alert('xss')</script>` → `alert('xss')` (script tag removed)
- `<img src="x" onerror="malicious()">` → `<img src="x" >` (event handler removed)
- `javascript:alert('xss')` → `alert('xss')` (javascript protocol removed)

### Path Traversal Attempts
- `../../../etc/passwd` → `etc/passwd` (path traversal sequences removed)
- `..\\..\\windows\\system32` → `windows\\system32` (Windows path traversal removed)

### SQL Injection Attempts
- `admin' OR '1'='1` → `admin OR 1=1` (quotes and operators partially neutralized)
- `'; DROP TABLE users; --` → ` DROP TABLE users  ` (comment and statement terminators removed)

### iframe Injection
- `<iframe src="malicious.com"></iframe>` → `` (entire iframe tag removed)

### Template Injection
- `{{7*7}}` → `` (template expression removed)
- `{% if True %}malicious{% endif %}` → ` if True  malicious  endif ` (template tags removed)

These examples demonstrate the system's effectiveness in removing malicious content while preserving legitimate data.

**Section sources**
- [index.test.ts](file://packages/shared-auth/src/index.test.ts#L163-L190)
- [security.js](file://apps/admin-api/src/middleware/security.js#L112-L115)

## Security and Data Integrity Balance
The system strikes a careful balance between security and data integrity:

- **Continued processing**: The system continues processing requests even if sanitization fails, preventing denial-of-service conditions
- **Non-destructive cleaning**: Sanitization removes malicious patterns but preserves legitimate content
- **Graceful degradation**: Security features fail open rather than fail closed, maintaining availability
- **Comprehensive coverage**: All input vectors (body, query, params) are sanitized to prevent bypass attempts
- **Performance considerations**: Limits on recursion depth, array size, and object keys prevent resource exhaustion attacks

This approach recognizes that perfect security can sometimes conflict with usability and availability, opting for a pragmatic defense-in-depth strategy that reduces risk without compromising core functionality.

**Section sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L201-L204)

## Integration with Security Layers
The input sanitization system integrates with other security layers to provide comprehensive protection:

- **Rate limiting**: Works with authRateLimit, apiRateLimit, and chatRateLimit to prevent brute force and DoS attacks
- **Security headers**: Complements helmet-based security headers (CSP, HSTS, frameguard)
- **Request size limiting**: Collaborates with requestSizeLimit middleware to prevent large payload attacks
- **Security logging**: Provides data to securityLogger for monitoring and incident response
- **Authentication**: Works alongside auth middleware to protect authenticated endpoints

The layered approach follows security best practices, ensuring that even if one layer is bypassed, others provide additional protection. This defense-in-depth strategy enhances overall system resilience against various attack vectors.

```mermaid
graph TB
A[Client Request] --> B[Request Size Limit]
B --> C[Security Headers]
C --> D[Rate Limiting]
D --> E[Input Sanitization]
E --> F[Authentication]
F --> G[Business Logic]
E --> H[Security Logging]
D --> H
F --> H
```

**Diagram sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L11-L284)

**Section sources**
- [security.js](file://apps/admin-api/src/middleware/security.js#L11-L284)