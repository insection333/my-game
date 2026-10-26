// The climb to 99 (session 12): a player of version 1 loses nothing. The XP table to 40 is as it was,
// so every level reached stays reached, and every skill's perks at levels 10 to 40 add up to what they
// did before; past 40 every level still unlocks something.
import { emptyLevels, levelFor, MAX_LEVEL, XP_TABLE } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import { perksAt } from '../src/shared/skill.ts';

const skills = FEATURES.flatMap((f) => (f.content.skill ? [f.content.skill] : []));
const ladderOf = (id: string) => skills.find((s) => s.id === id)!.ladder;
const nonZero = (m: Record<string, number>) => Object.fromEntries(Object.entries(m).filter(([, v]) => v));

describe('the climb to 99', () => {
  it('keeps the XP table to 40 exactly as version 1 had it', () => {
    expect([XP_TABLE[2], XP_TABLE[10], XP_TABLE[20], XP_TABLE[30], XP_TABLE[39], XP_TABLE[40]]).toEqual([
      50, 6_790, 155_000, 1_360_000, 6_900_000, 8_100_000,
    ]);
    expect(levelFor(8_100_000)).toBe(40);
    expect(XP_TABLE).toHaveLength(MAX_LEVEL + 1);
  });

  it("keeps every skill's perks at 40 as they were", () => {
    const at40 = (id: string) => nonZero(perksAt(ladderOf(id), 40));
    for (const id of ['woodcutting', 'mining'])
      expect(at40(id), id).toEqual({ speed: 20, extraYield: 34, findChance: 64, masteryGain: 42 });
    expect(at40('smithing')).toEqual({ speed: 9, saveInput: 20, findChance: 24, masteryGain: 16 });
    for (const id of ['melee', 'archery', 'magic'])
      expect(at40(id), id).toEqual({ damage: 35, accuracy: 18, guard: 22.5, spoils: 48 });
    expect(at40('hitpoints')).toEqual({ maxHealth: 1560, regen: 50, foodHeal: 30, retreatAt: 12 });
  });

  it('unlocks something at every level to 99, and ends each skill on a capstone', () => {
    for (const s of skills) {
      expect(emptyLevels(s.ladder), s.id).toEqual([]);
      expect(
        s.ladder[MAX_LEVEL - 1].some((u) => u.type === 'perk'),
        s.id,
      ).toBe(true);
    }
  });
});
