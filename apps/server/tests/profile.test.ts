// A player's profile card (session 44): anyone signed in may look up anyone not banned, by name in any
// case, and sees their look, title, career and castle; their own card says so; a lord's war record counts
// every report ever written though reports keep only twenty; and it goes with the account.
import type { Profile } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { tallyOf } from '../src/castle/record.ts';
import { CastleStore } from '../src/castle/store.ts';
import { castleRecords, players } from '../src/db/schema.ts';
import { code, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const card = async (cookie: string, name: string) => {
  const r = await post(s, '/api/profile', { name }, cookie);
  return { status: r.statusCode, body: r.statusCode === 200 ? (JSON.parse(r.body) as Profile) : null, r };
};
const idOf = (name: string) =>
  s.ctx.db.select({ id: players.id }).from(players).where(eq(players.name, name)).get()!.id;

describe('a profile card', () => {
  it("shows another player's look, title and career, by their name in any case", async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    await signUp(s, 'Birch');
    const c = await card(alder, 'birch');
    expect(c.status).toBe(200);
    expect(c.body).toMatchObject({
      name: 'Birch',
      you: false,
      title: null,
      look: { picture: 'forester', frame: null, glow: null, badge: null, scene: 'march' },
      castle: null,
    });
    expect(c.body!.career.totalLevel).toBeGreaterThan(0);
    expect(c.body!.career.deedsAll).toBeGreaterThan(200);
    expect((await card(alder, 'Alder')).body!.you).toBe(true);
  });

  it('knows no one by a name that is not a player, or a banned player', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    await signUp(s, 'Birch');
    const missing = await card(alder, 'Nobody');
    expect([missing.status, code(missing.r)]).toEqual([404, 'notFound']);
    s.ctx.db.update(players).set({ bannedAt: s.clock.now }).where(eq(players.name, 'Birch')).run();
    s.clock.now += 61_000;
    expect((await card(alder, 'Birch')).status).toBe(404);
  });
});

describe("a lord's war record", () => {
  it('counts each kind of report by how it went', () => {
    expect(tallyOf('siegeOut', { outcome: 'decisive' })).toBe('siegesWon');
    expect(tallyOf('siegeOut', { outcome: 'repelled' })).toBe('siegesLost');
    expect(tallyOf('siegeIn', { outcome: 'repelled' })).toBe('defencesHeld');
    expect(tallyOf('siegeIn', { outcome: 'graze' })).toBe('defencesLost');
    expect(tallyOf('mercenary', { outcome: 'graze' })).toBe('strongholdsTaken');
    expect(tallyOf('spyOut', { success: true })).toBe('spiesDone');
    expect(tallyOf('spyOut', { success: false })).toBe('spiesCaught');
    expect(tallyOf('spyIn', {})).toBe('spiesStopped');
    expect(tallyOf('incursion', { won: true })).toBeNull();
  });

  it('keeps counting past the twenty reports a castle keeps, and goes with the account', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const id = idOf('Alder');
    const castles = new CastleStore(s.ctx);
    for (let i = 0; i < 25; i++)
      castles.log(id, s.clock.now + i, 'siegeOut', { outcome: i < 18 ? 'graze' : 'repelled' });
    const row = s.ctx.db.select().from(castleRecords).where(eq(castleRecords.userId, id)).get()!;
    expect([row.siegesWon, row.siegesLost]).toEqual([18, 7]);
    expect(castles.logs(id)).toHaveLength(20);
    await post(s, '/api/account/delete', { password: 'a long enough secret', confirm: true }, alder);
    expect(s.ctx.db.select().from(castleRecords).where(eq(castleRecords.userId, id)).get()).toBeUndefined();
  });
});
