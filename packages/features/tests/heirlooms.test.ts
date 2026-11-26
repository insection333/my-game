// Session 251: heirlooms. Gear was one straight line of eight tiers, and a boss's Rare and Legendary finds had
// nothing more to give once their uses were spent. Six heirlooms are forged at Smithing 90 from ten of a boss's
// Rare find and its Legendary find, each of the last tier's strength with its boss's way turned to the wearer,
// never tempered and never sold: against tempered dawnsteel each wins somewhere and loses somewhere.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { BOSSES } from '../src/shared/expeditions/data.ts';
import { FOES } from '../src/shared/combat/data.ts';
import { odds } from '../src/shared/combat/fight.ts';
import { fighterOf, mealsOf } from '../src/shared/combat/state.ts';
import { HEIRLOOMS, heirloomCost } from '../src/shared/heirlooms.ts';
import { heirloomWords } from '../src/shared/heirloom-view.ts';
import { reachOf } from '../src/expeditions/deep-view.ts';
import { forgeHeirloom } from '../src/smithing/heirloom.ts';
import { temper } from '../src/smithing/temper.ts';
import { oldGear } from '../src/storehouse/tidy.ts';
import { bestChanges } from '../src/combat/gear.ts';

const T0 = Date.UTC(2026, 10, 26);
const SET = { helm: 'dawnsteel-helm', body: 'dawnsteel-body', legs: 'dawnsteel-legs' };
const WEAPON: Record<string, string> = { melee: 'dawnsteel-sword', archery: 'dawnsteel-bow', magic: 'dawnsteel-staff' };
const at99 = (worn: Record<string, string>, tempered: Record<string, number>, items: Record<string, number> = {}) =>
  ({
    ...newState(3, T0),
    skills: Object.fromEntries(
      ['melee', 'archery', 'magic', 'hitpoints', 'smithing'].map((k) => [k, { xp: XP_TABLE[99] }]),
    ),
    items: { ...Object.fromEntries(Object.values(worn).map((i) => [i, 1])), 'sturgeon-stew': 1000, ...items },
    features: { combat: { worn, health: null, healthAt: T0, retreated: null }, smithing: { tempered } },
  }) as State;

/** Tempered dawnsteel whole, and the same with the heirloom in its slot (the rest tempered as before). */
function pair(item: string) {
  const h = HEIRLOOMS.find((x) => x.item === item)!;
  const worn = { ...SET, weapon: WEAPON[h.style ?? 'melee'] };
  const tempered = Object.fromEntries(Object.values(worn).map((i) => [i, 5]));
  const replaced = worn[h.slot];
  const rest = Object.fromEntries(Object.entries(tempered).filter(([k]) => k !== replaced));
  return { plain: at99(worn, tempered), heir: at99({ ...worn, [h.slot]: item }, rest) };
}
const xpAgainst = (s: State, foeId: string) => {
  const foe = [...BOSSES, ...FOES].find((f) => f.id === foeId)!;
  return odds(fighterOf(s, foe)!, foe, mealsOf(s)[0], 400).xpPerHour;
};

describe('forging an heirloom', () => {
  it("takes ten of its boss's Rare find and its Legendary find, from Smithing 90, one held at a time", () => {
    const cost = heirloomCost(HEIRLOOMS[0]);
    expect(cost).toEqual([
      { item: 'barrow-ring', count: 10 },
      { item: 'wight-kings-sceptre', count: 1 },
    ]);
    const s = at99({}, {}, { 'barrow-ring': 12, 'wight-kings-sceptre': 1 });
    const r = forgeHeirloom(s, 'barrow-helm', T0);
    expect(r.result).toEqual({ ok: true });
    expect([
      r.state.items['barrow-helm'],
      r.state.items['barrow-ring'],
      r.state.items['wight-kings-sceptre'] ?? 0,
    ]).toEqual([1, 2, 0]);
    expect(r.events).toEqual([{ type: 'heirloomForged', at: T0, item: 'barrow-helm' }]);
    expect(forgeHeirloom(r.state, 'barrow-helm', T0).result).toEqual({ ok: false, reason: 'held' });
    expect(
      forgeHeirloom(at99({}, {}, { 'barrow-ring': 9, 'wight-kings-sceptre': 1 }), 'barrow-helm', T0).result,
    ).toEqual({ ok: false, reason: 'short' });
    const low = { ...s, skills: { ...s.skills, smithing: { xp: XP_TABLE[89] } } };
    expect(forgeHeirloom(low, 'barrow-helm', T0).result).toEqual({ ok: false, reason: 'locked' });
    expect(forgeHeirloom(s, 'dawnsteel-helm', T0).result).toEqual({ ok: false, reason: 'unknown' });
  });

  it('is never tempered nor sold as old gear, and says its way', () => {
    const s = at99({ helm: 'barrow-helm' }, {}, { 'dawnsteel-bar': 1000, 'barrow-ring': 50 });
    expect(temper(s, 'helm', T0).result).toEqual({ ok: false, reason: 'heirloom' });
    expect(oldGear(s).some((x) => x.item === 'barrow-helm')).toBe(false);
    for (const h of HEIRLOOMS) expect(heirloomWords(h.item)).toMatch(/\S/);
    expect(heirloomWords('mire-mail')).toBe('Mends 2% of your health after each fight won');
  });
});

describe('against tempered dawnsteel, each heirloom', () => {
  it('weapon wins against some foe and loses against another', () => {
    const cases: [string, string, string][] = [
      // The Troll-chief's blade, when the fight hurts: the Peaks' foes; not the first boss.
      ['troll-blade', 'sky-reaver', 'barrow-king'],
      // The Warden's bow, where its style is weak (and on the Warden itself); not where it is even.
      ['warden-bow', 'troll-chief', 'storm-roc'],
      // The Wyrm's staff, on a boss; not on the Peaks' foes.
      ['wyrm-staff', 'ember-wyrm', 'ash-troll'],
    ];
    for (const [item, wins, loses] of cases) {
      const { plain, heir } = pair(item);
      expect(xpAgainst(heir, wins), `${item} against ${wins}`).toBeGreaterThan(xpAgainst(plain, wins));
      expect(xpAgainst(heir, loses), `${item} against ${loses}`).toBeLessThan(xpAgainst(plain, loses));
    }
  });

  it('piece of armour goes deeper into the Deep, by a depth at most', () => {
    for (const item of ['barrow-helm', 'mire-mail', 'roc-greaves']) {
      const { plain, heir } = pair(item);
      const a = reachOf(plain, 0, 0, 0, T0).depth;
      const b = reachOf(heir, 0, 0, 0, T0).depth;
      expect(b, item).toBeGreaterThan(a);
      expect(b - a, item).toBeLessThanOrEqual(1);
    }
  });
});

describe('an heirloom worn', () => {
  it('is left on by Fight as, beside an untempered piece of its tier (session 252)', () => {
    const s = at99({ weapon: 'troll-blade', helm: 'barrow-helm' }, {}, { 'dawnsteel-sword': 1, 'dawnsteel-helm': 1 });
    expect(bestChanges(s, 'melee')).toEqual([]);
    // Fighting as another style still changes the weapon.
    const magic = at99({ weapon: 'troll-blade' }, {}, { 'dawnsteel-staff': 1 });
    expect(bestChanges(magic, 'magic')).toEqual([{ slot: 'weapon', item: 'dawnsteel-staff' }]);
  });
});
