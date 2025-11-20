# Slimy.ai Monitoring & Metrics Architecture Plan

## Overview

This document defines the monitoring and metrics strategy for Slimy.ai infrastructure. The proposed architecture follows Prometheus/Grafana patterns with standardized metric naming, consistent labeling, and comprehensive coverage across all services.

## Metric Naming Convention

All metrics follow the pattern: `slimy_<service>_<subsystem>_<metric>_<unit>`

### Conventions:
- **Prefix**: Always `slimy_` to namespace our metrics
- **Service**: `web`, `admin_api`, `bot`, `minecraft`
- **Subsystem**: The component being measured (e.g., `http`, `db`, `cache`)
- **Metric**: Descriptive name of what's measured
- **Unit**: `total` (counter), `seconds` (histogram), `bytes`, `count` (gauge)

### Metric Types:
- **Counter**: Monotonically increasing values (requests, errors)
- **Gauge**: Point-in-time values (active connections, memory usage)
- **Histogram**: Distribution of values (request duration, response size)
- **Summary**: Similar to histogram with quantiles

---

## 1. Web Service Metrics (`apps/web`)

### HTTP Request Metrics

**`slimy_web_http_requests_total`** (Counter)
- Description: Total HTTP requests received
- Labels:
  - `method`: HTTP method (GET, POST, PUT, DELETE)
  - `route`: Normalized route pattern (e.g., `/api/guilds/:id`)
  - `status_code`: HTTP status code (200, 404, 500)
  - `host`: Optional hostname for multi-tenant scenarios

**`slimy_web_http_request_duration_seconds`** (Histogram)
- Description: HTTP request latency in seconds
- Labels:
  - `method`: HTTP method
  - `route`: Normalized route pattern
  - `status_code`: HTTP status code
- Buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

**`slimy_web_http_request_size_bytes`** (Histogram)
- Description: HTTP request size in bytes
- Labels:
  - `method`: HTTP method
  - `route`: Normalized route pattern
- Buckets: [100, 1000, 10000, 100000, 1000000]

**`slimy_web_http_response_size_bytes`** (Histogram)
- Description: HTTP response size in bytes
- Labels:
  - `method`: HTTP method
  - `route`: Normalized route pattern
  - `status_code`: HTTP status code
- Buckets: [100, 1000, 10000, 100000, 1000000, 10000000]

**`slimy_web_http_errors_total`** (Counter)
- Description: Total HTTP errors by type
- Labels:
  - `method`: HTTP method
  - `route`: Normalized route pattern
  - `error_type`: Error classification (validation, authorization, server_error, timeout)
  - `status_code`: HTTP status code

### Database Metrics

**`slimy_web_db_queries_total`** (Counter)
- Description: Total database queries executed
- Labels:
  - `operation`: Query type (select, insert, update, delete)
  - `table`: Table name
  - `status`: success, error

**`slimy_web_db_query_duration_seconds`** (Histogram)
- Description: Database query duration
- Labels:
  - `operation`: Query type
  - `table`: Table name
- Buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]

**`slimy_web_db_connections_active`** (Gauge)
- Description: Number of active database connections
- Labels:
  - `pool`: Connection pool identifier (primary, replica)

**`slimy_web_db_connection_errors_total`** (Counter)
- Description: Database connection errors
- Labels:
  - `error_type`: timeout, refused, auth_failed

### Cache Metrics (Redis)

**`slimy_web_cache_operations_total`** (Counter)
- Description: Cache operations
- Labels:
  - `operation`: get, set, delete, expire
  - `result`: hit, miss, error

**`slimy_web_cache_operation_duration_seconds`** (Histogram)
- Description: Cache operation duration
- Labels:
  - `operation`: get, set, delete
- Buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]

**`slimy_web_cache_keys_count`** (Gauge)
- Description: Number of keys in cache
- Labels:
  - `key_pattern`: Pattern prefix (session:, guild:, user:)

### Authentication & Session Metrics

**`slimy_web_auth_attempts_total`** (Counter)
- Description: Authentication attempts
- Labels:
  - `provider`: discord, email, api_key
  - `result`: success, failure
  - `failure_reason`: invalid_credentials, expired_token, rate_limited

