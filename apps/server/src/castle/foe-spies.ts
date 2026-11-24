// Spies against the day's foes (session 167): poisoned wells, a sabotaged gatehouse or forged orders on one
// of the day's strongholds or the fortress, from the first day. The work is kept on the lord's own castle
// with that foe's pair (castleEngine's foe-spies.ts), and the battle and the odds both count it.
import { SIEGE } from '@idle-clash/content';
import { castleEngine as E, seasonAt } from '@idle-clash/features';
import { purseOf, roll, setPurse, store, type Io, type Outcome } from './service.ts';

type Castle = E.Castle;

/** The foe a target names, as it stands today: one of the day's strongholds not yet fallen, or the
 *  fortress at the lord's own tier. */
function foeOf(att: Castle, target: string, now: number) {
  // The next chamber of the season's legendary siege (session 220).
  if (target.startsWith('legend:')) {
    const season = seasonAt(now)?.number;
    const next = season ? E.nextChamber(att, season, now) : null;
    // Not before its week (session 223): the spies' work lasts hours, and would be spent on a closed gate.
    if (!season || !next || next.opens > now || target !== E.chamberKey(season, next.chamber.n)) return null;
    const legend = E.legendOf(season);
    return { level: next.chamber.level, name: E.legendName(legend), data: { legend, chamber: next.chamber.n } };
  }
  if (target.startsWith('fortress:')) {
    const tier = Number(target.slice('fortress:'.length));
    if (tier !== att.incursionTier) return null;
    const f = E.fortressAt(tier);
    return { level: tier, name: E.fortressName(f.id), data: { fortress: f.id, tier } };
  }
  const m = E.mercenaries(att, now, SIEGE.STRONGHOLD_PAY.length).find((x) => x.id === target);
  if (!m || E.pairOf(att, m.id, now).fell) return null;
  return {
    level: m.level,
    name: E.mercName(m.first, m.second),
    data: { merc: { id: m.id, first: m.first, second: m.second, rating: m.rating, n: m.n } },
  };
}

export function spyFoe(io: Io, att: Castle, target: string, missionId: string): Outcome {
  const foe = foeOf(att, target, io.now);
  if (!foe) return { ok: false, reason: 'unknown' };
  const refusal = E.foeSpyRefusal(att, target, missionId, io.now);
  if (refusal) return { ok: false, reason: refusal };
  const mission = E.FOE_MISSIONS.find((m) => m.id === missionId)!;
  const costs = E.foeSpyCosts(att, mission, io.now);
  const paid = E.pay({ castle: att, purse: purseOf(io) }, costs.gold);
  if (!paid) return { ok: false, reason: 'gold' };
  io.castles.burn(costs.gold);
  setPurse(io, paid.purse);
  const r = E.spyOnFoe(paid.castle, target, foe.level, missionId, io.now, roll());
  store(io, r.castle);
  io.castles.log(io.playerId, io.now, 'spyOut', { foe: target, ...foe.data, mission: missionId, success: r.success });
  io.events.push({ type: 'castleSpied', at: io.now, foe: foe.name, mission: missionId, success: r.success });
  return { ok: true, success: r.success, report: null, bribe: costs.gold };
}
