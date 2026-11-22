// Spies on the day's strongholds, as a lord told so on its row would send them (session 178): before a
// siege on a stronghold whose chance stands under a fair one (60%) with the formation set against it, a
// raider sends the mission that lifts it most, one at a time, while the spies' full work would bring it to
// a fair chance, each bribe a tenth of the purse or less and AP kept for the siege after. Each mission rolls
// against the foe's watch; a caught spy spends its AP and bribe for nothing, as on the page.
import { RECOVERY, SIEGE } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';

/** A fair chance, at which a lord goes in. */
export const FAIR = 0.6;
/** The most of the purse one bribe may take. */
const BRIBE_SHARE = 0.1;

/** The chance against a stronghold with the formation set against it and this work on it. */
export const chanceAgainst = (c: E.Castle, m: E.Mercenary, ops: E.FoeOps, t: number) =>
  E.winChance(E.bestOffense(c, E.mercenarySide(m, ops), t).r);

/** The wounds a won siege leaves, healed before the next on the way to a rout. */
const SIEGE_WOUNDS = RECOVERY.WOUNDS_WINNER;

/** All the work the spies could do on a stronghold: wells poisoned twice, its gate sabotaged, orders forged. */
const FULL: E.FoeOps = { poison: 2, sabotage: 1, forge: 1 };

export interface SpyRun {
  castle: E.Castle;
  purse: number;
  /** Bribes paid, missions sent and those that got through. */
  bribes: number;
  sent: number;
  through: number;
}

/** Spies sent at one stronghold until its chance is fair, or no mission would help or may go. */
export function spyStronghold(c: E.Castle, purse: number, m: E.Mercenary, t: number, roll: () => number): SpyRun {
  const out: SpyRun = { castle: c, purse, bribes: 0, sent: 0, through: 0 };
  if (chanceAgainst(c, m, FULL, t) < FAIR) return out;
  for (let guard = 0; guard < 4; guard++) {
    const ops = E.foeOps(out.castle, m.id, t);
    const now = chanceAgainst(out.castle, m, ops, t);
    if (now >= FAIR) break;
    const best = E.FOE_MISSIONS.filter((x) => !E.foeSpyRefusal(out.castle, m.id, x.id, t))
      .map((x) => ({ x, gain: chanceAgainst(out.castle, m, { ...ops, [x.id]: ops[x.id as keyof E.FoeOps] + 1 }, t) }))
      .sort((a, b) => b.gain - a.gain)[0];
    if (!best || best.gain <= now) break;
    const cost = E.foeSpyCosts(out.castle, best.x, t);
    if (out.castle.activeAp < cost.ap + SIEGE.AP || cost.gold > out.purse * BRIBE_SHARE) break;
    const paid = E.pay({ castle: out.castle, purse: out.purse }, cost.gold);
    if (!paid) break;
    const r = E.spyOnFoe(paid.castle, m.id, m.level, best.x.id, t, roll());
    out.castle = r.castle;
    out.purse = paid.purse;
    out.bribes += cost.gold;
    out.sent++;
    if (r.success) out.through++;
  }
  return out;
}

/** The castle with its wounds healed, as a lord on the way to a rout keeps it between battles. */
export const healed = (c: E.Castle): E.Castle => ({ ...c, infirmaryPct: 0 });

/** Whether a rout is within reach today: each stronghold still standing comes to a fair chance with the
 *  troops healed and the spies' full work; the AP holds every siege left (dearer by fatigue), a heal before
 *  each and two missions for each not yet fair; the purse holds every fee left; and what the rout costs
 *  beyond a careful day (the fees' fatigue, the heals and the bribes) is in the gold set aside for it, with
 *  a quarter to spare. That cost, or null when out of reach. */
export function routInReach(c: E.Castle, purse: number, saved: number, t: number): number | null {
  const standing = E.mercenaries(c, t, SIEGE.TARGETS).filter((m) => E.siegeRefusal(c, m.id, false, 0, t) !== 'fallen');
  const whole = healed(c);
  if (!standing.length || standing.some((m) => chanceAgainst(whole, m, FULL, t) < FAIR)) return null;
  const fee = E.mercenaryCosts(c, standing[0], t).gold;
  const spy = E.foeSpyCosts(c, E.FOE_MISSIONS[0], t);
  const heal = E.instantCost(c, SIEGE_WOUNDS, t);
  let fees = 0;
  let beyond = 0;
  let ap = 0;
  standing.forEach((m, i) => {
    const tired = Math.max(0, c.siegesToday + i + 1 - SIEGE.FATIGUE_FREE);
    fees += fee * (1 + SIEGE.FATIGUE_GOLD * tired);
    beyond += fee * SIEGE.FATIGUE_GOLD * tired + heal.gold;
    ap += SIEGE.AP * (1 + SIEGE.FATIGUE_AP * tired) + heal.ap;
    if (chanceAgainst(whole, m, E.foeOps(c, m.id, t), t) < FAIR) {
      beyond += 2 * spy.gold;
      ap += 2 * spy.ap;
    }
  });
  return c.activeAp >= ap && purse >= fees + beyond && saved >= beyond * 1.25 ? beyond : null;
}
