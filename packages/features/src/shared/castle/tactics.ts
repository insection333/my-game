// Castle Clash's planning (session 34): what the page shows before a battle. The chance to win from the
// battle's roll, the attack formation that does best against a garrison it knows, and an estimate of a
// scouted lord's defence from their rating and the garrison the scouting saw. Pure.
import { COMBAT } from '@idle-clash/content';
import type { Castle, Shares } from './castle.ts';
import { attackPower, castleSide, combatRatio, defensePower, type Side } from './combat.ts';

/** The chance a battle of even-roll ratio `r` ends at R ≥ 1 (a breach, or a fortress taken): R is r times
 *  a uniform spread of ± COMBAT.ROLL_SPREAD. */
export function winChance(r: number): number {
  const s = COMBAT.ROLL_SPREAD;
  if (!Number.isFinite(r)) return 1;
  if (r <= 0) return 0;
  const need = (1 / r - (1 - s)) / (2 * s);
  return Math.min(1, Math.max(0, 1 - need));
}

/** The even-roll ratio of a castle's attack in a formation against a defending side. */
export function oddsWith(c: Castle, shares: Shares, def: Side, now: number): number {
  return combatRatio(castleSide({ ...c, offense: shares }, now, 'attack'), def, 0.5).r;
}

/** Every formation on the five-percent grid, each share 0 to 100. */
const GRID: Shares[] = (() => {
  const out: Shares[] = [];
  for (let a = 0; a <= 100; a += 5) for (let b = 0; a + b <= 100; b += 5) out.push([a, b, 100 - a - b]);
  return out;
})();

/** The attack formation that does best against a defending side, and its even-roll ratio. */
export function bestOffense(c: Castle, def: Side, now: number): { shares: Shares; r: number } {
  const att = castleSide(c, now, 'attack');
  let best = { shares: c.offense, r: -1 };
  for (const shares of GRID) {
    const side = { ...att, shares: shares.map((x) => x / 100) as [number, number, number] };
    const d = defensePower(def, side);
    const r = d > 0 ? attackPower(side, def) / d : Infinity;
    if (r > best.r + 1e-9) best = { shares, r };
  }
  return best;
}

/** A scouted lord's defence, estimated: your own castle's strength scaled to their rating, in the
 *  garrison, trap and castellan the scouting saw. Their walls, techs and relics are unknown, so it is an
 *  estimate, and the page says so. */
export function estimatedDefence(
  c: Castle,
  seen: { defense: readonly number[]; trap: string | null; castellan: string | null },
  rating: number,
  now: number,
): Side {
  const proxy: Castle = {
    ...c,
    defense: [seen.defense[0] ?? 34, seen.defense[1] ?? 33, seen.defense[2] ?? 33] as unknown as Shares,
    activeTrap: seen.trap,
    castellan: seen.castellan,
    genuineReceived: [],
    debuffs: [],
    infirmaryPct: 0,
    wallIntegrity: 100,
  };
  const side = castleSide(proxy, now, 'defense', { totalLevel: 0, fair: false });
  const k = rating / Math.max(1, c.rating);
  return { ...side, base: side.base.map((b) => b * k) as [number, number, number], morale: 1 };
}
