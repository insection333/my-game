#!/usr/bin/env bash
# The monthly restore rehearsal (the idleclash-rehearse timer runs it; `sudo systemctl start
# idleclash-rehearse` runs it now). It restores the newest backup from R2 the way a real restore would,
# into a folder of its own, and proves it: the file passes SQLite's integrity check, a second game
# server starts on it (applying any migrations) and answers its health check, and every player in it
# has a save. On success it touches status/restore, which the health answer reads.
set -euo pipefail

STATUS_DIR=${STATUS_DIR:-/var/lib/idleclash/status}
REMOTE=${BACKUP_REMOTE:?BACKUP_REMOTE is not set}
# The remote is set up by RCLONE_CONFIG_* variables alone; there is no config file.
export RCLONE_CONFIG=${RCLONE_CONFIG:-/dev/null}
PORT=${REHEARSE_PORT:-3901}
release=$(cd "$(dirname "$0")/../.." && pwd)

work=$(mktemp -d)
server=
cleanup() {
  [[ -n $server ]] && kill "$server" 2>/dev/null
  rm -rf "$work"
}
trap cleanup EXIT
started=$(date +%s)

newest=$(rclone lsf --files-only "$REMOTE" | grep -E '^idleclash-[0-9]{8}-[0-9]{6}\.db\.gz$' | sort | tail -n 1)
[[ -n $newest ]] || { echo "No backups in $REMOTE" >&2; exit 1; }
rclone copyto "$REMOTE/$newest" "$work/restored.db.gz"
gunzip "$work/restored.db.gz"
db="$work/restored.db"

check=$(sqlite3 "$db" 'pragma integrity_check' 2>&1 || true)
[[ $check == ok ]] || { echo "$newest failed its integrity check: $check" >&2; exit 1; }

(cd "$release" && PORT=$PORT HOST=127.0.0.1 DB_PATH=$db LOG=false exec node apps/server/src/main.ts) &
server=$!
up=
for _ in $(seq 1 60); do
  if curl -fsS --max-time 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    up=yes
    break
  fi
  kill -0 "$server" 2>/dev/null || break
  sleep 0.5
done
[[ -n $up ]] || { echo "A server on $newest did not come up" >&2; exit 1; }

players=$(sqlite3 "$db" 'select count(*) from players')
unsaved=$(sqlite3 "$db" 'select count(*) from players where id not in (select player_id from saves)')
[[ $unsaved == 0 ]] || { echo "$unsaved of $players players in $newest have no save" >&2; exit 1; }

mkdir -p "$STATUS_DIR"
touch "$STATUS_DIR/restore"
echo "Restored $newest: $players players, every one with a save; a server ran on it; took $(($(date +%s) - started)) s"
