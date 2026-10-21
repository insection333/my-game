// Operations: the health answer the deploy and the outside uptime check read. It says the server is
// up and its database answers, and whether the nightly backup and the monthly restore rehearsal are
// recent, from the files each touches when it succeeds.
import { mkdtempSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BACKUP_FRESH_MS, RESTORE_FRESH_MS } from '../src/ops/status.ts';
import { server, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const health = async () => JSON.parse((await s.app.inject({ method: 'GET', url: '/api/health' })).body) as unknown;
const touch = (dir: string, name: string, at: number) => {
  writeFileSync(join(dir, name), '');
  utimesSync(join(dir, name), at / 1000, at / 1000);
};

describe('the health answer', () => {
  it('says backups are off where none are kept', async () => {
    s = await server();
    expect(await health()).toEqual({ ok: true, backups: 'off' });
  });

  it('says backups are fresh only while both the nightly backup and the rehearsal are recent', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ic-status-'));
    s = await server({ backupStatusDir: dir });
    const now = s.clock.now;
    expect(await health()).toEqual({ ok: true, backups: 'stale' });
    touch(dir, 'backup', now - 3_600_000);
    expect(await health()).toMatchObject({ backups: 'stale' });
    touch(dir, 'restore', now - 20 * 86_400_000);
    expect(await health()).toMatchObject({ backups: 'fresh' });
    touch(dir, 'backup', now - BACKUP_FRESH_MS - 60_000);
    expect(await health()).toMatchObject({ backups: 'stale' });
    touch(dir, 'backup', now);
    touch(dir, 'restore', now - RESTORE_FRESH_MS - 60_000);
    expect(await health()).toMatchObject({ backups: 'stale' });
  });

  it('fails when the database does not answer', async () => {
    s = await server();
    s.ctx.store.sqlite.close();
    expect((await s.app.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(500);
  });
});
