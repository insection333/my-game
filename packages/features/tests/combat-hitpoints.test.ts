// Hitpoints in step (session 177): a fight teaches Hitpoints as much as its style while the style stands at
// or above Hitpoints, and a third as much while it stands below, so Hitpoints keeps pace with a player's best
// style: a player of one style is unchanged, and one of three no longer has it at 99 months before them.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { HITPOINTS_XP_BEHIND } from '../src/shared/combat/data.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const rat = { feature: 'combat', id: 'hollow-rat' };

const fighter = (melee: number, hitpoints: number): State => ({
  ...newState(8, T0),
  skills: { melee: { xp: XP_TABLE[melee] }, hitpoints: { xp: XP_TABLE[hitpoints] } },
  items: { 'copper-sword': 1, bread: 20 },
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
});

/** An hour of hollow rats: the XP each skill gained. */
function hour(s: State) {
  const rng = seeded(4);
  const started = engine.command(s, T0, { type: 'start', lane: 'combat', action: rat }, rng).state;
  const out = engine.advance(started, T0 + HOUR, rng).state;
  return {
    melee: out.skills.melee.xp - s.skills.melee.xp,
    hitpoints: out.skills.hitpoints.xp - s.skills.hitpoints.xp,
  };
}

describe('Hitpoints in step', () => {
  it('pays Hitpoints the style XP while the style stands at or above it', () => {
    const level = hour(fighter(20, 20));
    expect(level.hitpoints).toBeCloseTo(level.melee, 3);
    const above = hour(fighter(22, 20));
    expect(above.hitpoints).toBeCloseTo(above.melee, 3);
  });

  it('pays it a third of the style XP while the style stands below it', () => {
    expect(HITPOINTS_XP_BEHIND).toBeCloseTo(1 / 3, 6);
    const below = hour(fighter(20, 30));
    expect(below.melee).toBeGreaterThan(0);
    expect(below.hitpoints / below.melee).toBeCloseTo(1 / 3, 3);
  });
});
