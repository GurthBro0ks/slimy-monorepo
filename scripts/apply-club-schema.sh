#!/bin/bash
# apply-club-schema.sh
# Helper script to apply club analytics schema to the database
#
# Usage:
#   export DB_URL='mysql://user:password@host:port/database'
#   ./scripts/apply-club-schema.sh
#
# This script is a MANUAL HELPER - it will show you the commands to run
# but requires explicit confirmation before executing destructive operations.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Club Analytics Schema Migration Helper ===${NC}"
echo ""

# Check if DB_URL is set
if [ -z "$DB_URL" ]; then
  echo -e "${RED}ERROR: DB_URL environment variable is not set${NC}"
  echo ""
  echo "Please set DB_URL to your database connection string:"
  echo "  export DB_URL='mysql://user:password@host:port/database'"
  echo ""
  echo "Example:"
  echo "  export DB_URL='mysql://admin:secretpassword@localhost:3306/slimy'"
  exit 1
fi

# Parse DB_URL
# Format: mysql://user:password@host:port/database
if [[ $DB_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo -e "${RED}ERROR: Could not parse DB_URL${NC}"
  echo "Expected format: mysql://user:password@host:port/database"
  exit 1
fi

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Find the schema file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SCHEMA_FILE="$REPO_ROOT/apps/admin-api/lib/club-schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo -e "${RED}ERROR: Schema file not found at $SCHEMA_FILE${NC}"
  exit 1
fi

echo "Schema file: $SCHEMA_FILE"
echo ""

# Show the command that will be executed
echo -e "${YELLOW}The following command will be executed:${NC}"
echo ""
echo "  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < $SCHEMA_FILE"
echo ""

# Warning
echo -e "${RED}WARNING: This will modify your database schema!${NC}"
echo ""
echo "Recommended steps before proceeding:"
echo "  1. Backup your database:"
echo "     mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME > backup-\$(date +%Y%m%d-%H%M%S).sql"
echo ""
echo "  2. Review the schema file:"
echo "     cat $SCHEMA_FILE"
echo ""

# Ask for confirmation
read -p "Do you want to apply the schema now? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo ""
  echo -e "${YELLOW}Aborted. No changes were made.${NC}"
  echo ""
  echo "To apply manually, run:"
  echo "  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME < $SCHEMA_FILE"
  exit 0
fi

echo ""
echo -e "${GREEN}Applying schema...${NC}"

# Apply the schema
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SCHEMA_FILE"; then
  echo ""
  echo -e "${GREEN}✓ Schema applied successfully!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Verify tables were created:"
  echo "     mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e 'SHOW TABLES LIKE \"club_%\";'"
  echo ""
  echo "  2. Test the admin-api endpoints:"
  echo "     GET /api/guilds/:guildId/club/latest"
  echo ""
  echo "  3. Configure OCR ingestion pipeline"
  echo ""
else
  echo ""
  echo -e "${RED}✗ Schema application failed!${NC}"
  echo ""
  echo "Please check the error messages above and try again."
  exit 1
fi
