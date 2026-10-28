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
      icon: 'woodcutting',
      until: T + 4000 + 6000,
    });
    expect(second).toMatchObject({ size: 'toast', title: 'Goal done: Chop a pine' });
  });

  it('opens a goal’s supply cache in a banner, and a lucky one in the centre', () => {
    const cache = (grade: string): GameEvent => ({
      type: 'goalDone',
      at: T,
      goal: 'short-4',
      name: 'Woodcutting: Oak tree ×50',
      cache: {
        grade,
        items: [
          { item: 'gold', count: 275 },
          { item: 'meat-pie', count: 6 },
        ],
      },
    });
    expect(momentsFrom([cache('stocked')], T - 1, FEATURES)[0]).toMatchObject({
      size: 'banner',
      icon: 'supply-cache',
      title: 'Goal done: Woodcutting: Oak tree ×50',
      body: 'A stocked cache: 275 gold, Meat pie ×6',
    });
    expect(momentsFrom([cache('lucky')], T - 1, FEATURES)[0]).toMatchObject({ size: 'centre' });
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

  it('leads with what a cache held when opening it also completes a deed', () => {
    // A lucky cache's gold lifts the player past 1,000 gold: the deed is recorded a moment later.
    const events: GameEvent[] = [
      {
        type: 'goalDone',
        at: T,
        goal: 'short-0',
        name: 'Chop 10 pine trees',
        cache: { grade: 'lucky', items: [{ item: 'gold', count: 1000 }] },
      },
      {
        type: 'deedDone',
        at: T + 40,
        deed: 'gold-1000',
        name: 'Hold 1,000 gold',
        icon: null,
        tier: 'easy',
        points: 10,
      },
    ];
    const [moment] = momentsFrom(events, T - 1, FEATURES);
    expect(moment.body).toContain('A lucky cache: 1,000 gold');
    expect(moment.icon).toBe('supply-cache');
    expect(moment.body).toContain('Hold 1,000 gold');
  });
});
