// An ingredient short, said on its row (session 125): Cooked perch said "Takes Perch ×2, Pine logs ×1" to a
// player with no perch, and Start was answered only by "Out of perch"; a standing stone's row already said
// its key was not held (session 102). A row now says which ingredients are short of one go.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import type { SkillActionRow } from '../src/shared/skill-slots.ts';

const T0 = Date.UTC(2026, 10, 17, 9);
const takes = (items: Record<string, number>): string | null => {
  const s: State = { ...newState(3, T0), skills: { cooking: { xp: XP_TABLE[1] } }, items };
  const cooking = FEATURES.find((f) => f.id === 'cooking')!;
  const rows = cooking.slots['skill.actions']({ state: s, now: T0 }) as unknown as SkillActionRow[];
  return rows.find((r) => r.action.id === 'cooked-perch')!.takes;
};

describe("a row's ingredients", () => {
  it('say which are short of one go', () => {
    expect(takes({ 'pine-logs': 5 })).toBe('Takes Perch ×2, Pine logs ×1; short of perch');
    expect(takes({ perch: 1 })).toBe('Takes Perch ×2, Pine logs ×1; short of perch and pine logs');
    expect(takes({ perch: 2, 'pine-logs': 1 })).toBe('Takes Perch ×2, Pine logs ×1');
  });
});
