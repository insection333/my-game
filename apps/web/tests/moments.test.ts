// Moments: what the page shows for notable events, and how close ones are grouped.
import { FEATURES } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { momentsFrom } from '../src/shell/moments.ts';

const T = Date.UTC(2026, 9, 21, 9);
const pine = { feature: 'woodcutting', id: 'pine-tree' };
const rare: GameEvent = {
  type: 'find',
  at: T,
  skill: 'woodcutting',
  item: 'carved-acorn',
  rarity: 'rare',
  first: true,
};

describe('moments', () => {
  it('gives a Rare find a banner of its own with its icon and its place in the collection log', () => {
    expect(momentsFrom([rare], T - 1, FEATURES)).toEqual([
      {
        key: String(T),
        size: 'banner',
        icon: 'carved-acorn',
        title: 'Rare find: Carved acorn',
        body: 'New in your collection log.',
        until: T + 5000,
      },
    ]);
  });

  it('shows events within 5 seconds together, the best first, at the size of the biggest', () => {
    const events: GameEvent[] = [
      { type: 'masteryStep', at: T, action: pine, step: 3 },
      { type: 'levelUp', at: T + 2000, skill: 'woodcutting', level: 10 },
      { type: 'find', at: T + 4000, skill: 'woodcutting', item: 'birds-nest', rarity: 'uncommon', first: false },
      { type: 'goalDone', at: T + 9000, goal: 'chop-a-pine' },
    ];
    const [first, second] = momentsFrom(events, T - 1, FEATURES);
    expect(first).toMatchObject({
      size: 'centre',
      title: 'Woodcutting level 10',
      body: "Unlocked: Ash tree. Also: Pine tree: mastery 3; Uncommon find: Bird's nest.",
      icon: 'birds-nest',
      until: T + 4000 + 6000,
    });
    expect(second).toMatchObject({ size: 'toast', title: 'Goal done: Chop a pine' });
  });

  it('shows nothing for what happened before the page opened, or for a lane the player stopped', () => {
    const stop: GameEvent = {
      type: 'laneStopped',
      at: T + 1,
      lane: 'gathering',
      action: pine,
      reason: { code: 'stoppedByPlayer' },
    };
    expect(momentsFrom([rare, stop], T, FEATURES)).toEqual([]);
  });

  it('says why a lane stopped by itself, and why a command was refused', () => {
    const bar = { feature: 'smithing', id: 'bronze-bar' };
    const events: GameEvent[] = [
      {
        type: 'laneStopped',
        at: T,
        lane: 'artisan',
        action: bar,
        reason: { code: 'outOfInputs', detail: { item: 'tin-ore' } },
      },
      {
        type: 'refused',
        at: T + 9000,
        lane: 'artisan',
        action: bar,
        reason: { code: 'levelTooLow', detail: { level: 10 } },
      },
    ];
    expect(momentsFrom(events, T - 1, FEATURES)).toMatchObject([
      { size: 'toast', title: 'Artisan stopped: out of tin ore', body: 'Bronze bar' },
      { size: 'toast', title: 'Needs level 10', body: 'Bronze bar' },
    ]);
  });

  it('says what a mastery step gives', () => {
    const [m] = momentsFrom([{ type: 'masteryStep', at: T, action: pine, step: 3 }], T - 1, FEATURES);
    expect(m.body).toBe('9% faster, +18% chance of an extra item');
  });
});
