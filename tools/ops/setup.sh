#!/usr/bin/env bash
# Prepares a fresh Ubuntu 24.04 server for Idle Clash. Run once as root (running it again updates the
# packages, units and Caddy's settings, and keeps the deploy key):
#
#   curl -fsSL https://raw.githubusercontent.com/insection333/my-game/main/tools/ops/setup.sh | bash
#
# It installs Node 22, Caddy, SQLite, rclone and a firewall; makes the `idleclash` user (runs the game)
# and the `deploy` user (GitHub Actions signs in as it to deploy); installs the services and timers;
# and prints what to add to GitHub's secrets. The game itself arrives with the first deploy.
set -euo pipefail

REPO=${REPO:-insection333/my-game}
REF=${REF:-main}
RAW="https://raw.githubusercontent.com/$REPO/$REF/tools/ops"

[[ $(id -u) == 0 ]] || { echo "Run this as root." >&2; exit 1; }
# shellcheck source=/dev/null
. /etc/os-release
[[ $ID == ubuntu ]] || { echo "This expects Ubuntu (found $PRETTY_NAME)." >&2; exit 1; }
step() { printf '\n== %s\n' "$*"; }

step "Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl gnupg ufw fail2ban sqlite3 rclone caddy unattended-upgrades
if ! node --version 2>/dev/null | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -yq nodejs
fi
node --version

step "Memory: a 1 GB swap file, so a spike does not end the game"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

step "Firewall: SSH, HTTP and HTTPS only"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban >/dev/null

step "Users and folders"
id idleclash >/dev/null 2>&1 || useradd --system --home-dir /var/lib/idleclash --shell /usr/sbin/nologin idleclash
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
usermod -aG idleclash,systemd-journal deploy
install -d -o deploy -g deploy -m 755 /srv/idleclash /srv/idleclash/releases /srv/idleclash/incoming
install -d -o idleclash -g idleclash -m 770 /var/lib/idleclash /var/lib/idleclash/status
install -d -o deploy -g deploy -m 700 /etc/idleclash
for f in server.env backup.env; do
  [[ -f /etc/idleclash/$f ]] || install -o deploy -g deploy -m 600 /dev/null "/etc/idleclash/$f"
done
cat >/etc/sudoers.d/idleclash-deploy <<'EOF'
# The deploy user may restart the game and run the backup jobs, and nothing else as root.
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart idleclash, /usr/bin/systemctl stop idleclash, /usr/bin/systemctl start idleclash, /usr/bin/systemctl start idleclash-backup.service, /usr/bin/systemctl start idleclash-rehearse.service
EOF
chmod 440 /etc/sudoers.d/idleclash-deploy
visudo -cf /etc/sudoers.d/idleclash-deploy >/dev/null

step "Services, timers and Caddy"
for unit in idleclash.service idleclash-backup.service idleclash-backup.timer idleclash-rehearse.service \
  idleclash-rehearse.timer; do
  curl -fsSL "$RAW/systemd/$unit" -o "/etc/systemd/system/$unit"
done
curl -fsSL "$RAW/Caddyfile" -o /etc/caddy/Caddyfile
install -d -o caddy -g caddy /var/log/caddy
systemctl daemon-reload
systemctl enable idleclash.service idleclash-backup.timer idleclash-rehearse.timer >/dev/null
systemctl start idleclash-backup.timer idleclash-rehearse.timer
systemctl reload-or-restart caddy

step "The deploy key"
key_line=
if ! grep -q 'github-actions-deploy' /home/deploy/.ssh/authorized_keys 2>/dev/null; then
  install -d -o deploy -g deploy -m 700 /home/deploy/.ssh
  tmp=$(mktemp -d)
  ssh-keygen -q -t ed25519 -N '' -C github-actions-deploy -f "$tmp/key"
  echo "restrict $(cat "$tmp/key.pub")" >>/home/deploy/.ssh/authorized_keys
  chown deploy:deploy /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
  key_line=$(cat "$tmp/key")
  rm -rf "$tmp"
fi

ip=$(hostname -I | awk '{print $1}')
host_key=$(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)
cat <<EOF

== Ready. Add these in GitHub: the repository's Settings, then Secrets and variables, then Actions,
   then "New repository secret" for each.

DEPLOY_HOST
$ip

DEPLOY_KNOWN_HOSTS
$ip $host_key
EOF
if [[ -n $key_line ]]; then
  cat <<EOF

DEPLOY_SSH_KEY  (all of it, from the BEGIN line to the END line)
$key_line

This key is shown once and not kept on the server. If it is lost, remove the github-actions-deploy
line from /home/deploy/.ssh/authorized_keys and run this script again for a new one.
EOF
else
  echo
  echo "DEPLOY_SSH_KEY was made the first time this ran; it is unchanged."
fi
