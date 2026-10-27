// The deeds (docs/EXPANSION.md, step 15): about 280 achievements made from the game's own content
// (every skill, action, foe, find and tier), so a skill, foe or find added later brings its deeds with
// it. Each deed is a target on one reading of the save; its words are its family's strings filled
// with its numbers, so the text can never disagree with what it asks. Tiers give points: easy 5,
// hard 15, elite 40, master 100.
import { placeholders, t, templateOf } from '@idle-clash/content';
import { ENLARGE_COSTS } from '../shared/storehouse.ts';
import type { Reader } from './reader.ts';

export const DEED_TIERS = ['easy', 'hard', 'elite', 'master'] as const;
export type DeedTier = (typeof DEED_TIERS)[number];
export const POINTS: Record<DeedTier, number> = { easy: 5, hard: 15, elite: 40, master: 100 };

export interface Deed {
  id: string;
  /** Its family: the strings its words come from (`deed.<family>.name`, `.text`) and where it is listed. */
  family: string;
  /** Its row in the family's table: a skill, a foe; '' in a family of one row. */
  row: string;
  tier: DeedTier;
  target: number;
  /** The strings its words come from, and their values, numbers already through the formatter. */
  key: string;
  words: Record<string, string>;
  /** Its medallion: a short mark ("40", "10K") or an icon (a Legendary find, a skill's seal). */
  mark: string;
  icon: string | null;
  /** Its words stay unread until it is done. */
  hidden: boolean;
  /** How its progress reads: a count, a time (minutes), or simply done or not. */
  shows: 'count' | 'minutes' | 'none';
  measure: (r: Reader) => number;
}

// The numbers each family climbs through, with each step's tier.
export type Steps = readonly (readonly [number, DeedTier])[];
export const LEVELS: Steps = [
  [10, 'easy'],
  [25, 'easy'],
  [40, 'hard'],
  [55, 'hard'],
  [70, 'elite'],
  [85, 'elite'],
  [99, 'master'],
];
export const RANK_TIERS: DeedTier[] = [
  'easy',
  'easy',
  'easy',
  'hard',
  'hard',
  'hard',
  'elite',
  'elite',
  'elite',
  'master',
  'master',
  'master',
];
export const WORK: Steps = [
  [100, 'easy'],
  [1_000, 'hard'],
  [10_000, 'elite'],
  [100_000, 'master'],
];
export const MASTERY: Steps = [
  [3, 'easy'],
  [6, 'hard'],
  [10, 'elite'],
];
export const MASTERED: Steps = [
  [10, 'elite'],
  [50, 'master'],
];
export const FOE_COUNTS: Steps = [
  [10, 'easy'],
  [100, 'hard'],
  [1_000, 'elite'],
];
export const REGION_TIERS: DeedTier[] = ['easy', 'hard', 'elite'];
export const DEFEATS: Steps = [
  [100, 'easy'],
  [1_000, 'hard'],
  [10_000, 'elite'],
  [100_000, 'master'],
];
export const GEAR_TIERS: DeedTier[] = ['easy', 'easy', 'hard', 'hard', 'elite', 'elite', 'master', 'master'];
export const COLLECTOR: Steps = [
  [10, 'easy'],
  [30, 'hard'],
  [45, 'elite'],
];
export const FIRE: Steps = [
  [15, 'easy'],
  [30, 'easy'],
  [60, 'hard'],
  [120, 'hard'],
  [240, 'elite'],
  [360, 'master'],
];
export const GOLD: Steps = [
  [1_000, 'easy'],
  [10_000, 'easy'],
  [100_000, 'hard'],
  [1_000_000, 'elite'],
  [10_000_000, 'master'],
];
export const STORE: Steps = [
  [1, 'easy'],
  [5, 'hard'],
  [15, 'elite'],
  [ENLARGE_COSTS.length, 'master'],
];
/** The hidden deeds' numbers. */
export const HIDDEN = { jack: 25, even: 10, hoard: 10_000 };

export const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const skillName = (s: string) => t(`skill.${s}`);

type Defaults = 'hidden' | 'shows' | 'icon' | 'key' | 'row';
/** A deed, with the usual defaults: shown, counted, no icon, its family's strings, one row. */
export const deed = (d: Omit<Deed, Defaults> & Partial<Pick<Deed, Defaults>>): Deed => ({
  hidden: false,
  shows: 'count',
  icon: null,
  key: `deed.${d.family}`,
  row: '',
  ...d,
});

/** A deed's name or text: its family's string, given the words it uses (a name may use fewer). */
export function wordsOf(d: Pick<Deed, 'key' | 'words'>, part: 'name' | 'text'): string {
  const key = `${d.key}.${part}`;
  const wanted = placeholders(templateOf(key) ?? '');
  return t(key, Object.fromEntries(Object.entries(d.words).filter(([k]) => wanted.includes(k))));
}
