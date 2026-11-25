// The console's load on the server (session 233): the Overview is made once a half minute and shared,
// however often it is read; its counts find the visits by their day rather than walking the table; the
// closed test reads its newest testers alone and once a minute; and the server's pulse measures each
// minute's answers, the console's share among them.
import { afterEach, describe, expect, it } from 'vitest';
import { OVERVIEW_MS } from '../src/admin/overview.ts';
import { Pulse } from '../src/admin/pulse.ts';
import { TESTERS } from '../src/feedback.ts';
import { ORIGIN, post, server, signUp, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
let s: TestServer;
afterEach(() => s?.close());

const read = async <T>(cookie: string, url: string, body: unknown = ''): Promise<T> => {
  const r = await post(s, url, body, cookie, { origin: ORIGIN });
  if (r.statusCode >= 300) throw new Error(`${url}: ${r.statusCode} ${r.body}`);
  return JSON.parse(r.body) as T;
};
const admin = async () => {
  const r = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, { origin: ORIGIN });
  return String(r.headers['set-cookie']).split(';')[0];
};

describe("the console's load", () => {
  it('makes the Overview once a half minute, however often it is read', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    await signUp(s, 'Rowan');
    const cookie = await admin();
    const total = async () => (await read<{ players: { total: number } }>(cookie, '/api/admin/overview')).players.total;
    expect(await total()).toBe(1);
    await signUp(s, 'Birch');
    s.clock.now += OVERVIEW_MS - 1;
    expect(await total()).toBe(1);
    s.clock.now += 1;
    expect(await total()).toBe(2);
  });

  it("finds the Overview's visits by their day, never walking the table", async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const db = s.ctx.store.sqlite;
    const asked: string[] = [];
    const prepare = db.prepare.bind(db);
    db.prepare = (sql: string) => (asked.push(sql), prepare(sql));
    await read(await admin(), '/api/admin/overview');
    db.prepare = prepare;
    const ofVisits = asked.filter((q) => /\bvisits\b/.test(q));
    expect(ofVisits.length).toBeGreaterThan(0);
    for (const q of ofVisits) {
      const plan = (db.prepare(`explain query plan ${q}`).all(...placeholders(q)) as { detail: string }[])
        .map((r) => r.detail)
        .join('; ');
      expect(plan, q).not.toMatch(/\bSCAN (visits|v)\b/);
    }
  });

  it('reads the closed test of its newest players alone, once a minute', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    for (let i = 0; i < TESTERS + 5; i++) {
      s.clock.now += 3_600_000; // past the sign-ups an address may make in an hour
      await signUp(s, `Tester${i}`);
    }
    const cookie = await admin();
    const testers = async () => (await read<{ testers: unknown[] }>(cookie, '/api/admin/test')).testers.length;
    expect(await testers()).toBe(TESTERS);
  });

  it("measures each minute's answers, and the console's share of their time", () => {
    const pulse = new Pulse();
    for (let i = 0; i < 19; i++) pulse.seen(3, false);
    pulse.seen(300, true);
    const minute = pulse.close(1000);
    expect(minute).toMatchObject({ at: 1000, p95Ms: 5, consolePct: 84 });
    expect(minute.requests).toBeGreaterThan(0);
    expect(pulse.close(2000)).toMatchObject({ requests: 0, p95Ms: 0, consolePct: 0 });
    expect(pulse.hour).toHaveLength(2);
    pulse.stop();
  });

  it("says the server's pulse and the pages open on System", async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const sys = await read<{ pulse: { hour: unknown[]; pagesOpen: number; heapMb: number } }>(
      await admin(),
      '/api/admin/system',
    );
    expect(sys.pulse).toMatchObject({ hour: [], pagesOpen: 0 });
    expect(sys.pulse.heapMb).toBeGreaterThan(0);
  });
});

/** Values for a statement's placeholders, named or not, so its plan can be asked for. */
function placeholders(q: string): unknown[] {
  const named = [...q.matchAll(/@(\w+)/g)].map((m) => m[1]);
  if (named.length) return [Object.fromEntries(named.map((n) => [n, '2026-01-01']))];
  return Array.from({ length: (q.match(/\?/g) ?? []).length }, () => 0);
}
