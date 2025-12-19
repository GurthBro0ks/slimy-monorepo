#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:3001"}
AUTH_ME_PATH="/api/admin-api/api/auth/me"
ACTIVE_GUILD_PATH="/api/admin-api/api/auth/active-guild"
COOKIE_NAME_EXPECTED="slimy_admin_active_guild_id"

printf "Active guild cookie probe (no secrets will be printed).\n"
read -r -s -p "Paste cookie name=value from DevTools: " RAW_COOKIE
printf "\n"
if [[ -z "${RAW_COOKIE}" ]]; then
  printf "No cookie provided.\n" >&2
  exit 1
fi
COOKIE_NAME=${RAW_COOKIE%%=*}
printf "Cookie received: %s=<redacted>\n" "$COOKIE_NAME"

read -r -p "Guild ID to sync: " GUILD_ID
if [[ -z "${GUILD_ID}" ]]; then
  printf "No guildId provided.\n" >&2
  exit 1
fi

TMP_HEADERS=$(mktemp)
TMP_BODY=$(mktemp)
cleanup() {
  rm -f "$TMP_HEADERS" "$TMP_BODY"
}
trap cleanup EXIT

extract_status() {
  awk '/^HTTP/{code=$2} END{print code}' "$1"
}

report_auth_me() {
  local label=$1
  local status=$2
  printf "%s status: %s\n" "$label" "$status"

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$TMP_BODY" <<'PY'
import json
import sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as handle:
        data = json.load(handle)
except Exception:
    print("activeGuildId: parse_error")
    print("activeGuildAppRole: parse_error")
    sys.exit(0)

active_id = data.get("activeGuildId")
active_role = data.get("activeGuildAppRole")
print(f"activeGuildId: {'yes' if active_id else 'no'}")
print(f"activeGuildAppRole: {'yes' if active_role else 'no'}")
PY
  else
    local has_active_id="no"
    local has_active_role="no"
    if grep -q '"activeGuildId"' "$TMP_BODY"; then
      has_active_id="yes"
    fi
    if grep -q '"activeGuildAppRole"' "$TMP_BODY"; then
      has_active_role="yes"
    fi
    printf "activeGuildId: %s\n" "$has_active_id"
    printf "activeGuildAppRole: %s\n" "$has_active_role"
  fi
}

call_auth_me() {
  local label=$1
  curl -sS -D "$TMP_HEADERS" -o "$TMP_BODY" \
    -H "Cookie: $RAW_COOKIE" \
    "$BASE_URL$AUTH_ME_PATH" >/dev/null
  local status
  status=$(extract_status "$TMP_HEADERS")
  report_auth_me "$label" "$status"
}

report_set_cookie_attrs() {
  local found=0
  local line
  local -a attrs

  while IFS= read -r line; do
    local value=${line#*:}
    value=$(printf "%s" "$value" | sed 's/^[[:space:]]*//')
    local name=${value%%=*}
    if [[ "$name" != "$COOKIE_NAME_EXPECTED" ]]; then
      continue
    fi

    found=1
    attrs=()
    if [[ "$value" == *";"* ]]; then
      local remainder=${value#*;}
      IFS=';' read -r -a parts <<< "$remainder"
      for attr in "${parts[@]}"; do
        attr=$(printf "%s" "$attr" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        case "${attr,,}" in
          secure)
            attrs+=("Secure")
            ;;
          samesite=*)
            attrs+=("SameSite=${attr#*=}")
            ;;
          domain=*)
            attrs+=("Domain=${attr#*=}")
            ;;
          path=*)
            attrs+=("Path=${attr#*=}")
            ;;
        esac
      done
    fi

    if [[ ${#attrs[@]} -eq 0 ]]; then
      printf "Set-Cookie (%s): present (no Secure/SameSite/Domain/Path attributes found)\n" "$COOKIE_NAME_EXPECTED"
    else
      printf "Set-Cookie (%s): %s\n" "$COOKIE_NAME_EXPECTED" "${attrs[*]}"
    fi
  done < <(grep -i '^set-cookie:' "$TMP_HEADERS" || true)

  if [[ $found -eq 0 ]]; then
    printf "Set-Cookie (%s): not present\n" "$COOKIE_NAME_EXPECTED"
  fi
}

call_auth_me "GET /api/auth/me (before)"

printf "POST %s\n" "$ACTIVE_GUILD_PATH"
POST_BODY=$(printf '{"guildId":"%s"}' "$GUILD_ID")

curl -sS -D "$TMP_HEADERS" -o "$TMP_BODY" \
  -H "Content-Type: application/json" \
  -H "Cookie: $RAW_COOKIE" \
  -X POST \
  --data "$POST_BODY" \
  "$BASE_URL$ACTIVE_GUILD_PATH" >/dev/null

POST_STATUS=$(extract_status "$TMP_HEADERS")
printf "POST /api/auth/active-guild status: %s\n" "$POST_STATUS"
report_set_cookie_attrs

call_auth_me "GET /api/auth/me (after)"
