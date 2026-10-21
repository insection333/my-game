#!/usr/bin/env bash
# A real restore, for when the live database is lost or damaged (OPERATIONS.md). Run as root on the
# server, with the backup settings loaded:
#
#   sudo bash -c 'set -a; . /etc/idleclash/backup.env; /srv/idleclash/current/tools/ops/restore.sh newest'
#
# It fetches the named backup (or the newest), checks it, stops the game, sets the current database
# aside (never deleted: idle-clash.db.replaced-TIME), puts the backup in its place and starts the game.
set -euo pipefail

DB=${DB:-/var/lib/idleclash/idle-clash.db}
REMOTE=${BACKUP_REMOTE:?BACKUP_REMOTE is not set: load /etc/idleclash/backup.env first}
export RCLONE_CONFIG=${RCLONE_CONFIG:-/dev/null}
SERVICE_CTL=${SERVICE_CTL:-systemctl}
SERVICE=${SERVICE:-idleclash}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3000/api/health}
want=${1:?usage: restore.sh newest | idleclash-YYYYMMDD-HHMMSS.db.gz}

if [[ $want == newest ]]; then
  want=$(rclone lsf --files-only "$REMOTE" | grep -E '^idleclash-[0-9]{8}-[0-9]{6}\.db\.gz$' | sort | tail -n 1)
fi
[[ $want =~ ^idleclash-[0-9]{8}-[0-9]{6}\.db\.gz$ ]] || { echo "Not a backup name: $want" >&2; exit 2; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
rclone copyto "$REMOTE/$want" "$work/restored.db.gz"
gunzip "$work/restored.db.gz"
check=$(sqlite3 "$work/restored.db" 'pragma integrity_check' 2>&1 || true)
[[ $check == ok ]] || { echo "$want failed its integrity check: $check" >&2; exit 1; }

$SERVICE_CTL stop "$SERVICE"
aside="$DB.replaced-$(date -u +%Y%m%d-%H%M%S)"
for suffix in '' -wal -shm; do
  [[ -f $DB$suffix ]] && mv "$DB$suffix" "$aside$suffix"
done
cp "$work/restored.db" "$DB"
if id idleclash >/dev/null 2>&1; then
  chown idleclash:idleclash "$DB"
  chmod 660 "$DB"
fi
$SERVICE_CTL start "$SERVICE"
for _ in $(seq 1 30); do
  if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Restored $want; the database it replaced is at $aside"
    exit 0
  fi
  sleep 1
done
echo "Restored $want, but the game does not answer its health check; the replaced database is at $aside" >&2
exit 1
