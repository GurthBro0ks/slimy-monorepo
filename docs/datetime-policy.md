# Date/Time Handling Policy

**Status**: Active
**Last Updated**: 2025-11-19
**Applies To**: admin-api, web

---

## Policy Summary

**All APIs use UTC in ISO 8601 format internally and for responses. UI converts to user's local time for display.**

This standardization ensures:
- Predictable behavior across timezones
- Consistent API responses
- Clear user experience with local time displays
- No ambiguity in date boundaries or comparisons

---

## API Guidelines (admin-api)

### Internal Representation

All timestamps must be handled in **UTC** internally. Use the datetime utility library for consistency:

```javascript
const { nowISO, toISO, formatDateSlug } = require('../lib/datetime');

// Current timestamp in ISO 8601 UTC
const timestamp = nowISO();
// "2025-11-19T03:21:18.000Z"

// Convert Date object to ISO
const isoString = toISO(new Date());
// "2025-11-19T03:21:18.000Z"

// Format date for file paths (uses UTC)
const slug = formatDateSlug(new Date());
// "2025-11-19"
```

### API Response Format

All timestamp fields in API responses **MUST** be in ISO 8601 format:

```javascript
// ✅ Correct
res.json({
  ok: true,
  timestamp: nowISO(),
  createdAt: toISO(user.createdAt),
  updatedAt: toISO(user.updatedAt)
});

// ❌ Incorrect
res.json({
  timestamp: Date.now(),  // Unix milliseconds
  createdAt: new Date(),  // Date object
  updatedAt: user.updatedAt.toString()  // Ambiguous format
});
```

**ISO 8601 Format**: `YYYY-MM-DDTHH:mm:ss.sssZ`
**Example**: `2025-11-19T03:21:18.000Z`

### Common Timestamp Fields

Standard field names for consistency:

| Field | Purpose | Example |
|-------|---------|---------|
| `createdAt` | When record was created | `2025-11-19T03:21:18.000Z` |
| `updatedAt` | When record was last modified | `2025-11-19T05:30:00.000Z` |
| `timestamp` | Generic timestamp | `2025-11-19T03:21:18.000Z` |
| `expiresAt` | When something expires | `2025-11-26T03:21:18.000Z` |
| `uploadedAt` | When file was uploaded | `2025-11-19T03:21:18.000Z` |
| `deletedAt` | When record was soft-deleted | `2025-11-19T10:00:00.000Z` |
| `generatedAt` | When report/data was generated | `2025-11-19T03:21:18.000Z` |
| `processedAt` | When job/task was processed | `2025-11-19T03:21:18.000Z` |

### Backward Compatibility

When adding timestamp standardization to existing endpoints:

1. **Keep existing fields** for backward compatibility
2. **Add new ISO field** alongside if existing format is non-ISO
3. **Document deprecation** of old field in API docs

Example:
```javascript
// Legacy endpoint returning unix timestamp
res.json({
  timestamp: Date.now(),           // Keep for compatibility
  timestampIso: nowISO(),          // Add new ISO field
  // Deprecation notice in API docs
});
```

### File System Operations

For file organization by date (e.g., uploads), use UTC-based date slugs to ensure consistent date boundaries across timezones:

```javascript
const { formatDateSlug } = require('../lib/datetime');

// Create date-based directory
const daySlug = formatDateSlug(new Date());  // "2025-11-19" in UTC
const path = `/uploads/${guildId}/${daySlug}`;
```

---

## UI Guidelines (web)

### Display Formatting

All dates/times from APIs **MUST** be converted to user's local time for display. Use the datetime utility library:

```typescript
import {
  formatDateTime,
  formatDate,
  formatTime,
  formatRelativeTime
} from '@/lib/datetime';

// Full date and time: "Nov 19, 2025 9:20 PM"
formatDateTime(timestamp);

// Date only: "Nov 19, 2025"
formatDate(timestamp);

// Time only: "9:20 PM"
formatTime(timestamp);

// Relative time: "3 minutes ago"
formatRelativeTime(timestamp);
```

### Common Use Cases

| Use Case | Function | Output Example |
|----------|----------|----------------|
| Event timestamp | `formatDateTime()` | "Nov 19, 2025 9:20 PM" |
| Due date | `formatDate()` | "Nov 19, 2025" |
| Log entry | `formatDateTime()` | "Nov 19, 2025 9:20 PM" |
| Recent activity | `formatRelativeTime()` | "3 minutes ago" |
| Schedule time | `formatTime()` | "9:20 PM" |
| Export/debug | `formatISO()` | "2025-11-19T21:20:00.000Z" |

### Custom Formats

Both utilities support custom format strings via date-fns:

