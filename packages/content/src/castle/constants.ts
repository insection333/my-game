// Castle Clash's numbers (docs/castle-clash/SPEC.md, with DESIGN.md's settlements): every constant the
// engine reads, in one place. Gold figures are the plan's scaled by GOLD_SCALE to this game's economy
// (DESIGN.md section 8); every other number is the plan's own unless a comment says otherwise.

const HOUR = 3_600_000;
const MINUTE = 60_000;

/** The plan's gold amounts multiplied by this, to this game's scale (16M gold by day 30, 1.5M a day). */
export const GOLD_SCALE = 100;

/** Section 2: action points and the daily Call to arms. */
export const AP = {
  BASE_AP_PER_HOUR: 10,
  BASE_ACTIVE_AP_CAP: 240,
  MAX_STREAK: 14,
  /** +1% AP speed per streak day. */
  STREAK_PCT_PER_DAY: 1,
  DAILY_CTA_INSTANT_BONUS_AP: 5,
  /** A Call to arms may lift AP this far past the cap. */
  CTA_OVERCAP: 25,
  START_AP: 60,
  /** Each full day missed takes this many days off the streak. */
  STREAK_LOSS_PER_MISSED_DAY: 3,
} as const;

/** Section 3: the deflationary economy, the treasury and its edicts. */
export const ECONOMY = {
  /** Every burn: 95% destroyed, 5% to the war chest. */
  BURN_DESTROYED: 0.95,
  BURN_TO_WAR_CHEST: 0.05,
  /** upgradeGoldCost(base, level) = round(base × 1.18^level); statPower(base, level) = base × level^1.05. */
  COST_GROWTH: 1.18,
  STAT_EXPONENT: 1.05,
  /** requiredTreasury = round(GOLD_SCALE × 1000 × 1.12^max(avgLevel, totalLevel ÷ 22)): the floor by the
   *  lord's total level keeps a neglected castle from a near-free edict (DESIGN.md 11.2). */
  TREASURY_BASE: 1000 * GOLD_SCALE,
  TREASURY_GROWTH: 1.12,
  TREASURY_TOTAL_LEVEL_DIVISOR: 22,
  /** An edict's bonus at the requirement, doubling by 5× it: base × min(2, 1 + slope × log2(t ÷ req)).
   *  Half the plan's 10%, so an edict sits beside the steading rather than above it (DESIGN.md 11.1). The
   *  plan's slope of 0.25 reaches 2× only at 16 times the requirement, against its own "2x at 5x"; the
   *  slope here is the one that keeps the stated intent, 1 ÷ log2(5) (DESIGN.md 5.18). */
  EDICT_BASE_PCT: 5,
  EDICT_MAX_MULT: 2,
  EDICT_LOG_SLOPE: 1 / Math.log2(5),
  /** Defending troops when the treasury is under its requirement. */
  UNPAID_MORALE: 0.8,
  WITHDRAW_TAX: 0.2,
  UPKEEP_PER_DAY: 0.02,
  UPKEEP_PAUSE_MS: 48 * HOUR,
  /** The deep vault never protects more than this share: a quarter is always raidable. */
  VAULT_MAX_PROTECT: 0.75,
  /** What the vault protects: flat per level and per excavation depth, plus a share that grows with level
   *  (0.20 + 0.55 × L ÷ (L + 30)), all within the cap above. */
  VAULT_FLAT_PER_LEVEL: 400 * GOLD_SCALE,
  VAULT_FLAT_PER_DEPTH: 200 * GOLD_SCALE,
  VAULT_PCT_BASE: 0.2,
  VAULT_PCT_RANGE: 0.55,
  VAULT_PCT_HALF: 30,
  /** No level of any building, unit or tech passes this (DESIGN.md section 5.4). */
  MAX_LEVEL: 100,
} as const;

