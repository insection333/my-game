# Running Idle Clash

How the live game at idleclash.com is set up, deployed, backed up and restored. Everything here is in
`tools/ops/` and `.github/workflows/deploy.yml`; the tests in `tools/ops/tests/` run each script on a
folder of its own.

## The server

One VentraIP VPS (2 cores, 2 GB, Ubuntu 24.04) with:

| Part | Where |
| --- | --- |
| The game (Node 22) | `idleclash.service`, running as the `idleclash` user from `/srv/idleclash/current`, listening on 127.0.0.1:3000 |
| HTTPS | Caddy (`/etc/caddy/Caddyfile`): certificates fetched and renewed itself; `www.` redirects to `idleclash.com` |
| The database | `/var/lib/idleclash/idle-clash.db` (SQLite) |
| Settings | `/etc/idleclash/server.env` and `backup.env`, written by each deploy from GitHub's secrets |
| Releases | `/srv/idleclash/releases/<time>-<commit>`, the newest five; `current` points at the live one |
| Logs | `journalctl -u idleclash` (the game), `/var/log/caddy/idleclash.log` (requests) |
| Firewall | ufw: SSH, HTTP and HTTPS only; fail2ban on SSH |

**Setting up a new server.** On a fresh Ubuntu 24.04 VPS, signed in as root:

```sh
curl -fsSL https://raw.githubusercontent.com/insection333/my-game/main/tools/ops/setup.sh | bash
```

It prints three values for GitHub's secrets (repository Settings, Secrets and variables, Actions):
`DEPLOY_HOST`, `DEPLOY_KNOWN_HOSTS` and `DEPLOY_SSH_KEY` (shown once). The deploy also reads
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` (the Cloudflare R2 token for the
`idleclash-backups` bucket), and the variables `ADMIN_NAMES` and `INVITES` (`true` while the closed
test runs: signing up then takes an invite made on the admin page; see `docs/CLOSED_TEST.md`). Point `idleclash.com` and
`www.idleclash.com` (A records) at the server, then run the deploy.

## Deploying

Every commit on `main` whose verify passes is deployed (`deploy.yml`): GitHub Actions packs a release
(`tools/ops/pack.sh`: the server's sources, its production dependencies and the built page, about
20 MB), copies it to the server and runs `tools/ops/deploy.sh activate`. That unpacks it, snapshots the
database, switches `current`, restarts the game and asks its health check twice. If the new release
is not healthy, the server puts back the release before it and the database as it was just before the
switch, and the run fails (GitHub emails the owner).

By hand, from GitHub: Actions, **deploy**, Run workflow, then choose:

| Action | Does |
| --- | --- |
| deploy | Deploys `main` again |
| rollback | Switches to the release before the live one. The code only: the database stays, so no one loses progress (the migrations so far only add tables and columns, so older code runs on a newer database) |
| backup | Runs the nightly backup now |
| rehearse | Runs the restore rehearsal now |

## Backups

- **Nightly** (`idleclash-backup.timer`, 17:20 UTC): SQLite's online backup of the live database,
  checked, compressed and sent to Cloudflare R2 (`tools/ops/backup.sh`). Kept: the newest 30 nights and
  the first backup of each of the last 12 months.
- **Rehearsed monthly** (`idleclash-rehearse.timer`, on the 1st): the newest backup is downloaded,
  checked, and a second game server is started on it; every player in it must have a save
  (`tools/ops/rehearse.sh`).
- **Watched**: each touches `/var/lib/idleclash/status/backup` or `restore` when it succeeds, and the
  health answer (`/api/health`) says `"backups":"fresh"` only while the backup is under 26 hours old and
  the rehearsal under 35 days. The uptime check alerts when it says anything else.

**Restoring for real** (the database is lost or damaged). Signed in to the server as root:

```sh
sudo bash -c 'set -a; . /etc/idleclash/backup.env; /srv/idleclash/current/tools/ops/restore.sh newest'
```

Or name a backup instead of `newest` (`rclone lsf r2:idleclash-backups` lists them, with the same
settings loaded). It checks the backup, stops the game, sets the current database aside as
`idle-clash.db.replaced-<time>` (never deleted), puts the backup in its place and starts the game.
Progress since that backup is lost, so restore only when the live database cannot be used.

## Watching

- **UptimeRobot**: a keyword monitor on `https://idleclash.com/api/health` every 5 minutes, alerting
  when the keyword `"backups":"fresh"` is missing. It catches the site being down, HTTPS failing, the
  database not answering, and backups or rehearsals that stopped.
- **Browser errors** reach the server's log (`journalctl -u idleclash | grep "browser error"`).
- **GitHub** emails the owner when a deploy fails.

## Capacity

`pnpm load` starts the real server on one core (half the live server), signs 500 players up and keeps
them online for 3 minutes, each with the live channel open and playing at a person's pace. On
21 October 2026: 40 requests a second, p95 17 ms for a change, 10 ms for reading the game and 26 ms
for the hiscores, no errors, 20% of one core and 200 MB of memory. With 1,500 players: 113 requests a
second, p95 60 ms, 51% of one core, 243 MB.
