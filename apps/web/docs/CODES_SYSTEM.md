# Codes System Architecture

## Overview

The Codes System is a comprehensive solution for aggregating, caching, and serving Super Snail game codes from multiple sources. It provides robust error handling, deduplication, fallback mechanisms, and automatic refresh capabilities.

## Architecture

### Core Components

#### 1. Source Adapters (`lib/codes/sources/`)
Individual adapters for each code source that implement a unified interface:

- **SnelpSource**: Official Super Snail codes API
- **RedditSource**: Community codes from r/SuperSnailGame
- **Interface**: `CodeSource` with standardized fetch/health check methods

#### 2. Caching Layer (`lib/codes/cache.ts`)
Redis-based caching with:
- TTL-based expiration
- Retry logic with exponential backoff
- Graceful degradation when Redis unavailable
- Cache key management

#### 3. Deduplication Engine (`lib/codes/deduplication.ts`)
Advanced deduplication with multiple strategies:
- **Newest/Oldest**: Timestamp-based selection
- **Priority-based**: Source hierarchy selection
- **Merge**: Combine attributes from duplicates
- Metadata preservation and conflict resolution

#### 4. Fallback Mechanisms (`lib/codes/fallbacks.ts`)
Circuit breaker pattern with:
- Automatic failure detection
- Stale data serving during outages
- Recovery timeout management
- Emergency fallback codes

#### 5. Refresh Manager (`lib/codes/refresh.ts`)
Stale-while-revalidate pattern:
- Background refresh during cache misses
- Configurable refresh intervals
- Auto-refresh with health monitoring

#### 6. Main Aggregator (`lib/codes-aggregator.ts`)
Orchestrates all components:
- Concurrent source fetching
- Health monitoring and reporting
- Configuration management
- Singleton pattern for resource efficiency

### Data Flow

```
API Request → Refresh Manager → Cache Check → Aggregator
    ↓              ↓              ↓            ↓
Response ← Stale Data ← Cache Hit ← Source Fetch ← Fallback
    ↑              ↑              ↑            ↑
Client ← Background ← Auto-refresh ← Circuit Breaker
```

## Configuration

### Environment Variables

```bash
# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Source URLs
NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes
```

### Code Configuration

```typescript
const config: AggregatorConfig = {
  sources: {
    snelp: {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      cacheTtl: 300,
      enabled: true,
    },
    reddit: {
      timeout: 15000,
      retries: 2,
      retryDelay: 2000,
      cacheTtl: 600,
      enabled: true,
    },
  },
  cache: {
    enabled: true,
    ttl: 300,
    staleWhileRevalidate: true,
    staleTtl: 600,
  },
  deduplication: {
    enabled: true,
    strategy: "newest",
    priorityOrder: ["snelp", "reddit"],
    mergeTags: true,
  },
  refresh: {
    enabled: true,
    interval: 300000, // 5 minutes
    onDemand: true,
  },
};
```

## API Endpoints

### GET `/api/codes`

Aggregate codes from all sources with filtering and search.

#### Query Parameters

- `scope`: Filter scope (`active`, `past7`, `all`) - default: `active`
- `q`: Search query string
- `metadata`: Include metadata in response (`true`/`false`) - default: `false`
- `health`: Health check mode (`true`/`false`) - default: `false`

#### Response Format

```json
{
  "codes": [
    {
      "code": "EXAMPLE123",
      "source": "snelp",
      "ts": "2024-01-01T00:00:00.000Z",
      "tags": ["active"],
      "expires": null,
      "region": "global",
      "description": "Example code"
    }
  ],
  "sources": {
    "snelp": {
      "count": 10,
      "lastFetch": "2024-01-01T00:00:00.000Z",
      "status": "success"
    },
    "reddit": {
      "count": 5,
      "lastFetch": "2024-01-01T00:00:00.000Z",
      "status": "success"
    }
  },
  "scope": "active",
  "query": null,
  "count": 15,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "totalSources": 2,
    "successfulSources": 2,
    "failedSources": 0,
    "deduplicationStats": {
      "total": 20,
      "unique": 15,
      "duplicates": 5,
      "merged": 0
    },
    "cache": {
      "hit": true,
      "stale": false,
      "age": 0
    }
  }
}
```

#### Response Headers

- `X-Processing-Time`: Request processing time in milliseconds
- `X-Data-Freshness`: `fresh` or `stale`
- `X-Cache-Status`: `fresh`, `stale`, or `miss`
- `X-Sources-Total`: Total number of sources
- `X-Sources-Successful`: Number of successful sources
- `X-Sources-Failed`: Number of failed sources

### Health Check

GET `/api/codes?health=true`

