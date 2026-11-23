// The next Kindling on the Hearth (session 195): Next up names the three nearest unlocks across the skills,
// and a skill at 99 has none left, so a player with every skill at 99 found Next up with nothing of their
// skills at all, where the next flame on a seal is the climb they are on. A skill at 99 now offers its next
// Kindling there, so it stands among the unlocks by how far away it is.
import { XP_TABLE } from '@idle-clash/content';
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { woodcutting } from '../src/woodcutting/index.ts';
import { KINDLE_XP } from '../src/shared/kindling.ts';
import '../src/index.ts';

const T0 = Date.UTC(2026, 10, 23, 9);

describe('the next Kindling in Next up', () => {
  it('is offered by a skill at 99, with how far away it is', () => {
    const xp = XP_TABLE[99] + 2 * KINDLE_XP + 1_000;
    const s = { ...newState(1, T0), skills: { woodcutting: { xp } } };
    const row = woodcutting.slots['hearth.nextUp']({ state: s, now: T0 }) as {
      skill: string;
      text: string;
      xpAway: number;
    } | null;
    expect(row).toMatchObject({ skill: 'woodcutting', xpAway: KINDLE_XP - 1_000 });
    expect(row!.text).toBe('Kindling 3: another flame on its seal');
  });
});
