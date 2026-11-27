// Session 268: with no room in the Storehouse for what a fight drops, the lane refuses a boss's fight and the
// realm's strike, yet the boss rows and the realm's row said ready (Fight offered) and the Hearth asked for
// them; they now ask the lane's own check and say why.
import { HOUR, type State } from '@idle-clash/kernel';
import { itemOf } from '../src/shared/catalog.ts';
import { describe, expect, it } from 'vitest';
import { bossRows } from '../src/expeditions/views.ts';
import { expeditionErrands } from '../src/expeditions/errands.ts';
import { capacity, slotsUsed } from '../src/shared/storehouse.ts';
import { BOSSES } from '../src/shared/expeditions/data.ts';
import { engine, fighterAt, T0 } from './helpers/expedition.ts';

/** The Storehouse filled to its last space with kinds no fight drops. */
function full(s: State): State {
  const out = structuredClone(s);
  const drops = new Set(BOSSES.map((b) => b.drop));
  const fill = [
    'pine-logs',
    'oak-logs',
    'ash-logs',
    'yew-logs',
    'maple-logs',
    'copper-ore',
    'tin-ore',
    'iron-ore',
    'coal',
    'copper-bar',
    'bronze-bar',
    'iron-bar',
    'steel-bar',
    'perch',
    'trout',
    'pike',
    'salmon',
    'bread',
    'birds-nest',
    'rough-garnet',
    'horseshoe',
    'heron-quill',
    'wild-herbs',
    'mussel',
    'chalk',
    'glimmer-stone',
    'battle-trophy',
    'goose-fletching',
    'amber-nugget',
    'river-pearl',
  ].filter((i) => !drops.has(i) && itemOf(i));
  for (const item of fill) {
    if (slotsUsed(out) >= capacity(out)) break;
    out.items[item] = (out.items[item] ?? 0) + 1;
  }
  for (const b of BOSSES) delete out.items[b.drop];
  return out;
}

describe('a boss with no room for its drop', () => {
  it('is not offered, and says the Storehouse is full', () => {
    const s = full(fighterAt('march', 13));
    const row = bossRows(s, T0).find((b) => b.id === 'barrow-king')!;
    const start = engine.command(
      s,
      T0,
      { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'barrow-king' } },
      () => 0.5,
    );
    expect(start.result).toEqual({ ok: false, reason: { code: 'storehouseFull' } });
    expect(row).toMatchObject({ ready: false, status: 'Storehouse full' });
    expect(expeditionErrands(s, T0).some((e) => /can be fought|fights? banked|boss fights wait/.test(e.text))).toBe(
      false,
    );
    void HOUR;
  });
});
