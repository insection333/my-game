// Session 249: war marks that cross over. War marks bought only what stayed inside the castle; three charters
// now carry them back into the rest of the game, each 1% a rank for five ranks, bought with war marks alone:
// the Land lifts what gathering brings, the Craft keeps an artisan's ingredient now and then, Arms lifts every
// fight's damage. The castle's mirror carries their ranks into the save, edict paid or not.
import { CHARTER_MARKS, XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { mirrorFor, charterPct } from '../src/shared/castle/mirror.ts';
import { newCastle, raiseCharter, type Castle } from '../src/shared/castle/index.ts';
import { FOES } from '../src/shared/combat/data.ts';
import { fighterOf } from '../src/shared/combat/state.ts';
import { extraYieldPct } from '../src/shared/complete.ts';

const T0 = Date.UTC(2026, 10, 26);
const castle = (extra: Partial<Castle> = {}): Castle => ({ ...newCastle('lord', T0), ...extra });
const withMirror = (c: Castle): State => ({
  ...newState(4, T0),
  skills: { melee: { xp: XP_TABLE[40] } },
  items: { 'iron-sword': 1 },
  features: {
    castle: mirrorFor(c, 0, T0),
    combat: { worn: { weapon: 'iron-sword' }, health: null, healthAt: T0, retreated: null },
  },
});

describe('a charter', () => {
  it('is raised a rank for war marks alone, to five', () => {
    const r = raiseCharter({ castle: castle({ warMarks: 100 }), purse: 0 }, 'land');
    expect(r).toMatchObject({ ok: true, purse: 0, burned: 0 });
    if (!r.ok) return;
    expect([r.castle.charters.land, r.castle.warMarks]).toEqual([1, 100 - CHARTER_MARKS[0]]);
    expect(raiseCharter({ castle: castle({ warMarks: 59 }), purse: 1e9 }, 'land')).toMatchObject({
      ok: false,
      reason: 'marks',
    });
    const top = castle({ warMarks: 1e6, charters: { land: 5, craft: 0, arms: 0 } });
    expect(raiseCharter({ castle: top, purse: 0 }, 'land')).toMatchObject({ ok: false, reason: 'top' });
    expect(raiseCharter({ castle: top, purse: 0 }, 'nope' as 'land')).toMatchObject({ ok: false, reason: 'unknown' });
  });

  it('crosses into the save with no edict paid, and works there', () => {
    const plain = withMirror(castle());
    const chartered = withMirror(castle({ charters: { land: 3, craft: 2, arms: 4 } }));
    expect(mirrorFor(castle(), 0, T0).charters).toBeUndefined();
    expect([charterPct(chartered, 'land'), charterPct(chartered, 'craft'), charterPct(chartered, 'arms')]).toEqual([
      3, 2, 4,
    ]);
    // The Land lifts gathering, not an artisan's work.
    expect(
      extraYieldPct(chartered, 'woodcutting', 0, false, 1, T0) - extraYieldPct(plain, 'woodcutting', 0, false, 1, T0),
    ).toBe(3);
    expect(extraYieldPct(chartered, 'smithing', 0, true, 1, T0)).toBe(extraYieldPct(plain, 'smithing', 0, true, 1, T0));
    // Arms lifts the fighter's damage.
    const foe = FOES[0];
    expect(fighterOf(chartered, foe)!.perks.damage - fighterOf(plain, foe)!.perks.damage).toBe(4);
  });
});
