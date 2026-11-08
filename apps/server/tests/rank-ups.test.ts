// Rank-ups (session 49): a listed player who climbs into a better band of places on a ladder (the top
// 100, 50, 10, 3, or 1st) is told so at once, and the telling is kept with their notices. Their first
// place is not a climb, and a band once reached is not said again after falling out of it and back.
import { XP_TABLE } from '@idle-clash/content';
import type { GameEvent, State } from '@idle-clash/kernel';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players } from '../src/db/schema.ts';
import { bandOf, climb } from '../src/game/rank-ups.ts';
import { server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

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
const rankUps = (id: string) =>
  s.ctx.notices
    .list(id)
    .filter((e): e is Extract<GameEvent, { type: 'rankUp' }> => e.type === 'rankUp')
    .map((e) => [e.skill, e.place]);

describe('rank-ups', () => {
  it('names the bands of places', () => {
    expect([1, 2, 3, 4, 10, 11, 50, 100, 101].map(bandOf)).toEqual([1, 3, 3, 10, 10, 50, 50, 100, null]);
    expect(climb(null, 7)).toEqual({ keep: 10, said: false });
    expect(climb(null, 500)).toEqual({ keep: 0, said: false });
    expect(climb(0, 100)).toEqual({ keep: 100, said: true });
    expect(climb(10, 9)).toEqual({ keep: 10, said: false });
    expect(climb(10, 3)).toEqual({ keep: 3, said: true });
    expect(climb(3, 40)).toEqual({ keep: 3, said: false });
  });

  it('tells a player who climbs into a better band, and only then', async () => {
    s = await server();
    const alder = await idOf(await signUp(s, 'Alder'));
    const birch = await idOf(await signUp(s, 'Birch'));
    const heard: [string, GameEvent[]][] = [];
    const say = s.ctx.hiscores.onRankUp;
    s.ctx.hiscores.onRankUp = (id, events) => {
      heard.push([id, events]);
      say(id, events);
    };
    record(alder, XP_TABLE[30], 1);
    // Birch's first place is second: where he starts, not a climb.
    record(birch, XP_TABLE[20], 2);
    expect(rankUps(birch)).toEqual([]);
    // Passing Alder puts him first, on Woodcutting and on Total alike.
    record(birch, XP_TABLE[40], 3);
    expect(rankUps(birch)).toEqual([
      ['total', 1],
      ['woodcutting', 1],
    ]);
    expect(heard).toEqual([
      [
        birch,
        [
          { type: 'rankUp', at: 3, skill: 'woodcutting', place: 1, band: 1 },
          { type: 'rankUp', at: 3, skill: 'total', place: 1, band: 1 },
        ],
      ],
    ]);
    // Alder takes first back: his first place since being listed, so nothing is said to him.
    record(alder, XP_TABLE[50], 4);
    expect(rankUps(alder)).toEqual([]);
    // Birch takes it back again: first was reached before, so it is not said twice.
    record(birch, XP_TABLE[60], 5);
    expect(rankUps(birch)).toHaveLength(2);
    // A write that changes nothing on the ladder says nothing either.
    record(birch, XP_TABLE[60], 6);
    expect(heard).toHaveLength(1);
  });

  it('keeps the band reached across a restart', async () => {
    s = await server();
    const alder = await idOf(await signUp(s, 'Alder'));
    const birch = await idOf(await signUp(s, 'Birch'));
    record(alder, XP_TABLE[30], 1);
    record(birch, XP_TABLE[20], 2);
    // The server's memory goes (a restart); Birch's band, the top three, is read back from the table,
    // so climbing to first is still a climb.
    s.ctx.hiscores.forget();
    (s.ctx.hiscores as unknown as { rows: Map<string, unknown> }).rows.clear();
    record(birch, XP_TABLE[40], 3);
    expect(rankUps(birch)).toHaveLength(2);
  });
});
