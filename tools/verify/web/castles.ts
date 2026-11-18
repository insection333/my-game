// Castles for the screenshots (Castle Clash). Three lords at the three stages players are at, from the
// year's simulation (session 139: every page had been checked against an end-game castle only):
// - the squire's, raised five days ago (about day 7): levels 2 to 3, lords not yet open;
// - the elder's, two months in (about day 75, level 7): every tab open, a relic worn, an edict in force,
//   wounds and a breached wall, reports of each kind with their accounts, today's easiest stronghold fallen;
//   and its rival's near its rating, who besieged it two hours ago, so the War lists a lord to strike back at;
// - the keeper's, a year in (about day 380, level 22): every troop at its fourth evolution, every relic
//   forged, tempers and a deep dig.
import { castleEngine as E } from '@idle-clash/features';
import { CastleStore } from '../../../apps/server/src/castle/store.ts';
import { reports } from '../../../apps/server/src/db/schema.ts';
import { noteSiege } from '../../../apps/server/src/moderation.ts';
import type { Ctx } from '../../../apps/server/src/context.ts';

const HOUR = 3_600_000;
const pick = (m: E.Mercenary) => ({ first: m.first, second: m.second, rating: m.rating });
const DAY = 24 * HOUR;
type Stage = 'early' | 'mid' | 'late';
/** What the elder's siege on its rival raided. */
const RAIDED = 318_000;

/** Each stage's castle, as the year's simulation has it (`.verify/year.md`: level 3.1 on day 30, 7.7 on day
 *  90, 21.6 on day 365, 23.0 on day 456; troops evolved on day 67, 182 and 386). */
const STAGES: Record<Stage, { age: number; level: number } & Partial<E.Castle>> = {
  early: {
    age: 5,
    level: 2,
    incursionTier: 3,
    warMarks: 26,
    warMarksEarned: 26,
    excavationDepth: 1,
    techs: { logistics: 0, siegecraft: 0, fortification: 0, espionage: 0 },
    relics: {},
    tempers: {},
    equippedRelics: [],
    drillXp: { vanguard: 300, outriders: 150, siege: 100 },
  },
  mid: {
    age: 75,
    level: 7,
    incursionTier: 11,
    warMarks: 46,
    warMarksEarned: 141,
    excavationDepth: 4,
    techs: { logistics: 1, siegecraft: 0, fortification: 1, espionage: 0 },
    relics: { 'banner-of-the-first-king': 2, 'aegis-shard': 1 },
    tempers: {},
    equippedRelics: ['banner-of-the-first-king', 'aegis-shard'],
    drillXp: { vanguard: 2_400, outriders: 1_100, siege: 600 },
  },
  late: {
    age: 380,
    level: 22,
    incursionTier: 40,
    warMarks: 64,
    warMarksEarned: 905,
    excavationDepth: 21,
    techs: { logistics: 5, siegecraft: 4, fortification: 5, espionage: 3 },
    relics: Object.fromEntries(
      [
        'banner-of-the-first-king',
        'aegis-shard',
        'ember-of-sieges',
        'oathbound-horn',
        'wyrmglass-lens',
        'sentinels-eye',
        'gilded-ledger',
      ].map((id) => [id, 5]),
    ),
    tempers: { 'banner-of-the-first-king': 4, 'aegis-shard': 3, 'ember-of-sieges': 2 },
    equippedRelics: ['banner-of-the-first-king', 'aegis-shard', 'ember-of-sieges'],
    drillXp: { vanguard: 24_000, outriders: 18_000, siege: 15_000 },
  },
};

function raised(id: string, now: number, stage: Stage): E.Castle {
  const { age, level, ...rest } = STAGES[stage];
  const c = E.newCastle(id, now - age * DAY);
  // Walls first and the beacon last, as the cheapest-first climb leaves them; the troops at the stage's
  // evolution (6 at mid, 22 at late).
  const lift = stage === 'early' ? 0 : 1;
  const levels = {
    walls: level + 2 * lift,
    deepVault: level,
    watchtower: Math.max(1, level - 2 * lift),
    spyGuild: Math.max(1, level - lift),
    vanguard: level + lift,
    outriders: level,
    siege: level + (stage === 'early' ? 0 : stage === 'mid' ? -1 : 0),
  };
  const out: E.Castle = {
    ...c,
    activeAp: 132,
    lastApSyncAt: now,
    lastCtaDateUtc: new Date(now - DAY).toISOString().slice(0, 10),
    streakAtLastCta: Math.min(9, age),
    levels,
    offense: [30, 25, 45],
    defense: [50, 30, 20],
    activeTrap: 'spiked-palisades',
    castellan: 'iron-marshal',
    shieldUntil: 0,
    wallIntegrity: 82,
    infirmaryPct: 12,
    recoverySyncedAt: now,
    lastUpkeepAt: now,
    ...rest,
  };
  return { ...out, rating: E.bastionRating(out) };
}

/** Today's easiest stronghold, taken twelve minutes ago (its report is in castles()): fallen, one of five,
 *  and counted on the day's orders as taking it would have (session 62: the sheet said "1 of 5 fallen"
 *  beside "Take 3 strongholds, 0 of 3"). */
function fallen(c: E.Castle, now: number): E.Castle {
  const id = `merc:${E.formatUtcDate(now)}:0`;
  const orders = E.ordersOf(c, now);
  const list = orders.list.map((o) => (o.kind === 'strongholds' ? { ...o, progress: 1 } : o));
  return {
    ...c,
    pairs: [{ d: id, sieges: [now - 0.2 * HOUR], spies: [], cn: 0, cnUntil: 0, fell: true }],
    orders: { ...orders, list },
  };
}

