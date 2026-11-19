// Session 156: a script that sends a command every four minutes keeps a player's fire lit round the clock.
// The admin page's player list says how long a player's fire burned on their busiest day of the week, so
// a fire that never sleeps shows beside one lit for an evening.
import type { AdminPlayersResponse } from '@idle-clash/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());
let n = 0;
const stoke = (cookie: string) =>
  post(s, '/api/game/command', { requestId: `req-fire-${++n}`, command: { type: 'stoke' } }, cookie);

describe('the fire, watched', () => {
  it('shows the admin the most a player’s fire burned in a day', async () => {
    s = await server({ readsPerMinute: 1_000_000 });
    const warden = await signUpAdmin(s, 'Warden');
    const bot = await signUp(s, 'Sleepless');
    const person = await signUp(s, 'Evening');
    for (let m = 0; m < 22 * 60; m += 4) {
      await stoke(bot);
      if (m < 90) await stoke(person);
      s.clock.now += 4 * 60_000;
    }
    const list = JSON.parse((await post(s, '/api/admin/players', { query: '' }, warden)).body) as AdminPlayersResponse;
    const hours = (name: string) => list.players.find((p) => p.name === name)?.fireHours;
    expect(hours('Sleepless')).toBeGreaterThanOrEqual(20);
    expect(hours('Evening')).toBeLessThan(2);
  });
});