/** Section 4B and C: formations, the matrix, traps and walls. */
export const COMBAT = {
  FLANK_THRESHOLD: 0.6,
  FLANK_SLOPE: 0.5,
  /** M[i][j]: unit i against unit j (0 vanguard, 1 outriders, 2 siege). */
  MATRIX: [
    [1.0, 1.35, 0.75],
    [0.75, 1.0, 1.35],
    [1.35, 0.75, 1.0],
  ] as readonly (readonly number[])[],
  TRAP_PENALTY: 0.2,
  /** Siege share a₂ bypasses 0.25 × a₂ of the walls' bonus (more with the Iron Marshal and Siegecraft). */
  PENETRATION_PER_SIEGE_SHARE: 0.25,
  /** No attacker bypasses more than this share of the walls. */
  PENETRATION_MAX: 0.9,
  /** The walls' defence multiplier: 1 + 0.25 × L ÷ (L + 25) × integrity (DESIGN.md section 5.12). At 0.6,
   *  two equal castles met at R ≈ 0.79, under the plan's genuine bound of 0.85, so no fair siege could
   *  ever breach. At 0.25 a paid garrison keeps a modest edge at every level (equal castles at R 0.86 to
   *  0.99, the castle-siege test). */
  WALL_BONUS_MAX: 0.25,
  WALL_BONUS_HALF: 25,
  /** Changing the garrison, trap or castellan: 1% of the required treasury, then 2 hours' rest. */
  DEFENSE_CHANGE_COST_PCT: 0.01,
  DEFENSE_COOLDOWN_MS: 2 * HOUR,
  /** Being scouted pins the garrison for 15 minutes and the treasury for 30 (DESIGN.md section 5.1). */
  RECON_LOCK_MS: 15 * MINUTE,
  WITHDRAW_LOCK_MS: 30 * MINUTE,
  /** R = attacker × uniform(0.96, 1.04) ÷ defender. */
  ROLL_SPREAD: 0.04,
} as const;

/** Section 4D: espionage and the pair-scoped rules against collusion. */
export const ESPIONAGE = {
  PAIR_WINDOW_MS: 24 * HOUR,
  PAIR_SIEGES: 2,
  PAIR_SPIES: 3,
  /** At most this many pairs are remembered on a castle's row, the stalest dropped first. */
  PAIR_ENTRIES: 20,
  COMPROMISED_STEALTH: 0.25,
  COMPROMISED_MS: 12 * HOUR,
  COMPROMISED_MAX: 3,
  /** War marks a defender earns when a spy is caught. */
  CAUGHT_SPY_MARKS: 2,
  /** A sabotage's immunity, granted only when a genuine siege consumes it. */
  IMMUNITY_MS: 4 * HOUR,
  /** chance = clamp(0.5 + 0.35 × ln(stealth ÷ detection), 0.10, 0.90) (DESIGN.md section 5.8). */
  CHANCE_BASE: 0.5,
  CHANCE_SLOPE: 0.35,
  CHANCE_MIN: 0.1,
  CHANCE_MAX: 0.9,
  /** The bribe: GOLD_SCALE × 0.5 × max(both ratings) × the mission's factor. */
  BRIBE_PER_RATING: 0.5 * GOLD_SCALE,
  /** At most this many debuffs and immunities kept on a row. */
  MAX_ENTRIES: 20,
} as const;

