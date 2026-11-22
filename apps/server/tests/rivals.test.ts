// Rivals (session 173): with five to fifteen friends on the ladders, the bands of places a climb is said by
// (the top 100, 50, 10, 3) fire once and fall silent, and nothing told a player a friend had passed them.
// Now the one passed hears of it in their tray, on a ladder they climb (they gained on it within a week),
// once a day for each who passes them there; and each ladder answers who stands just above and below.
import { XP_TABLE } from '@idle-clash/content';
import type { GameEvent, State } from '@idle-clash/kernel';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players } from '../src/db/schema.ts';
import { server, signUp, T0, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const DAY = 86_400_000;
const idOf = async (cookie: string) =>
  (
    JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
      player: { id: string };
    }
  ).player.id;

/** Lists the player, then records their save with this much Woodcutting XP at `at`, as a write does. */
const record = (id: string, xp: number, at: number) => {
  s.ctx.db.update(players).set({ firstActAt: 0, listedAt: 0 }).where(eq(players.id, id)).run();
  const saved = s.ctx.store.read(id, s.clock.now)!;
  const state: State = { ...saved.doc.state, skills: { woodcutting: { xp } } };
  s.ctx.store.write(id, { ...saved.doc, state }, saved.rev, s.clock.now);
  s.ctx.hiscores.update(id, state, at);
};
const passings = (id: string) =>
  s.ctx.notices
    .list(id)
    .filter((e): e is Extract<GameEvent, { type: 'passedBy' }> => e.type === 'passedBy')
    .map((e) => [e.skill, e.foe, e.place]);

describe('rivals', () => {
  it('tells a climbing player who passed them, once a day, and not one who has stopped climbing', async () => {
    s = await server();
    const alder = await idOf(await signUp(s, 'Alder'));
    const birch = await idOf(await signUp(s, 'Birch'));
    const cedar = await idOf(await signUp(s, 'Cedar'));
    record(alder, XP_TABLE[30], T0);
    record(birch, XP_TABLE[20], T0);
    record(cedar, XP_TABLE[10], T0);
    // Cedar passes Birch (who gained today) on Woodcutting and Total.
    record(cedar, XP_TABLE[25], T0 + 1000);
    expect(passings(birch)).toEqual([
      ['total', 'Cedar', 3],
      ['woodcutting', 'Cedar', 3],
    ]);
    expect(passings(alder)).toEqual([]);
    // Birch back above, Cedar past again the same day: not said twice.
    record(birch, XP_TABLE[27], T0 + 2000);
    record(cedar, XP_TABLE[28], T0 + 3000);
    expect(passings(birch)).toHaveLength(2);
    // Alder has not gained in over a week: passed, they hear nothing.
    s.clock.now = T0 + 9 * DAY;
    record(cedar, XP_TABLE[31], T0 + 9 * DAY);
    expect(passings(alder)).toEqual([]);
    // The next day, Birch gaining again, a passing is said again.
    record(birch, XP_TABLE[32], T0 + 10 * DAY);
    record(cedar, XP_TABLE[33], T0 + 10 * DAY + 1000);
    expect(passings(birch).length).toBeGreaterThan(2);
  });

  it('answers who stands just above and below on each ladder', async () => {
    s = await server();
    const alder = await idOf(await signUp(s, 'Alder'));
    const birch = await idOf(await signUp(s, 'Birch'));
    const cedar = await idOf(await signUp(s, 'Cedar'));
    record(alder, XP_TABLE[30], T0);
    record(birch, XP_TABLE[20], T0);
    record(cedar, XP_TABLE[10], T0);
    const near = s.ctx.hiscores.ladder('woodcutting', birch).near!;
    expect(near.above?.name).toBe('Alder');
    expect(near.above?.rank).toBe(1);
    expect(near.below?.name).toBe('Cedar');
    expect(near.below?.rank).toBe(3);
    expect(s.ctx.hiscores.ladder('woodcutting', alder).near?.above).toBeNull();
  });
});
