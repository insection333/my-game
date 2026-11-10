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

  // Session 58: levels, mastery, stops and the castle's lines stood on a bare dot.
  it('pictures every line it can: a skill by its seal, an action by what it makes, a stop by its remedy', () => {
    const icons = Object.fromEntries(recap.recapLines(away).map((l) => [l.text, l.icon]));
    expect(icons['Mining reached level 13']).toBe('mining');
    expect(icons['Oak tree: mastery 4']).toBe('oak-logs');
    expect(icons['Artisan stopped: out of tin ore']).toBe('tin-ore');
    const besieged = recap.noticeLine({
      type: 'castleBesieged',
      at: at(10),
      foe: 'Keeper',
      outcome: 'repelled',
      lost: 0,
      marks: 3,
    });
    expect(besieged?.icon).toBe('castle-walls');
    const tempered = recap.noticeLine({
      type: 'castleTempered',
      at: at(11),
      relic: 'aegis-shard',
      tempers: 2,
      masterstroke: false,
    });
    expect(tempered?.icon).toBe('aegis-shard');
  });

  // Session 66: a siege or a caught spy against the player while away came back only in the bell; the
  // recap ("While you were away") said nothing of it, even of gold lost.
  it("says what the player's castle met while they were away, from the server's notices", () => {
    const notices: GameEvent[] = [
      { type: 'castleBesieged', at: 2 * 3600_000, foe: 'Keeper', outcome: 'graze', lost: 182_000, marks: 2 },
      { type: 'castleSpyCaught', at: 3 * 3600_000, foe: 'Keeper', marks: 1 },
      // Before the time away began: already seen.
      { type: 'castleSpyCaught', at: -60_000, foe: 'Alder', marks: 1 },
      { type: 'rankUp', at: 8 * 3600_000, skill: 'mining', place: 9, band: 10 },
    ];
    const lines = recap.recapLines(away, notices);
    const defences = lines.filter((l) => l.kind === 'defence');
    expect(defences.map((l) => l.text)).toEqual([
      recap.noticeLine(notices[0])!.text,
      recap.noticeLine(notices[1])!.text,
    ]);
    expect(defences[0]).toMatchObject({ icon: 'castle-walls', href: '/castle' });
    expect(defences[0].text).toContain('182K');
    // They need the player, as a stopped lane does: never folded away among the good things.
    expect(recap.goodThings(lines).some((l) => l.kind === 'defence')).toBe(false);
    expect(lines.find((l) => l.kind === 'rank')?.text).toBe(recap.noticeLine(notices[3])!.text);
    // The defences come after the good things and before a stopped lane.
    const kinds = lines.map((l) => l.kind);
    expect(kinds.indexOf('defence')).toBeGreaterThan(kinds.indexOf('xp'));
    expect(kinds.indexOf('defence')).toBeLessThan(kinds.indexOf('stopped'));
  });

  // Session 68: 266 of the 272 deeds have no picture, nor has a milestone or the XP line, so each stood on
  // a bare dot. A deed carries its medallion (its tier and mark), a milestone its gold, the XP line the seal
  // of the skill that earned most.
  it('gives every deed its medallion, a milestone its gold and the XP its skill', () => {
    const deed: GameEvent = {
      type: 'deedDone',
      at: 1,
      deed: 'level-mining-40',
      name: 'Mining 40',
      icon: null,
      tier: 'hard',
      points: 15,
      mark: '40',
    };
    expect(recap.noticeLine(deed)).toMatchObject({ icon: null, medal: { tier: 'hard', mark: '40' } });
    // A notice kept from before marks rode with deeds: its tier alone.
    const { mark: _, ...old } = deed;
    expect(recap.noticeLine(old as GameEvent)?.medal).toEqual({ tier: 'hard', mark: '' });
    expect(recap.noticeLine({ type: 'goalDone', at: 1, goal: 'milestone', name: 'Reach total level 450' })?.icon).toBe(
      'gold',
    );
    const xp = recap.recapLines(away).find((l) => l.kind === 'xp');
    expect(xp?.icon).toBe('woodcutting');
  });

  // Session 69: an order of the day had no line in the tray, and a spy mission no event at all.
  it("lists an order of the day and a spy mission's end", () => {
    const orders: GameEvent = { type: 'castleOrders', at: 1, orders: ['spy'], all: false, marks: 6 };
    expect(recap.noticeLine(orders)).toMatchObject({ kind: 'castle', icon: 'castle-walls', href: '/castle' });
    const spied: GameEvent = { type: 'castleSpied', at: 1, foe: 'Keeper', mission: 'scout', success: true };
    expect(recap.noticeLine(spied)).toMatchObject({
      kind: 'castle',
      text: 'Scout the castle: Keeper. Done unseen',
      icon: 'spy-scout',
    });
    const caught: GameEvent = { ...spied, mission: 'forge', success: false };
    expect(recap.noticeLine(caught)).toMatchObject({ text: 'Forge orders: Keeper. Caught', icon: 'spy-forge' });
  });
});
