#!/usr/bin/env bash
set -euo pipefail

LOG="/tmp/setup-docker-mint_$(date +%F_%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date -Is)] setup-docker-mint starting"
echo "Log: $LOG"

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: This script needs sudo/root."
  echo "Run: sudo bash scripts/host/setup-docker-mint.sh"
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "ERROR: apt-get not found; this script targets Mint/Ubuntu."
  exit 1
fi

echo "[$(date -Is)] OS info:"
if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "ID=${ID:-} VERSION_ID=${VERSION_ID:-} VERSION_CODENAME=${VERSION_CODENAME:-}"
fi

comment_cdrom_sources() {
  local src="/etc/apt/sources.list"
  [[ -f "$src" ]] || return 0
  if grep -nE '^[[:space:]]*deb[[:space:]]+cdrom:' "$src" >/dev/null; then
    local bak="${src}.bak.$(date +%s)"
    echo "[$(date -Is)] Commenting out active deb cdrom: entries in $src (backup: $bak)"
    cp -a "$src" "$bak"
    sed -i -E 's/^[[:space:]]*(deb[[:space:]]+cdrom:)/# \1/' "$src"
  fi
}

remove_conflicts_if_present() {
  local pkgs=(docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc)
  local to_remove=()
  local pkg
  for pkg in "${pkgs[@]}"; do
    if dpkg -s "$pkg" >/dev/null 2>&1; then
      to_remove+=("$pkg")
    fi
  done

  if ((${#to_remove[@]} == 0)); then
    echo "[$(date -Is)] No conflicting Docker packages installed (ok)."
    return 0
  fi

  echo "[$(date -Is)] Removing conflicting packages: ${to_remove[*]}"
  apt-get remove -y "${to_remove[@]}"
  apt-get autoremove -y || true
}

install_docker_repo() {
  echo "[$(date -Is)] Installing prerequisites"
  apt-get update
  apt-get install -y ca-certificates curl gnupg

  echo "[$(date -Is)] Adding Docker APT key + repo (Ubuntu noble)"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  local arch
  arch="$(dpkg --print-architecture)"

  local list="/etc/apt/sources.list.d/docker.list"
  if [[ -f "$list" ]]; then
    cp -a "$list" "${list}.bak.$(date +%s)"
  fi
  echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable" >"$list"

  apt-get update
}

install_docker_packages() {
  echo "[$(date -Is)] Installing Docker Engine + plugins"
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

enable_docker_service() {
  echo "[$(date -Is)] Enabling + starting docker service"
  systemctl enable --now docker
}

ensure_docker_group_membership() {
  groupadd -f docker

  local target_user="${SUDO_USER:-}"
  if [[ -z "$target_user" ]]; then
    echo "[$(date -Is)] NOTE: SUDO_USER is empty; cannot auto-add a non-root user to docker group."
    return 0
  fi

  if ! id "$target_user" >/dev/null 2>&1; then
    echo "[$(date -Is)] NOTE: User '$target_user' not found; skipping docker group membership."
    return 0
  fi

  if id -nG "$target_user" | tr ' ' '\n' | grep -qx docker; then
    echo "[$(date -Is)] User '$target_user' already in docker group (ok)."
  else
    echo "[$(date -Is)] Adding '$target_user' to docker group"
    usermod -aG docker "$target_user"
    echo "[$(date -Is)] NOTE: User needs a new login session or run: newgrp docker"
  fi
}

comment_cdrom_sources
remove_conflicts_if_present
install_docker_repo
install_docker_packages
enable_docker_service
ensure_docker_group_membership

echo "[$(date -Is)] Versions:"
docker version || true
docker compose version || true

echo "[$(date -Is)] setup-docker-mint completed"

