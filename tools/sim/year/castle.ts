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
import { castleEngine as E, materialsFor, seasonAt, totalLevel } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { mirrored } from '../../../apps/server/src/castle/mirror.ts';
import { STAGES, stageCost, stageOf, WORKS } from '../../../packages/features/src/shared/steading.ts';

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
  /** War marks held, unspent (session 209: what a currency keeps once it has nothing to buy). */
  held: number;
  rating: number;
  /** The troops' evolution, the least evolved of the three (0 to 3), and their lowest level. */
  evolution: number;
  troops: number;
  /** Season's legends taken, all five chambers (session 220). */
  legends: number;
  /** The gold its own materials have paid towards levels so far (session 247). */
  materials: number;
}

/** A share of the gold left after the treasury is topped up, spent on the castle each visit; nearly all once
 *  every skill is at 99 and there is little else to save for. */
const BUILD_SHARE = 0.2;
const BUILD_SHARE_AT_99 = 0.9;
const ALL_AT_99 = 99 * 11;
/** Past 99: sieges of strongholds a day (as many as come before fatigue), and tempering tries a visit. */
const STRONGHOLDS_A_DAY = SIEGE.FATIGUE_FREE;
const TEMPERS_A_VISIT = 3;
/** A bribe at the fortress is paid only while it is at most this share of the purse (session 167). */
const SPY_SHARE = 0.1;
/** The bribes at the season's legend a visit, at most this share of the purse: the season's goal. */
const LEGEND_SPY_SHARE = 0.3;
/** What the steading's next raisings ask, by item. */
function steadingAsks(state: State): Record<string, number> {
  const asks: Record<string, number> = {};
  for (const w of WORKS) {
    const stage = stageOf(state, w.id);
    if (stage < STAGES) for (const i of stageCost(w, stage + 1).items) asks[i.item] = (asks[i.item] ?? 0) + i.count;
  }
  return asks;
}

/** Of each material, what the lord keeps for its lanes before the castle takes any (session 247). */
const MATERIAL_RESERVE = 5_000;
/** The treasury kept: this many times what the edict needs. */
const TREASURY_TIMES = 1.5;

