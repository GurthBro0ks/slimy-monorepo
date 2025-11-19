# Slimy.ai Dashboard Ideas

This document outlines proposed Grafana dashboards for monitoring the Slimy.ai infrastructure. Each dashboard is designed for specific operational concerns and audiences.

---

## Dashboard 1: Ops Overview

**Purpose**: High-level operational health across all Slimy.ai services
**Audience**: DevOps, SRE, On-call engineers
**Refresh Rate**: 30 seconds
**Time Range**: Last 1 hour (default)

### Panels:

#### Row 1: Service Status
**Panel 1.1: Service Health Matrix**
- Type: Status panel / Stat grid
- Metrics:
  - `slimy_web_health_check_status`
  - `slimy_admin_api_health_check_status`
  - `slimy_bot_gateway_status`
  - `slimy_minecraft_server_uptime_seconds`
- Visualization: Color-coded status indicators (green=healthy, red=down)
- Shows: Current status of all services at a glance

**Panel 1.2: Uptime Percentage (Last 24h)**
- Type: Stat panel
- Metrics: Calculated uptime % for each service over 24h
- Formula: `(time_healthy / total_time) * 100`
- Shows: Web, Admin API, Bot, Minecraft uptime percentages

#### Row 2: Traffic Overview
**Panel 2.1: Total Request Rate**
- Type: Time series graph
- Metrics:
  - `rate(slimy_web_http_requests_total[5m])`
  - `rate(slimy_admin_api_operations_total[5m])`
  - `rate(slimy_bot_commands_total[5m])`
- Shows: Requests per second for each service (stacked area chart)
- Y-axis: Requests/sec
- Legend: By service

**Panel 2.2: Error Rate Percentage**
- Type: Time series graph
- Metrics:
  - Web: `rate(slimy_web_http_errors_total[5m]) / rate(slimy_web_http_requests_total[5m]) * 100`
  - Bot: `rate(slimy_bot_command_errors_total[5m]) / rate(slimy_bot_commands_total[5m]) * 100`
- Shows: Error rate % over time
- Threshold: Warning at 1%, Critical at 5%
- Y-axis: Percentage (0-10%)

#### Row 3: Performance Metrics
**Panel 3.1: Request Latency (P95)**
- Type: Time series graph
- Metrics:
  - `histogram_quantile(0.95, slimy_web_http_request_duration_seconds)`
  - `histogram_quantile(0.95, slimy_bot_command_duration_seconds)`
- Shows: 95th percentile latency for web and bot
- Y-axis: Seconds
- Threshold lines: SLA targets

**Panel 3.2: Database Query Performance**
- Type: Time series graph
- Metrics:
  - `histogram_quantile(0.95, slimy_web_db_query_duration_seconds)`
  - `rate(slimy_web_db_queries_total[5m])`
- Shows: P95 query duration and query rate
- Dual Y-axis: Duration (left), Rate (right)

#### Row 4: Resource Utilization
**Panel 4.1: CPU Usage by Service**
- Type: Time series graph (stacked)
- Metrics:
  - `slimy_web_process_cpu_usage_percent`
  - `slimy_admin_api_process_cpu_usage_percent`
  - `slimy_bot_process_cpu_usage_percent`
- Shows: CPU % for each service
- Y-axis: 0-100%
- Threshold: Warning at 80%

**Panel 4.2: Memory Usage by Service**
- Type: Time series graph (stacked)
- Metrics:
  - `slimy_web_process_memory_bytes`
  - `slimy_admin_api_process_memory_bytes`
  - `slimy_bot_process_memory_bytes`
- Shows: Memory usage in GB
- Y-axis: GB
- Unit conversion: bytes to GB

**Panel 4.3: Database Connections**
- Type: Time series graph
- Metrics:
  - `slimy_web_db_connections_active{pool="primary"}`
  - `slimy_web_db_connections_active{pool="replica"}`
- Shows: Active DB connections over time
- Threshold: Maximum connection pool size

#### Row 5: Key Indicators
**Panel 5.1: Active Users**
- Type: Stat panel
- Metrics:
  - `slimy_web_sessions_active`
  - `slimy_minecraft_players_online`
- Shows: Current active web sessions and Minecraft players

