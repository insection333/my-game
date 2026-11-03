// Castle Clash in the year (session 33, docs/castle-clash/DESIGN.md section 7): a year's player raises
// their castle once their total level allows and keeps it on each visit as a careful lord would:
// - answer the Call to arms, keep the Edict of Vigor powered (twice the treasury it needs, deposited
//   from the purse), and spend a share of what is left on the castle's levels and the War College;
// - spend AP on incursions while the next fortress is likely to fall, a dig of the foundations a day
//   while the gold allows, and drill otherwise;
// - forge relics with spare war marks.
// The edict is mirrored into the save before the engine plays time away, as the server does, so the
// year's checks run with the edict lifting every skill's XP.
import {
  BUILDINGS,
  RELICS,
  SIEGE,
  SINKS,
  TECH_IDS,
  UNIT_IDS,
  UNITS,
  type BuildingId,
  type UnitId,
} from '@idle-clash/content';
import { castleEngine as E, totalLevel } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { mirrored } from '../../../apps/server/src/castle/mirror.ts';

export interface CastleDay {
  /** Average castle level, the edict's bonus now, the treasury and what it needs. */
  level: number;
  pct: number;
  treasury: number;
  required: number;
  /** Gold the castle took from the purse today: deposits, levels and studies (upkeep is the treasury's). */
  spent: number;
  tier: number;
  marks: number;
  rating: number;
}

/** A share of the gold left after the treasury is topped up, spent on the castle each visit; nearly all once
 *  every skill is at 99 and there is little else to save for. */
const BUILD_SHARE = 0.2;
const BUILD_SHARE_AT_99 = 0.9;
const ALL_AT_99 = 99 * 11;
/** Past 99: sieges of strongholds a day (as many as come before fatigue), and tempering tries a visit. */
const STRONGHOLDS_A_DAY = SIEGE.FATIGUE_FREE;
const TEMPERS_A_VISIT = 3;
/** The treasury kept: this many times what the edict needs. */
const TREASURY_TIMES = 1.5;

export class Lordship {
  castle: E.Castle | null = null;
  private roll: () => number;
  constructor(seed: number) {
    let s = seed;
    this.roll = () => {
      s = (s + 0x6d2b79f5) | 0;
      let r = Math.imul(s ^ (s >>> 15), 1 | s);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
    };
  }

  /** Before the engine plays time away: the edict as the castle can pay for it now (the server's mirror). */
  arrive(state: State, t: number): State {
    return mirrored(state, this.castle, t);
  }

