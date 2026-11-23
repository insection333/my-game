// The fire going out, said quietly (session 189): the fire burns five minutes past a player's last press, so
// every absence ended with "Gathering (the fire) stopped: the fire went out" in the recap and the tray, a red
// line needing nothing (any press lights the fire and starts its lane again, session 153). It reads as a
// rest now: no recap line, no tray line, and the lane rests rather than halting.
import { isQuietStop } from '@idle-clash/content';
import { newState, summarizeAway, type GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const fireOut = {
  type: 'laneStopped',
  at: 1,
  lane: 'gathering2',
  action: { feature: 'mining', id: 'copper-vein' },
  reason: { code: 'fireOut' },
} as GameEvent;

describe('the fire going out', () => {
  it('is a quiet stop: nothing in the recap or the tray', () => {
    expect(isQuietStop('fireOut')).toBe(true);
    const before = newState(1, 0);
    const lines = recap.recapLines(summarizeAway(before, before, [fireOut], 8 * 3600_000));
    expect(lines.filter((l) => l.kind === 'stopped')).toEqual([]);
    expect(recap.noticeLine(fireOut)).toBeNull();
  });
});