**Panel 5.2: Discord Bot Activity**
- Type: Stat panel
- Metrics:
  - `slimy_bot_guilds_active` (current guilds)
  - `rate(slimy_bot_commands_total[5m])` (commands/sec)
- Shows: Guild count and command rate

**Panel 5.3: Recent Incidents**
- Type: Alert list / Table
- Shows: Recent alerts and their status
- Filters: Last 6 hours, all severities

---

## Dashboard 2: Discord Bot Health

**Purpose**: Detailed monitoring of Discord bot performance and Discord API interactions
**Audience**: Bot developers, Discord operations team
**Refresh Rate**: 15 seconds
**Time Range**: Last 30 minutes (default)

### Panels:

#### Row 1: Bot Status
**Panel 1.1: Gateway Connection Status**
- Type: Stat panel with sparkline
- Metrics:
  - `slimy_bot_gateway_status{shard_id}` (per shard)
- Shows: Connection status for each shard
- Color: Green (1), Red (0)

**Panel 1.2: WebSocket Latency**
- Type: Time series graph
- Metrics:
  - `slimy_bot_websocket_latency_seconds` by shard
- Shows: Heartbeat latency per shard
- Y-axis: Milliseconds
- Threshold: Warning at 500ms

**Panel 1.3: Gateway Reconnections**
- Type: Stat panel (counter)
- Metrics:
  - `increase(slimy_bot_gateway_reconnects_total[1h])`
- Shows: Reconnection count in last hour by reason
- Breakdown by: `reason` label

#### Row 2: Command Analytics
**Panel 2.1: Commands Per Minute**
- Type: Time series graph
- Metrics:
  - `rate(slimy_bot_commands_total[1m]) * 60` by command
- Shows: Top 10 commands by usage
- Legend: Command names
- Y-axis: Commands per minute

**Panel 2.2: Command Success vs Failure**
- Type: Stacked bar chart
- Metrics:
  - `rate(slimy_bot_commands_total{result="success"}[5m])`
  - `rate(slimy_bot_commands_total{result="failure"}[5m])`
- Shows: Success/failure ratio over time
- Colors: Green (success), Red (failure)

**Panel 2.3: Command Duration Distribution**
- Type: Heatmap
- Metrics:
  - `slimy_bot_command_duration_seconds` histogram buckets
- Shows: Distribution of command execution times
- X-axis: Time
- Y-axis: Duration buckets
- Color: Density of requests

**Panel 2.4: Top Failing Commands**
- Type: Table
- Metrics:
  - `rate(slimy_bot_command_errors_total[15m])`
- Shows: Commands with highest error rates
- Columns: Command, Error Count, Error Rate, Top Error Type
- Sort: By error rate descending

#### Row 3: Error Analysis
**Panel 3.1: Error Rate by Type**
- Type: Time series graph (stacked area)
- Metrics:
  - `rate(slimy_bot_command_errors_total[5m])` by `error_type`
- Shows: Error types over time
- Legend: permission_denied, timeout, invalid_input, internal_error
- Y-axis: Errors per second

**Panel 3.2: Errors by Guild**
- Type: Pie chart / Bar gauge
- Metrics:
  - `increase(slimy_bot_command_errors_total[1h])` by `guild_id`
- Shows: Top 10 guilds with most errors
- Useful for: Identifying problematic guilds

#### Row 4: Discord API Interaction
**Panel 4.1: Discord API Request Rate**
- Type: Time series graph
- Metrics:
  - `rate(slimy_bot_discord_api_requests_total[5m])` by endpoint
- Shows: Requests/sec to Discord API
- Legend: Top endpoints
- Y-axis: Requests/sec

**Panel 4.2: Discord API Latency**
- Type: Time series graph
- Metrics:
  - `histogram_quantile(0.50, slimy_bot_discord_api_latency_seconds)` (P50)
  - `histogram_quantile(0.95, slimy_bot_discord_api_latency_seconds)` (P95)
  - `histogram_quantile(0.99, slimy_bot_discord_api_latency_seconds)` (P99)
- Shows: Discord API response times
- Y-axis: Milliseconds
- Legend: P50, P95, P99

**Panel 4.3: Rate Limit Hits**
- Type: Time series graph (bar)
- Metrics:
  - `increase(slimy_bot_discord_api_rate_limits_hit_total[1m])` by `limit_type`