  /** A visit's castle-keeping; returns the save (its purse spent) and the castle's day. */
  keep(state: State, t: number): { state: State; day: CastleDay | null; firsts: string[] } {
    const level = totalLevel(state);
    const share = level >= ALL_AT_99 ? BUILD_SHARE_AT_99 : BUILD_SHARE;
    const firsts: string[] = [];
    if (!this.castle) {
      if (!E.castleOpen(level)) return { state, day: null, firsts };
      this.castle = E.newCastle('lord', t);
      firsts.push('castle');
    }
    const was = this.castle;
    const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
    let c = E.syncCastle(this.castle, t).castle;
    const call = E.claimCallToArms(c, t);
    if (call.ok) c = call.castle;
    let purse = state.items.gold ?? 0;
    const start = purse;
    const wallet = (): E.Wallet => ({ castle: c, purse });
    const apply = (d: E.Done) => {
      if (!d.ok) return false;
      c = d.castle;
      purse = d.purse;
      return true;
    };
    apply(E.setEdict(wallet(), 'vigor'));
    // The treasury: twice what the edict needs, from the purse.
    const required = E.requiredTreasury(c, level);
    const short = Math.max(0, Math.round(TREASURY_TIMES * required) - c.treasury);
    if (short > 0 && purse > 0) apply(E.deposit(wallet(), Math.min(short, Math.floor(purse))));
    // Building, once the treasury is whole: the cheapest level first, then the War College with marks.
    if (c.treasury >= required) {
      let budget = Math.floor(purse * share);
      const levelCost = (id: BuildingId | UnitId) =>
        E.levelCost(c, [...BUILDINGS, ...UNITS].find((x) => x.id === id)!.cost, c.levels[id], t);
      for (;;) {
        const id = [...BUILDINGS, ...UNITS]
          .map((x) => x.id)
          .filter((x) => c.levels[x] < 100)
          .sort((a, b) => levelCost(a) - levelCost(b))[0];
        if (!id || levelCost(id) > budget) break;
        const before = purse;
        if (!apply(E.upgrade(wallet(), id, t))) break;
        budget -= before - purse;
      }
      for (const tech of TECH_IDS) {
        const cost = E.techCost(c, tech, t);
        if (cost && cost.gold <= budget && c.warMarks >= cost.marks) {
          const before = purse;
          if (apply(E.research(wallet(), tech, t))) budget -= before - purse;
        }
      }
    }
    // AP: incursions while the fortress is likely to fall, a dig, then drill.
    let dug = false;
    for (let guard = 0; guard < 40; guard++) {
      if (c.activeAp < SINKS.DRILL_AP) break;
      if (c.activeAp >= SINKS.INCURSION_AP) {
        const odds = E.combatRatio(E.castleSide(c, t, 'attack'), E.fortressSide(c.incursionTier), 0.5).r;
        if (odds >= 1.05) {
          const r = E.launchIncursion(c, t, this.roll(), this.roll());
          if (r !== 'ap') {
            c = r.castle;
            continue;
          }
        }
      }
      // The deep foundations, once a day while the gold allows: the vault and the edict both grow.
      const dig = E.excavationCost(c, t);
      if (!dug && c.activeAp >= dig.ap && dig.gold <= purse * share && apply(E.excavate(wallet(), t))) {
        dug = true;
        continue;
      }
      const unit = [...UNIT_IDS].sort((a, b) => c.drillXp[a] - c.drillXp[b])[0];
      if (!apply(E.drill(wallet(), unit, 1))) break;
    }
    // Once every skill is at 99, the castle's war is the lord's chase: the day's easier strongholds, in the
    // formation set against each, for war marks (the fee burned, no bounty from an empty realm's chest).
    if (level >= ALL_AT_99)
      for (const m of E.mercenaries(c, t, SIEGE.TARGETS)) {
        if (c.siegesDayUtc === E.formatUtcDate(t) && c.siegesToday >= STRONGHOLDS_A_DAY) break;
        const side = E.mercenarySide(m);
        const best = E.bestOffense(c, side, t);
        if (E.winChance(best.r) < 0.6) continue;
        c = { ...c, offense: best.shares };
        const costs = E.mercenaryCosts(c, m, t);
        if (E.siegeRefusal(c, m.id, false, costs.ap, t) || costs.gold > purse * share) continue;
        const paid = E.pay(wallet(), costs.gold);
        if (!paid) continue;
        purse = paid.purse;
        c = E.resolveMercenary(E.launch(paid.castle, m.id, costs.ap, t, false), m, t, this.roll(), 0).attacker;
      }
    // Relics with spare war marks, one at a time to its last level; then tempering it, a few tries a visit.
    if (E.tabOpen(c, 'halls')) {
      const forging = RELICS.find((r) => E.relicCost(c, r.id));
      for (let n = 0; forging && n < 5; n++) {
        const cost = E.relicCost(c, forging.id);
        if (!cost || c.warMarks < cost.marks || purse * share < cost.gold || !apply(E.forgeRelic(wallet(), forging.id)))
          break;
      }
      for (const r of RELICS)
        for (let n = 0; n < TEMPERS_A_VISIT; n++) {
          const cost = E.temperCost(c, r.id);
          if (!cost || c.warMarks < cost.marks || purse * share < cost.gold) break;
          const done = E.temperRelic(wallet(), r.id, this.roll(), this.roll());
          if (!done.ok) break;
          c = done.castle;
          purse = done.purse;
        }
    }
    if (c.equippedRelics.length < 3) {
      const owned = Object.keys(c.relics).slice(0, 3);
      apply(E.equipRelics(wallet(), owned));
    }
    c = { ...c, rating: Math.max(c.rating, E.bastionRating(c)) };
    // What was new in the castle today: a fortress taken, a level raised, a study, a relic.
    if (c.incursionTier > was.incursionTier) firsts.push('castle:tier');
    // A building or a troop raised a level, as a work of the steading raised a stage.
    if (sum(c.levels) > sum(was.levels)) firsts.push('castle:raise');
    if (sum(c.techs) > sum(was.techs)) firsts.push('castle:study');
    if (c.excavationDepth > was.excavationDepth) firsts.push('castle:dig');
    if (sum(c.relics) > sum(was.relics)) firsts.push('castle:relic');
    if (sum(c.tempers) > sum(was.tempers)) firsts.push('castle:temper');
    this.castle = c;
    const next = mirrored({ ...state, items: { ...state.items, gold: Math.max(0, Math.floor(purse)) } }, c, t);
    return {
      state: next,
      firsts,
      day: {
        level: E.avgLevel(c),
        pct: E.edictBonusPct(c, level),
        treasury: c.treasury,
        required: E.requiredTreasury(c, level),
        spent: start - purse,
        tier: c.incursionTier,
        marks: c.warMarksEarned,
        rating: c.rating,
      },
    };
  }
}
