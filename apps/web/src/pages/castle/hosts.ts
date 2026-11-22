// The two hosts of a battle as figures (session 168): each side's three troops drawn as figures, nine to a
// side, shared out as its formation's shares (every share above nothing has a figure), each troop at its
// evolution: yours at your levels, a foe's at the level it fights at. Pure, for the battlefield and the
// Army's battle line.
import { UNITS, type UnitId } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';

export const FIGURES = 9;
const IDS: readonly UnitId[] = ['vanguard', 'outriders', 'siege'];

export interface Rank {
  unit: UnitId;
  /** The troop's picture at its evolution. */
  icon: string;
  count: number;
}

/** Nine figures shared out by `shares` (any three non-negative numbers), largest remainders first; a share
 *  above nothing keeps at least one figure. */
export function figuresOf(shares: readonly number[]): number[] {
  const total = shares.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  const exact = shares.map((x) => (Math.max(0, x) / total) * FIGURES);
  const counts = exact.map((x, i) => (shares[i] > 0 ? Math.max(1, Math.floor(x)) : 0));
  let left = FIGURES - counts.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0 && k < 30; k++) {
    const i = order[k % 3][1];
    if (shares[i] > 0) {
      counts[i]++;
      left--;
    }
  }
  while (left < 0) {
    const i = counts.indexOf(Math.max(...counts));
    counts[i]--;
    left++;
  }
  return counts;
}

/** A host: its three ranks at the evolution of each troop's level. */
export function hostOf(shares: readonly number[], levels: Record<UnitId, number>): Rank[] {
  const counts = figuresOf(shares);
  return IDS.map((unit, i) => {
    const u = UNITS.find((x) => x.id === unit)!;
    return { unit, icon: u.evolutions[E.evolutionOf(Math.max(1, Math.round(levels[unit])))], count: counts[i] };
  });
}

/** Every troop of a foe at one level (a stronghold's, a fortress's tier). */
export const allAt = (level: number): Record<UnitId, number> => ({ vanguard: level, outriders: level, siege: level });

/** The level a castle of this rating fights at, as a stronghold's is reckoned (every military level at L
 *  rates 540 × L^1.05): for a lord's host where only their rating is known. */
export const levelOfRating = (rating: number): number => Math.max(1, (Math.max(1, rating) / 540) ** (1 / 1.05));

export interface FieldHost {
  ranks: Rank[];
  crest: string;
}
export interface Field {
  you: FieldHost;
  foe: FieldHost;
}

/** A battle's two hosts: yours in the shares sent at your troops' levels, theirs in their garrison's shares
 *  at the level they fight at. */
export function fieldOf(
  c: E.Castle,
  sent: readonly number[],
  foe: { shares: readonly number[]; level: number; crest: string },
): Field {
  return {
    you: { ranks: hostOf(sent, c.levels), crest: c.userId },
    foe: { ranks: hostOf(foe.shares, allAt(foe.level)), crest: foe.crest },
  };
}

/** The level a target fights at: a stronghold's own, the fortress's tier, a lord's from their rating. */
export function targetLevel(t: { merc: E.Mercenary | null; fortress?: number | null; rating: number }): number {
  if (t.merc) return t.merc.level;
  if (t.fortress) return t.fortress;
  return levelOfRating(t.rating);
}

/** The field for a battle about to be fought: what is known of their defence (an even garrison if
 *  nothing is), and yours as sent. */
export const fieldFor = (c: E.Castle, sent: readonly number[], def: E.Side | null, level: number, crest: string) =>
  fieldOf(c, sent, { shares: def ? def.shares : [1, 1, 1], level, crest });
