// Castle Clash's matchmaking (SPEC.md section 4E.5): lords within 0.75 to 1.35 of your rating come first;
// the list is filled with mercenary strongholds drawn from your id and the UTC day, so it holds still
// through a day. A mercenary pays war marks, and a bounty only from the war chest, always under the fee
// (DESIGN.md 11.4): no gold is ever made.
import { MERCENARY_NAMES, RECOVERY, SIEGE, TRAPS } from '@idle-clash/content';
import { formatUtcDate, type Castle } from './castle.ts';
import { combatRatio, castleSide, outcomeOf, type Outcome, type Side } from './combat.ts';
import { lift, modifiers, noModifiers } from './effects.ts';
import { statPower } from './economy.ts';
import { siegeCosts } from './siege.ts';

/** A 32-bit FNV-1a hash: a stable number from a string. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const GARRISONS: readonly (readonly [number, number, number])[] = [
  [34, 33, 33],
  [50, 30, 20],
  [20, 50, 30],
  [30, 20, 50],
  [40, 40, 20],
  [20, 40, 40],
  [40, 20, 40],
  [60, 20, 20],
];

export interface Mercenary {
  /** `merc:<day>:<n>`: a stronghold's id, used as the pair key against the attacker. */
  id: string;
  /** Name parts, each an index into MERCENARY_NAMES. */
  first: number;
  second: number;
  rating: number;
  level: number;
  garrison: readonly [number, number, number];
  trap: string;
}

/** The rating of a castle with every military level at L (buildings 240, units 300 per L^1.05). */
const RATING_PER_LEVEL = 540;

/** The day's strongholds for this attacker, `count` of them, around their rating. */
export function mercenaries(c: Castle, now: number, count: number): Mercenary[] {
  const day = formatUtcDate(now);
  return SIEGE.MERCENARY_SCALES.slice(0, count).map((scale, n) => {
    const h = hash(`${c.userId}:${day}:${n}`);
    const rating = Math.max(1, Math.round(Math.max(1, c.rating) * scale));
    return {
      id: `merc:${day}:${n}`,
      first: h % MERCENARY_NAMES.first.length,
      second: (h >>> 8) % MERCENARY_NAMES.second.length,
      rating,
      level: Math.max(1, (rating / RATING_PER_LEVEL) ** (1 / 1.05)),
      garrison: GARRISONS[(h >>> 16) % GARRISONS.length],
      trap: TRAPS[(h >>> 24) % TRAPS.length].id,
    };
  });
}

/** A stronghold as a defending side: every unit at its level, behind whole walls of that level. */
export function mercenarySide(m: Mercenary): Side {
  const power = statPower(100, m.level);
  return {
    base: [power, power, power],
    shares: m.garrison.map((g) => g / 100) as [number, number, number],
    mods: noModifiers(),
    wounded: 0,
    walls: { level: Math.round(m.level), integrity: 100 },
    trap: m.trap,
    vigilance: 0,
    morale: 1,
    poison: 0,
  };
}

/** A bounty: the smaller of 0.6 × GOLD_SCALE × the attacker's rating and 5% of the war chest. */
export const mercenaryBounty = (attackerRating: number, chest: number): number =>
  Math.max(
    0,
    Math.floor(
      Math.min(SIEGE.MERCENARY_BOUNTY_PER_RATING * Math.max(1, attackerRating), chest * SIEGE.MERCENARY_CHEST_SHARE),
    ),
  );

export interface MercenaryResult {
  attacker: Castle;
  outcome: Outcome;
  r: number;
  marks: number;
  bounty: number;
}

/** A siege on a stronghold (the attacker launched and paid already): war marks and a bounty on a breach. */
export function resolveMercenary(att: Castle, m: Mercenary, now: number, roll: number, chest: number): MercenaryResult {
  const { r } = combatRatio(castleSide(att, now, 'attack'), mercenarySide(m), roll);
  const outcome = outcomeOf(r);
  const mods = modifiers(att, now);
  const breach = outcome !== 'repelled';
  const marks = breach
    ? Math.round((outcome === 'decisive' ? SIEGE.MARKS_DECISIVE : SIEGE.MARKS_GRAZE) * lift(mods.marks))
    : 0;
  const wounds = (breach ? RECOVERY.WOUNDS_WINNER : RECOVERY.WOUNDS_LOSER) * lift(mods.woundsTaken);
  return {
    attacker: {
      ...att,
      warMarks: att.warMarks + marks,
      warMarksEarned: att.warMarksEarned + marks,
      infirmaryPct: Math.min(RECOVERY.INFIRMARY_MAX, att.infirmaryPct + wounds),
    },
    outcome,
    r,
    marks,
    bounty: breach ? mercenaryBounty(att.rating, chest) : 0,
  };
}

/** A stronghold's siege costs: as a lord's of the same rating. */
export const mercenaryCosts = (c: Castle, m: Mercenary, now: number) =>
  siegeCosts(c, m.rating / Math.max(1, c.rating), now);

/** Whether a lord is a fair match: unshielded, not you, within 0.75 to 1.35 of your rating. */
export const inBracket = (mine: number, theirs: number): boolean =>
  theirs >= SIEGE.BRACKET_LOW * mine && theirs <= SIEGE.BRACKET_HIGH * mine;