**`slimy_web_sessions_active`** (Gauge)
- Description: Number of active user sessions
- Labels:
  - `type`: web, api

**`slimy_web_sessions_duration_seconds`** (Histogram)
- Description: Session duration before logout/expiry
- Labels:
  - `termination_reason`: logout, timeout, revoked

### API-Specific Metrics

**`slimy_web_api_rate_limit_hits_total`** (Counter)
- Description: API rate limit hits
- Labels:
  - `endpoint`: API endpoint
  - `user_id`: Optional user identifier
  - `limit_type`: per_minute, per_hour, per_day

---

## 2. Admin API Metrics (`apps/admin-api`)

### Authentication Metrics

**`slimy_admin_api_auth_attempts_total`** (Counter)
- Description: Admin authentication attempts
- Labels:
  - `method`: password, oauth, mfa
  - `result`: success, failure
  - `failure_reason`: invalid_password, mfa_required, account_locked

**`slimy_admin_api_auth_failures_consecutive`** (Gauge)
- Description: Consecutive auth failures per account
- Labels:
  - `account_id`: Admin account identifier

### Guild Sync Metrics

**`slimy_admin_api_guild_sync_total`** (Counter)
- Description: Guild synchronization operations
- Labels:
  - `guild_id`: Discord guild ID
  - `sync_type`: full, incremental, forced
  - `result`: success, failure, partial

**`slimy_admin_api_guild_sync_duration_seconds`** (Histogram)
- Description: Guild sync duration
- Labels:
  - `guild_id`: Discord guild ID
  - `sync_type`: full, incremental
- Buckets: [1, 5, 10, 30, 60, 120, 300, 600]

**`slimy_admin_api_guild_sync_items_processed`** (Counter)
- Description: Items processed during sync
- Labels:
  - `guild_id`: Discord guild ID
  - `item_type`: members, roles, channels, permissions
  - `operation`: created, updated, deleted

**`slimy_admin_api_guild_sync_errors_total`** (Counter)
- Description: Errors during guild sync
- Labels:
  - `guild_id`: Discord guild ID
  - `error_type`: discord_api_error, db_error, validation_error, timeout

### Admin Operations Metrics

**`slimy_admin_api_operations_total`** (Counter)
- Description: Admin operations performed
- Labels:
  - `operation`: user_ban, user_unban, guild_enable, guild_disable, config_update
  - `admin_id`: Admin performing operation
  - `result`: success, failure

**`slimy_admin_api_audit_events_total`** (Counter)
- Description: Audit events logged
- Labels:
  - `event_type`: config_change, permission_change, data_access
  - `admin_id`: Admin ID
  - `severity`: info, warning, critical

---

## 3. Discord Bot Metrics (`apps/bot`)

### Command Metrics

**`slimy_bot_commands_total`** (Counter)
- Description: Discord bot commands executed
- Labels:
  - `command`: Command name
  - `guild_id`: Discord guild ID
  - `result`: success, failure
  - `interaction_type`: slash_command, context_menu, button, select_menu

**`slimy_bot_commands_per_minute`** (Gauge)
- Description: Commands per minute (rolling window)
- Labels:
  - `command`: Command name
  - `guild_id`: Optional guild ID

**`slimy_bot_command_duration_seconds`** (Histogram)
- Description: Command execution duration
- Labels:
  - `command`: Command name
  - `guild_id`: Discord guild ID
- Buckets: [0.1, 0.5, 1, 2, 5, 10, 30]

**`slimy_bot_command_errors_total`** (Counter)
- Description: Command execution errors
- Labels:
  - `command`: Command name
  - `error_type`: permission_denied, timeout, invalid_input, internal_error
  - `guild_id`: Discord guild ID

### Discord API Metrics

**`slimy_bot_discord_api_requests_total`** (Counter)
- Description: Discord API requests made
- Labels:
  - `method`: GET, POST, PUT, DELETE, PATCH
  - `endpoint`: API endpoint pattern
  - `status_code`: HTTP status code

**`slimy_bot_discord_api_rate_limits_hit_total`** (Counter)
- Description: Discord API rate limit hits
- Labels:
  - `endpoint`: API endpoint
  - `limit_type`: global, per_route

**`slimy_bot_discord_api_latency_seconds`** (Histogram)
- Description: Discord API request latency
- Labels:
  - `endpoint`: API endpoint
- Buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]

### Event Processing Metrics

**`slimy_bot_events_received_total`** (Counter)
- Description: Discord gateway events received
- Labels:
  - `event_type`: MESSAGE_CREATE, GUILD_MEMBER_ADD, INTERACTION_CREATE, etc.
  - `guild_id`: Optional guild ID

**`slimy_bot_events_processed_total`** (Counter)
- Description: Events successfully processed
- Labels:
  - `event_type`: Event type
  - `result`: success, failure, ignored

**`slimy_bot_event_processing_duration_seconds`** (Histogram)
- Description: Event processing duration
- Labels:
  - `event_type`: Event type
- Buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]

### Connection & Websocket Metrics

**`slimy_bot_gateway_status`** (Gauge)
- Description: Gateway connection status (1=connected, 0=disconnected)
- Labels:
  - `shard_id`: Shard identifier

**`slimy_bot_gateway_reconnects_total`** (Counter)
- Description: Gateway reconnection attempts
- Labels:
  - `shard_id`: Shard identifier
  - `reason`: resume_failed, timeout, explicit_disconnect

**`slimy_bot_websocket_latency_seconds`** (Gauge)
- Description: WebSocket heartbeat latency
- Labels:
  - `shard_id`: Shard identifier

### Guild & Member Metrics

**`slimy_bot_guilds_active`** (Gauge)
- Description: Number of guilds bot is active in

**`slimy_bot_members_cached`** (Gauge)
- Description: Number of members in cache
- Labels:
  - `guild_id`: Optional guild ID

---

## 4. Minecraft Server Metrics (`slime.craft`)

### Player Metrics

**`slimy_minecraft_players_online`** (Gauge)
- Description: Current online players
- Labels:
  - `world`: Minecraft world name
  - `server_instance`: Server instance ID for multi-server setups

**`slimy_minecraft_players_max`** (Gauge)
- Description: Maximum player capacity

**`slimy_minecraft_player_joins_total`** (Counter)
- Description: Player join events
- Labels:
  - `player_uuid`: Player UUID (optional, for detailed tracking)

**`slimy_minecraft_player_quits_total`** (Counter)
- Description: Player quit events
- Labels:
  - `quit_reason`: disconnect, timeout, kick, ban

**`slimy_minecraft_player_session_duration_seconds`** (Histogram)
- Description: Player session duration
- Buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800]

### Server Performance Metrics

**`slimy_minecraft_tps`** (Gauge)
- Description: Server ticks per second (target: 20.0)
- Labels:
  - `world`: Minecraft world name

**`slimy_minecraft_tick_duration_milliseconds`** (Histogram)
- Description: Server tick duration
- Labels:
  - `world`: World name
- Buckets: [10, 25, 50, 75, 100, 150, 200, 300, 500]

**`slimy_minecraft_lag_spikes_total`** (Counter)
- Description: Number of lag spikes (tick time >100ms)
- Labels:
  - `severity`: minor (100-200ms), moderate (200-500ms), severe (>500ms)

### Resource Metrics

**`slimy_minecraft_memory_used_bytes`** (Gauge)
- Description: JVM memory usage

**`slimy_minecraft_memory_max_bytes`** (Gauge)
- Description: JVM maximum memory

**`slimy_minecraft_chunks_loaded`** (Gauge)
- Description: Number of loaded chunks
- Labels:
  - `world`: World name

**`slimy_minecraft_entities_count`** (Gauge)
- Description: Number of entities
- Labels:
  - `world`: World name
  - `entity_type`: living, item, projectile, other

### Server Lifecycle Metrics

**`slimy_minecraft_server_restarts_total`** (Counter)
- Description: Server restart events
- Labels:
  - `reason`: scheduled, crash, manual, update

**`slimy_minecraft_server_uptime_seconds`** (Gauge)
- Description: Server uptime in seconds

**`slimy_minecraft_server_crashes_total`** (Counter)
- Description: Server crash events
- Labels:
  - `crash_type`: out_of_memory, plugin_error, world_corruption, unknown

**`slimy_minecraft_server_startup_duration_seconds`** (Histogram)
- Description: Server startup duration
- Buckets: [5, 10, 20, 30, 60, 120, 300]

