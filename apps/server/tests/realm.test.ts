// The realm's boss of the week on the server (session 174): strikes counted from the saves' own events in
// the week they were fought; the week needs three for each player who struck it the week before, four at
// least (session 198: four for each who merely played, eight at least, left a realm of one unable to fell it
// and a realm whose friends drifted off asking more strikes than its players could give); when it has enough, the boss falls and everyone who struck hears at once; their saves are told the
// share they may take (this week or next), and the week's ladder ranks strikes, ties to whoever struck first.
import type { GameEvent } from '@idle-clash/kernel';
import { weekOf } from '@idle-clash/features';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players, visits } from '../src/db/schema.ts';
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
const strike = (id: string, at: number): GameEvent => ({
  type: 'realmFought',
  at,
  boss: 'troll-chief',
  won: true,
  gold: 5,
  marks: 2,
});

describe("the realm's boss on the server", () => {
  it('needs three strikes a player who struck last week, falls with enough, and owes each striker a share', async () => {
    s = await server();
    const ids = [
      await idOf(await signUp(s, 'Alder')),
      await idOf(await signUp(s, 'Birch')),
      await idOf(await signUp(s, 'Cedar')),
    ];
    for (const id of ids) s.ctx.db.update(players).set({ listedAt: 0, firstActAt: 0 }).where(eq(players.id, id)).run();
    // Three struck last week, and two more only played: nine strikes this week.
    const week = weekOf(T0);
    const lastWeekDay = new Date(Date.parse(`${week}T00:00:00Z`) - 3 * DAY).toISOString().slice(0, 10);
    for (const id of ids) s.ctx.realm.heard(id, [strike(id, Date.parse(`${lastWeekDay}T12:00:00Z`))]);
    for (const name of ['Dogwood', 'Elm']) {
      const id = await idOf(await signUp(s, name));
      s.ctx.db.insert(visits).values({ playerId: id, day: lastWeekDay }).onConflictDoNothing().run();
    }
    const fell: [string, GameEvent[]][] = [];
    s.ctx.realm.onFell = (id, events) => void fell.push([id, events]);
    const standing = (id: string) => s.ctx.realm.standing(id, T0, null);
    expect(standing(ids[0])).toMatchObject({ week, needed: 9, strikes: 0, mine: 0, fell: false, owed: null });
    // Alder and Birch strike; Cedar never does.
    for (let d = 0; d < 5; d++) {
      s.ctx.realm.heard(ids[0], [strike(ids[0], T0 + d * 3_600_000)]);
      s.ctx.realm.heard(ids[1], [strike(ids[1], T0 + d * 3_600_000 + 1)]);
    }
    expect(fell.map(([id]) => id).sort()).toEqual([ids[0], ids[1]].sort());
    // It fell at the ninth strike: Alder's fifth, Birch with four.
    expect(fell[0][1][0]).toMatchObject({ type: 'realmFell', week });
    expect(fell.map(([, e]) => (e[0] as { strikes: number }).strikes).sort()).toEqual([4, 5]);
    expect(standing(ids[0])).toMatchObject({ strikes: 10, mine: 5, fell: true, owed: { week } });
    expect(standing(ids[2]).owed).toBeNull();
    // Taken: owed no more; and a strike after it fell does not make it fall again.
    expect(s.ctx.realm.standing(ids[0], T0, week).owed).toBeNull();
    s.ctx.realm.heard(ids[2], [strike(ids[2], T0 + 8 * 3_600_000)]);
    expect(fell).toHaveLength(2);
    // Next week, last week's share is still owed to one who has not taken it.
    expect(s.ctx.realm.standing(ids[1], T0 + 7 * DAY, null).owed).toEqual({ week, boss: 'troll-chief' });
    const ladder = s.ctx.realm.ladder(ids[2], T0);
    expect(ladder.rows.map((r) => [r.name, r.xp])).toEqual([
      ['Alder', 5],
      ['Birch', 5],
      ['Cedar', 1],
    ]);
    expect(ladder.you?.rank).toBe(3);
  });

  it('asks four at least, so a realm of one can fell it in a week', async () => {
    s = await server();
    const id = await idOf(await signUp(s, 'Alder'));
    expect(s.ctx.realm.standing(id, T0, null).needed).toBe(4);
    s.ctx.realm.heard(id, [strike(id, T0)]);
    expect(s.ctx.realm.standing(id, T0 + 7 * DAY, null).needed).toBe(4);
  });

  it("owes each fallen week once, last week's before this week's, however the shares are taken", async () => {
    s = await server();
    const id = await idOf(await signUp(s, 'Alder'));
    s.ctx.db.update(players).set({ listedAt: 0, firstActAt: 0 }).where(eq(players.id, id)).run();
    const lastWeek = T0 - 7 * DAY;
    // The boss falls with this player's strikes last week and again this week.
    for (let i = 0; i < 8; i++) s.ctx.realm.heard(id, [strike(id, lastWeek + i * 60_000)]);
    for (let i = 0; i < 8; i++) s.ctx.realm.heard(id, [strike(id, T0 + i * 60_000)]);
    const last = weekOf(lastWeek);
    const week = weekOf(T0);
    // Last week's first; once it is taken, this week's; once that is taken, nothing, whichever was last.
    expect(s.ctx.realm.standing(id, T0, null).owed?.week).toBe(last);
    expect(s.ctx.realm.standing(id, T0, last).owed?.week).toBe(week);
    expect(s.ctx.realm.standing(id, T0, week).owed).toBeNull();
  });
});
