// A realm of castles on the pure engine (Castle Clash, session 33): lords of three kinds raise their
// castles on the same day and play for weeks, each as a careful lord would. Every visit they answer the
// Call to arms, keep their edict powered, build with a share of their gold, then spend AP on war:
// - a lord in reach is scouted, and besieged when the odds are fair;
// - otherwise one of today's strongholds is attacked;
// - otherwise an incursion is assaulted, or a troop drilled.
// Gold comes in as each kind earns it in the year's simulation. What happens is recorded for the checks
// (checks.ts): every siege and its odds, raids, bounties, tiers, marks, and the realm's gold to the coin.
import { BUILDINGS, RELICS, SIEGE, SINKS, TECH_IDS, UNIT_IDS, UNITS } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import type { Lord, Realm } from './records.ts';

export type { Lord, MercRecord, Realm, SiegeRecord } from './records.ts';

const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
/** The realm opens on a Monday at midnight, UTC. */
export const T0 = Date.UTC(2026, 10, 2);

export interface LordKind {
  name: string;
  /** Visits a day (hours after midnight); a lapsed lord skips days after its first week. */
  visits: number[];
  /** Gold earned a day, and the total level the lord holds (for the treasury it needs). */
  income: number;
  totalLevel: number;
  /** Days of each four, from its second week, it plays at all. */
  playsOf4: number;
  /** The treasury it keeps, in times what its edict needs: more for a stronger edict, and more to raid. */
  treasury: number;
  /** Whether it goes to war, against other lords and today's strongholds. */
  raids: boolean;
}

export const KINDS: LordKind[] = [
  { name: 'steady', visits: [8], income: 1_500_000, totalLevel: 420, playsOf4: 4, raids: true, treasury: 2.5 },
  { name: 'light', visits: [8, 20], income: 500_000, totalLevel: 300, playsOf4: 4, raids: false, treasury: 1.5 },
  { name: 'lapsed', visits: [8], income: 400_000, totalLevel: 250, playsOf4: 1, raids: true, treasury: 2 },
];

