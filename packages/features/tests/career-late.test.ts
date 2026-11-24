// A career's late honours on the profile card (session 226): the card said a lifetime's foes, bosses and runs
// and the castle's fortresses and routs, yet nothing of the Deep (the deepest is the year-two veteran's
// boast, with a ladder of its own) or of the season's legendary sieges taken, so a friend's card two years in
// read as a year-in one. Both are now read from the save.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { careerOf } from '../src/index.ts';

const T0 = Date.UTC(2026, 10, 24, 9);

describe("a career's late honours", () => {
  it("says the Deep's deepest and the legends taken", () => {
    const s: State = {
      ...newState(3, T0),
      features: {
        expeditions: {
          marks: 0,
          relics: {},
          drawn: 0,
          run: null,
          bossDay: {},
          wins: {},
          runs: {},
          twists: [],
          deep: { deepest: 139, week: null, weekDeepest: 0, descents: 212, run: null },
        },
        castle: {
          edict: null,
          pct: 0,
          until: 0,
          standing: { level: 22, taken: 40, marks: 0, relics: 0, studies: 0, tempered: 0, routs: 9, legends: 4 },
        },
      },
    };
    const c = careerOf(s, T0);
    expect(c.deepest).toBe(139);
    expect(c.castle).toMatchObject({ level: 22, fortresses: 40, routs: 9, legends: 4 });
    const fresh = careerOf(newState(3, T0), T0);
    expect([fresh.deepest, fresh.castle]).toEqual([0, null]);
  });
});
