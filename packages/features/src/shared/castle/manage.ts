// Castle Clash's own-castle actions: raising buildings and units, the War College and the Reliquary, the
// formations, trap and castellan, the edict, the treasury and repairs. Each takes the castle and the purse
// (the save's gold) and returns both, with the gold it burned, or the reason it cannot. Pure.
import {
  BUILDINGS,
  COMBAT,
  DOCTRINES,
  ECONOMY,
  EDICTS,
  RECOVERY,
  RELIC_SOCKETS,
  TRAPS,
  UNITS,
  type BuildingId,
  type TechId,
  type UnitId,
} from '@idle-clash/content';
import { validShares, type Castle, type Shares } from './castle.ts';
import { lift, modifiers } from './effects.ts';
import { avgLevel, defenseChangeCost, levelCost, relicCost, techCost } from './economy.ts';

export type Refusal =
  'gold' | 'marks' | 'ap' | 'top' | 'unknown' | 'locked' | 'cooling' | 'unchanged' | 'invalid' | 'notOwned';

export interface Wallet {
  castle: Castle;
  purse: number;
}
export type Done = ({ ok: true; burned: number } & Wallet) | { ok: false; reason: Refusal };

const no = (reason: Refusal): Done => ({ ok: false, reason });

/** Pays gold from the purse, or from the treasury when the castle is set to (the plan's 0% tax). */
export function pay(w: Wallet, gold: number): Wallet | null {
  if (gold <= 0) return w;
  if (w.castle.payFromTreasury)
    return w.castle.treasury >= gold
      ? { castle: { ...w.castle, treasury: w.castle.treasury - gold }, purse: w.purse }
      : null;
  return w.purse >= gold ? { castle: w.castle, purse: w.purse - gold } : null;
}

const spend = (w: Wallet, gold: number, next: (c: Castle) => Castle): Done => {
  const paid = pay(w, gold);
  return paid ? { ok: true, castle: next(paid.castle), purse: paid.purse, burned: gold } : no('gold');
};

/** Raises a building or unit a level (to 100 at most). `credit` is gold the lord's own materials stand in for
 *  (session 247), a quarter of the price at most; the rest is paid in gold. */
export function upgrade(w: Wallet, id: BuildingId | UnitId, now: number, times = 1, credit = 0): Done {
  const base = [...BUILDINGS, ...UNITS].find((x) => x.id === id);
  if (!base) return no('unknown');
  if (!Number.isInteger(times) || times < 1 || times > LEVEL_UP_MOST) return no('invalid');
  const level = w.castle.levels[id];
  if (level + times > ECONOMY.MAX_LEVEL) return no('top');
  const cost = levelUpCost(w.castle, id, times, now);
  if (!Number.isInteger(credit) || credit < 0 || credit > Math.floor(cost / 4)) return no('invalid');
  return spend(w, cost - credit, (c) => ({
    ...c,
    levels: { ...c.levels, [id]: level + times },
  }));
}

/** The most levels one press raises (session 134: Level up +1 or +5). */
export const LEVEL_UP_MOST = 5;

/** What `times` levels of a troop or building cost from where it stands: each level's price, summed, as
 *  that many single presses would pay. */
export function levelUpCost(c: Castle, id: BuildingId | UnitId, times: number, now: number): number {
  const base = [...BUILDINGS, ...UNITS].find((x) => x.id === id)!;
  let gold = 0;
  for (let i = 0; i < times; i++) gold += levelCost(c, base.cost, c.levels[id] + i, now);
  return gold;
}

/** A War College rank, for gold and war marks. */
export function research(w: Wallet, tech: TechId, now: number): Done {
  if (!(tech in w.castle.techs)) return no('unknown');
  const cost = techCost(w.castle, tech, now);
  if (!cost) return no('top');
  if (w.castle.warMarks < cost.marks) return no('marks');
  return spend(w, cost.gold, (c) => ({
    ...c,
    warMarks: c.warMarks - cost.marks,
    techs: { ...c.techs, [tech]: c.techs[tech] + 1 },
  }));
}

/** Forges a war relic, or raises one a level. */
export function forgeRelic(w: Wallet, id: string): Done {
  const cost = relicCost(w.castle, id);
  if (!cost) return no(Object.hasOwn(w.castle.relics, id) ? 'top' : 'unknown');
  if (w.castle.warMarks < cost.marks) return no('marks');
  const level = Object.hasOwn(w.castle.relics, id) ? w.castle.relics[id] : 0;
  return spend(w, cost.gold, (c) => ({
    ...c,
    warMarks: c.warMarks - cost.marks,
    relics: { ...c.relics, [id]: level + 1 },
  }));
}

/** Wears up to three owned relics, each once. */
export function equipRelics(w: Wallet, ids: readonly string[]): Done {
  if (ids.length > RELIC_SOCKETS || new Set(ids).size !== ids.length) return no('invalid');
  if (ids.some((id) => !Object.hasOwn(w.castle.relics, id))) return no('notOwned');
  return { ok: true, castle: { ...w.castle, equippedRelics: [...ids] }, purse: w.purse, burned: 0 };
}

/** The attack's formation: free to set at any time. */
export function setOffense(w: Wallet, shares: Shares): Done {
  if (!validShares(shares)) return no('invalid');
  return { ok: true, castle: { ...w.castle, offense: [...shares] as unknown as Shares }, purse: w.purse, burned: 0 };
}

export interface DefenseChange {
  defense?: Shares;
  trap?: string | null;
  castellan?: string | null;
}

