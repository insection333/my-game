// Session 156's stress test: a player three weeks in who collected their recap, or opened the game just
// after midnight, read the newcomer's welcome on the Hearth: "Welcome to the march … Start with a first
// step". A quiet day for a player who has played says only that the day's moments will show there.
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../../../packages/content/src/index.ts';
import { quietDay } from '../src/pages/today-words.ts';

describe("the Hearth's Today with nothing yet today", () => {
  it('welcomes a newcomer and points them to a first step', () => {
    expect(quietDay(newState(1, 0))).toMatchObject({ title: 'Welcome to the march' });
  });
  it('says only that the day is quiet so far to a player who has played', () => {
    const played = { ...newState(1, 0), skills: { woodcutting: { xp: 5_000 } } };
    const words = quietDay(played);
    expect(words.title).not.toBe('Welcome to the march');
    expect(words.body).not.toMatch(/first step/);
  });
});