```typescript
// Custom date format
formatDate(timestamp, 'yyyy-MM-dd');  // "2025-11-19"

// Custom datetime format
formatDateTime(timestamp, 'PPpp');    // "Nov 19, 2025, 9:20:00 PM"
```

See [date-fns format documentation](https://date-fns.org/docs/format) for all format options.

### Do NOT Use Native Methods Directly

Avoid using native JavaScript date formatting in components:

```typescript
// ❌ Avoid these
new Date(timestamp).toLocaleDateString();
new Date(timestamp).toLocaleString();
timestamp.toString();

// ✅ Use these instead
formatDate(timestamp);
formatDateTime(timestamp);
```

**Why?**
- Inconsistent formatting across browsers
- No fallback for invalid dates
- Harder to maintain
- Less predictable output

---

## Database Considerations

### Prisma/PostgreSQL

- Database `DateTime` fields store in UTC by default ✅
- Prisma returns JavaScript `Date` objects
- Always convert to ISO strings for API responses

```javascript
// From Prisma query
const user = await prisma.user.findUnique({ where: { id } });

// Convert to ISO for API response
const response = {
  ...user,
  createdAt: toISO(user.createdAt),
  updatedAt: toISO(user.updatedAt),
};
```

### Schema Design

- Use `DateTime` for all timestamp fields
- Set default values: `@default(now())`
- Use `@updatedAt` for automatic updates
- Always store in UTC (PostgreSQL default)

---

## Testing

### API Tests

Verify ISO 8601 format in responses:

```javascript
test('health endpoint returns ISO timestamp', async () => {
  const response = await fetch('/api/health');
  const data = await response.json();

  // Check format matches ISO 8601
  expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

  // Verify it's parseable
  expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
});
```

### UI Tests

Verify local time conversion:

```typescript
test('formats timestamp to user locale', () => {
  const utcTimestamp = '2025-11-19T21:20:00.000Z';
  const formatted = formatDateTime(utcTimestamp);

  // Will vary based on timezone, but should be parseable
  expect(formatted).not.toBe('—');  // Not fallback
  expect(formatted).toContain('2025');  // Contains year
});
```

---

## Migration Checklist

When standardizing an existing component/endpoint:

- [ ] Identify all date/time operations
- [ ] Replace `new Date().toISOString()` with `nowISO()`
- [ ] Replace `Date.now()` with `nowMs()` (only for performance metrics)
- [ ] Use `formatDateSlug()` for UTC-based file paths
- [ ] Update UI to use `formatDateTime()`, `formatDate()`, etc.
- [ ] Add tests verifying ISO format
- [ ] Update API documentation
- [ ] Verify backward compatibility

---

## Quick Reference

### admin-api
```javascript
const { nowISO, toISO, formatDateSlug } = require('../lib/datetime');

// API response
{ timestamp: nowISO() }

// File path
const path = `/uploads/${guildId}/${formatDateSlug()}`;
```

### web
```typescript
import { formatDateTime, formatDate, formatRelativeTime } from '@/lib/datetime';

// Display in UI
<p>Created: {formatDateTime(item.createdAt)}</p>
<p>Due: {formatDate(item.dueDate)}</p>
<p>Last active: {formatRelativeTime(item.lastActive)}</p>
```

---

## Examples

### Before/After: Health Endpoint

**Before:**
```javascript
// Inconsistent, non-standard
router.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),  // Manual
  });
});
```

**After:**
```javascript
const { nowISO } = require("../lib/datetime");

// Standardized, uses utility
router.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: nowISO(),  // Consistent
  });
});
```

**Response (unchanged format, but consistent approach):**
```json
{
  "ok": true,
  "timestamp": "2025-11-19T03:21:18.000Z"
}
```

### Before/After: Club Results Display

**Before:**
```tsx
// Browser-dependent formatting
<span>
  {new Date(analysis.createdAt).toLocaleString()}
</span>
```

**After:**
```tsx
import { formatDateTime } from '@/lib/datetime';

// Consistent, with fallback
<span>
  {formatDateTime(analysis.createdAt)}
</span>
```

**Display:**
- **Before**: "11/19/2025, 9:20:00 PM" (varies by browser/locale)
- **After**: "Nov 19, 2025 9:20 PM" (consistent, readable)

---

## Related Files

- **admin-api**: `/apps/admin-api/src/lib/datetime.js`
- **web**: `/apps/web/src/lib/datetime.ts`
- **Policy**: `/docs/datetime-policy.md` (this file)

---

## Support

For questions or issues with date/time handling:
1. Check this policy document first
2. Review utility library source code
3. Search for examples in the codebase
4. Open a discussion in team channels