- Shows: Rate limit hits per minute
- Breakdown: Global vs per-route limits
- Alert: Any non-zero value

**Panel 4.4: Discord API Error Responses**
- Type: Time series graph
- Metrics:
  - `rate(slimy_bot_discord_api_requests_total{status_code=~"4..|5.."}[5m])`
- Shows: 4xx and 5xx responses from Discord API
- Group by: status_code
- Y-axis: Errors per second

#### Row 5: Event Processing
**Panel 5.1: Events Received Rate**
- Type: Time series graph (stacked)
- Metrics:
  - `rate(slimy_bot_events_received_total[1m])` by `event_type`
- Shows: Top event types received
- Legend: MESSAGE_CREATE, INTERACTION_CREATE, GUILD_MEMBER_ADD, etc.
- Y-axis: Events per second

**Panel 5.2: Event Processing Duration**
- Type: Time series graph
- Metrics:
  - `histogram_quantile(0.95, slimy_bot_event_processing_duration_seconds)` by `event_type`
- Shows: P95 processing time by event type
- Y-axis: Milliseconds

**Panel 5.3: Event Processing Backlog**
- Type: Stat panel
- Metrics:
  - `slimy_bot_events_received_total - slimy_bot_events_processed_total`
- Shows: Unprocessed events (if queue metrics available)
- Alert: Growing backlog

#### Row 6: Guild & Member Stats
**Panel 6.1: Active Guilds**
- Type: Stat panel with graph
- Metrics:
  - `slimy_bot_guilds_active`
- Shows: Total guild count over time
- Sparkline: Last 24 hours

**Panel 6.2: Cached Members**
- Type: Stat panel
- Metrics:
  - `slimy_bot_members_cached`
- Shows: Total members in cache
- Useful for: Memory usage estimation

**Panel 6.3: Guild Activity Heatmap**
- Type: Bar gauge
- Metrics:
  - `rate(slimy_bot_commands_total[1h])` by `guild_id`
- Shows: Top 20 most active guilds
- Sort: By command rate

---

## Dashboard 3: Minecraft / slime.craft

**Purpose**: Monitor Minecraft server performance, player activity, and server health
**Audience**: Minecraft admins, community managers
**Refresh Rate**: 10 seconds
**Time Range**: Last 1 hour (default)

### Panels:

#### Row 1: Server Status
**Panel 1.1: Server Status Indicator**
- Type: Stat panel
- Metrics:
  - `slimy_minecraft_server_uptime_seconds > 0` (1=up, 0=down)
- Shows: Current server status
- Color: Green (up), Red (down)
- Sparkline: Uptime over last 24h

**Panel 1.2: Server Uptime**
- Type: Stat panel
- Metrics:
  - `slimy_minecraft_server_uptime_seconds`
- Shows: Current uptime
- Format: Human-readable duration (e.g., "3d 12h 45m")

**Panel 1.3: TPS (Ticks Per Second)**
- Type: Gauge
- Metrics:
  - `slimy_minecraft_tps`
- Shows: Current TPS
- Range: 0-20
- Thresholds:
  - 18-20: Green (healthy)
  - 15-18: Yellow (degraded)
  - <15: Red (critical)

**Panel 1.4: Restarts & Crashes**
- Type: Stat panel (counter)
- Metrics:
  - `increase(slimy_minecraft_server_restarts_total[24h])`
  - `increase(slimy_minecraft_server_crashes_total[24h])`
- Shows: Count in last 24 hours
- Breakdown by: reason

#### Row 2: Player Activity
**Panel 2.1: Online Players**
- Type: Time series graph
- Metrics:
  - `slimy_minecraft_players_online`
- Shows: Player count over time
- Y-axis: Player count
- Max line: `slimy_minecraft_players_max`
- Fill: Area under curve

**Panel 2.2: Player Joins & Quits**
- Type: Time series graph (dual axis)
- Metrics:
  - `rate(slimy_minecraft_player_joins_total[5m]) * 60` (joins/min)
  - `rate(slimy_minecraft_player_quits_total[5m]) * 60` (quits/min)
- Shows: Join/quit rate
- Y-axis: Players per minute
- Legend: Joins (green), Quits (red)

