# Caddy Reverse Proxy

Caddy reverse proxy configurations for Slimy.ai

## Overview

Caddy serves as the reverse proxy and HTTPS termination layer for Slimy.ai, providing:
- Automatic HTTPS with Let's Encrypt
- Domain-based routing
- Request routing to appropriate backend services
- Compression and performance optimization
- Security headers

## Current Configuration

The Caddyfile is currently located at:
- `infra/docker/Caddyfile.slimy-nuc2`

**Proposed location**: Move to `infra/caddy/Caddyfile` for better organization.

## Domains

### Production Domains

| Domain              | Backend Service   | Purpose                |
|---------------------|-------------------|------------------------|
| slimyai.xyz         | web:3000          | Main website           |
| www.slimyai.xyz     | web:3000          | Main website (www)     |
| login.slimyai.xyz   | web:3000          | Authentication portal  |
| panel.slimyai.xyz   | web:3000 / api:3080 | Admin panel          |
| slime.chat          | web:3000          | Chat interface         |
| www.slime.chat      | web:3000          | Chat interface (www)   |

### Development

| Domain              | Backend Service   | Purpose                |
|---------------------|-------------------|------------------------|
| localhost:8080      | web:3000 / api:3080 | Local reverse proxy  |

## Routing Logic

### API Routes

```
/api/bedrock-status → web:3000
/api/*              → admin-api:3080
```

**Explanation**:
- Bedrock status endpoint is handled by web app
- All other API routes go to admin-api

### Static Routes

```
/*                  → web:3000
```

All non-API routes serve the Next.js web app.

## Caddyfile Structure

### Production Configuration

```caddyfile
# Main domains
slimyai.xyz, www.slimyai.xyz {
    # API routing
    handle /api/bedrock-status {
        reverse_proxy web:3000
    }

    handle /api/* {
        reverse_proxy admin-api:3080
    }

    # Static content
    handle {
        reverse_proxy web:3000
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Compression
    encode zstd gzip
}

# Login subdomain
login.slimyai.xyz {
    reverse_proxy web:3000
    encode zstd gzip
}

# Admin panel
panel.slimyai.xyz {
    handle /api/* {
        reverse_proxy admin-api:3080
    }

    handle {
        reverse_proxy admin-ui:3081
    }

    encode zstd gzip
}

# Chat domains
slime.chat, www.slime.chat {
    reverse_proxy web:3000
    encode zstd gzip
}

# Development proxy
:8080 {
    handle /api/* {
        reverse_proxy admin-api:3080
    }

    handle {
        reverse_proxy web:3000
    }
}
```

## HTTPS and SSL

### Automatic HTTPS

Caddy automatically provisions SSL certificates via Let's Encrypt:

1. **Domain validation**: Caddy validates domain ownership
2. **Certificate issuance**: Let's Encrypt issues certificate
3. **Auto-renewal**: Certificates renewed 30 days before expiry
4. **HTTPS redirect**: HTTP automatically redirects to HTTPS

### Certificate Storage

Certificates are stored in:
- Container: `/data/caddy/certificates/`
- Host: Mapped volume (if configured)

### Manual Certificate Management

```bash
# List certificates
docker exec slimy-caddy caddy list-certificates

# Force renewal
docker exec slimy-caddy caddy reload --config /etc/caddy/Caddyfile
```

## Security Headers

### HSTS (HTTP Strict Transport Security)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Forces browsers to use HTTPS for 1 year.

### Content Type Options

```
X-Content-Type-Options: nosniff
```

Prevents MIME type sniffing.

### Frame Options

```
X-Frame-Options: DENY
```

Prevents clickjacking attacks.

### Referrer Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

Controls referrer information.

## Compression

Caddy compresses responses with:
- **Zstandard (zstd)**: Modern, fast compression
- **Gzip**: Fallback for older clients

```caddyfile
encode zstd gzip
```

## Load Balancing

For multiple backend instances:

```caddyfile
reverse_proxy web-1:3000 web-2:3000 web-3:3000 {
    lb_policy round_robin
    health_uri /api/health
    health_interval 30s
}
```

**Load balancing strategies**:
- `round_robin`: Distribute evenly
- `least_conn`: Prefer least connections
- `random`: Random selection
- `ip_hash`: Sticky sessions based on IP

## WebSocket Support

Caddy automatically handles WebSocket connections:

```caddyfile
reverse_proxy admin-api:3080 {
    # WebSocket support is automatic
}
```

For explicit WebSocket configuration:

```caddyfile
@websockets {
    header Connection *Upgrade*
    header Upgrade websocket
}

handle @websockets {
    reverse_proxy admin-api:3080
}
```

## CORS Configuration

Handle CORS at Caddy level:

```caddyfile
header {
    Access-Control-Allow-Origin "*"
    Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers "Content-Type, Authorization"
}
```

