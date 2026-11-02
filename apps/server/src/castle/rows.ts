// Castle Clash: a `player_bastions` row as the engine's Castle and back. JSON columns are read through
// strict schemas: a damaged one reads as empty rather than failing the request, and is written back whole.
import { castleEngine } from '@idle-clash/features';
import { z } from 'zod';
import type { playerBastions } from '../db/schema.ts';

type Castle = castleEngine.Castle;
export type BastionRow = typeof playerBastions.$inferSelect;

const Debuffs = z
  .array(
    z.object({
      kind: z.enum(['poison', 'sabotage', 'forge']),
      stacks: z.number().int().min(1).max(5),
      until: z.number(),
    }),
  )
  .max(20);
const Immunities = z.object({ poison: z.number(), sabotage: z.number(), forge: z.number() }).partial().strict();
const Pairs = z
  .array(
    z.object({
      d: z.string().max(64),
      sieges: z.array(z.number()).max(20),
      spies: z.array(z.number()).max(20),
      cn: z.number().int().min(0).max(3),
      cnUntil: z.number(),
      fell: z.boolean().optional(),
    }),
  )
  .max(20);
const Times = z.array(z.number()).max(20);
const Relics = z.record(z.string().max(40), z.number().int().min(1).max(5));
const Tempers = z.record(z.string().max(40), z.number().int().min(0).max(10_000));
const Equipped = z.array(z.string().max(40)).max(3);

function json<T>(schema: z.ZodType<T>, text: string, empty: T): T {
  try {
    const parsed = schema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : empty;
  } catch {
    return empty;
  }
}

const shares = (a: number, b: number, c: number): castleEngine.Shares =>
  castleEngine.validShares([a, b, c]) ? [a, b, c] : [34, 33, 33];

export function toCastle(r: BastionRow): Castle {
  return {
    userId: r.userId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    activeAp: r.activeAp,
    lastApSyncAt: r.lastApSyncAt,
    lastCtaDateUtc: r.lastCtaDateUtc,
    streakAtLastCta: r.streakAtLastCta,
    treasury: r.bastionTreasury,
    edict: r.edict,
    lastUpkeepAt: r.lastUpkeepAt,
    payFromTreasury: r.payFromTreasury === 1,
    levels: {
      walls: r.castleWallsLevel,
      deepVault: r.deepVaultLevel,
      watchtower: r.watchtowerLevel,
      spyGuild: r.spyGuildLevel,
      vanguard: r.vanguardLevel,
      outriders: r.outridersLevel,
      siege: r.siegeLevel,
    },
    drillXp: { vanguard: r.vanguardDrillXp, outriders: r.outridersDrillXp, siege: r.siegeDrillXp },
    techs: {
      logistics: r.techLogistics,
      siegecraft: r.techSiegecraft,
      fortification: r.techFortification,
      espionage: r.techEspionage,
    },
    offense: shares(r.offVPct, r.offOPct, r.offSPct),
    defense: shares(r.defVPct, r.defOPct, r.defSPct),
    activeTrap: r.activeTrap,
    castellan: r.castellanDoctrine,
    defenseChangedAt: r.defenseChangedAt,
    reconLockdownUntil: r.reconLockdownUntilUtc,
    withdrawLockdownUntil: r.withdrawLockdownUntilUtc,
    shieldUntil: r.shieldUntilUtc,
    wallIntegrity: r.wallIntegrity,
    infirmaryPct: r.infirmaryPct,
    recoverySyncedAt: r.recoverySyncedAt,
    genuineReceived: json(Times, r.genuineReceived, []),
    siegesDayUtc: r.siegesDayUtc,
    siegesToday: r.siegesToday,
    rating: r.bastionRating,
    warMarks: r.warMarks,
    warMarksEarned: r.warMarksEarned,
    excavationDepth: r.excavationDepth,
    incursionTier: r.incursionTier,
    incursionScoutedTier: r.incursionScoutedTier,
    routs: r.routs,
    relics: json(Relics, r.relics, {}),
    tempers: json(Tempers, r.relicTempers, {}),
    equippedRelics: json(Equipped, r.equippedRelics, []),
    debuffs: json(Debuffs, r.activeDebuffs, []),
    immunities: json(Immunities, r.debuffImmunities, {}),
    pairs: json(Pairs, r.pairLimits, []),
  };
}

export function toRow(c: Castle): BastionRow {
  return {
    userId: c.userId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    activeAp: c.activeAp,
    lastApSyncAt: c.lastApSyncAt,
    lastCtaDateUtc: c.lastCtaDateUtc,
    streakAtLastCta: c.streakAtLastCta,
    bastionTreasury: c.treasury,
    edict: c.edict,
    lastUpkeepAt: c.lastUpkeepAt,
    payFromTreasury: c.payFromTreasury ? 1 : 0,
    castleWallsLevel: c.levels.walls,
    deepVaultLevel: c.levels.deepVault,
    watchtowerLevel: c.levels.watchtower,
    spyGuildLevel: c.levels.spyGuild,
    vanguardLevel: c.levels.vanguard,
    outridersLevel: c.levels.outriders,
    siegeLevel: c.levels.siege,
    vanguardDrillXp: c.drillXp.vanguard,
    outridersDrillXp: c.drillXp.outriders,
    siegeDrillXp: c.drillXp.siege,
    techLogistics: c.techs.logistics,
    techSiegecraft: c.techs.siegecraft,
    techFortification: c.techs.fortification,
    techEspionage: c.techs.espionage,
    offVPct: c.offense[0],
    offOPct: c.offense[1],
    offSPct: c.offense[2],
    defVPct: c.defense[0],
    defOPct: c.defense[1],
    defSPct: c.defense[2],
    activeTrap: c.activeTrap,
    castellanDoctrine: c.castellan,
    defenseChangedAt: c.defenseChangedAt,
    reconLockdownUntilUtc: c.reconLockdownUntil,
    withdrawLockdownUntilUtc: c.withdrawLockdownUntil,
    shieldUntilUtc: c.shieldUntil,
    wallIntegrity: c.wallIntegrity,
    infirmaryPct: c.infirmaryPct,
    recoverySyncedAt: c.recoverySyncedAt,
    genuineReceived: JSON.stringify(c.genuineReceived),
    siegesDayUtc: c.siegesDayUtc,
    siegesToday: c.siegesToday,
    bastionRating: c.rating,
    warMarks: c.warMarks,
    warMarksEarned: c.warMarksEarned,
    excavationDepth: c.excavationDepth,
    incursionTier: c.incursionTier,
    incursionScoutedTier: c.incursionScoutedTier,
    routs: c.routs,
    relics: JSON.stringify(c.relics),
    relicTempers: JSON.stringify(c.tempers),
    equippedRelics: JSON.stringify(c.equippedRelics),
    activeDebuffs: JSON.stringify(c.debuffs),
    debuffImmunities: JSON.stringify(c.immunities),
    pairLimits: JSON.stringify(c.pairs),
  };
}