**Panel 2.3: Player Session Duration**
- Type: Histogram / Heatmap
- Metrics:
  - `slimy_minecraft_player_session_duration_seconds` buckets
- Shows: Distribution of session lengths
- X-axis: Time of day
- Y-axis: Duration buckets
- Useful for: Understanding player engagement

**Panel 2.4: Peak Players Today**
- Type: Stat panel
- Metrics:
  - `max_over_time(slimy_minecraft_players_online[24h])`
- Shows: Peak concurrent players in last 24h
- Comparison: vs previous day

#### Row 3: Performance Metrics
**Panel 3.1: TPS Over Time**
- Type: Time series graph
- Metrics:
  - `slimy_minecraft_tps` by world
- Shows: TPS trend
- Y-axis: 0-20
- Target line: 20 TPS
- Threshold: Red zone at <15

**Panel 3.2: Tick Duration**
- Type: Time series graph
- Metrics:
  - `histogram_quantile(0.95, slimy_minecraft_tick_duration_milliseconds)` (P95)
  - `histogram_quantile(0.99, slimy_minecraft_tick_duration_milliseconds)` (P99)
- Shows: Tick processing time
- Y-axis: Milliseconds
- Target line: 50ms (for 20 TPS)

**Panel 3.3: Lag Spikes**
- Type: Time series graph (bar)
- Metrics:
  - `increase(slimy_minecraft_lag_spikes_total[1m])` by severity
- Shows: Lag spike frequency
- Colors: Yellow (minor), Orange (moderate), Red (severe)
- Y-axis: Spikes per minute

#### Row 4: Resource Usage
**Panel 4.1: Memory Usage**
- Type: Time series graph
- Metrics:
  - `slimy_minecraft_memory_used_bytes`
  - `slimy_minecraft_memory_max_bytes`
- Shows: JVM heap usage
- Y-axis: GB
- Fill: Area to max line
- Threshold: Warning at 80%

**Panel 4.2: Loaded Chunks**
- Type: Time series graph
- Metrics:
  - `slimy_minecraft_chunks_loaded` by world
- Shows: Chunk count over time
- Y-axis: Chunk count
- Legend: By world
- Correlates with: Player count

**Panel 4.3: Entity Count**
- Type: Time series graph (stacked)
- Metrics:
  - `slimy_minecraft_entities_count` by `entity_type`
- Shows: Entity distribution
- Legend: living, item, projectile, other
- Y-axis: Entity count
- Useful for: Identifying entity lag sources

**Panel 4.4: World Size**
- Type: Stat panel
- Metrics:
  - `slimy_minecraft_world_size_bytes` by world
- Shows: Disk usage per world
- Format: GB
- Trend: Sparkline showing growth

#### Row 5: World Operations
**Panel 5.1: Save Duration**
- Type: Time series graph
- Metrics:
  - `slimy_minecraft_save_duration_seconds` by world
- Shows: Time to save worlds
- Y-axis: Seconds
- Group by: save_type (auto, manual)

**Panel 5.2: Plugin Activity**
- Type: Time series graph
- Metrics:
  - `rate(slimy_minecraft_plugin_events_total[5m])` by plugin
- Shows: Top active plugins
- Legend: Top 10 plugins by event rate
- Y-axis: Events per second

**Panel 5.3: Plugin Errors**
- Type: Table
- Metrics:
  - `increase(slimy_minecraft_plugin_errors_total[1h])` by plugin
- Shows: Plugins with errors in last hour
- Columns: Plugin Name, Error Count, Error Rate
- Sort: By error count descending

#### Row 6: Alerts & Incidents
**Panel 6.1: Recent Crashes**
- Type: Logs panel / Table
- Metrics:
  - `slimy_minecraft_server_crashes_total` events
- Shows: Last 10 crash events with timestamps
- Columns: Time, Crash Type, Duration Until Restart

**Panel 6.2: Performance Degradation Events**
- Type: Stat panel
- Metrics:
  - `count(slimy_minecraft_tps < 15)` over time windows
- Shows: Minutes of poor performance in last hour
- Alert: >5 minutes

---

## Dashboard 4: Web Application Performance

