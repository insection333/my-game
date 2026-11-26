// Session 254: cheers and a gift. A cheer is one press on a friend's card for what they did this week, three a
// day and one a friend; a gift is a supply cache once a day, which the friend opens as one of their own:
// refused from an account under a week old, between accounts made the same week, and past three a day to one
// player. A block either way stops both, and a deleted account's go.
import type { Profile } from '@idle-clash/contracts';
import type { GameEvent, State } from '@idle-clash/kernel';
import { afterEach, describe, expect, it } from 'vitest';
import { erase } from '../src/auth/account.ts';
import { code, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const DAY = 86_400_000;
const idOf = async (cookie: string) =>
  (
    JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
      player: { id: string };
    }
  ).player.id;
const card = async (name: string, cookie: string) =>
  JSON.parse((await post(s, '/api/profile', { name }, cookie)).body) as Profile;
const game = async (cookie: string) =>
  (JSON.parse((await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } })).body) as { state: State })
    .state;
const climbed = (id: string) =>
  s.ctx.notices.add(id, [{ type: 'rankUp', at: s.clock.now, skill: 'woodcutting', place: 3, band: 3 }]);
const heard = (id: string, type: GameEvent['type']) => s.ctx.notices.list(id).filter((e) => e.type === type);

describe('a cheer', () => {
  it('is for what a friend did this week, three a day and one a friend, said to them', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const friends = ['Birch', 'Cedar', 'Damson', 'Elder'];
    const ids = await Promise.all(friends.map(async (n) => idOf(await signUp(s, n))));
    // Nothing to cheer yet: nothing offered, and the press refused.
    expect((await card('Birch', alder)).social).toMatchObject({ cheer: null, cheerState: 'open' });
    expect(code(await post(s, '/api/cheer', { name: 'Birch' }, alder))).toBe('nothingToCheer');
    for (const id of ids) climbed(id);
    expect((await card('Birch', alder)).social?.cheer).toEqual({ occasion: 'rank', detail: 'woodcutting', place: 3 });
    expect((await post(s, '/api/cheer', { name: 'Birch' }, alder)).statusCode).toBe(200);
    expect(heard(ids[0], 'cheered')).toEqual([
      expect.objectContaining({ from: 'Alder', occasion: 'rank', detail: 'woodcutting', place: 3 }),
    ]);
    expect(code(await post(s, '/api/cheer', { name: 'Birch' }, alder))).toBe('cheerSent');
    expect((await card('Birch', alder)).social?.cheerState).toBe('sent');
    await post(s, '/api/cheer', { name: 'Cedar' }, alder);
    await post(s, '/api/cheer', { name: 'Damson' }, alder);
    expect(code(await post(s, '/api/cheer', { name: 'Elder' }, alder))).toBe('cheersSpent');
    // A climb older than a week is nothing to cheer; tomorrow, the cheers are back.
    s.clock.now += DAY;
    expect((await card('Elder', alder)).social?.cheerState).toBe('open');
    s.clock.now += 7 * DAY;
    expect((await card('Elder', alder)).social?.cheer).toBeNull();
  });

  // Session 261: a crowd of new accounts could flood one player's moments and tray with cheers.
  it('reaches one player ten times a day at most', async () => {
    s = await server();
    const target = await idOf(await signUp(s, 'Target'));
    climbed(target);
    // Made an hour apart, as sign-ups from one address are paced (a crowd from many addresses is not).
    const crowd: string[] = [];
    for (let i = 0; i < 11; i++) {
      crowd.push(await signUp(s, `Cheerer${String(i)}`));
      s.clock.now += 3_600_000;
    }
    climbed(target);
    for (const c of crowd.slice(0, 10))
      expect((await post(s, '/api/cheer', { name: 'Target' }, c)).statusCode).toBe(200);
    expect(code(await post(s, '/api/cheer', { name: 'Target' }, crowd[10]))).toBe('cheersFull');
    expect((await card('Target', crowd[10])).social?.cheerState).toBe('full');
    expect(heard(target, 'cheered')).toHaveLength(10);
  });

  it('is never offered on your own card, nor between players where either blocked the other', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const birch = await signUp(s, 'Birch');
    climbed(await idOf(birch));
    expect((await card('Alder', alder)).social).toBeNull();
    expect(code(await post(s, '/api/cheer', { name: 'Alder' }, alder))).toBe('notFound');
    await post(s, '/api/mail/block', { name: 'Alder', blocked: true }, birch);
    expect((await card('Birch', alder)).social).toBeNull();
    expect(code(await post(s, '/api/cheer', { name: 'Birch' }, alder))).toBe('notFound');
    expect(code(await post(s, '/api/gift', { name: 'Birch' }, alder))).toBe('notFound');
  });
});

