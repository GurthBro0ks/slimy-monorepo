#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${1:-docker-compose.yml}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "FAIL: compose file not found: $COMPOSE_FILE"
  exit 2
fi

resolve_env_default() {
  local token="$1"

  if [[ "$token" == '${'*'}' ]]; then
    local inner="${token:2:${#token}-3}"

    # ${VAR:-default}
    if [[ "$inner" == *":-"* ]]; then
      local var="${inner%%":-"*}"
      local def="${inner#*":-"}"
      local val="${!var:-}"
      if [[ -n "$val" ]]; then
        echo "$val"
      else
        echo "$def"
      fi
      return 0
    fi

    # ${VAR}
    local var="${inner}"
    echo "${!var:-}"
    return 0
  fi

  echo "$token"
}

ports=()

in_ports=0
ports_indent=0

split_colon_outside_braces() {
  local s="$1"
  local inside=0
  local buf=""
  local -a out=()
  local i=0

  while (( i < ${#s} )); do
    local two="${s:i:2}"
    local c="${s:i:1}"

    if [[ "$two" == '${' ]]; then
      inside=1
      buf+="${two}"
      i=$((i + 2))
      continue
    fi

    if [[ "$c" == '}' && $inside -eq 1 ]]; then
      inside=0
      buf+="${c}"
      i=$((i + 1))
      continue
    fi

    if [[ "$c" == ':' && $inside -eq 0 ]]; then
      out+=("$buf")
      buf=""
      i=$((i + 1))
      continue
    fi

    buf+="${c}"
    i=$((i + 1))
  done

  out+=("$buf")
  printf "%s\n" "${out[@]}"
}

while IFS= read -r raw; do
  line="${raw%%#*}"
  [[ -z "${line//[[:space:]]/}" ]] && continue

  indent="${line%%[^ ]*}"
  indent_len="${#indent}"
  trimmed="${line#"${indent}"}"

  if [[ "$trimmed" =~ ^ports:[[:space:]]*$ ]]; then
    in_ports=1
    ports_indent="$indent_len"
    continue
  fi

  if (( in_ports )); then
    if (( indent_len <= ports_indent )); then
      in_ports=0
      continue
    fi

    if [[ "$trimmed" =~ ^-[[:space:]]*(.*)$ ]]; then
      spec="${BASH_REMATCH[1]}"
      spec="${spec%\"}"
      spec="${spec#\"}"
      spec="${spec%\'}"
      spec="${spec#\'}"

      spec="${spec%%/*}"
      [[ "$spec" != *:* ]] && continue

      mapfile -t parts < <(split_colon_outside_braces "$spec")
      if (( ${#parts[@]} < 2 )); then
        continue
      fi

      host_port_raw=""
      if (( ${#parts[@]} == 2 )); then
        host_port_raw="${parts[0]}"
      else
        host_port_raw="${parts[${#parts[@]}-2]}"
      fi

      host_port="$(resolve_env_default "$host_port_raw")"
      host_port="$(echo "$host_port" | tr -d '[:space:]')"

      if [[ -z "$host_port" ]]; then
        continue
      fi
      if [[ "$host_port" =~ ^[0-9]+$ ]]; then
        ports+=("$host_port")
      fi
    fi
  fi
done < "$COMPOSE_FILE"

if (( ${#ports[@]} == 0 )); then
  echo "PASS: no published host ports found in $COMPOSE_FILE"
  exit 0
fi

readarray -t unique_ports < <(printf "%s\n" "${ports[@]}" | sort -n | uniq)

ss_available=0
if command -v ss >/dev/null 2>&1; then
  ss_available=1
fi

lsof_available=0
if command -v lsof >/dev/null 2>&1; then
  lsof_available=1
fi

fuser_available=0
if command -v fuser >/dev/null 2>&1; then
  fuser_available=1
fi

failures=()

for port in "${unique_ports[@]}"; do
  if (( ss_available )); then
    ss_out="$(ss -ltnpH 2>/dev/null || true)"
    match="$(echo "$ss_out" | awk -v p=":${port}" '$4 ~ p"$" {print}')"
    if [[ -n "$match" ]]; then
      owner="unknown"
      if [[ "$match" == *"users:(("* ]]; then
        owner_part="${match#*users:((}"
        owner_part="${owner_part#\"}"
        owner_part="${owner_part%%))*}"

        proc="${owner_part%%,pid=*}"
        proc="${proc%\"}"

        pid="${owner_part#*,pid=}"
        pid="${pid%%,*}"

        if [[ -n "${proc:-}" && "${pid:-}" =~ ^[0-9]+$ ]]; then
          owner="${proc} pid=${pid}"
        fi
      fi

      if [[ "$owner" == "unknown" && $lsof_available -eq 1 ]]; then
        lsof_out="$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
        if [[ -n "$lsof_out" ]]; then
          owner="$(echo "$lsof_out" | awk 'NR==2 {print $1" pid="$2}' )"
          [[ -z "$owner" ]] && owner="unknown"
        fi
      fi

      if [[ "$owner" == "unknown" && $fuser_available -eq 1 ]]; then
        fuser_out="$(fuser -n tcp "${port}" 2>/dev/null || true)"
        fuser_pid="$(echo "$fuser_out" | awk '{print $1}' | tr -d '[:space:]')"
        if [[ "$fuser_pid" =~ ^[0-9]+$ ]]; then
          owner="pid=${fuser_pid}"
        fi
      fi

      failures+=("port ${port} in use (${owner})")
      echo "FAIL: port ${port} is already in use (${owner})"
      echo "  ss: ${match}"
      continue
    fi
  elif (( lsof_available )); then
    lsof_out="$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$lsof_out" ]]; then
      owner="$(echo "$lsof_out" | awk 'NR==2 {print $1" pid="$2}' )"
      [[ -z "$owner" ]] && owner="unknown"
      failures+=("port ${port} in use (${owner})")
      echo "FAIL: port ${port} is already in use (${owner})"
      echo "$lsof_out" | sed -n '1,3p' | sed 's/^/  /'
      continue
    fi
  else
    echo "WARN: neither ss nor lsof is available; cannot check port ${port}"
  fi

  echo "OK: port ${port} available"
done

if (( ${#failures[@]} > 0 )); then
  echo
  echo "FAIL: compose host port collisions detected:"
  printf " - %s\n" "${failures[@]}"
  exit 1
fi

echo
echo "PASS: all compose host ports are available (${#unique_ports[@]} checked)"
