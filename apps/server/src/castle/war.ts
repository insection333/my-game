// Castle Clash's war (SPEC.md sections 4D and 4E): sieges on lords and on mercenary strongholds, and spy
// missions. Each reads the two castles in ascending id, takes the fee or bribe, resolves with the pure
// engine, and writes both castles, the war chest and both lords' reports in the request's transaction.
import { SIEGE } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { totalLevelOf } from '../game/standing.ts';
import { loadSynced, purseOf, roll, setPurse, store, type Io, type Outcome } from './service.ts';

type Castle = E.Castle;

/** Today's strongholds are the plan's five; any of them may be attacked, twice a day each. */
const mercenaryOf = (att: Castle, id: string, now: number) =>
  E.mercenaries(att, now, SIEGE.TARGETS).find((m) => m.id === id);

/** The other castle, synced, or why it cannot be a target. */
function opponent(io: Io, att: Castle, target: string): Castle | 'unknown' | 'self' {
  if (target === io.playerId) return 'self';
  if (io.castles.banned(target)) return 'unknown';
  const pair = io.castles.readPair(io.playerId, target);
  const raw = pair.get(target);
  return raw ? (loadSynced(io, target, raw) ?? 'unknown') : 'unknown';
}

export function siege(io: Io, att: Castle, target: string): Outcome {
  if (!E.tabOpen(att, 'warRoom')) return { ok: false, reason: 'locked' };
  if (target.startsWith('merc:')) return mercenarySiege(io, att, target);
  const def = opponent(io, att, target);
  if (typeof def === 'string') return { ok: false, reason: def };
  const costs = E.siegeCosts(att, E.brRatio(att, def), io.now);
  const refusal = E.siegeRefusal(att, target, E.isShielded(def, io.now), costs.ap, io.now);
  if (refusal) return { ok: false, reason: refusal };
  const paid = E.pay({ castle: att, purse: purseOf(io) }, costs.gold);
  if (!paid) return { ok: false, reason: 'gold' };
  io.castles.burn(costs.gold);
  const launched = E.launch(paid.castle, target, costs.ap, io.now);
  const levels = { attacker: io.totalLevel, defender: totalLevelOf(io.ctx, target) };
  const r = E.resolveSiege(launched, def, io.now, roll(), levels);
  setPurse(io, paid.purse + r.spoils.toAttacker);
  io.castles.ledger(r.spoils.toChest, r.spoils.destroyed);
  store(io, r.attacker);
  store(io, r.defender);
  const shared = { outcome: r.outcome, r: r.r, genuine: r.genuine, raided: r.spoils.raided };
  io.castles.log(io.playerId, io.now, 'siegeOut', {
    ...shared,
    foe: target,
    gold: r.spoils.toAttacker,
    marks: r.attackerMarks,
    fee: costs.gold,
  });
  io.castles.log(target, io.now, 'siegeIn', {
    ...shared,
    foe: io.playerId,
    marks: r.defenderMarks,
    truce: r.truce,
    consumed: r.consumed,
  });
  return { ok: true, ...shared, gold: r.spoils.toAttacker, marks: r.attackerMarks, fee: costs.gold };
}

function mercenarySiege(io: Io, att: Castle, target: string): Outcome {
  const m = mercenaryOf(att, target, io.now);
  if (!m) return { ok: false, reason: 'unknown' };
  const costs = E.mercenaryCosts(att, m, io.now);
  const refusal = E.siegeRefusal(att, m.id, false, costs.ap, io.now);
  if (refusal) return { ok: false, reason: refusal };
  const paid = E.pay({ castle: att, purse: purseOf(io) }, costs.gold);
  if (!paid) return { ok: false, reason: 'gold' };
  io.castles.burn(costs.gold);
  const launched = E.launch(paid.castle, m.id, costs.ap, io.now);
  const r = E.resolveMercenary(launched, m, io.now, roll(), io.castles.chest());
  // A bounty is paid strictly from the war chest: no gold is made (DESIGN.md 11.4).
  io.castles.ledger(-r.bounty, 0);
  setPurse(io, paid.purse + r.bounty);
  store(io, r.attacker);
  const data = {
    merc: { first: m.first, second: m.second, rating: m.rating },
    outcome: r.outcome,
    r: r.r,
    gold: r.bounty,
    marks: r.marks,
    fee: costs.gold,
  };
  io.castles.log(io.playerId, io.now, 'mercenary', data);
  return { ok: true, ...data };
}

export function spy(io: Io, att: Castle, target: string, missionId: string): Outcome {
  if (!E.tabOpen(att, 'warRoom')) return { ok: false, reason: 'locked' };
  if (target.startsWith('merc:')) return { ok: false, reason: 'unknown' };
  const def = opponent(io, att, target);
  if (typeof def === 'string') return { ok: false, reason: def };
  const refusal = E.spyRefusal(att, def, missionId, io.now);
  if (refusal) return { ok: false, reason: refusal };
  const mission = E.missionOf(missionId)!;
  const costs = E.spyCosts(att, def, mission, io.now);
  const paid = E.pay({ castle: att, purse: purseOf(io) }, costs.gold);
  if (!paid) return { ok: false, reason: 'gold' };
  io.castles.burn(costs.gold);
  setPurse(io, paid.purse);
  const r = E.runMission(paid.castle, def, missionId, io.now, roll());
  store(io, r.attacker);
  store(io, r.defender);
  const report = r.success && missionId === 'scout' ? E.scoutReport(r.defender, io.now) : null;
  io.castles.log(io.playerId, io.now, 'spyOut', { foe: target, mission: missionId, success: r.success, report });
  if (!r.success)
    io.castles.log(target, io.now, 'spyIn', { foe: io.playerId, mission: missionId, marks: r.defenderMarks });
  return { ok: true, success: r.success, report, bribe: costs.gold };
}