describe('a gift', () => {
  it('is a cache the friend opens as their own, once a day, and told no more once opened', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    await signUp(s, 'Birch');
    s.clock.now += 8 * DAY;
    // Two accounts made the same week give nothing to each other, however old.
    expect((await card('Birch', alder)).social?.gift).toBe('sameWeek');
    expect(code(await post(s, '/api/gift', { name: 'Birch' }, alder))).toBe('giftSameWeek');
    const cedar = await signUp(s, 'Cedar');
    // An account under a week old gives nothing; Alder, a week older than Cedar, may.
    expect(code(await post(s, '/api/gift', { name: 'Alder' }, cedar))).toBe('giftYoung');
    expect((await card('Cedar', alder)).social?.gift).toBe('open');
    expect((await post(s, '/api/gift', { name: 'Cedar' }, alder)).statusCode).toBe(200);
    expect(code(await post(s, '/api/gift', { name: 'Cedar' }, alder))).toBe('giftGiven');
    const cedarId = await idOf(cedar);
    expect(heard(cedarId, 'giftCame')).toEqual([expect.objectContaining({ from: 'Alder' })]);
    const waiting = (await game(cedar)).features.gifts as { waiting: { id: number; from: string }[] };
    expect(waiting.waiting).toEqual([expect.objectContaining({ from: 'Alder' })]);
    const gold = (st: State) => st.items.gold ?? 0;
    const before = gold(await game(cedar));
    const open = JSON.parse(
      (
        await post(
          s,
          '/api/f/goals/openGift',
          { requestId: 'gift-open-1', input: { id: waiting.waiting[0].id } },
          cedar,
        )
      ).body,
    ) as { result: unknown; state: State; events: GameEvent[] };
    expect(open.result).toEqual({ ok: true });
    expect(gold(open.state)).toBeGreaterThan(before);
    expect(open.events).toEqual([expect.objectContaining({ type: 'giftOpened', from: 'Alder' })]);
    expect(((await game(cedar)).features.gifts as { waiting: unknown[] }).waiting).toEqual([]);
    // Opened twice: nothing.
    const again = JSON.parse(
      (
        await post(
          s,
          '/api/f/goals/openGift',
          { requestId: 'gift-open-2', input: { id: waiting.waiting[0].id } },
          cedar,
        )
      ).body,
    ) as { result: unknown };
    expect(again.result).toEqual({ ok: false, reason: 'none' });
  });

  it('reaches one player three times a day at most, and goes with a deleted account', async () => {
    s = await server();
    const givers = await Promise.all(['Alder', 'Birch', 'Cedar', 'Damson'].map((n) => signUp(s, n)));
    s.clock.now += 8 * DAY;
    const elder = await signUp(s, 'Elder');
    for (const g of givers.slice(0, 3)) expect((await post(s, '/api/gift', { name: 'Elder' }, g)).statusCode).toBe(200);
    expect(code(await post(s, '/api/gift', { name: 'Elder' }, givers[3]))).toBe('giftFull');
    erase(s.ctx, await idOf(givers[0]));
    const elderId = await idOf(elder);
    expect(s.ctx.social.waitingOf(elderId).map((g) => g.from)).toEqual(['Birch', 'Cedar']);
    expect(
      heard(elderId, 'giftCame')
        .map((e) => (e as { from: string }).from)
        .sort(),
    ).toEqual(['', 'Birch', 'Cedar']);
  });
});