export class Lordship {
  /** The gold its own materials have paid towards levels, all told (session 247). */
  materialsPaid = 0;
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
    // The materials the castle may take (session 247): what is held above a reserve kept for the lanes and
    // what the steading's next raisings ask.
    const items: Record<string, number> = { ...state.items };
    const forWorks = steadingAsks(state);
    const spare = (): State => ({
      ...state,
      items: Object.fromEntries(
        Object.entries(items).map(([k, n]) => [k, Math.max(0, n - MATERIAL_RESERVE - (forWorks[k] ?? 0))]),
      ),
    });
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
    // Spies at the fortress once every skill is at 99, part of the lord's chase (session 167): its wells
    // poisoned when that is what stands between the troops and the next tier, and the bribe is a tenth of
    // the purse or less, before the building takes the rest, as a player told so on its row would.
    const key = E.fortressKey(c.incursionTier);
    const poison = E.FOE_MISSIONS.find((m) => m.id === 'poison')!;
    const fortressOdds = (ops: E.FoeOps) =>
      E.combatRatio(E.castleSide(c, t, 'attack'), E.fortressSide(c.incursionTier, ops), 0.5).r;
    for (let n = 0; level >= ALL_AT_99 && n < 3; n++) {
      const ops = E.foeOps(c, key, t);
      if (fortressOdds(ops) >= 1.05 || fortressOdds({ ...ops, poison: 2 }) < 1.05) break;
      const cost = E.foeSpyCosts(c, poison, t);
      if (E.foeSpyRefusal(c, key, 'poison', t) || cost.gold > purse * SPY_SHARE) break;
      const paid = E.pay(wallet(), cost.gold);
      if (!paid) break;
      purse = paid.purse;
      c = E.spyOnFoe(paid.castle, key, c.incursionTier, 'poison', t, this.roll()).castle;
    }
    // Spies at the season's legend (session 220): its next chamber's wells poisoned when that would bring it
    // within reach and it is not yet, as its row says (session 142), only on a visit whose gold holds the
    // poisonings it needs and one try more (a single stack lasts four hours, so two are sent together).
    const season = seasonAt(t)?.number ?? 0;
    const chamber = season > 0 ? E.nextChamber(c, season, t) : null;
    if (chamber && chamber.opens <= t) {
      const lkey = E.chamberKey(season, chamber.chamber.n);
      const at = (o: E.FoeOps) => E.bestOffense(c, E.chamberSide(chamber.chamber, o), t).r;
      const ops = () => E.foeOps(c, lkey, t);
      const need = [1, 2].find((k) => at({ ...ops(), poison: Math.min(2, ops().poison + k) }) >= 1.05);
      const cost = E.foeSpyCosts(c, poison, t);
      if (at(ops()) < 1.05 && need && cost.gold * (need + 1) <= purse * LEGEND_SPY_SHARE)
        for (let n = 0; n <= need && at(ops()) < 1.05; n++) {
          if (E.foeSpyRefusal(c, lkey, 'poison', t)) break;
          const paid = E.pay(wallet(), cost.gold);
          if (!paid) break;
          purse = paid.purse;
          c = E.spyOnFoe(paid.castle, lkey, chamber.chamber.level, 'poison', t, this.roll()).castle;
        }
    }
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
        if (!id) break;
        // Its own materials pay their part (session 247), those held above a reserve for the lanes.
        const paid = (BUILDINGS as readonly { id: string }[]).some((b) => b.id === id)
          ? materialsFor(spare(), id as BuildingId, levelCost(id))
          : null;
        if (levelCost(id) - (paid?.credit ?? 0) > budget) break;
        const before = purse;
        if (!apply(E.upgrade(wallet(), id, t, 1, paid?.credit ?? 0))) break;
        if (paid) {
          items[paid.item] = (items[paid.item] ?? 0) - paid.count;
          this.materialsPaid += paid.credit;
        }
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
      // The season's legend (session 220): the next chamber while it is likely to fall, as the fortress.
      const chamber = season > 0 ? E.nextChamber(c, season, t) : null;
      if (chamber && chamber.opens <= t && c.activeAp >= E.LEGEND.AP) {
        const best = E.bestOffense(c, chamber.side, t);
        if (best.r >= 1.05) {
          const r = E.assaultLegend({ ...c, offense: best.shares }, season, t, this.roll());
          if (typeof r !== 'string') {
            c = r.castle;
            continue;
          }
        }
      }
      if (c.activeAp >= SINKS.INCURSION_AP) {
        const tier = c.incursionTier;
        const odds = E.combatRatio(
          E.castleSide(c, t, 'attack'),
          E.fortressSide(tier, E.foeOps(c, E.fortressKey(tier), t)),
          0.5,
        ).r;
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
    const evolved = (x: E.Castle) => UNIT_IDS.reduce((n, u) => n + E.evolutionOf(x.levels[u]), 0);
    if (evolved(c) > evolved(was)) firsts.push('castle:evolve');
    if (sum(c.relics) > sum(was.relics)) firsts.push('castle:relic');
    if (sum(c.tempers) > sum(was.tempers)) firsts.push('castle:temper');
    if (c.legends > was.legends) firsts.push('castle:legend');
    // A chamber of the season's legend taken (session 222): a named fortress's battle won, said as a moment.
    else if (c.legendTaken > (c.legendSeason === was.legendSeason ? was.legendTaken : 0)) firsts.push('castle:chamber');
    this.castle = c;
    const next = mirrored({ ...state, items: { ...items, gold: Math.max(0, Math.floor(purse)) } }, c, t);
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
        held: c.warMarks,
        legends: c.legends,
        rating: c.rating,
        evolution: Math.min(...UNIT_IDS.map((u) => E.evolutionOf(c.levels[u]))),
        troops: Math.min(...UNIT_IDS.map((u) => c.levels[u])),
        materials: this.materialsPaid,
      },
    };
  }
}
