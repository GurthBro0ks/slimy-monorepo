#!/bin/bash
# Extract credentials from admin-api .env file and create docker-compose .env

ADMIN_ENV="/opt/slimy/app/admin-api/.env.admin.production"
OUTPUT_ENV="/opt/slimy/web/.env.docker"

if [ ! -f "$ADMIN_ENV" ]; then
    echo "Error: $ADMIN_ENV not found"
    exit 1
fi

echo "# Docker Compose Environment Variables" > "$OUTPUT_ENV"
echo "# Generated from admin-api .env.admin.production" >> "$OUTPUT_ENV"
echo "" >> "$OUTPUT_ENV"

# Extract key variables
grep -E "^(SESSION_SECRET|DISCORD_CLIENT_ID|DISCORD_CLIENT_SECRET|DISCORD_BOT_TOKEN|COOKIE_DOMAIN|CORS_ALLOW_ORIGIN|DISCORD_REDIRECT_URI|ADMIN_USER_IDS|CLUB_USER_IDS|OPENAI_API_KEY|STATS_SHEET_ID|SNELP_CODES_URL)=" "$ADMIN_ENV" >> "$OUTPUT_ENV" 2>/dev/null || true

# Add web-specific variables
echo "" >> "$OUTPUT_ENV"
echo "# Web App Configuration" >> "$OUTPUT_ENV"
echo "NEXT_PUBLIC_ADMIN_API_BASE=http://admin-api:3080" >> "$OUTPUT_ENV"
echo "NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes" >> "$OUTPUT_ENV"

echo "Created $OUTPUT_ENV"
cat "$OUTPUT_ENV"