**Purpose**: Detailed web application metrics for frontend and API performance
**Audience**: Web developers, frontend team, API maintainers
**Refresh Rate**: 30 seconds
**Time Range**: Last 1 hour (default)

### Panels:

#### Row 1: Traffic Overview
**Panel 1.1: Request Rate**
- Type: Time series graph
- Metrics:
  - `rate(slimy_web_http_requests_total[5m])` by method
- Shows: Requests/sec by HTTP method
- Legend: GET, POST, PUT, DELETE, PATCH
- Y-axis: Requests/sec

**Panel 1.2: Status Code Distribution**
- Type: Stacked bar chart
- Metrics:
  - `rate(slimy_web_http_requests_total[5m])` by status_code range
- Shows: 2xx, 3xx, 4xx, 5xx over time
- Colors: Green (2xx), Blue (3xx), Yellow (4xx), Red (5xx)
- Y-axis: Requests/sec

**Panel 1.3: Top Routes by Volume**
- Type: Bar gauge
- Metrics:
  - `rate(slimy_web_http_requests_total[5m])` by route
- Shows: Top 15 routes by request rate
- Sort: Descending
- Useful for: Identifying hot paths

#### Row 2: Latency Analysis
**Panel 2.1: Request Latency (Percentiles)**
- Type: Time series graph
- Metrics:
  - `histogram_quantile(0.50, slimy_web_http_request_duration_seconds)` (P50)
  - `histogram_quantile(0.95, slimy_web_http_request_duration_seconds)` (P95)
  - `histogram_quantile(0.99, slimy_web_http_request_duration_seconds)` (P99)
- Shows: Latency distribution
- Y-axis: Milliseconds
- SLA lines: Target thresholds

**Panel 2.2: Slowest Routes**
- Type: Table
- Metrics:
  - `histogram_quantile(0.95, slimy_web_http_request_duration_seconds)` by route
- Shows: Routes with highest P95 latency
- Columns: Route, P95, P99, Request Rate
- Sort: By P95 descending
- Limit: Top 10

**Panel 2.3: Latency Heatmap**
- Type: Heatmap
- Metrics:
  - `slimy_web_http_request_duration_seconds` buckets
- Shows: Request duration distribution over time
- X-axis: Time
- Y-axis: Duration buckets
- Color: Request density

#### Row 3: Error Tracking
**Panel 3.1: Error Rate**
- Type: Time series graph
- Metrics:
  - `rate(slimy_web_http_errors_total[5m]) / rate(slimy_web_http_requests_total[5m]) * 100`
- Shows: Error percentage
- Y-axis: Percentage
- Threshold: Warning at 1%, Critical at 5%

**Panel 3.2: Errors by Type**
- Type: Time series graph (stacked)
- Metrics:
  - `rate(slimy_web_http_errors_total[5m])` by `error_type`
- Shows: Error classification over time
- Legend: validation, authorization, server_error, timeout
- Y-axis: Errors/sec

**Panel 3.3: Error Details Table**
- Type: Table
- Metrics:
  - `increase(slimy_web_http_errors_total[15m])` by route, error_type, status_code
- Shows: Recent errors with context
- Columns: Route, Error Type, Status Code, Count
- Sort: By count descending

#### Row 4: Database Performance
**Panel 4.1: Query Rate**
- Type: Time series graph (stacked)
- Metrics:
  - `rate(slimy_web_db_queries_total[5m])` by operation
- Shows: DB operations/sec
- Legend: select, insert, update, delete
- Y-axis: Queries/sec

**Panel 4.2: Query Latency**
- Type: Time series graph
- Metrics:
  - `histogram_quantile(0.95, slimy_web_db_query_duration_seconds)` by operation
- Shows: P95 query duration by operation type
- Y-axis: Milliseconds
- Threshold: >100ms warning

**Panel 4.3: Slow Queries**
- Type: Table
- Metrics:
  - `histogram_quantile(0.95, slimy_web_db_query_duration_seconds)` by table
- Shows: Slowest tables
- Columns: Table, P95 Duration, Query Count
- Useful for: Query optimization targets

**Panel 4.4: Connection Pool Status**
- Type: Time series graph
- Metrics:
  - `slimy_web_db_connections_active` by pool
- Shows: Active connections vs pool size
- Legend: primary, replica
- Threshold: Max pool size line

