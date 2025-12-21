#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-https://admin.slimyai.xyz}"
STRICT="${STRICT:-1}"

PAT="${PAT:-(https?:)?//(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?|(localhost|127\\.0\\.0\\.1|\\[::1\\]):[0-9]+|localhost%3a|127\\.0\\.0\\.1%3a|/api/admin-api/api/auth/(callback|login)}"

tmp_dir="$(mktemp -d)"
cleanup() { rm -rf "$tmp_dir"; }
trap cleanup EXIT

html="$tmp_dir/admin.html"
chunks="$tmp_dir/next_chunks.txt"

echo "[info] fetching $BASE/ ..."
curl -fsSL "$BASE/" -o "$html"

fail=0

if grep -nEi "$PAT" "$html" >/dev/null; then
  echo "[FAIL] localhost/legacy route found in HTML:"
  grep -nEi "$PAT" "$html" || true
  fail=1
else
  echo "[PASS] HTML contains no localhost/legacy routes"
fi

grep -oE '/_next/static/[^"[:space:]]+\.js' "$html" | sort -u >"$chunks" || true
chunk_count="$(wc -l <"$chunks" | tr -d ' ')"
echo "[info] discovered $chunk_count Next.js chunks"

while IFS= read -r p; do
  [[ -n "$p" ]] || continue
  url="$BASE$p"
  body="$tmp_dir/chunk-$(echo "$p" | tr '/.' '__').js"
  curl -fsSL "$url" -o "$body"
  if grep -nEi "$PAT" "$body" >/dev/null; then
    echo "[FAIL] localhost/legacy route found in chunk: $p"
    grep -nEi "$PAT" "$body" || true
    fail=1
  fi
done <"$chunks"

if [[ "$fail" == "0" ]]; then
  echo "[PASS] no localhost/legacy routes in HTML + chunks"
  exit 0
fi

if [[ "$STRICT" == "1" ]]; then
  exit 1
fi

echo "[WARN] matches found but STRICT=0"
exit 0
