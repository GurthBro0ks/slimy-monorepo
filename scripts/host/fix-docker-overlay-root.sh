#!/usr/bin/env bash
set -euo pipefail

LOG="/tmp/fix-docker-overlay-root_$(date +%F_%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date -Is)] fix-docker-overlay-root starting"
echo "Log: $LOG"

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: This script needs sudo/root."
  echo "Run: sudo bash scripts/host/fix-docker-overlay-root.sh"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker not found."
  echo "Install it first: sudo bash scripts/host/setup-docker-mint.sh"
  exit 1
fi

root_source=""
root_fstype=""
if root_line="$(findmnt -n -o SOURCE,FSTYPE / 2>/dev/null)"; then
  root_source="$(awk '{print $1}' <<<"$root_line")"
  root_fstype="$(awk '{print $2}' <<<"$root_line")"
fi

echo "Root mount: source=${root_source:-unknown} fstype=${root_fstype:-unknown}"

storage_driver="$(docker info 2>/dev/null | awk -F': ' 'BEGIN{IGNORECASE=1} /Storage Driver/ {print $2; exit}')"
echo "Docker Storage Driver: ${storage_driver:-unknown}"

overlay_hostile=0
if [[ "${root_fstype:-}" == "overlay" || "${root_source:-}" == "/cow" ]]; then
  overlay_hostile=1
  echo "Detected live-session overlay root; overlayfs snapshotter likely fails here."
fi

need_vfs=0
if [[ "$overlay_hostile" -eq 1 && "${storage_driver:-}" != "vfs" ]]; then
  need_vfs=1
fi

tmp_out="$(mktemp)"
set +e
docker run --rm hello-world >"$tmp_out" 2>&1
hello_rc=$?
set -e
if [[ "$hello_rc" -ne 0 ]] && grep -qiE 'failed to mount|fstype: overlay|err: invalid argument' "$tmp_out"; then
  need_vfs=1
fi

if [[ "$need_vfs" -eq 1 ]]; then
  echo "Applying Docker vfs storage-driver workaround."
  install -d -m 0755 /etc/docker
  if [[ -f /etc/docker/daemon.json ]]; then
    bak="/etc/docker/daemon.json.bak.$(date +%s)"
    cp -a /etc/docker/daemon.json "$bak"
    echo "Backed up /etc/docker/daemon.json to $bak"
  fi

  cat >/etc/docker/daemon.json <<'JSON'
{
  "features": { "containerd-snapshotter": false },
  "storage-driver": "vfs"
}
JSON

  systemctl restart docker
else
  echo "No change needed."
fi

echo "Verify Storage Driver is vfs:"
docker info 2>/dev/null | grep -i "Storage Driver" || true

if ! docker info 2>/dev/null | grep -qiE 'Storage Driver:[[:space:]]*vfs[[:space:]]*$'; then
  echo "ERROR: Storage Driver is not vfs; refusing to continue."
  exit 1
fi

echo "Verify hello-world:"
docker run --rm hello-world >/dev/null
echo "OK: hello-world"

echo "[$(date -Is)] fix-docker-overlay-root completed"
