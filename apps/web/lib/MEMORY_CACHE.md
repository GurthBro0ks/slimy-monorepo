# Memory Cache - In-Memory Data Caching with TTL

This module provides memory-friendly caching for expensive derived data computations with automatic expiration (TTL) and LRU eviction.

## Features

- ✅ **In-memory** - No external cache service required
- ✅ **TTL Support** - Automatic expiration after configured time
- ✅ **LRU Eviction** - Least Recently Used eviction when size limit reached
- ✅ **Statistics** - Track hits, misses, evictions
- ✅ **Dev Bypass** - Easy cache bypassing for development/testing
- ✅ **TypeScript** - Full type safety

## Use Cases

Perfect for caching:
- Aggregated analytics/statistics
- Transformed large datasets
- Expensive computations that are called frequently
- Derived data that doesn't change often

**Do NOT cache:**
- Secrets or sensitive data
- User-specific authentication data
- Data that changes immediately

## Quick Start

### Using Global Cache Instances

```typescript
import { caches, shouldBypassCache } from '@/lib/memory-cache';

async function getExpensiveData(id: string) {
  const cacheKey = `data:${id}`;

  // Check bypass flag (respects BYPASS_MEMORY_CACHE env var)
  if (!shouldBypassCache()) {
    const cached = caches.mediumLived.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Compute expensive result
  const result = await computeExpensiveAggregation(id);

  // Cache for 2 minutes (mediumLived default TTL)
  if (!shouldBypassCache()) {
    caches.mediumLived.set(cacheKey, result);
  }

  return result;
}
```

### Global Cache Instances

Three pre-configured instances:

| Instance | TTL | Max Size | Use For |
|----------|-----|----------|---------|
| `caches.shortLived` | 30s | 50 | Frequently changing data |
| `caches.mediumLived` | 2min | 100 | Expensive computations |
| `caches.longLived` | 5min | 200 | Rarely changing derived data |

### Using Custom Cache Instance

```typescript
import { MemoryCache } from '@/lib/memory-cache';

const myCache = new MemoryCache({
  ttl: 60000,        // 60 seconds
  maxSize: 100,      // Max 100 entries
  debug: true        // Enable logging
});

// Basic operations
myCache.set('key', 'value');
const value = myCache.get('key');
myCache.delete('key');
myCache.clear();

// Get or compute
const data = await myCache.getOrCompute(
  'expensive:key',
  async () => {
    return await fetchExpensiveData();
  }
);

// Custom TTL per entry
myCache.set('key', 'value', 10000); // 10 second TTL

// Cleanup when done
myCache.destroy();
```

## Examples

### Example 1: Club Export Data Transformation

```typescript
// apps/web/app/api/club/export/route.ts
import { caches, shouldBypassCache } from '@/lib/memory-cache';

const cacheKey = `clubExport:${guildId}:${dateRange || 'all'}`;
const bypassCache = shouldBypassCache();

let analysisData;
if (!bypassCache) {
  analysisData = caches.mediumLived.get(cacheKey);
}

if (!analysisData) {
  // Expensive: fetch 100 analyses and transform metrics
  const analyses = await clubDatabase.getAnalysesByGuild(guildId, 100, 0);

  analysisData = analyses.map(analysis => ({
    ...analysis,
    metrics: analysis.metrics.reduce((acc, metric) => {
      acc[metric.name] = metric.value;
      return acc;
    }, {})
  }));

  // Cache for 2 minutes
  if (!bypassCache) {
    caches.mediumLived.set(cacheKey, analysisData);
  }
}
```

### Example 2: Analytics Aggregation

```typescript
async function getGuildStats(guildId: string, week: string) {
  const cacheKey = `clubStats:${guildId}:${week}`;

  return await caches.mediumLived.getOrCompute(
    cacheKey,
    async () => {
      // Expensive database aggregation
      const stats = await db.query(`
        SELECT
          COUNT(*) as total,
          AVG(score) as avg_score,
          SUM(points) as total_points
        FROM events
        WHERE guild_id = ? AND week = ?
        GROUP BY guild_id
      `, [guildId, week]);

      return stats;
    }
  );
}
```

### Example 3: Large List Transformation

```typescript
async function getTransformedMembers(clubId: string) {
  const cacheKey = `members:transformed:${clubId}`;

  return await caches.shortLived.getOrCompute(
    cacheKey,
    async () => {
      const members = await fetchAllMembers(clubId); // 1000+ members

      // Expensive transformation
      return members.map(member => ({
        ...member,
        displayName: formatDisplayName(member),
        stats: calculateMemberStats(member),
        rank: determineRank(member)
      }));
    },
    30000 // 30 second TTL
  );
}
```

## Development & Testing

### Bypass Cache in Development

Set environment variable to disable caching:

```bash
# .env.local
BYPASS_MEMORY_CACHE=true
```

Or programmatically:

```typescript
import { shouldBypassCache } from '@/lib/memory-cache';

if (shouldBypassCache()) {
  // Cache is bypassed - always compute fresh
}
```

The cache is **automatically bypassed** when:
- `NODE_ENV=test` (during testing)
- `BYPASS_MEMORY_CACHE=true` is set

### Cache Statistics

```typescript
const stats = cache.getStats();
console.log(stats);
// {
//   hits: 150,
//   misses: 25,
//   size: 45,
//   evictions: 5
// }
```

### Debug Logging

Enable debug logging to see cache operations:

```typescript
const cache = new MemoryCache({
  ttl: 60000,
  debug: true  // Enable logging
});

// Will log:
// [MemoryCache] SET key1 (TTL: 60000ms) - Stats: {...}
// [MemoryCache] HIT key1 - Stats: {...}
// [MemoryCache] MISS key2 - Stats: {...}
```

## Cache Key Design

Use descriptive, hierarchical keys:

```typescript
// ✅ Good keys
`clubExport:${guildId}:${dateRange}`
`clubStats:${guildId}:${week}`
`analytics:${userId}:${period}`
`transform:members:${clubId}`

// ❌ Bad keys
`data`
`cache1`
`temp`
```

## TTL Recommendations

| Data Type | Recommended TTL | Cache Instance |
|-----------|----------------|----------------|
| Real-time dashboards | 30-60s | `shortLived` |
| Analytics aggregations | 2-5min | `mediumLived` |
| Export transformations | 2-5min | `mediumLived` |
| Static reference data | 5-10min | `longLived` |
| Search results | 30-60s | `shortLived` |

## Best Practices

1. **Always use cache keys with identifiers** - Include relevant IDs, dates, filters
2. **Respect bypass flags** - Always check `shouldBypassCache()` in dev
3. **Don't cache secrets** - Only cache derived, non-sensitive aggregates
4. **Use appropriate TTL** - Match TTL to data freshness requirements
5. **Monitor statistics** - Check hit/miss ratios to tune cache settings
6. **Clean up custom caches** - Call `destroy()` when done with custom instances

## Implementation

**Location:** `apps/web/lib/memory-cache.ts`
**Applied to:** `apps/web/app/api/club/export/route.ts` (club analysis export)
**TTL:** 120 seconds (2 minutes)
**Cache key pattern:** `clubExport:${guildId}:${dateRange}`

## Performance Impact

For the club export endpoint:
- **Before:** Fetches and transforms 100 analyses on every request
- **After:** Returns cached result for 2 minutes, reducing:
  - Database queries
  - Array transformations (100 × metrics.reduce())
  - CPU usage
  - Response time

Expected improvement: 80-95% reduction in processing time for cached requests.
