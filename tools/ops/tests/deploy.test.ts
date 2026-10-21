// The deploy script on a folder of its own: a stand-in for systemd starts and stops small releases
// that answer the health check (or do not). A healthy release goes live; one that is not is replaced
// by the one before it, with the database as it was before the switch; a rollback restores the
// previous code and keeps the data; old releases are pruned.
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { freePort } from './ports.ts';

const DEPLOY = join(import.meta.dirname, '..', 'deploy.sh');
let dir: string;
let env: NodeJS.ProcessEnv;

/** A release: a tiny server that answers the health check, or one that changes the data and dies. */
function release(name: string, kind: 'good' | 'bad' | 'writes') {
  const src = join(dir, 'src', name);
  mkdirSync(src, { recursive: true });
  const write = `require('node:child_process').execFileSync('sqlite3', [process.env.DB, "insert into notes values ('${name}')"]);`;
  const body =
    kind === 'bad'
      ? `${write} process.exit(1);`
      : `${kind === 'writes' ? write : ''}
         require('node:http').createServer((q, r) => r.end('{"ok":true}')).listen(Number(process.env.PORT), '127.0.0.1');`;
  writeFileSync(join(src, 'server.cjs'), body);
  mkdirSync(join(dir, 'root', 'incoming'), { recursive: true });
  execFileSync('tar', ['-czf', join(dir, 'root', 'incoming', `${name}.tgz`), '-C', src, '.']);
}

const deploy = (...args: string[]) => spawnSync('bash', [DEPLOY, ...args], { env, encoding: 'utf8' });
const live = () => basename(readlinkSync(join(dir, 'root', 'current')));
const notes = () => execFileSync('sqlite3', [env.DB!, 'select name from notes order by rowid'], { encoding: 'utf8' });

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'ic-deploy-'));
  const port = await freePort();
  // The stand-in for systemctl: restart and start run the live release's server; stop ends it.
  const ctl = join(dir, 'ctl.sh');
  writeFileSync(
    ctl,
    `#!/usr/bin/env bash
pid="${dir}/server.pid"
stop() { [[ -f $pid ]] && kill "$(cat "$pid")" 2>/dev/null; rm -f "$pid"; sleep 0.2; }
case $1 in
  stop) stop ;;
  start|restart) stop; (cd "${dir}/root/current" && exec node server.cjs) >/dev/null 2>&1 & echo $! >"$pid" ;;
esac
`,
  );
  chmodSync(ctl, 0o755);
  env = {
    ...process.env,
    ROOT: join(dir, 'root'),
    DB: join(dir, 'game.db'),
    SERVICE_CTL: ctl,
    PORT: String(port),
    HEALTH_URL: `http://127.0.0.1:${port}/api/health`,
    HEALTH_TRIES: '6',
    HEALTH_SETTLE: '0.4',
  };
  execFileSync('sqlite3', [env.DB!, "create table notes (name text); insert into notes values ('first')"]);
});

afterEach(() => {
  spawnSync(env.SERVICE_CTL!, ['stop']);
});

describe('deploying', { timeout: 60_000 }, () => {
  it('puts a healthy release live', () => {
    release('20261021-0100-aaa', 'good');
    const r = deploy('activate', '20261021-0100-aaa');
    expect(r.stderr).toContain('Live: 20261021-0100-aaa');
    expect(r.status).toBe(0);
    expect(live()).toBe('20261021-0100-aaa');
    expect(existsSync(join(dir, 'root', 'incoming', '20261021-0100-aaa.tgz'))).toBe(false);
  });

  it('puts back the release before, and the data as it was, when the new one is not healthy', () => {
    release('20261021-0100-aaa', 'good');
    deploy('activate', '20261021-0100-aaa');
    release('20261021-0200-bbb', 'bad');
    const r = deploy('activate', '20261021-0200-bbb');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('Put back: 20261021-0100-aaa, with the database as it was');
    expect(live()).toBe('20261021-0100-aaa');
    expect(notes()).toBe('first\n');
    expect(readdirSync(join(dir, 'root', 'releases'))).toEqual(['20261021-0100-aaa']);
  });

  it('rolls back the code and keeps what players did since', () => {
    release('20261021-0100-aaa', 'good');
    deploy('activate', '20261021-0100-aaa');
    release('20261021-0200-bbb', 'writes');
    deploy('activate', '20261021-0200-bbb');
    expect(live()).toBe('20261021-0200-bbb');
    const r = deploy('rollback');
    expect(r.stderr).toContain('Rolled back: 20261021-0200-bbb to 20261021-0100-aaa');
    expect(live()).toBe('20261021-0100-aaa');
    expect(notes()).toBe('first\n20261021-0200-bbb\n');
  });

  it('keeps the newest five releases', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      release(`20261021-0${n}00-r${n}`, 'good');
      expect(deploy('activate', `20261021-0${n}00-r${n}`).status).toBe(0);
    }
    expect(readdirSync(join(dir, 'root', 'releases')).sort()).toEqual(
      [3, 4, 5, 6, 7].map((n) => `20261021-0${n}00-r${n}`),
    );
  });

  it('refuses a name that is not a release name', () => {
    expect(deploy('activate', '../../etc').status).toBe(2);
  });
});
