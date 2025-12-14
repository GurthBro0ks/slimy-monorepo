# Docker on Live-Session Overlay Roots (/cow): overlayfs “invalid argument”

## How to detect a live-session overlay root

Run:

```bash
findmnt -n -o SOURCE,FSTYPE /
```

If you see something like:

```
/cow   overlay
```

…you’re on a live-session / overlay-root environment.

## Why Docker overlayfs fails here

Docker’s default storage backend (`overlay2` / containerd overlay snapshotter) needs kernel/filesystem features that typically aren’t available (or aren’t compatible) when the *host root* is itself an overlay filesystem (common in live USB sessions). The result is usually a container start failure similar to:

```
failed to mount ... fstype: overlay ... err: invalid argument
```

## Workaround: force Docker to use `vfs`

`vfs` avoids overlay mounts entirely, so it works reliably on `/cow overlay` roots, at the cost of performance and disk usage.

Use the host helper:

```bash
sudo bash scripts/host/fix-docker-overlay-root.sh
docker info | grep -i "Storage Driver"
```

Expected:

```
Storage Driver: vfs
```

Important: on `/cow overlay` roots, keep this `vfs` configuration; removing `/etc/docker/daemon.json` will typically put you right back into the overlay mount failure.

## Reverting once installed on a real disk (ext4/btrfs/etc)

Once the machine is installed to a “real” filesystem (not `/cow overlay`), you can revert to the default overlay driver:

1. Inspect root filesystem:
   ```bash
   findmnt -n -o SOURCE,FSTYPE /
   ```
2. If it’s *not* `overlay`, edit `/etc/docker/daemon.json` and remove the `storage-driver` override (or delete the file).
3. Restart Docker:
   ```bash
   sudo systemctl restart docker
   docker info | grep -i "Storage Driver"
   ```

If you’re unsure, leave `vfs` in place for correctness, and only revert when you’re on an installed system and want better performance.

