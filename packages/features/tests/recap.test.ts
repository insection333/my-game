// The away recap: best first (Legendary, a new log entry, levels, Rare, mastery, Uncommon, what the
// lanes brought, then any lane that stopped), one line a skill, an item or an action.
import type { AwaySummary, GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const at = (n: number) => 1_000 + n;
const events: GameEvent[] = [
  {
    type: 'laneStopped',
    at: at(1),
    lane: 'artisan',
    action: { feature: 'smithing', id: 'bronze-bar' },
    reason: { code: 'outOfInputs', detail: { item: 'tin-ore' } },
  },
  { type: 'masteryStep', at: at(2), action: { feature: 'woodcutting', id: 'oak-tree' }, step: 3 },
  { type: 'levelUp', at: at(3), skill: 'mining', level: 12 },
  { type: 'find', at: at(4), skill: 'woodcutting', item: 'heartwood-knot', rarity: 'rare', first: false },
  { type: 'masteryStep', at: at(5), action: { feature: 'woodcutting', id: 'oak-tree' }, step: 4 },
  { type: 'levelUp', at: at(6), skill: 'mining', level: 13 },
  { type: 'find', at: at(7), skill: 'woodcutting', item: 'heartwood-knot', rarity: 'rare', first: false },
  { type: 'find', at: at(8), skill: 'mining', item: 'star-iron-shard', rarity: 'legendary', first: true },
  { type: 'find', at: at(9), skill: 'mining', item: 'rough-garnet', rarity: 'uncommon', first: true },
];
const away: AwaySummary = {
  from: 0,
  to: 8 * 3600_000,
  events,
  uncommon: 12,
  items: { gold: 40, 'oak-logs': 900, 'tin-ore': -30 },
  xp: { woodcutting: 9000, mining: 5000 },
};

describe('the away recap', () => {
  it('leads with the best thing and gives one line a skill, an item and an action', () => {
    const lines = recap.recapLines(away);
    expect(lines.map((l) => l.text)).toEqual([
      'Legendary find: Star-iron shard',
      'First find: Rough garnet (Uncommon)',
      'Mining reached level 13',
      'Rare find: Heartwood knot ×2',
      'Oak tree: mastery 4',
      '12 Uncommon finds',
      '+40 gold, +900 oak logs',
      '+14,000 XP across 2 skills',
      'Artisan stopped: out of tin ore',
    ]);
    expect(recap.goodThings(lines)).toHaveLength(8);
    expect(lines.at(-1)!.href).toBe('/storehouse?panel=item&item=tin-ore');
  });

  it('lists notices one event each, leaving out Uncommon finds the log already holds', () => {
    expect(recap.noticeLine(events[2])).toMatchObject({ text: 'Mining reached level 12', href: '/skills/mining' });
    expect(recap.noticeLine({ ...events[8], type: 'find', first: false } as GameEvent)).toBeNull();
    expect(
      recap.noticeLine({
        type: 'laneStopped',
        at: 1,
        lane: 'gathering',
        action: null,
        reason: { code: 'stoppedByPlayer' },
      }),
    ).toBeNull();
  });
});
