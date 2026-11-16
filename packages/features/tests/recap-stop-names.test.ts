// A stop said inside a sentence keeps a name's capital (session 121): the recap read "Combat stopped:
// storehouse full", lowering the Storehouse, a page of the game's own menu, where the lane said "Storehouse
// full". A reason that opens with a common word still reads as part of the sentence.
import { formatStop } from '@idle-clash/content';
import { newState, summarizeAway, type GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const stopped = (lane: 'combat' | 'artisan', code: string, detail?: Record<string, string>): GameEvent =>
  ({ type: 'laneStopped', at: 1, lane, reason: { code, ...(detail ? { detail } : {}) } }) as GameEvent;

describe('a stop inside a sentence', () => {
  it('keeps the Storehouse a name in the recap', () => {
    const before = newState(1, 0);
    const events = [stopped('combat', 'storehouseFull'), stopped('artisan', 'outOfInputs', { item: 'tin-ore' })];
    const lines = recap.recapLines(summarizeAway(before, before, events, 8 * 3600_000)).map((l) => l.text);
    expect(lines).toContain('Combat stopped: Storehouse full');
    expect(lines).toContain('Artisan stopped: out of tin ore');
  });

  it('lowers only a common word', () => {
    expect(formatStop({ code: 'storehouseFull' }, 'mid')).toBe('Storehouse full');
    expect(formatStop({ code: 'hitpointsTooLow', detail: { level: 10 } }, 'mid')).toBe('needs Hitpoints level 10');
    expect(formatStop({ code: 'fireOut' }, 'mid')).toBe('the fire went out');
  });
});
