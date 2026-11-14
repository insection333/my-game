// A stone's key, said (session 102): a standing stone past the first needs its tier's key, kept and never used
// up, but its row said nothing of it; Start was refused with "Needs a iron key" (sic) and no row had warned.
import { formatStop, XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import type { SkillActionRow } from '../src/shared/skill-slots.ts';

const T0 = Date.UTC(2026, 10, 14, 9);
const rows = (items: Record<string, number>): SkillActionRow[] => {
  const s: State = { ...newState(3, T0), skills: { runecraft: { xp: XP_TABLE[20] } }, items };
  const rc = FEATURES.find((f) => f.id === 'runecraft')!;
  return rc.slots['skill.actions']({ state: s, now: T0 }) as unknown as SkillActionRow[];
};
const row = (items: Record<string, number>, id: string) => rows(items).find((r) => r.action.id === id)!;

describe("a standing stone's key", () => {
  it('is named on its row, and said when not held', () => {
    expect(row({ 'iron-key': 1 }, 'tide-stone').needs).toBe('Needs Iron key (kept)');
    expect(row({}, 'tide-stone').needs).toBe('Needs Iron key, not held');
    expect(row({}, 'spark-stone').needs).toBeNull();
  });

  it('is named rightly when a stone is refused for it', () => {
    expect(formatStop({ code: 'needsKey', detail: { item: 'iron-key' } })).toBe('Needs the iron key');
  });
});
