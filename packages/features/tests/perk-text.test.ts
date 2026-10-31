// A perk's rank is worded as where the perk now stands, never as a numeral: "Quick swing (26.25%
// faster in all)" says what a level brings in a way "Quick swing XXI" does not.
import { formatEffect, type Effect } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import { unlockText } from '../src/shared/skill.ts';

const skills = FEATURES.filter((f) => f.content.skill);

describe('perk ranks as the player reads them', () => {
  it('carry no numerals on any skill', () => {
    for (const f of skills)
      for (const level of f.content.skill!.ladder)
        for (const u of level)
          expect(unlockText(f.id, f.content.skill!.ladder, u)).not.toMatch(/\b[IVXL]{2,}\b|\b[VX]\b/);
  });

  it('say the first rank as it is, and each later rank as the perk now stands', () => {
    const f = FEATURES.find((x) => x.id === 'woodcutting')!;
    const ladder = f.content.skill!.ladder;
    const ranks = ladder.flat().filter((u) => u.type === 'perk' && u.perk === 'quick-swing');
    expect(ranks.length).toBeGreaterThan(2);
    const [first, second] = ranks;
    expect(unlockText(f.id, ladder, first)).toBe(
      `Quick swing (${formatEffect(first.type === 'perk' ? first.effect : (null as never))})`,
    );
    const pct = (u: (typeof ranks)[number]) => (u.type === 'perk' && 'pct' in u.effect ? u.effect.pct : 0);
    const total = { kind: 'speed', pct: pct(first) + pct(second) } as Effect;
    expect(unlockText(f.id, ladder, second)).toBe(`Quick swing (${formatEffect(total)} in all)`);
  });
});
