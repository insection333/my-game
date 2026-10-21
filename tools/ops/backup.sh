#!/usr/bin/env bash
# The nightly backup (the idleclash-backup timer runs it as the game's user): a consistent copy of the
# live database, checked, compressed and sent off the server to Cloudflare R2. Kept: the newest 30
# nights, and the first backup of each of the last 12 months. On success it touches status/backup,
# which the health answer reads.
#
# Settings (from /etc/idleclash/backup.env): BACKUP_REMOTE, the rclone remote and bucket, such as
# r2:idleclash-backups (the remote itself is configured by RCLONE_CONFIG_R2_* variables); DB and
# STATUS_DIR have the server's defaults.
set -euo pipefail

DB=${DB:-/var/lib/idleclash/idle-clash.db}
STATUS_DIR=${STATUS_DIR:-/var/lib/idleclash/status}
REMOTE=${BACKUP_REMOTE:?BACKUP_REMOTE is not set}
# The remote is set up by RCLONE_CONFIG_* variables alone; there is no config file.
export RCLONE_CONFIG=${RCLONE_CONFIG:-/dev/null}
KEEP_NIGHTS=${KEEP_NIGHTS:-30}
KEEP_MONTHS=${KEEP_MONTHS:-12}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
stamp=$(date -u +%Y%m%d-%H%M%S)
name="idleclash-$stamp.db"

# SQLite's own backup copies a consistent database while the game keeps writing.
sqlite3 "$DB" ".backup '$work/$name'"
check=$(sqlite3 "$work/$name" 'pragma integrity_check')
[[ $check == ok ]] || { echo "The copy failed its integrity check: $check" >&2; exit 1; }
gzip -9 "$work/$name"
rclone copyto --s3-no-check-bucket "$work/$name.gz" "$REMOTE/$name.gz"
size=$(stat -c %s "$work/$name.gz")

# Which to keep: the newest few nights, and the first of each recent month. Names sort by time.
mapfile -t all < <(rclone lsf --files-only "$REMOTE" | grep -E '^idleclash-[0-9]{8}-[0-9]{6}\.db\.gz$' | sort)
keep=$(
  printf '%s\n' "${all[@]}" | tail -n "$KEEP_NIGHTS"
  printf '%s\n' "${all[@]}" | awk '{ m = substr($0, 11, 6); if (!(m in seen)) { seen[m] = 1; print } }' |
    tail -n "$KEEP_MONTHS"
)
gone=0
for f in "${all[@]}"; do
  if ! grep -qxF "$f" <<<"$keep"; then
    rclone deletefile "$REMOTE/$f"
    gone=$((gone + 1))
  fi
done

mkdir -p "$STATUS_DIR"
touch "$STATUS_DIR/backup"
echo "Backed up $name.gz ($size bytes); removed $gone old backups"