/** Section 4E: guardrails against snowballing, vigilance, spoils and shields. */
export const SIEGE = {
  AP: 20,
  /** The mobilization fee: GOLD_SCALE × 1 per point of the attacker's rating, burned win or lose. */
  MOBILIZE_PER_RATING: 1 * GOLD_SCALE,
  OVEREXTENSION_RATIO: 0.8,
  OVEREXTENSION_COST_EXP: 2.5,
  OVEREXTENSION_REWARD_EXP: 2,
  /** The first three sieges a UTC day at base cost; each one after adds +35% gold and +20% AP. */
  FATIGUE_FREE: 3,
  FATIGUE_GOLD: 0.35,
  FATIGUE_AP: 0.2,
  GENUINE_MAX_RATIO: 1.35,
  GENUINE_MIN_R: 0.85,
  VIGILANCE_WINDOW_MS: 12 * HOUR,
  VIGILANCE_DEFENSE: 0.12,
  VIGILANCE_RAIDABLE: 0.25,
  VIGILANCE_MAX: 2,
  /** The third genuine siege in 12 hours raises a 6-hour truce shield. */
  TRUCE_AFTER: 3,
  TRUCE_MS: 6 * HOUR,
  NOVICE_MS: 48 * HOUR,
  GRAZE_FROM: 1.0,
  DECISIVE_FROM: 1.25,
  GRAZE_LOOT_MIN: 0.2,
  /** Raided gold: the defender loses all of it; the attacker gets 65%, 30% is destroyed, 5% to the chest. */
  SPOILS_TO_ATTACKER: 0.65,
  SPOILS_DESTROYED: 0.3,
  SPOILS_TO_WAR_CHEST: 0.05,
  /** One siege raids at most this many times the defender's required treasury (DESIGN.md 11.3). */
  RAID_CAP_REQUIRED: 2,
  /** War marks: a grazing and a decisive breach, and a defender who repels a siege. */
  MARKS_GRAZE: 8,
  MARKS_DECISIVE: 14,
  MARKS_REPELLED: 4,
  /** Matchmaking: up to 5 unshielded lords within 0.75 to 1.35 of your rating, then mercenaries. */
  TARGETS: 5,
  BRACKET_LOW: 0.75,
  BRACKET_HIGH: 1.35,
  MERCENARY_SCALES: [0.85, 0.95, 1.0, 1.1, 1.2] as readonly number[],
  /** A mercenary bounty: min(GOLD_SCALE × 0.6 × your rating, 5% of the war chest), always under the fee
   *  (DESIGN.md 11.4). */
  MERCENARY_BOUNTY_PER_RATING: 0.6 * GOLD_SCALE,
  MERCENARY_CHEST_SHARE: 0.05,
} as const;

/** Section 4E.6: walls and wounds recover; nothing is ever lost for good. */
export const RECOVERY = {
  WALL_FLOOR: 50,
  INFIRMARY_MAX: 30,
  PER_HOUR: 5,
  /** Integrity a defender's walls lose to a grazing and a decisive breach. */
  WALL_LOSS_GRAZE: 10,
  WALL_LOSS_DECISIVE: 20,
  /** Wounds taken: by the side that lost, and by the side that won. */
  WOUNDS_LOSER: 10,
  WOUNDS_WINNER: 4,
  /** Instant repair or healing: AP, and GOLD_SCALE × 20 gold per point restored per average level. */
  INSTANT_AP: 10,
  INSTANT_GOLD_PER_POINT_LEVEL: 20 * GOLD_SCALE,
} as const;

/** Section 5: the three endless sinks. */
export const SINKS = {
  DRILL_AP: 10,
  DRILL_XP_PER_AP: 25,
  /** bonusPct = 50 × (1 − e^(−xp ÷ 10000)). */
  DRILL_MAX_PCT: 50,
  DRILL_SCALE: 10_000,
  EXCAVATION_AP: 25,
  /** GOLD_SCALE × 2000 × 1.15^depth gold a level. */
  EXCAVATION_GOLD_BASE: 2000 * GOLD_SCALE,
  EXCAVATION_GROWTH: 1.15,
  /** The idle multiplier, 1 + 0.02 × √depth (DESIGN.md section 7: it lifts the edict and idle AP). */
  EXCAVATION_MULT_SLOPE: 0.02,
  INCURSION_AP: 30,
  INCURSION_SCOUT_AP: 5,
  /** A fortress at tier t: 80 × t^1.05 of power in its garrison, behind walls of level t. */
  INCURSION_POWER_BASE: 80,
  INCURSION_POWER_EXP: 1.05,
  INCURSION_MARKS_BASE: 6,
  INCURSION_DRILL_XP_BASE: 150,
  INCURSION_DRILL_XP_PER_TIER: 20,
} as const;

/** The weekly decree: floor(now in seconds ÷ 604,800) mod 5. */
export const DECREE_WEEK_SECONDS = 604_800;

/** When Castle Clash and its tabs open (DESIGN.md section 6). */
export const UNLOCKS = {
  TOTAL_LEVEL: 100,
  INCURSIONS_UNIT_LEVEL: 3,
  WAR_ROOM_AVG_LEVEL: 5,
  RELIQUARY_MARKS_EARNED: 1,
} as const;
