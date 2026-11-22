// Late unlocks filled (session 176): past level 40 new actions came eleven to fifteen levels apart (a
// gathering skill's at 44, 55, 59, 70, 74, 85, 89; Fletching's at 40, 55, 70, 85), so for weeks a level-up
// gave a percent or two. Each gathering skill now has a lucky action in its last four tiers and Fletching
// its hand-fletched arrows: no skill waits more than ten levels for something new to do.
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';

const MAX_GAP = 10;

describe('new actions come at most ten levels apart', () => {
  for (const f of FEATURES.filter((x) => x.content.skill && (x.content.actions ?? []).length > 0)) {
    it(f.id, () => {
      const levels = [...new Set((f.content.actions ?? []).map((a) => a.level))].sort((a, b) => a - b);
      const gaps = [...levels, 99].slice(1).map((l, i) => [levels[i], l - levels[i]] as const);
      expect(gaps.filter(([, gap]) => gap > MAX_GAP)).toEqual([]);
    });
  }
});