### Plugin & Mod Metrics

**`slimy_minecraft_plugin_events_total`** (Counter)
- Description: Plugin event executions
- Labels:
  - `plugin`: Plugin name
  - `event_type`: Event type
  - `result`: success, failure

**`slimy_minecraft_plugin_errors_total`** (Counter)
- Description: Plugin errors
- Labels:
  - `plugin`: Plugin name
  - `error_type`: Error classification

### World & Storage Metrics

**`slimy_minecraft_world_size_bytes`** (Gauge)
- Description: World save size on disk
- Labels:
  - `world`: World name

**`slimy_minecraft_save_duration_seconds`** (Histogram)
- Description: World save duration
- Labels:
  - `world`: World name
  - `save_type`: auto, manual
- Buckets: [0.5, 1, 2, 5, 10, 30, 60]

---

## Cross-Service Metrics

### System Metrics (All Services)

**`slimy_<service>_process_cpu_usage_percent`** (Gauge)
- Description: CPU usage percentage

**`slimy_<service>_process_memory_bytes`** (Gauge)
- Description: Process memory usage
- Labels:
  - `type`: heap, rss, external

**`slimy_<service>_process_open_file_descriptors`** (Gauge)
- Description: Number of open file descriptors

**`slimy_<service>_process_uptime_seconds`** (Gauge)
- Description: Process uptime

**`slimy_<service>_nodejs_event_loop_lag_seconds`** (Gauge)
- Description: Event loop lag (Node.js services only)

### Health Check Metrics

**`slimy_<service>_health_check_status`** (Gauge)
- Description: Health check status (1=healthy, 0=unhealthy)
- Labels:
  - `check_name`: database, cache, external_api

**`slimy_<service>_health_check_duration_seconds`** (Histogram)
- Description: Health check duration
- Labels:
  - `check_name`: Check identifier

---

## Label Usage Guidelines

### Common Labels Across All Services:
- **environment**: `production`, `staging`, `development`
- **version**: Application version (from git tag or package.json)
- **instance**: Instance identifier (hostname, container ID, or pod name)
- **region**: Geographic region (if multi-region deployment)

### Service-Specific Labels:
- **guild_id**: Discord guild identifier (bot, admin-api, web when guild-scoped)
- **user_id**: User identifier (when tracking per-user metrics)
- **route/endpoint**: API route or endpoint pattern
- **command**: Discord bot command name
- **world**: Minecraft world name

### Best Practices:
1. **Cardinality**: Limit high-cardinality labels (don't use unique IDs unless necessary)
2. **Normalization**: Use normalized route patterns (`/api/guilds/:id` not `/api/guilds/123456`)
3. **Consistency**: Use snake_case for label names
4. **Opt-in for PII**: User IDs and guild IDs should be opt-in and anonymizable

---

## Metric Collection & Export

### Instrumentation Libraries:
- **Node.js**: `prom-client` for Prometheus metrics
- **Minecraft**: `prometheus-exporter` plugin or custom exporter

### Exposure Endpoints:
- Web: `GET /metrics` (protected, internal network only)
- Admin API: `GET /metrics`
- Bot: `GET /metrics` on separate management port
- Minecraft: Separate exporter service on `localhost:9225/metrics`

### Scrape Configuration:
- **Interval**: 15 seconds (standard)
- **Timeout**: 10 seconds
- **Retention**: 15 days (configurable based on storage)

---

## Alerting Considerations

### Critical Alerts:
- High error rates (>5% of requests)
- Service down (health check failures)
- Database connection failures
- Discord gateway disconnections
- Minecraft server crashes
- TPS drops below 15

### Warning Alerts:
- Elevated latency (p95 > SLA threshold)
- High memory usage (>80%)
- API rate limit approaching
- Slow database queries (>1s)
- Low TPS (15-18)

### Informational:
- Deployment events
- Scheduled restarts
- Configuration changes

---

## Future Enhancements

1. **Distributed Tracing**: OpenTelemetry integration for request tracing
2. **Log Aggregation**: Correlation between metrics and logs
3. **Custom Business Metrics**: Guild engagement scores, revenue metrics
4. **Anomaly Detection**: ML-based alerting for unusual patterns
5. **SLO/SLI Tracking**: Formal service level tracking
