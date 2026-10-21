// The notices tray and the away recap: what a written change brings about is kept as notices (the
// newest 100); reading the game after a quarter of an hour away says what happened meanwhile, and
// collecting it puts those events in the tray.
import type { GameResponse, NoticesResponse } from '@idle-clash/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const pine = { feature: 'woodcutting', id: 'pine-tree' };
const get = async <T>(cookie: string, url: string) =>
  JSON.parse((await s.app.inject({ method: 'GET', url, headers: { cookie } })).body) as T;
const command = (cookie: string, requestId: string, cmd: unknown) =>
  post(s, '/api/game/command', { requestId, command: cmd }, cookie);

describe('notices and the recap', () => {
  it('recaps time away, then keeps its events as notices once the player is back', async () => {
    s = await server();
    const cookie = await signUp(s);
    await command(cookie, 'req-notice-1', { type: 'start', lane: 'gathering', action: pine });
    s.clock.now += 10 * 60_000;
    expect((await get<GameResponse>(cookie, '/api/game')).away).toBeNull();
    s.clock.now += 8 * 3600_000;
    const back = await get<GameResponse>(cookie, '/api/game');
    expect(back.away).toMatchObject({ to: s.clock.now });
    expect(back.away!.to - back.away!.from).toBe(8 * 3600_000 + 10 * 60_000);
    expect(back.away!.items['pine-logs']).toBe(back.state.items['pine-logs']);
    expect(back.away!.events.some((e) => e.type === 'levelUp')).toBe(true);
    expect((await get<NoticesResponse>(cookie, '/api/notices')).notices).toEqual([]);
    // Collecting is a real input: the server writes the time away, and its moments reach the tray.
    await command(cookie, 'req-notice-2', { type: 'stoke' });
    const { notices } = await get<NoticesResponse>(cookie, '/api/notices');
    const levels = back.away!.events.filter((e) => e.type === 'levelUp');
    expect(notices.filter((e) => e.type === 'levelUp')).toEqual([...levels].reverse());
    expect((await get<GameResponse>(cookie, '/api/game')).away).toBeNull();
  });

  it("keeps each player's notices apart, the newest 100", async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    s.ctx.notices.add(
      'nobody',
      Array.from({ length: 3 }, (_, i) => ({ type: 'levelUp' as const, at: i, skill: 'woodcutting', level: 2 })),
    );
    const me = await get<{ player: { id: string } }>(a, '/api/me');
    s.ctx.notices.add(
      me.player.id,
      Array.from({ length: 130 }, (_, i) => ({
        type: 'levelUp' as const,
        at: i,
        skill: 'woodcutting',
        level: 2 + (i % 38),
      })),
    );
    const list = (await get<NoticesResponse>(a, '/api/notices')).notices;
    expect(list).toHaveLength(100);
    expect(list[0].at).toBe(129);
    expect((await get<NoticesResponse>(b, '/api/notices')).notices).toEqual([]);
  });
});
