#!/usr/bin/env bash
set -euo pipefail

BOT_NAME="${BOT_NAME:-slimy-bot-v2}"
LOG_DIR="${LOG_DIR:-/home/slimy/logs}"
OUT_LOG="${OUT_LOG:-$LOG_DIR/bot-out.log}"
ERR_LOG="${ERR_LOG:-$LOG_DIR/bot-error.log}"
COMBINED_LOG="${COMBINED_LOG:-$LOG_DIR/bot-combined.log}"
EVENT_LOG="${EVENT_LOG:-/tmp/slimy-bot-command-watchdog-events.log}"
RAW_LOG="${RAW_LOG:-/tmp/slimy-bot-command-watchdog-raw.log}"
PID_FILE="${PID_FILE:-/tmp/slimy-bot-command-watchdog.pid}"
PM2_BIN="${PM2_BIN:-$(command -v pm2 || true)}"

if [[ -z "$PM2_BIN" && -x /home/slimy/.npm-global/bin/pm2 ]]; then
  PM2_BIN="/home/slimy/.npm-global/bin/pm2"
fi

ERROR_PATTERN='(error|exception|Unhandled|TypeError|ReferenceError|SyntaxError|DiscordAPIError|InteractionAlreadyReplied|Unknown interaction|Cannot read|Cannot access|failed|❌)'
IGNORE_PATTERN='(Health check server running|Health: http://localhost:3000/health|Metrics: http://localhost:3000/metrics)'

timestamp() {
  date '+%Y-%m-%d %H:%M:%S %z'
}

note() {
  printf '[%s] %s\n' "$(timestamp)" "$*" | tee -a "$EVENT_LOG"
}

check_pm2() {
  if [[ -z "$PM2_BIN" ]]; then
    note "WARN pm2 is not on PATH; falling back to direct log tail"
    return
  fi

  local status
  status="$("$PM2_BIN" jlist 2>/dev/null | BOT_NAME="$BOT_NAME" node -e "
let s='';
process.stdin.on('data', d => s += d);
process.stdin.on('end', () => {
  const rows = JSON.parse(s || '[]');
  const app = rows.find(r => r.name === process.env.BOT_NAME);
  console.log(app ? app.pm2_env.status : 'missing');
});
" 2>/dev/null || true)"

  if [[ "$status" != "online" ]]; then
    note "ERROR $BOT_NAME pm2 status is '$status'"
  else
    note "OK $BOT_NAME is online"
  fi
}

watch_logs() {
  : > "$RAW_LOG"
  touch "$OUT_LOG" "$ERR_LOG" "$COMBINED_LOG" "$EVENT_LOG"
  echo "$$" > "$PID_FILE"

  note "START watching $BOT_NAME command smoke tests"
  note "RAW_LOG=$RAW_LOG"
  note "EVENT_LOG=$EVENT_LOG"
  note "PID_FILE=$PID_FILE"
  check_pm2

  tail -q -n 0 -F "$COMBINED_LOG" "$OUT_LOG" "$ERR_LOG" 2>/dev/null |
    while IFS= read -r line; do
      if [[ "$line" == "==> "* ]]; then
        continue
      fi

      printf '[%s] %s\n' "$(timestamp)" "$line" >> "$RAW_LOG"

      if printf '%s\n' "$line" | grep -Eiq "$IGNORE_PATTERN"; then
        continue
      fi

      if printf '%s\n' "$line" | grep -Eiq "$ERROR_PATTERN"; then
        note "FLAG $line"
        continue
      fi

      if printf '%s\n' "$line" | grep -Eiq '(Loaded command:|Executing command|interactionCreate|command:)'; then
        note "TRACE $line"
      fi
    done
}

case "${1:-watch}" in
  watch)
    watch_logs
    ;;
  status)
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      note "OK watchdog running pid=$(cat "$PID_FILE")"
    else
      note "WARN watchdog not running"
      exit 1
    fi
    ;;
  stop)
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      kill "$(cat "$PID_FILE")"
      note "STOP watchdog pid=$(cat "$PID_FILE")"
    else
      note "WARN watchdog not running"
    fi
    ;;
  *)
    echo "Usage: $0 [watch|status|stop]" >&2
    exit 2
    ;;
esac
