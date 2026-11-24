// The Deep (session 212, the plan *Dead and short content, 23 November*): an endless descent under the Ashen
// Peaks for combat after 99, where the styles had no new place, foe or challenge left. A descent goes down
// one depth at a time in the Combat lane: ten minutes of fights against the Peaks' foes made stronger by
// depth, and every tenth depth one of the six bosses, its own way and all, made as strong as the Ember Wyrm
// at that depth. The week's omens (two of the twists and roads) and the season's hold for everyone. Reaching a
// tenth depth leaves a waystone, so the next descent starts there. Nothing ends it but the fighter.
import { BOSSES, bossIn, ROADS, TWISTS, type Boss, type Twist } from './data.ts';
import type { Foe } from '../combat/foes.ts';
import { seasonAt } from '../season.ts';
import { weekOf } from '../week-time.ts';

export const DEEP = {
  /** The Hitpoints level that opens it: Hitpoints keeps pace with the best style (session 177). */
  OPENS: 99,
  /** Each depth makes its foes this much stronger than the one above, in health, hits and gold: compounding,
   *  so the relics that answer it (each rank on what is left) keep the deepest growing, slowly, for good. */
  SCALE: 0.03,
  /** A boss every tenth depth, and a waystone. */
  EVERY: 10,
  STAGE_MINUTES: 10,
  /** The meals a descent carries, best first from what the Storehouse holds: food carried, not the clock,
   *  decides how deep a descent goes, so a night away goes no deeper than an hour's play. */
  PACK: 30,
} as const;

/** How much stronger the foes of a depth are than the Peaks' own. */
export const scaleAt = (depth: number): number => (1 + DEEP.SCALE) ** depth;

/** Where a descent starts: the deepest waystone reached. */
export const waystoneOf = (deepest: number): number => Math.floor(deepest / DEEP.EVERY) * DEEP.EVERY;

/** Whether a depth is a boss's. */
export const bossDepth = (depth: number): boolean => depth > 0 && depth % DEEP.EVERY === 0;

/** Marks a depth pays: one, as a run's stage does, and one more for each twenty depths down. */
export const marksAt = (depth: number): number => 1 + Math.floor(depth / (2 * DEEP.EVERY));

/** The omens that can hold a week: the twists and roads that change a fight, a find or what is paid (not a
 *  run's stages, caches or camps, which a descent has none of). */
export const OMEN_POOL: readonly Twist[] = [...TWISTS, ...ROADS].filter(
  (x) => x.hit || x.heal || x.foeHit || x.finds || x.drops || x.marks || x.bossHp || x.xp,
);

/** The week's two omens, drawn from the week's number (Monday 00:00 UTC), the same for everyone. */
export function omensOf(week: string): Twist[] {
  const n = Math.round(Date.parse(`${week}T00:00:00Z`) / (7 * 86_400_000));
  const len = OMEN_POOL.length;
  const a = (((n * 7) % len) + len) % len;
  const b = (a + 1 + ((((n * 3) % (len - 1)) + (len - 1)) % (len - 1))) % len;
  return [OMEN_POOL[a], OMEN_POOL[b]];
}

/** The season's omen (session 221): one more held in the Deep for the whole of a season, by its first twist,
 *  beside the week's two. Each is the twist's own in the dark: the Greenwood's roots slow the foes, the
 *  Forgefire's glow teaches more, the Muster's drums raise the foes and the marks alike, the Omens' falling
 *  stars bring finds, the Open Road's waymarks marks, the Plenty's larder drops. */
export const SEASON_OMENS: Readonly<Record<string, Twist>> = {
  greenwood: { id: 'rootbound', foeHit: 0.9 },
  forgefire: { id: 'forge-glow', xp: 1.1 },
  muster: { id: 'war-drums', foeHit: 1.1, marks: 1.5 },
  omens: { id: 'falling-stars', finds: 2 },
  road: { id: 'waymarks', marks: 1.25 },
  plenty: { id: 'deep-larder', drops: 1.5 },
};

/** The season's omen at a moment, or null before the first season. */
export function seasonOmenAt(at: number): Twist | null {
  const season = seasonAt(at);
  return season && Object.hasOwn(SEASON_OMENS, season.twist.id) ? SEASON_OMENS[season.twist.id] : null;
}

/** Every omen holding in the Deep at a moment: the week's two and the season's. */
export function omensAt(at: number): Twist[] {
  const season = seasonOmenAt(at);
  return season ? [...omensOf(weekOf(at)), season] : omensOf(weekOf(at));
}

/** One of the Peaks' foes as it stands at a depth: health, hits and gold grown by the depth. */
export const deepFoe = (foe: Foe, depth: number): Foe => {
  const f = scaleAt(depth);
  return { ...foe, hp: Math.round(foe.hp * f), maxHit: Math.round(foe.maxHit * f), gold: Math.round(foe.gold * f) };
};

/** The boss of a tenth depth: the six in turn, each with its own style, way and finds, made as strong as the
 *  Ember Wyrm grown by the depth, and paying its gold grown so too. */
export function deepBoss(depth: number): Boss {
  const b = BOSSES[(depth / DEEP.EVERY - 1) % BOSSES.length];
  const top = bossIn('peaks');
  const f = scaleAt(depth);
  return {
    ...b,
    level: top.level,
    hitpoints: top.hitpoints,
    tier: top.tier,
    hp: Math.round(top.hp * f),
    maxHit: Math.round(top.maxHit * f),
    gold: Math.round(b.gold * f),
  };
}
