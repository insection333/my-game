// Six bosses, not three (session 210, the plan *Dead and short content, 23 November*): each region had one
// boss, at its last tier, so the first boss came about a month in, a newcomer's run into the march ended
// against a Troll-chief its Hitpoints had not opened, and from the last first win (about day 176) every run's
// end, daily boss and realm's boss was one of the same three for good. Each region now has a second boss a
// tier or two below its last; a run's boss is drawn with its route from those the player has opened.
import { XP_TABLE } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { BOSSES, bossesIn, REGIONS } from '../src/shared/expeditions/data.ts';
import { HONOURS } from '../src/deeds/honours.ts';
import { COMPANIONS } from '../src/shared/companions.ts';
import { bossOfRun, nextRoute } from '../src/expeditions/route.ts';
import { fighterAt } from './helpers/expedition.ts';

const atHitpoints = (region: (typeof REGIONS)[number], level: number, seed = 1) => {
  const s = fighterAt(region, seed);
  return { ...s, skills: { ...s.skills, hitpoints: { xp: XP_TABLE[level] } } };
};
const bossesOver = (region: (typeof REGIONS)[number], level: number) =>
  new Set(
    Array.from({ length: 40 }, (_, seed) => bossOfRun(nextRoute(atHitpoints(region, level, seed), region, 1)!).id),
  );

describe('six bosses', () => {
  it('stand two to a region, each a tier or more apart, the first opened in the first days', () => {
    expect(BOSSES).toHaveLength(6);
    for (const region of REGIONS) {
      const [weak, strong] = bossesIn(region);
      expect(strong.level - weak.level).toBeGreaterThanOrEqual(15);
    }
    expect(Math.min(...BOSSES.map((b) => b.hitpoints))).toBeLessThanOrEqual(25);
  });

  it("end a newcomer's march run at the boss their Hitpoints can face, then either once both are open", () => {
    expect(bossesOver('march', 22)).toEqual(new Set(['barrow-king']));
    expect(bossesOver('march', 40)).toEqual(new Set(['barrow-king', 'troll-chief']));
    expect(bossesOver('fen', 70)).toEqual(new Set(['mire-mother', 'drowned-warden']));
    expect(bossesOver('peaks', 99)).toEqual(new Set(['storm-roc', 'ember-wyrm']));
  });

  it('keep a run set out before them at the boss it was going to', () => {
    const route = nextRoute(atHitpoints('fen', 70), 'fen', 1)!;
    const { boss: _drawn, ...older } = route;
    expect(bossOfRun(older).id).toBe('drowned-warden');
  });

  it('each bring finds, a picture, a companion and a share in the title for them all', () => {
    for (const b of BOSSES) {
      expect(HONOURS.some((h) => h.kind === 'picture' && h.id === b.id)).toBe(true);
      expect(COMPANIONS.some((c) => c.boss === b.id)).toBe(true);
    }
    expect(new Set(BOSSES.flatMap((b) => [b.finds.rare, b.finds.legendary])).size).toBe(12);
    expect(HONOURS.find((h) => h.id === 'bossbane')?.unlock).toEqual({ deed: 'bosses-all' });
  });
});
