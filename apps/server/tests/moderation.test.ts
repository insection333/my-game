// Bad actors (session 39): a report by name for a name or for cheating, ten a day, once per target and
// reason, never of oneself, answering the same whatever happened; the admin's queue weighs reports from
// players who have played a while first, and dismissing, renaming or banning settles them; sieges between
// two lords are summed by pair for the admin, the way back beside them; and none of it outlives an account.
import type { AdminReportsResponse, AdminSiegeFlowsResponse } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players, reports, siegeFlows } from '../src/db/schema.ts';
import { noteSiege, REPORTS_A_DAY } from '../src/moderation.ts';
import { code, post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const HOUR = 3_600_000;
const report = (cookie: string, name: string, reason = 'name') => post(s, '/api/report', { name, reason }, cookie);
const queue = async (admin: string) =>
  JSON.parse((await post(s, '/api/admin/reports', '', admin)).body) as AdminReportsResponse;
const idOf = (name: string) =>
  s.ctx.db.select({ id: players.id }).from(players).where(eq(players.name, name)).get()!.id;
const list = (name: string) =>
  s.ctx.db.update(players).set({ firstActAt: 0, listedAt: s.clock.now }).where(eq(players.name, name)).run();

describe('reporting a player', () => {
  it('takes a report once per target and reason, never of yourself, and answers the same each time', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    await signUp(s, 'Birch');
    expect((await report(alder, 'Birch')).statusCode).toBe(204);
    expect((await report(alder, 'Birch')).statusCode).toBe(204);
    expect((await report(alder, 'birch', 'cheating')).statusCode).toBe(204);
    expect(
      s.ctx.db
        .select()
        .from(reports)
        .all()
        .map((r) => r.reason),
    ).toEqual(['name', 'cheating']);
    const self = await report(alder, 'Alder');
    expect([self.statusCode, code(self)]).toEqual([422, 'invalidInput']);
    expect(code(await report(alder, 'Nobody'))).toBe('notFound');
    expect(code(await post(s, '/api/report', { name: 'Birch', reason: 'rude' }, alder))).toBe('invalidInput');
    expect((await post(s, '/api/report', { name: 'Birch', reason: 'name' })).statusCode).toBe(401);
  });

  it('holds a player to ten reports a day', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    await signUp(s, 'Birch');
    for (let i = 0; i < REPORTS_A_DAY; i++) expect((await report(alder, 'Birch')).statusCode).toBe(204);
    expect((await report(alder, 'Birch')).statusCode).toBe(429);
  });
});

describe("the admin's queue", () => {
  it('weighs reports from players who have played a while first, and settles them', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Warden');
    const old = await signUp(s, 'Elder');
    const fresh1 = await signUp(s, 'Sprout');
    const fresh2 = await signUp(s, 'Seedling');
    await signUp(s, 'Rude');
    s.clock.now += HOUR;
    await signUp(s, 'Cheat');
    list('Elder');
    // Two new accounts report Rude; one player who has played a while reports Cheat.
    await report(fresh1, 'Rude');
    await report(fresh2, 'Rude');
    await report(old, 'Cheat', 'cheating');
    const before = (await queue(admin)).reported;
    expect(before.map((r) => [r.name, r.reporters, r.listedReporters])).toEqual([
      ['Cheat', 1, 1],
      ['Rude', 2, 0],
    ]);
    expect(before[1].reasons).toEqual({ name: 2, cheating: 0 });
    // Only an admin reads it.
    expect(code(await post(s, '/api/admin/reports', '', old))).toBe('notAdmin');

    // Dismissed: gone; reported again after, it is back.
    expect((await post(s, '/api/admin/reports/settle', { playerId: idOf('Cheat') }, admin)).statusCode).toBe(204);
    expect((await queue(admin)).reported.map((r) => r.name)).toEqual(['Rude']);
    await report(old, 'Cheat', 'cheating');
    expect((await queue(admin)).reported.map((r) => r.name)).toEqual(['Cheat', 'Rude']);

    // Renaming settles a name's reports; banning settles all.
    await post(s, '/api/admin/rename', { playerId: idOf('Rude'), name: 'Polite' }, admin);
    await post(s, '/api/admin/ban', { playerId: idOf('Cheat'), banned: true }, admin);
    expect((await queue(admin)).reported).toEqual([]);
  });
});

describe('sieges between lords', () => {
  it('are summed by pair for the admin, the way back beside them, from four sieges in 30 days', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Warden');
    await signUp(s, 'Main');
    await signUp(s, 'Alt');
    const [main, alt] = [idOf('Main'), idOf('Alt')];
    for (let i = 0; i < 5; i++) noteSiege(s.ctx, main, alt, s.clock.now - i * 24 * HOUR, 1_000_000, true);
    noteSiege(s.ctx, alt, main, s.clock.now, 0, false);
    // Older than 30 days: not counted.
    noteSiege(s.ctx, main, alt, s.clock.now - 31 * 24 * HOUR, 9_000_000, true);
    const { flows } = JSON.parse((await post(s, '/api/admin/siege-flows', '', admin)).body) as AdminSiegeFlowsResponse;
    expect(flows).toEqual([
      {
        attacker: { id: main, name: 'Main' },
        defender: { id: alt, name: 'Alt' },
        sieges: 5,
        breaches: 5,
        gold: 5_000_000,
        back: 1,
      },
    ]);
  });
});

describe('deleting an account', () => {
  it('takes their reports, made and received, and their sieges with it', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder', 'a long enough secret');
    const birch = await signUp(s, 'Birch');
    await report(alder, 'Birch');
    await report(birch, 'Alder', 'cheating');
    noteSiege(s.ctx, idOf('Alder'), idOf('Birch'), s.clock.now, 10, true);
    const gone = await post(s, '/api/account/delete', { password: 'a long enough secret', confirm: true }, alder);
    expect(gone.statusCode).toBeLessThan(300);
    expect(s.ctx.db.select().from(reports).all()).toEqual([]);
    expect(s.ctx.db.select().from(siegeFlows).all()).toEqual([]);
  });
});