Returns system health status:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sources": {
    "snelp": { "healthy": true },
    "reddit": { "healthy": true }
  },
  "cache": {
    "available": true,
    "connected": true
  },
  "refresh": {
    "active": true,
    "stats": {}
  }
}
```

## Error Handling

### Circuit Breaker Pattern

The system implements circuit breakers for each source:

- **Closed**: Normal operation
- **Open**: Source failures exceed threshold, requests blocked
- **Half-Open**: Testing recovery after timeout

### Fallback Strategies

1. **Cache Fallback**: Serve stale cached data during outages
2. **Partial Response**: Continue with available sources when some fail
3. **Emergency Codes**: Serve hardcoded emergency codes as last resort

### Error Response Format

```json
{
  "ok": false,
  "code": "AGGREGATION_ERROR",
  "message": "Failed to aggregate codes",
  "details": "Specific error details",
  "codes": [],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "_processingTime": 150
}
```

## Caching Strategy

### Cache Keys

- `codes:aggregated_codes`: Main aggregated response
- `codes:source_{sourceName}`: Individual source results
- `codes:health_{sourceName}`: Source health status

### TTL Configuration

- **Fresh Data**: 5 minutes (300s)
- **Stale Data**: 10 minutes (600s)
- **Emergency**: 24 hours for fallback data

### Stale-While-Revalidate

- Serve stale data immediately while fetching fresh data
- Reduces perceived latency during cache misses
- Ensures data availability during source outages

## Deduplication

### Strategies

1. **Newest**: Select most recently fetched code
2. **Oldest**: Select earliest fetched code
3. **Priority**: Use source priority order
4. **Merge**: Combine attributes from all duplicates

### Normalization

- Case-insensitive comparison
- Remove spaces and special characters
- Unicode normalization

### Conflict Resolution

- **Tags**: Merge unique tags or select by priority
- **Descriptions**: Select longest or most recent
- **Expiration**: Use earliest expiration date

## Monitoring & Observability

### Health Checks

- Source availability monitoring
- Cache connectivity checks
- Refresh mechanism status
- Circuit breaker state

### Metrics

- Fetch success/failure rates
- Cache hit/miss ratios
- Processing times
- Deduplication statistics

### Logging

- Structured error logging
- Performance monitoring
- Source health events
- Cache operations

## Testing

### Unit Tests

```bash
npm run test:unit codes-aggregator.test.ts
npm run test:unit codes-cache.test.ts
npm run test:unit codes-deduplication.test.ts
```

### Integration Tests

- API endpoint testing
- Source adapter validation
- Cache integration testing
- Fallback mechanism verification

### Test Coverage

- Source adapters and error handling
- Cache operations and failure modes
- Deduplication strategies
- Refresh mechanisms
- API responses and headers

## Deployment Considerations

### Environment Setup

1. Configure Redis (optional but recommended)
2. Set source API URLs
3. Configure timeouts and retry policies
4. Set up monitoring and alerting

### Scaling

- **Horizontal**: Multiple instances with shared Redis
- **Cache**: Redis cluster for high availability
- **Sources**: Rate limiting and circuit breakers prevent overload

### Monitoring

- Response times and error rates
- Cache performance metrics
- Source health dashboards
- Alert on circuit breaker trips

## Future Enhancements

### Planned Features

- Additional source adapters (Discord, Twitter, etc.)
- Machine learning-based code validation
- User-submitted code verification
- Geographic routing for regional codes
- Real-time code expiration notifications

### Performance Optimizations

- Response compression
- Edge caching with CDN
- Database persistence for code history
- Async processing for heavy operations

## Troubleshooting

### Common Issues

1. **All sources failing**: Check network connectivity and API endpoints
2. **Cache not working**: Verify Redis connection and configuration
3. **High latency**: Check source timeouts and circuit breaker status
4. **Duplicate codes**: Review deduplication configuration

### Debug Mode

Enable detailed logging:

```typescript
const aggregator = getAggregator({
  // Enable debug logging
  debug: true,
});
```

### Health Check Commands

```bash
# Check overall health
curl "http://localhost:3000/api/codes?health=true"

# Check with metadata
curl "http://localhost:3000/api/codes?metadata=true"

# Force refresh
curl -X GET "http://localhost:3000/api/codes" -H "Cache-Control: no-cache"
```

## Contributing

### Adding New Sources

1. Implement `CodeSource` interface
2. Add to aggregator configuration
3. Update tests and documentation
4. Configure health checks

### Code Quality

- TypeScript strict mode
- Comprehensive test coverage
- Error handling best practices
- Performance monitoring

---

## Success Criteria Verification

✅ **Handles API failures gracefully**: Circuit breakers and fallback mechanisms
✅ **Caches results effectively**: Redis with TTL and stale-while-revalidate
✅ **Falls back when sources down**: Stale data and emergency codes
✅ **No duplicate codes shown**: Advanced deduplication engine
✅ **Sources properly attributed**: Source metadata in responses
✅ **Auto-refresh working**: Background refresh with configurable intervals
