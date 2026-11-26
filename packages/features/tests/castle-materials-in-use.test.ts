// Session 266: with the Citadel's materials on (the default), a Level up of the deep vault took the bars the
// Artisan lane was forging with, and the Spy Guild's the runes a Magic fighter carried, stopping the lane or
// the supply without a word. A material a running lane needs, or one locked, is left; gold pays all, and the
// line says why.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { materialFor, materialsFor } from '../src/shared/castle-materials.ts';

const T0 = Date.UTC(2026, 10, 24, 9);

function smith(forging: boolean): State {
  const s = newState(7, T0);
  s.skills = { smithing: { xp: XP_TABLE[1] } };
  s.items = { 'copper-bar': 5_000 };
  if (forging)
    s.lanes.artisan = {
      ...s.lanes.artisan,
      current: { action: { feature: 'smithing', id: 'copper-sword' }, startedAt: T0, endsAt: T0 + 60_000 },
    };
  return s;
}

describe("the Citadel's materials", () => {
  it('leave the bars the Artisan lane is forging with, and take them once it is not', () => {
    expect(materialFor(smith(false), 'deepVault')).toBe('copper-bar');
    expect(materialsFor(smith(false), 'deepVault', 100_000)?.count).toBeGreaterThan(0);
    expect(materialsFor(smith(true), 'deepVault', 100_000)).toBeNull();
  });

  it('leave a material locked in the Storehouse', () => {
    const s = smith(false);
    s.features.storehouse = { enlargements: 0, locked: ['copper-bar'] };
    expect(materialsFor(s, 'deepVault', 100_000)).toBeNull();
  });
});
