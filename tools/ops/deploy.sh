#!/usr/bin/env bash
# Deploys a release on the server, run there by the deploy user (GitHub Actions sends it over SSH):
#
#   deploy.sh activate NAME   unpack incoming/NAME.tgz, switch to it, restart, check health; if the
#                             new release is not healthy, put back the one before it and the database
#                             as it was just before the switch
#   deploy.sh rollback        switch back to the release before the current one (the code only: the
#                             database stays as it is, so no player loses anything)
#   deploy.sh status          the current release and the ones kept
#
# Paths and the service manager come from the environment, so the tests run it on a folder of their own.
set -euo pipefail

ROOT=${ROOT:-/srv/idleclash}
DB=${DB:-/var/lib/idleclash/idle-clash.db}
SERVICE_CTL=${SERVICE_CTL:-sudo systemctl}
SERVICE=${SERVICE:-idleclash}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3000/api/health}
HEALTH_TRIES=${HEALTH_TRIES:-40}
HEALTH_SETTLE=${HEALTH_SETTLE:-3}
KEEP=${KEEP:-5}

say() { printf '%s\n' "$*" >&2; }
current() { basename "$(readlink -f "$ROOT/current" 2>/dev/null || true)"; }
# Releases oldest first; names start with their UTC build time, so they sort by age.
releases() { find "$ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort; }

switch_to() {
  ln -sfn "releases/$1" "$ROOT/current.next"
  mv -T "$ROOT/current.next" "$ROOT/current"
}

# Healthy: the health answer comes back twice, a few seconds apart (a release that starts and then
# falls over fails the second).
healthy() {
  local i
  for ((i = 0; i < HEALTH_TRIES; i++)); do
    if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then
      sleep "$HEALTH_SETTLE"
      curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1 && return 0
    fi
    sleep 1
  done
  return 1
}

snapshot() {
  [[ -f $DB ]] || return 0
  sqlite3 "$DB" ".backup '$1'"
}

put_back_db() {
  [[ -f $1 ]] || return 0
  $SERVICE_CTL stop "$SERVICE"
  cp "$1" "$DB.restoring"
  rm -f "$DB-wal" "$DB-shm"
  mv "$DB.restoring" "$DB"
}

activate() {
  local name=$1 tgz="$ROOT/incoming/$1.tgz" before snap
  [[ $name =~ ^[A-Za-z0-9._-]+$ ]] || { say "Not a release name: $name"; exit 2; }
  [[ -f $tgz ]] || { say "No release at $tgz"; exit 2; }
  before=$(current)
  if [[ $before == "$name" ]]; then
    say "$name is already live"
    return 0
  fi
  rm -rf "$ROOT/releases/$name.part"
  mkdir -p "$ROOT/releases/$name.part"
  tar -xzf "$tgz" -C "$ROOT/releases/$name.part"
  rm -rf "$ROOT/releases/$name"
  mv "$ROOT/releases/$name.part" "$ROOT/releases/$name"
  snap="$(dirname "$DB")/before-$name.db"
  snapshot "$snap"
  switch_to "$name"
  $SERVICE_CTL restart "$SERVICE"
  if healthy; then
    say "Live: $name"
    rm -f "$tgz"
    # Older snapshots go; this one stays until the next deploy, in case a rollback wants it.
    find "$(dirname "$DB")" -maxdepth 1 -name 'before-*.db' ! -name "before-$name.db" -delete
    prune
    return 0
  fi
  say "$name did not come up healthy"
  if [[ -n $before && -d $ROOT/releases/$before ]]; then
    put_back_db "$snap"
    switch_to "$before"
    $SERVICE_CTL restart "$SERVICE"
    if healthy; then say "Put back: $before, with the database as it was"; else say "$before is not healthy either"; fi
  fi
  rm -rf "${ROOT:?}/releases/$name"
  exit 1
}

rollback() {
  local now before
  now=$(current)
  before=$(releases | awk -v now="$now" '$0 < now' | tail -n 1)
  [[ -n $before ]] || { say "No release before $now to roll back to"; exit 1; }
  switch_to "$before"
  $SERVICE_CTL restart "$SERVICE"
  if healthy; then
    say "Rolled back: $now to $before"
  else
    say "$before is not healthy; switching back to $now"
    switch_to "$now"
    $SERVICE_CTL restart "$SERVICE"
    exit 1
  fi
}

# Keeps the newest few releases and always the live one.
prune() {
  local live keep
  live=$(current)
  keep=$(releases | tail -n "$KEEP")
  while read -r r; do
    [[ -z $r || $r == "$live" ]] && continue
    grep -qxF "$r" <<<"$keep" || rm -rf "${ROOT:?}/releases/$r"
  done < <(releases)
}

mkdir -p "$ROOT/releases" "$ROOT/incoming"
case ${1:-} in
  activate) activate "${2:?release name}" ;;
  rollback) rollback ;;
  status)
    echo "live: $(current)"
    releases
    ;;
  *)
    say "usage: deploy.sh activate NAME | rollback | status"
    exit 2
    ;;
esac
