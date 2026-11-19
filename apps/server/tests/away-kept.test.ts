// Session 155: a player two months in, back after ten hours, read a full recap; the page then recorded the
// deeds done meanwhile (a route it sends by itself, which writes the save advanced to now but leaves the
// player unseen), and on the next load, a reload or another device, the recap said "+166 gold, +5
// silverbark logs" for the same ten hours, the rest gone. The recap of one absence now holds until the
// player is back.
import type { AwaySummary, State } from '@idle-clash/kernel';
import { afterEach, describe, expect, it } from 'vitest';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const read = async (cookie: string) =>
  JSON.parse((await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } })).body) as {
    state: State;
    away: AwaySummary | null;
  };

describe('the recap of one absence', () => {
  it('holds across reads until the player is back, though the page records deeds meanwhile', async () => {
    s = await server();
    const cookie = await signUp(s);
    await post(
      s,
      '/api/game/command',
      {
        requestId: 'req-start',
        command: { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
      },
      cookie,
    );
    s.clock.now += 10 * 3_600_000;
    const first = await read(cookie);
    expect(first.away?.items['pine-logs']).toBeGreaterThan(3000);
    await post(s, '/api/f/deeds/refresh', { requestId: 'req-deeds', input: {} }, cookie);
    s.clock.now += 60_000;
    const again = await read(cookie);
    expect(again.away?.from).toBe(first.away?.from);
    expect(again.away?.items['pine-logs']).toBeGreaterThanOrEqual(first.away!.items['pine-logs']);
    expect(again.away?.xp.woodcutting).toBeGreaterThanOrEqual(first.away!.xp.woodcutting);
    // Read once more on the same save: nothing told is lost.
    s.clock.now += 60_000;
    const third = await read(cookie);
    expect(third.away?.items['pine-logs']).toBeGreaterThanOrEqual(again.away!.items['pine-logs']);
    // Back (a command): the next absence starts afresh.
    await post(s, '/api/game/command', { requestId: 'req-stoke', command: { type: 'stoke' } }, cookie);
    s.clock.now += 20 * 60_000;
    const later = await read(cookie);
    expect(later.away?.items['pine-logs'] ?? 0).toBeLessThan(first.away!.items['pine-logs']);
  });
});