/** The garrison, trap and castellan: 1% of the required treasury, then 2 hours' rest; pinned for 15
 *  minutes after a successful scouting (SPEC.md 4B). */
export function setDefense(w: Wallet, change: DefenseChange, totalLevel: number, now: number): Done {
  const c = w.castle;
  if (change.defense !== undefined && !validShares(change.defense)) return no('invalid');
  if (change.trap !== undefined && change.trap !== null && !TRAPS.some((t) => t.id === change.trap))
    return no('unknown');
  if (change.castellan !== undefined && change.castellan !== null && !DOCTRINES.some((d) => d.id === change.castellan))
    return no('unknown');
  const next: Castle = {
    ...c,
    defense: change.defense ? ([...change.defense] as unknown as Shares) : c.defense,
    activeTrap: change.trap === undefined ? c.activeTrap : change.trap,
    castellan: change.castellan === undefined ? c.castellan : change.castellan,
  };
  const same =
    next.defense.every((x, i) => x === c.defense[i]) &&
    next.activeTrap === c.activeTrap &&
    next.castellan === c.castellan;
  if (same) return no('unchanged');
  if (c.reconLockdownUntil !== null && c.reconLockdownUntil > now) return no('locked');
  if (c.defenseChangedAt !== null && now - c.defenseChangedAt < COMBAT.DEFENSE_COOLDOWN_MS) return no('cooling');
  return spend(w, defenseChangeCost(c, totalLevel), (x) => ({
    ...x,
    defense: next.defense,
    activeTrap: next.activeTrap,
    castellan: next.castellan,
    defenseChangedAt: now,
  }));
}

/** Chooses the edict the treasury powers (or none): free. */
export function setEdict(w: Wallet, edict: string | null): Done {
  if (edict !== null && !EDICTS.some((e) => e.id === edict)) return no('unknown');
  if (edict === w.castle.edict) return no('unchanged');
  return { ok: true, castle: { ...w.castle, edict }, purse: w.purse, burned: 0 };
}

/** Moves gold from the purse into the treasury: an amount, or 'all' its whole coins as the press lands
 *  (session 135). */
export function deposit(w: Wallet, amount: number | 'all'): Done {
  const gold = amount === 'all' ? Math.floor(w.purse) : amount;
  if (!Number.isInteger(gold) || gold <= 0) return no('invalid');
  if (w.purse < gold) return no('gold');
  return { ok: true, castle: { ...w.castle, treasury: w.castle.treasury + gold }, purse: w.purse - gold, burned: 0 };
}

/** Takes gold back to the purse, less the 20% smuggling burn; refused for 30 minutes after a scouting. An
 *  amount, or 'all' the treasury holds as the press lands (session 135: its upkeep takes a coin or so a
 *  second, so all said as the number a page read was more than there was by the time it arrived). */
export function withdraw(w: Wallet, amount: number | 'all', now: number): Done {
  if (w.castle.withdrawLockdownUntil !== null && w.castle.withdrawLockdownUntil > now) return no('locked');
  const gold = amount === 'all' ? Math.floor(w.castle.treasury) : amount;
  if (!Number.isInteger(gold) || gold <= 0) return no('invalid');
  if (w.castle.treasury < gold) return no('gold');
  const burned = Math.ceil(gold * ECONOMY.WITHDRAW_TAX);
  return {
    ok: true,
    castle: { ...w.castle, treasury: w.castle.treasury - gold },
    purse: w.purse + gold - burned,
    burned,
  };
}

/** Pays costs from the treasury from now on, or from the purse. */
export const setPayFrom = (w: Wallet, treasury: boolean): Done =>
  w.castle.payFromTreasury === treasury
    ? no('unchanged')
    : { ok: true, castle: { ...w.castle, payFromTreasury: treasury }, purse: w.purse, burned: 0 };

/** Mending at once instead of 5 points an hour: AP, and gold by the points restored and the castle's level,
 *  rounded up to the coin, so no part of a heal is ever cheaper than its share (session 134). */
export function instantCost(c: Castle, points: number, now: number): { ap: number; gold: number } {
  const gold = RECOVERY.INSTANT_GOLD_PER_POINT_LEVEL * points * avgLevel(c) * lift(modifiers(c, now).costs.repair);
  return { ap: RECOVERY.INSTANT_AP, gold: Math.max(1, Math.ceil(gold - 1e-9)) };
}

/** Repairs the walls or heals the wounds at once: all of it, or `pct` points of it (a whole number from 1
 *  to 100; session 134, the owner's slider), never past whole. Each press pays the AP whole and the gold
 *  for what it mends, rounded up, so a heal split in parts never costs less than one heal. */
export function mendNow(w: Wallet, what: 'walls' | 'wounds', now: number, pct?: number): Done {
  if (pct !== undefined && (!Number.isInteger(pct) || pct < 1 || pct > 100)) return no('invalid');
  const points = what === 'walls' ? 100 - w.castle.wallIntegrity : w.castle.infirmaryPct;
  if (points <= 0.01) return no('unchanged');
  const all = pct === undefined || pct >= points;
  const mended = all ? points : pct;
  const cost = instantCost(w.castle, mended, now);
  if (w.castle.activeAp + 1e-9 < cost.ap) return no('ap');
  return spend(w, cost.gold, (c) => ({
    ...c,
    activeAp: c.activeAp - cost.ap,
    ...(what === 'walls'
      ? { wallIntegrity: all ? 100 : Math.min(100, c.wallIntegrity + mended) }
      : { infirmaryPct: all ? 0 : Math.max(0, c.infirmaryPct - mended) }),
  }));
}
