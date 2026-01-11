#!/usr/bin/env bash
set -euo pipefail

failures=()

capture_find_output() {
  local description=$1
  shift
  local matches
  matches=$(find "$@" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "FAIL_STRAY: $description"
    printf '%s\n' "$matches"
    exit 1
  fi
}

capture_find_output "Found .php files under apps/web/public - possible webshells" apps/web/public -maxdepth 3 -type f -iname "*.php"
capture_find_output "Found xmrig-related files" . -type f -iname "*xmrig*"
capture_find_output "Found tarball artifacts under apps/web" apps/web -maxdepth 4 -type f -name "*.tar.gz"

echo "OK_CLEAN: no stray PHP, xmrig, or tarball artifacts detected"
