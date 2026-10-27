// Kindling (step 17), on paper: past 99 a skill's XP keeps counting, and every KINDLE_XP of it is a
// Kindling, sized to take about a quarter of the first climb at the top's pace. At 99 each skill with
// actions of its own takes a Path, which a player may change at any time: more of what it makes, more
// XP, or more finds; each of the first five Kindlings strengthens it. Nothing is ever lost.
export const KINDLE_XP = 37_000_000;
/** Kindlings past this many still count (a flame on the seal, the hiscores) but strengthen nothing. */
export const KINDLINGS_THAT_STRENGTHEN = 5;

export interface Path {
  id: string;
  /** What it raises, by how much at 99, and how much more with each of the first five Kindlings. */
  raises: 'items' | 'xp' | 'finds';
  pct: number;
  perKindling: number;
}
export const PATHS: Path[] = [
  { id: 'bounty', raises: 'items', pct: 15, perKindling: 3 },
  { id: 'lore', raises: 'xp', pct: 15, perKindling: 3 },
  { id: 'fortune', raises: 'finds', pct: 50, perKindling: 10 },
];

/** A Path's bonus, in percent, with a number of Kindlings. */
export const pathPct = (p: Path, kindlings: number) =>
  p.pct + p.perKindling * Math.min(kindlings, KINDLINGS_THAT_STRENGTHEN);