/** Writes the four castles and the elder's reports. `levels` are each lord's total level, for the treasury
 *  each edict needs. */
export function castles(
  ctx: Ctx,
  ids: { squire: string; elder: string; rival: string; keeper: string },
  now: number,
  levels: { squire: number; elder: number; rival: number; keeper: number },
): void {
  const store = new CastleStore(ctx);
  const keep = (c: E.Castle, total: number, times: number, edict: E.Castle['edict'], extra: Partial<E.Castle> = {}) =>
    store.write({ ...c, treasury: Math.round(E.requiredTreasury(c, total) * times), edict, ...extra });
  keep(raised(ids.squire, now, 'early'), levels.squire, 1.5, 'vigor', { wallIntegrity: 100, infirmaryPct: 0 });
  keep(raised(ids.keeper, now, 'late'), levels.keeper, 2.2, 'fortune');
  const mine = fallen(raised(ids.elder, now, 'mid'), now);
  keep(mine, levels.elder, 2.4, 'vigor', { payFromTreasury: false });
  // The rival a level above the elder in its troops, so it stands near the elder's rating.
  const near = raised(ids.rival, now, 'mid');
  const rival = { ...near, levels: { ...near.levels, outriders: near.levels.outriders + 1 } };
  keep({ ...rival, rating: E.bastionRating(rival) }, levels.rival, 1.6, 'harvest');
  // Each battle's numbers as the engine has them at these castles, so the accounts read as this stage's.
  const fight = (att: E.Side, def: E.Side, roll: number) => {
    const f = E.combatRatio(att, def, roll);
    return { attack: Math.round(f.attack), defense: Math.round(f.defense), r: Math.round(f.r * 100) / 100 };
  };
  const attack = E.castleSide(mine, now, 'attack');
  const out = fight(attack, E.castleSide(rival, now, 'defense'), 0.9);
  const back = fight(E.castleSide(rival, now, 'attack'), E.castleSide(mine, now, 'defense'), 0.1);
  const merc = E.mercenaries(mine, now, 5)[0];
  const fee = E.siegeCosts(mine, E.brRatio(mine, rival), now).gold;
  const at = (h: number) => now - h * HOUR;
  const log = (h: number, kind: string, data: Record<string, unknown>) => store.log(ids.elder, at(h), kind, data);
  // Each battle with its account (session 38). In a fresh database the elder's reports are the first
  // written, so their ids run 1 to 6 in this order: verify opens the account of the siege on them (6).
  log(30, 'incursion', {
    tier: 10,
    fortress: E.fortressAt(10).id,
    won: true,
    ...fight(attack, E.fortressSide(10), 0.7),
    fortune: 0.032,
    formation: [30, 25, 45],
    marks: 14,
    drillXp: {},
    spoils: 'armoury',
  });
  log(0.2, 'mercenary', {
    merc: { ...pick(merc), n: 0 },
    outcome: 'decisive',
    ...fight(attack, E.mercenarySide(merc), 0.8),
    fortune: -0.041,
    formation: [30, 25, 45],
    gold: 96_000,
    marks: 10,
    fee: E.mercenaryCosts(mine, merc, now).gold,
  });
  log(20, 'spyIn', { foe: ids.rival, mission: 'poison', marks: 2 });
  log(6, 'spyOut', {
    foe: ids.rival,
    mission: 'scout',
    success: true,
    report: {
      defense: rival.defense,
      trap: rival.activeTrap,
      castellan: rival.castellan,
      relics: [],
      raidable: E.raidableGold(rival, now, levels.rival),
    },
  });
  log(5, 'siegeOut', {
    foe: ids.rival,
    outcome: out.r >= 1.25 ? 'decisive' : 'graze',
    ...out,
    fortune: 0.019,
    formation: [30, 25, 45],
    gold: RAIDED,
    marks: 14,
    fee,
  });
  log(2, 'siegeIn', {
    foe: ids.rival,
    outcome: 'repelled',
    ...back,
    fortune: 0.02,
    formation: [20, 35, 45],
    walls: 82,
    raided: 0,
    marks: 4,
    truce: false,
  });
  // The rival's side of the same battles, as the game writes both lords' reports, so the rival's card
  // counts them (session 128: it said "0 won, 0 lost" beside the elder's reports of them). Written after
  // the elder's, whose ids stay 1 to 6.
  const theirs = (h: number, kind: string, data: Record<string, unknown>) =>
    store.log(ids.rival, at(h), kind, { foe: ids.elder, ...data });
  theirs(20, 'spyOut', { mission: 'poison', success: false });
  theirs(5, 'siegeIn', {
    outcome: out.r >= 1.25 ? 'decisive' : 'graze',
    ...out,
    fortune: 0.019,
    formation: [30, 25, 45],
    walls: 61,
    raided: RAIDED,
    marks: 0,
    truce: false,
  });
  theirs(2, 'siegeOut', {
    outcome: 'repelled',
    ...back,
    fortune: 0.02,
    formation: [20, 35, 45],
    gold: 0,
    marks: 0,
    fee: 0,
  });
}

/** For the admin page: the elder reports the keeper for cheating, and has besieged them five days running. */
export function wrongdoing(ctx: Ctx, ids: { elder: string; keeper: string }, now: number): void {
  ctx.db
    .insert(reports)
    .values({ reporterId: ids.elder, targetId: ids.keeper, reason: 'cheating', at: now, reporterListed: 1 })
    .run();
  for (let d = 0; d < 5; d++) noteSiege(ctx, ids.elder, ids.keeper, now - d * DAY, 1_196_000, true);
}
