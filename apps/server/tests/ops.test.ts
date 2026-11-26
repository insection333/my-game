// Operations: the health answer the deploy and the outside uptime check read. It says the server is
// up and its database answers, and whether the nightly backup and the monthly restore rehearsal are
// recent, from the files each touches when it succeeds.
import { mkdtempSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BACKUP_FRESH_MS, DISK_LOW_BYTES, diskFree, RESTORE_FRESH_MS } from '../src/ops/status.ts';
import { server, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const health = async () => JSON.parse((await s.app.inject({ method: 'GET', url: '/api/health' })).body) as unknown;
const touch = (dir: string, name: string, at: number) => {
  writeFileSync(join(dir, name), '');
  utimesSync(join(dir, name), at / 1000, at / 1000);
};

describe('the health answer', () => {
  // Session 273: SQLite reads on a full disk, so `select 1` said all was well while no press could be written.
  it("fails while the database's disk is nearly full", async () => {
    let free = DISK_LOW_BYTES + 1;
    s = await server({ diskFree: () => free });
    expect((await s.app.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(200);
    free = DISK_LOW_BYTES - 1;
    const r = await s.app.inject({ method: 'GET', url: '/api/health' });
    expect(r.statusCode).toBe(503);
    expect(r.body).not.toContain('"backups":"fresh"');
  });

  it("reads the free space of the database's own disk", () => {
    const dir = mkdtempSync(join(tmpdir(), 'ic-disk-'));
    expect(diskFree(join(dir, 'game.db'))).toBeGreaterThan(0);
    expect(diskFree(':memory:')).toBeNull();
  });

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
