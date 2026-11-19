// Session 156: a bad actor's script that sends a command every four minutes keeps the fire lit round the
// clock (its +15% XP, its heat and its second lane), where the fire is the reward for playing in person.
// The fire's lit time is kept an hour at a time for two days (`fireLog`), so the admin page can show a
// fire that never sleeps; a person's evening shows as the minutes they played.
import { describe, expect, it } from 'vitest';
import { createEngine, fireBusiestDay, newState, seeded, type State } from '../src/index.ts';
import { registry, T0 } from './fixtures.ts';

const engine = createEngine(registry);
const stoke = (s: State, at: number) => engine.command(s, at, { type: 'stoke' }, seeded(1)).state;

describe('the fire, kept an hour at a time', () => {
  it('counts the minutes it burned', () => {
    let s = newState(1, T0);
    s = stoke(s, T0);
    s = stoke(s, T0 + 3 * 60_000);
    s = stoke(s, T0 + 60 * 60_000);
    // 3 minutes, then the 5 that second stoke lit (out at T0 + 8 min), and none in the gap.
    expect(fireBusiestDay(s)).toBe(8 * 60_000);
  });

  it('shows a fire kept lit by a script all day', () => {
    let s = newState(1, T0);
    for (let t = 0; t <= 24 * 60; t += 4) s = stoke(s, T0 + t * 60_000);
    expect(fireBusiestDay(s)).toBeGreaterThanOrEqual(23.9 * 3_600_000);
  });

  it('keeps two days of hours, an hour split where the fire burned across it', () => {
    let s = newState(1, T0 - 2 * 60_000);
    s = stoke(s, T0 - 2 * 60_000);
    s = stoke(s, T0 + 2 * 60_000);
    expect(Object.values(s.fireLog ?? {})).toEqual([2 * 60_000, 2 * 60_000]);
    for (let h = 0; h < 72; h++) s = stoke(stoke(s, T0 + h * 3_600_000), T0 + h * 3_600_000 + 60_000);
    expect(Object.keys(s.fireLog ?? {})).toHaveLength(48);
  });
});
