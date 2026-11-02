// Castle Clash's planning (session 34): what the page shows before a battle. The chance to win from the
// battle's roll, the attack formation that does best against a garrison it knows, an estimate of a
// scouted lord's defence from their rating and the garrison the scouting saw, and what a win would bring
// (session 38). Pure.
import { COMBAT, SIEGE, SPY_MISSIONS } from '@idle-clash/content';
import type { Castle, Debuff, DebuffKind, Shares } from './castle.ts';
import { attackPower, castleSide, combatRatio, defensePower, type Side } from './combat.ts';
import { lift, modifiers } from './effects.ts';
import { mercenaryBounty, strongholdMarks, strongholdPay, type Mercenary } from './mercenaries.ts';
import { marksReward, overextensionReward } from './siege.ts';

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
 *  garrison, trap and castellan the scouting saw, under the sabotage your spies have laid on them since
 *  (it bites only in a fair fight, as in the siege itself). Their walls, techs and relics are unknown, so it
 *  is an estimate, and the page says so. */
export function estimatedDefence(
  c: Castle,
  seen: { defense: readonly number[]; trap: string | null; castellan: string | null },
  rating: number,
  now: number,
  sabotage: readonly Debuff[] = [],
): Side {
  const proxy: Castle = {
    ...c,
    defense: [seen.defense[0] ?? 34, seen.defense[1] ?? 33, seen.defense[2] ?? 33] as unknown as Shares,
    activeTrap: seen.trap,
    castellan: seen.castellan,
    genuineReceived: [],
    debuffs: [...sabotage],
    immunities: {},
    infirmaryPct: 0,
    wallIntegrity: 100,
  };
  const fair = rating / Math.max(1, c.rating) <= SIEGE.GENUINE_MAX_RATIO;
  const side = castleSide(proxy, now, 'defense', { totalLevel: 0, fair });
  const k = rating / Math.max(1, c.rating);
  return { ...side, base: side.base.map((b) => b * k) as [number, number, number], morale: 1 };
}

/** The sabotage your spies have laid on a lord and that still holds, as your reports tell it (the lord's
 *  own castle is not yours to read): each successful mission's debuff from when it was sent, stacked as
 *  the mission allows, less what a fair siege of yours has since consumed. Another lord's siege may have
 *  consumed it too, unseen: the estimate says "about". */
export function sabotageSent(
  reports: readonly { kind: string; at: number; data: Record<string, unknown> }[],
  target: string,
  now: number,
): Debuff[] {
  // A fair siege of yours since consumed what was laid before it.
  const consumed = Math.max(
    0,
    ...reports
      .filter((r) => r.kind === 'siegeOut' && r.data.foe === target && r.data.genuine === true)
      .map((r) => r.at),
  );
  const out: Debuff[] = [];
  for (const m of SPY_MISSIONS) {
    if (!m.debuff) continue;
    const sent = reports.filter(
      (r) =>
        r.kind === 'spyOut' &&
        r.data.foe === target &&
        r.data.mission === m.id &&
        r.data.success === true &&
        r.at > consumed &&
        r.at + m.debuff!.lasts > now,
    );
    if (sent.length)
      out.push({
        kind: m.id as DebuffKind,
        stacks: Math.min(m.debuff.max, sent.length),
        until: Math.max(...sent.map((r) => r.at)) + m.debuff.lasts,
      });
  }
  return out;
}

/** What a stronghold gives if it falls: its war marks, and the bounty the war chest can pay now. */
export const strongholdSpoils = (c: Castle, m: Mercenary, chest: number, now: number) => ({
  marks: strongholdMarks(c, m, 'decisive', now),
  bounty: mercenaryBounty(c.rating, chest, strongholdPay(m)),
});

/** What a siege on a lord can bring at most: the gold yours of what a scouting saw raidable (null when
 *  not scouted), and the war marks of a narrow and a decisive breach. */
export function lordSpoils(c: Castle, rating: number, raidable: number | null, now: number) {
  const ratio = rating / Math.max(1, c.rating);
  const k = marksReward(ratio) * lift(modifiers(c, now).marks);
  return {
    gold: raidable === null ? null : Math.floor(raidable * overextensionReward(ratio) * SIEGE.SPOILS_TO_ATTACKER),
    marks: [Math.round(SIEGE.MARKS_GRAZE * k), Math.round(SIEGE.MARKS_DECISIVE * k)] as const,
  };
}