function generator(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Plays `days` days of a realm of `perKind` lords of each kind. */
export function playRealm(perKind: number, days: number, seed: number): Realm {
  const roll = generator(seed);
  const lords: Lord[] = [];
  for (const kind of KINDS)
    for (let n = 0; n < perKind; n++) {
      const id = `${kind.name}-${String(n).padStart(2, '0')}`;
      lords.push({
        id,
        kind,
        castle: E.newCastle(id, T0),
        purse: 5_000_000,
        powered: [],
        tiers: [],
        marks: [],
        levels: [],
        raidedOn: [],
      });
    }
  const realm: Realm = {
    lords,
    sieges: [],
    mercs: [],
    incursions: [],
    tempers: { tries: 0, taken: 0, masterstrokes: 0 },
    chest: 0,
    destroyed: 0,
    burned: {},
    income: 0,
    start: 0,
  };
  realm.start = lords.reduce((n, l) => n + l.purse, 0);
  const burn = (gold: number, why = 'other') => {
    realm.burned[why] = (realm.burned[why] ?? 0) + gold;
    const b = E.splitBurn(gold);
    realm.chest += b.toChest;
    realm.destroyed += b.destroyed;
  };
  const sync = (l: Lord, t: number) => {
    const s = E.syncCastle(l.castle, t);
    burn(s.burned, 'upkeep');
    l.castle = s.castle;
  };
  const rate = (c: E.Castle) => ({ ...c, rating: Math.max(c.rating, E.bastionRating(c)) });

  for (let d = 0; d < days; d++) {
    for (const l of lords) {
      l.purse += l.kind.income;
      realm.income += l.kind.income;
    }
    const visits = lords.flatMap((l) =>
      d >= 7 && d % 4 >= l.kind.playsOf4 ? [] : l.kind.visits.map((h) => ({ l, t: T0 + d * DAY + h * HOUR })),
    );
    visits.sort((a, b) => a.t - b.t || roll() - 0.5);
    for (const { l, t } of visits) {
      sync(l, t);
      manage(l, t);
      war(l, t, d);
      l.castle = rate(l.castle);
    }
    for (const l of lords) {
      const t = T0 + (d + 1) * DAY - 1;
      sync(l, t);
      l.powered.push(E.edictBonusPct(l.castle, l.kind.totalLevel) > 0);
      l.tiers.push(l.castle.incursionTier);
      l.marks.push(l.castle.warMarksEarned);
      l.levels.push(E.avgLevel(l.castle));
    }
  }
  return realm;

  function manage(l: Lord, t: number) {
    const done = (d: E.Done, why = 'building') => {
      if (!d.ok) return false;
      l.castle = d.castle;
      l.purse = d.purse;
      burn(d.burned, why);
      return true;
    };
    const w = (): E.Wallet => ({ castle: l.castle, purse: l.purse });
    const call = E.claimCallToArms(l.castle, t);
    if (call.ok) l.castle = call.castle;
    if (!l.castle.edict) done(E.setEdict(w(), 'vigor'));
    const required = E.requiredTreasury(l.castle, l.kind.totalLevel);
    const short = Math.round(l.kind.treasury * required) - l.castle.treasury;
    if (short > 0 && l.purse > 0) done(E.deposit(w(), Math.floor(Math.min(short, l.purse))), 'deposit');
    if (l.castle.treasury < required) return;
    let budget = l.purse * 0.3;
    for (const tech of TECH_IDS) {
      const cost = E.techCost(l.castle, tech, t);
      if (cost && cost.gold <= budget && l.castle.warMarks >= cost.marks && done(E.research(w(), tech, t)))
        budget -= cost.gold;
    }
    // Relics one at a time to their last level (the first three are worn), then the next.
    // (Saving up for the relic in hand rather than starting another.)
    const forging = RELICS.find((r) => E.relicCost(l.castle, r.id));
    for (let guard = 0; forging && guard < 5; guard++) {
      const cost = E.relicCost(l.castle, forging.id);
      if (!cost || cost.gold > budget || l.castle.warMarks < cost.marks || !done(E.forgeRelic(w(), forging.id))) break;
      budget -= cost.gold;
    }
    // Tempering: a relic at its last level, while war marks and the budget last, for a chance each time.
    for (const r of RELICS)
      for (let tries = 0; tries < 5; tries++) {
        const cost = E.temperCost(l.castle, r.id);
        if (!cost || cost.gold > budget || l.castle.warMarks < cost.marks) break;
        const t2 = E.temperRelic(w(), r.id, roll(), roll());
        if (!t2.ok) break;
        l.castle = t2.castle;
        l.purse = t2.purse;
        burn(t2.burned, 'tempering');
        budget -= t2.burned;
        realm.tempers.tries++;
        if (t2.outcome !== 'held') realm.tempers.taken++;
        if (t2.outcome === 'masterstroke') realm.tempers.masterstrokes++;
      }
    // War marks are the scarcer thing: their halls first, then levels with the gold left.
    const all = [...BUILDINGS, ...UNITS];
    for (;;) {
      const next = all
        .filter((x) => l.castle.levels[x.id] < 100)
        .map((x) => ({ id: x.id, cost: E.levelCost(l.castle, x.cost, l.castle.levels[x.id], t) }))
        .sort((a, b) => a.cost - b.cost)[0];
      if (!next || next.cost > budget) break;
      if (!done(E.upgrade(w(), next.id, t))) break;
      budget -= next.cost;
    }
    const owned = Object.keys(l.castle.relics).slice(0, 3);
    if (owned.length > l.castle.equippedRelics.length) done(E.equipRelics(w(), owned));
  }

  function war(l: Lord, t: number, day: number) {
    const att = () => E.castleSide(l.castle, t, 'attack');
    for (let guard = 0; guard < 30 && l.castle.activeAp >= SINKS.DRILL_AP; guard++) {
      // A careful lord goes to war at most three times a day (past that, fatigue raises every cost) and
      // never stakes more than a quarter of their purse on one fee.
      const war = E.tabOpen(l.castle, 'warRoom') && l.castle.siegesToday < SIEGE.FATIGUE_FREE;
      if (war && l.kind.raids && siegeALord(l, t, day)) continue;
      if (war && l.kind.raids && mercenary(l, t, day)) continue;
      // A raider with AP and gold to spare (a week's earnings in hand, the edict paid for) presses on past
      // fatigue against the strongholds still standing, for the harder ones' pay and the rout (session 38).
      const spare =
        l.purse > 7 * l.kind.income && l.castle.treasury >= E.requiredTreasury(l.castle, l.kind.totalLevel) * 1.5;
      const pressing = spare && E.tabOpen(l.castle, 'warRoom') && l.castle.siegesToday < SIEGE.STRONGHOLD_PAY.length;
      if (pressing && l.kind.raids && l.castle.activeAp >= SIEGE.AP * 2 && mercenary(l, t, day)) continue;
      if (E.tabOpen(l.castle, 'incursions') && l.castle.activeAp >= SINKS.INCURSION_AP) {
        const odds = E.combatRatio(att(), E.fortressSide(l.castle.incursionTier), 0.5).r;
        if (odds >= 1.05) {
          const r = E.launchIncursion(l.castle, t, roll(), roll());
          if (r !== 'ap') {
            l.castle = r.castle;
            realm.incursions.push({
              day,
              r: r.r,
              won: r.won,
              tier: l.castle.incursionTier - (r.won ? 1 : 0),
              spoils: r.spoils,
            });
            continue;
          }
        }
      }
      const unit = [...UNIT_IDS].sort((a, b) => l.castle.drillXp[a] - l.castle.drillXp[b])[0];
      const d = E.drill({ castle: l.castle, purse: l.purse }, unit, 1);
      if (!d.ok) break;
      l.castle = d.castle;
    }
  }

  /** A lord in the bracket, unshielded, worth the trip: scouted first, besieged at fair odds. */
  function siegeALord(l: Lord, t: number, day: number): boolean {
    const near = lords
      .filter((o) => o !== l && !E.isShielded(o.castle, t) && E.inBracket(l.castle.rating, o.castle.rating))
      .sort((a, b) => b.castle.treasury - a.castle.treasury);
    for (const o of near) {
      sync(o, t);
      const costs = E.siegeCosts(l.castle, E.brRatio(l.castle, o.castle), t);
      if (E.siegeRefusal(l.castle, o.id, false, costs.ap, t)) continue;
      // The lord's scouting tells them the garrison; the odds here are the truth a scouting would show.
      const odds = E.combatRatio(
        E.castleSide(l.castle, t, 'attack'),
        E.castleSide(o.castle, t, 'defense', { totalLevel: o.kind.totalLevel, fair: true }),
        0.5,
      ).r;
      const prize = E.raidableGold(o.castle, t);
      if (odds < 1.02 || prize < costs.gold * 1.5 || costs.gold > l.purse / 4) continue;
      const paid = E.pay({ castle: l.castle, purse: l.purse }, costs.gold);
      if (!paid) return false;
      burn(costs.gold, 'siege fees');
      l.purse = paid.purse;
      const launched = E.launch(paid.castle, o.id, costs.ap, t);
      const required = E.requiredTreasury(o.castle, o.kind.totalLevel);
      const r = E.resolveSiege(launched, o.castle, t, roll(), {
        attacker: l.kind.totalLevel,
        defender: o.kind.totalLevel,
      });
      l.castle = r.attacker;
      o.castle = rate(r.defender);
      l.purse += r.spoils.toAttacker;
      realm.chest += r.spoils.toChest;
      realm.destroyed += r.spoils.destroyed;
      o.raidedOn[day] = (o.raidedOn[day] ?? 0) + r.spoils.raided;
      realm.sieges.push({
        day,
        attacker: l.id,
        defender: o.id,
        ratio: E.brRatio(l.castle, o.castle),
        r: r.r,
        outcome: r.outcome,
        raided: r.spoils.raided,
        required,
        fee: costs.gold,
      });
      return true;
    }
    return false;
  }

  /** A stronghold, as a player would choose one: the formation set against each, the first standing one
   *  with a fair chance (60% or better), its fee no more than a quarter of the purse. */
  function mercenary(l: Lord, t: number, day: number): boolean {
    const today = E.mercenaries(l.castle, t, SIEGE.TARGETS);
    for (const m of today) {
      const side = E.mercenarySide(m);
      const best = E.bestOffense(l.castle, side, t);
      if (E.winChance(best.r) < 0.6) continue;
      const set = { ...l.castle, offense: best.shares };
      const costs = E.mercenaryCosts(set, m, t);
      if (E.siegeRefusal(set, m.id, false, costs.ap, t)) continue;
      if (costs.gold > l.purse / 4) continue;
      const paid = E.pay({ castle: set, purse: l.purse }, costs.gold);
      if (!paid) return false;
      burn(costs.gold, 'stronghold fees');
      l.purse = paid.purse;
      const r = E.resolveMercenary(E.launch(paid.castle, m.id, costs.ap, t), m, t, roll(), realm.chest);
      realm.chest -= r.bounty;
      l.purse += r.bounty;
      l.castle = r.attacker;
      realm.mercs.push({
        day,
        lord: l.id,
        scale: SIEGE.MERCENARY_SCALES[m.n],
        n: m.n,
        outcome: r.outcome,
        bounty: r.bounty,
        fee: costs.gold,
        marks: r.marks,
        rout: r.rout,
      });
      return true;
    }
    return false;
  }
}

/** The realm's gold: every purse and treasury, the war chest and the gold destroyed. */
export const goldOf = (r: Realm) =>
  r.lords.reduce((n, l) => n + l.purse + l.castle.treasury, 0) + r.chest + r.destroyed;