**Note**: CORS is currently handled by backend services.

## Request Logging

Enable access logs:

```caddyfile
log {
    output file /var/log/caddy/access.log {
        roll_size 100mb
        roll_keep 10
        roll_keep_for 720h
    }
    format json
}
```

## Error Handling

Custom error pages:

```caddyfile
handle_errors {
    @404 {
        expression {http.error.status_code} == 404
    }
    respond @404 "Page not found" 404

    @500 {
        expression {http.error.status_code} >= 500
    }
    respond @500 "Server error" 500
}
```

## Rate Limiting

Add rate limiting (requires plugin):

```caddyfile
rate_limit {
    zone dynamic {
        key {remote_host}
        events 100
        window 1m
    }
}
```

## Testing Configuration

### Validate Caddyfile

```bash
# Validate syntax
docker exec slimy-caddy caddy validate --config /etc/caddy/Caddyfile

# Test configuration
docker exec slimy-caddy caddy adapt --config /etc/caddy/Caddyfile
```

### Reload Configuration

```bash
# Reload without downtime
docker exec slimy-caddy caddy reload --config /etc/caddy/Caddyfile

# Force reload
docker-compose -f infra/docker/docker-compose.slimy-nuc2.yml restart caddy
```

### Test Domains Locally

Add to `/etc/hosts` for local testing:

```
127.0.0.1 slimyai.xyz
127.0.0.1 panel.slimyai.xyz
127.0.0.1 login.slimyai.xyz
```

## Monitoring

### Health Checks

Check if Caddy is responding:

```bash
# HTTP health check
curl -I http://localhost:80

# HTTPS health check
curl -I https://slimyai.xyz

# Admin API
curl http://localhost:2019/config/
```

### Metrics

Caddy exposes metrics at:
- Default: `http://localhost:2019/metrics`

Scrape with Prometheus:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'caddy'
    static_configs:
      - targets: ['caddy:2019']
```

### Logs

View Caddy logs:

```bash
# Docker logs
docker logs -f slimy-caddy

# Access logs (if configured)
docker exec slimy-caddy tail -f /var/log/caddy/access.log
```

## Migration from Current Setup

### Current State

Caddyfile is at: `infra/docker/Caddyfile.slimy-nuc2`

### Proposed Migration

1. **Move Caddyfile**:
   ```bash
   mv infra/docker/Caddyfile.slimy-nuc2 infra/caddy/Caddyfile
   ```

2. **Update docker-compose.yml**:
   ```yaml
   caddy:
     image: caddy:2
     volumes:
       - ../caddy/Caddyfile:/etc/caddy/Caddyfile:ro
   ```

3. **Test configuration**:
   ```bash
   docker exec slimy-caddy caddy validate --config /etc/caddy/Caddyfile
   ```

4. **Reload Caddy**:
   ```bash
   docker exec slimy-caddy caddy reload --config /etc/caddy/Caddyfile
   ```

## Troubleshooting

### Certificate Issues

```bash
# Check certificate status
docker exec slimy-caddy caddy list-certificates

# Force certificate renewal
docker exec slimy-caddy rm -rf /data/caddy/certificates
docker-compose restart caddy
```

### 502 Bad Gateway

**Causes**:
- Backend service not running
- Wrong backend port
- Network connectivity issue

**Debug**:
```bash
# Check backend is running
docker ps | grep web

# Test backend directly
curl http://localhost:3000

# Check Caddy logs
docker logs slimy-caddy
```

### Domain Not Resolving

**Causes**:
- DNS not configured
- Caddyfile syntax error
- Port 80/443 not accessible

**Debug**:
```bash
# Check DNS
nslookup slimyai.xyz

# Check ports
netstat -tuln | grep -E '80|443'

# Validate Caddyfile
docker exec slimy-caddy caddy validate
```

## Performance Optimization

### Enable HTTP/2

```caddyfile
# HTTP/2 is enabled by default
```

### Enable HTTP/3 (QUIC)

```caddyfile
slimyai.xyz {
    protocols h1 h2 h3
    reverse_proxy web:3000
}
```

### Connection Pooling

```caddyfile
reverse_proxy web:3000 {
    transport http {
        max_conns_per_host 200
        keepalive 90s
    }
}
```

## Future Enhancements

- **WAF (Web Application Firewall)**: Add security rules
- **DDoS Protection**: Rate limiting and IP blocking
- **Caching**: Cache static assets at Caddy level
- **CDN Integration**: Use Caddy as origin for CDN
- **Multiple Backends**: Load balancing across multiple instances
- **A/B Testing**: Route traffic based on rules
- **Blue-Green Deployment**: Zero-downtime deployments

## Related Documentation

- [Main Infrastructure README](../README.md)
- [Docker Configuration](../docker/README.md)
- Caddy Documentation: https://caddyserver.com/docs/

## License

Proprietary - Slimy.ai