#### Row 5: Cache Performance
**Panel 5.1: Cache Hit Rate**
- Type: Time series graph
- Metrics:
  - `rate(slimy_web_cache_operations_total{result="hit"}[5m]) / rate(slimy_web_cache_operations_total{operation="get"}[5m]) * 100`
- Shows: Cache hit percentage
- Y-axis: 0-100%
- Target: >80% hit rate

**Panel 5.2: Cache Operations**
- Type: Time series graph (stacked)
- Metrics:
  - `rate(slimy_web_cache_operations_total[5m])` by operation
- Shows: get, set, delete, expire rates
- Y-axis: Operations/sec

**Panel 5.3: Cache Latency**
- Type: Time series graph
- Metrics:
  - `histogram_quantile(0.95, slimy_web_cache_operation_duration_seconds)` by operation
- Shows: P95 cache operation duration
- Y-axis: Milliseconds
- Expected: <10ms

**Panel 5.4: Cache Size**
- Type: Time series graph
- Metrics:
  - `slimy_web_cache_keys_count` by `key_pattern`
- Shows: Number of keys by prefix
- Legend: session:, guild:, user:
- Y-axis: Key count

#### Row 6: Authentication & Sessions
**Panel 6.1: Auth Success Rate**
- Type: Stat panel with graph
- Metrics:
  - `rate(slimy_web_auth_attempts_total{result="success"}[5m]) / rate(slimy_web_auth_attempts_total[5m]) * 100`
- Shows: Auth success percentage
- Sparkline: Last hour
- Alert: <95%

**Panel 6.2: Auth Failures by Reason**
- Type: Pie chart
- Metrics:
  - `increase(slimy_web_auth_attempts_total{result="failure"}[1h])` by `failure_reason`
- Shows: Distribution of auth failure reasons
- Legend: invalid_credentials, expired_token, rate_limited

**Panel 6.3: Active Sessions**
- Type: Time series graph
- Metrics:
  - `slimy_web_sessions_active` by type
- Shows: Active web and API sessions
- Y-axis: Session count
- Legend: web, api

**Panel 6.4: Rate Limiting**
- Type: Time series graph
- Metrics:
  - `increase(slimy_web_api_rate_limit_hits_total[1m])` by endpoint
- Shows: Rate limit hits per minute
- Y-axis: Hits/min
- Alert: Increasing trend

---

## Common Dashboard Features

### Variables (Template Variables)
All dashboards should support these variables for filtering:
- **$environment**: production, staging, development
- **$instance**: Specific service instance
- **$time_range**: Quick time range selector (5m, 15m, 1h, 6h, 24h, 7d)

### Annotations
- **Deployments**: Mark deployment times on all graphs
- **Alerts**: Show when alerts fired/resolved
- **Incidents**: Manual incident markers

### Time Controls
- **Auto-refresh**: Configurable (10s, 30s, 1m, 5m, off)
- **Timezone**: User's local timezone
- **Relative time ranges**: Quick access to "Last X minutes/hours"

### Export & Sharing
- **Snapshot**: Create shareable snapshot
- **PNG Export**: Export individual panels or full dashboard
- **JSON**: Export dashboard definition for version control

---

## Implementation Notes

1. **Dashboard as Code**: Store dashboard JSON in `infrastructure/grafana/dashboards/` for version control
2. **Provisioning**: Use Grafana provisioning to auto-load dashboards
3. **Alerts**: Define alert rules in each dashboard where appropriate
4. **Permissions**: Set view/edit permissions by team
5. **Folders**: Organize dashboards in Grafana folders (Ops, Development, Business)

---

## Future Dashboard Ideas

- **Business Metrics**: User growth, engagement, revenue (if applicable)
- **Security Dashboard**: Auth patterns, suspicious activity, rate limiting
- **Cost Optimization**: Resource usage vs cost analysis
- **SLO Dashboard**: Service Level Objective tracking
- **Capacity Planning**: Trend analysis for resource scaling
- **Synthetic Monitoring**: Uptime and performance from external probes
- **Mobile/Mobile Web**: If mobile apps exist, dedicated performance dashboard
- **CI/CD Pipeline**: Build times, test pass rates, deployment frequency
