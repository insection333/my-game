// The nightly backup and the monthly restore rehearsal, against a real game database and an rclone
// remote that is a local folder (on the server it is Cloudflare R2). A backup lands off the database's
// folder, compressed and whole; the rehearsal restores it and runs a server on it; a damaged backup
// fails the rehearsal; old backups are pruned to the newest nights and the first of each month.
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../../apps/server/src/app.ts';
import { configFromEnv } from '../../../apps/server/src/config.ts';
import { freePort } from './ports.ts';

const OPS = join(import.meta.dirname, '..');
let dir: string;
let env: NodeJS.ProcessEnv;
const bucket = () => join(dir, 'bucket');
const run = (script: string) => spawnSync('bash', [join(OPS, script)], { env, encoding: 'utf8' });
const backups = () => readdirSync(bucket()).sort();

/** A game database with two players in it, made by the server itself. */
async function gameDb(path: string) {
  const { app, close } = await buildApp({ ...configFromEnv({}), dbPath: path, log: false });
  for (const name of ['Alder', 'Birch'])
    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:3000', 'x-forwarded-for': name },
      payload: JSON.stringify({ name, password: 'a long enough secret', ageConfirmed: true }),
    });
  await close();
}

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'ic-backup-'));
  mkdirSync(bucket());
  env = {
    ...process.env,
    DB: join(dir, 'live', 'game.db'),
    STATUS_DIR: join(dir, 'status'),
    RCLONE_CONFIG_LOCAL_TYPE: 'local',
    BACKUP_REMOTE: `local:${bucket()}`,
    REHEARSE_PORT: String(await freePort()),
  };
  mkdirSync(join(dir, 'live'));
  await gameDb(env.DB!);
});

describe('backups', { timeout: 60_000 }, () => {
  it('sends a whole, compressed copy off the server, and the rehearsal restores and runs it', () => {
    const b = run('backup.sh');
    expect(b.stderr).toBe('');
    expect(b.status).toBe(0);
    expect(backups()).toEqual([expect.stringMatching(/^idleclash-\d{8}-\d{6}\.db\.gz$/)]);
    expect(existsSync(join(dir, 'status', 'backup'))).toBe(true);
    const r = run('rehearse.sh');
    expect(r.stderr).toBe('');
    expect(r.stdout).toMatch(/^Restored idleclash-.*: 2 players, every one with a save; a server ran on it/);
    expect(existsSync(join(dir, 'status', 'restore'))).toBe(true);
  });

  it('restores a backup in place of the live database, setting the replaced one aside', async () => {
    expect(run('backup.sh').status).toBe(0);
    // Something goes wrong after the backup: a table of the live database is lost.
    execFileSync('sqlite3', [env.DB!, 'delete from players']);
    const port = await freePort();
    // The stand-in for systemctl runs the game from this checkout, as the live release would.
    const ctl = join(dir, 'ctl.sh');
    writeFileSync(
      ctl,
      `#!/usr/bin/env bash
pid="${dir}/server.pid"
case $1 in
  stop) [[ -f $pid ]] && kill "$(cat "$pid")" 2>/dev/null; rm -f "$pid"; sleep 0.2 ;;
  start) (cd "${join(OPS, '..', '..')}" && PORT=${port} DB_PATH="${env.DB}" LOG=false exec node apps/server/src/main.ts) >/dev/null 2>&1 & echo $! >"$pid" ;;
esac
`,
    );
    chmodSync(ctl, 0o755);
    const r = spawnSync('bash', [join(OPS, 'restore.sh'), 'newest'], {
      env: { ...env, SERVICE_CTL: ctl, HEALTH_URL: `http://127.0.0.1:${port}/api/health` },
      encoding: 'utf8',
    });
    spawnSync(ctl, ['stop']);
    expect(r.stderr).toBe('');
    expect(r.stdout).toMatch(/^Restored idleclash-\d{8}-\d{6}\.db\.gz; the database it replaced is at /);
    expect(execFileSync('sqlite3', [env.DB!, 'select name from players order by name'], { encoding: 'utf8' })).toBe(
      'Alder\nBirch\n',
    );
    expect(readdirSync(join(dir, 'live')).some((f) => f.startsWith('game.db.replaced-'))).toBe(true);
  });

  it('fails the rehearsal on a damaged backup, and does not mark it done', () => {
    run('backup.sh');
    writeFileSync(join(bucket(), 'idleclash-29991231-000000.db.gz'), gzipSync(Buffer.from('not a database')));
    const r = run('rehearse.sh');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('idleclash-29991231-000000.db.gz failed its integrity check');
    expect(existsSync(join(dir, 'status', 'restore'))).toBe(false);
  });

  it('keeps the newest 30 nights and the first backup of each of the last 12 months', () => {
    // Fourteen months of nightly backups from 2024, made up, then tonight's real one.
    const start = Date.UTC(2024, 0, 1);
    const days = Array.from({ length: 425 }, (_, d) =>
      new Date(start + d * 86_400_000).toISOString().slice(0, 10).replaceAll('-', ''),
    );
    for (const day of days) writeFileSync(join(bucket(), `idleclash-${day}-172000.db.gz`), '');
    writeFileSync(join(bucket(), 'notes.txt'), 'not a backup: left alone');
    expect(run('backup.sh').status).toBe(0);
    const kept = backups();
    expect(kept).toContain('notes.txt');
    const name = (day: string) => `idleclash-${day}-172000.db.gz`;
    // The newest 30: tonight's and the last 29 made-up nights (to 28 February 2025).
    for (const day of days.slice(-29)) expect(kept).toContain(name(day));
    expect(kept).not.toContain(name(days.at(-30)!));
    // The first of each of the last 12 months: tonight's month, then February 2025 back to April 2024.
    for (const m of ['202404', '202405', '202412', '202501']) expect(kept).toContain(name(`${m}01`));
    expect(kept).not.toContain(name('20240301'));
    expect(kept.filter((f) => f.startsWith('idleclash-'))).toHaveLength(30 + 10);
  });
});
