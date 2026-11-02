// Castles for the screenshots (Castle Clash): the elder's, raised for weeks (every tab open, relics worn,
// an edict in force, wounds and a breached wall, reports of each kind with their accounts, today's easiest
// stronghold fallen), and the keeper's, a rival near its rating who besieged it two hours ago, so the War
// room lists a lord to strike back at beside the strongholds.
import { castleEngine as E } from '@idle-clash/features';
import { CastleStore } from '../../../apps/server/src/castle/store.ts';
import type { Ctx } from '../../../apps/server/src/context.ts';

const HOUR = 3_600_000;
const pick = (m: E.Mercenary) => ({ first: m.first, second: m.second, rating: m.rating });
const DAY = 24 * HOUR;

function raised(id: string, now: number, level: number): E.Castle {
  const c = E.newCastle(id, now - 30 * DAY);
  const levels = {
    walls: level + 4,
    deepVault: level,
    watchtower: level - 3,
    spyGuild: level - 2,
    vanguard: level + 2,
    outriders: level,
    siege: level - 1,
  };
  const out: E.Castle = {
    ...c,
    activeAp: 132,
    lastApSyncAt: now,
    lastCtaDateUtc: new Date(now - DAY).toISOString().slice(0, 10),
    streakAtLastCta: 9,
    levels,
    drillXp: { vanguard: 6_250, outriders: 2_500, siege: 1_000 },
    techs: { logistics: 3, siegecraft: 2, fortification: 4, espionage: 1 },
    offense: [30, 25, 45],
    defense: [50, 30, 20],
    activeTrap: 'spiked-palisades',
    castellan: 'iron-marshal',
    shieldUntil: 0,
    wallIntegrity: 82,
    infirmaryPct: 12,
    recoverySyncedAt: now,
    lastUpkeepAt: now,
    warMarks: 186,
    warMarksEarned: 412,
    excavationDepth: 9,
    incursionTier: 8,
    incursionScoutedTier: 8,
    relics: { 'banner-of-the-first-king': 5, 'aegis-shard': 2, 'wyrmglass-lens': 1, 'ember-of-sieges': 2 },
    tempers: { 'banner-of-the-first-king': 3 },
    equippedRelics: ['banner-of-the-first-king', 'aegis-shard', 'ember-of-sieges'],
  };
  return { ...out, rating: E.bastionRating(out) };
}

/** Today's easiest stronghold, taken ten minutes ago: it shows as fallen, one of five. */
function fallen(c: E.Castle, now: number): E.Castle {
  const id = `merc:${E.formatUtcDate(now)}:0`;
  return { ...c, pairs: [{ d: id, sieges: [now - 10 * 60_000], spies: [], cn: 0, cnUntil: 0, fell: true }] };
}

/** Writes both castles and the elder's reports. `totalLevel` is the elder's, for the treasury it needs. */
export function castles(ctx: Ctx, ids: { elder: string; keeper: string }, now: number, totalLevel: number): void {
  const store = new CastleStore(ctx);
  const mine = fallen(raised(ids.elder, now, 24), now);
  const required = E.requiredTreasury(mine, totalLevel);
  store.write({ ...mine, treasury: Math.round(required * 2.4), edict: 'vigor', payFromTreasury: false });
  const rival = raised(ids.keeper, now, 23);
  store.write({ ...rival, treasury: Math.round(required * 1.6), edict: 'harvest' });
  const at = (h: number) => now - h * HOUR;
  const log = (h: number, kind: string, data: Record<string, unknown>) => store.log(ids.elder, at(h), kind, data);
  // Each battle with its account (session 38). In a fresh database the elder's reports are the first
  // written, so their ids run 1 to 6 in this order: verify opens the account of the siege on them (6).
  log(30, 'incursion', {
    tier: 7,
    fortress: 'hollow-crown-hold',
    won: true,
    r: 1.12,
    attack: 9_840,
    defense: 9_065,
    fortune: 0.032,
    formation: [30, 25, 45],
    marks: 22,
    drillXp: {},
    spoils: 'armoury',
  });
  log(0.2, 'mercenary', {
    merc: { ...pick(E.mercenaries(mine, now, 5)[0]), n: 0 },
    outcome: 'decisive',
    r: 1.34,
    attack: 11_620,
    defense: 8_310,
    fortune: -0.041,
    formation: [30, 25, 45],
    gold: 412_000,
    marks: 10,
    fee: 690_000,
  });
  log(20, 'spyIn', { foe: ids.keeper, mission: 'poison', marks: 2 });
  log(6, 'spyOut', {
    foe: ids.keeper,
    mission: 'scout',
    success: true,
    report: {
      defense: rival.defense,
      trap: rival.activeTrap,
      castellan: rival.castellan,
      relics: [],
      raidable: 1_840_000,
    },
  });
  log(5, 'siegeOut', {
    foe: ids.keeper,
    outcome: 'decisive',
    r: 1.31,
    attack: 12_480,
    defense: 9_710,
    fortune: 0.019,
    formation: [30, 25, 45],
    gold: 1_196_000,
    marks: 14,
    fee: 1_180_000,
  });
  log(2, 'siegeIn', {
    foe: ids.keeper,
    outcome: 'repelled',
    r: 0.91,
    attack: 10_130,
    defense: 11_350,
    fortune: 0.02,
    formation: [20, 35, 45],
    walls: 82,
    raided: 0,
    marks: 4,
    truce: false,
  });
}
