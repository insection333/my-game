// Castle Clash's sieges (SPEC.md section 4E): what one costs (overextension and fatigue), whether it may
// go, and its whole resolution between two castles: the roll, spoils and their burn, war marks, walls and
// wounds, and for a genuine siege, vigilance, the truce shield and consumed sabotage. Pure.
import { ESPIONAGE, RECOVERY, SIEGE } from '@idle-clash/content';
import { formatUtcDate, type Castle, type DebuffKind } from './castle.ts';
import { castleSide, combatRatio, debuffStacks, lootFactor, outcomeOf, type Outcome } from './combat.ts';
import { lift, modifiers } from './effects.ts';
import { raidableGold, requiredTreasury, splitBurn } from './economy.ts';
import { pairOf, withPair } from './pairs.ts';

/** The defender's rating over the attacker's (the plan's brRatio). */
export const brRatio = (attacker: Castle, defender: { rating: number }): number =>
  defender.rating / Math.max(1, attacker.rating);

/** Sieges launched before this one today (UTC). */
const launchedToday = (c: Castle, now: number) => (c.siegesDayUtc === formatUtcDate(now) ? c.siegesToday : 0);

/** A siege's AP and gold: base, more against a far weaker castle, more after three sieges in a day. */
export function siegeCosts(c: Castle, ratio: number, now: number): { ap: number; gold: number } {
  const extra = Math.max(0, launchedToday(c, now) + 1 - SIEGE.FATIGUE_FREE);
  const over =
    ratio < SIEGE.OVEREXTENSION_RATIO ? (SIEGE.OVEREXTENSION_RATIO / ratio) ** SIEGE.OVEREXTENSION_COST_EXP : 1;
  return {
    ap: SIEGE.AP * (1 + SIEGE.FATIGUE_AP * extra),
    gold: Math.round(SIEGE.MOBILIZE_PER_RATING * Math.max(1, c.rating) * over * (1 + SIEGE.FATIGUE_GOLD * extra)),
  };
}

/** Raids and war marks shrink against a far weaker castle: (brRatio ÷ 0.8)². */
export const overextensionReward = (ratio: number): number =>
  ratio < SIEGE.OVEREXTENSION_RATIO ? (ratio / SIEGE.OVEREXTENSION_RATIO) ** SIEGE.OVEREXTENSION_REWARD_EXP : 1;

/** War marks for a siege by the ratio: less against a far weaker castle, more against a stronger one
 *  (brRatio², up to 1.5; session 38), so the bolder attack is worth its worse odds. */
export const marksReward = (ratio: number): number =>
  ratio > 1 ? Math.min(SIEGE.BOLD_MARKS_MAX, ratio ** 2) : overextensionReward(ratio);

export type SiegeRefusal = 'self' | 'shielded' | 'fallen' | 'pairLimit' | 'ap';

/** Why a siege may not go, or null. Gold is the caller's to check (purse or treasury). */
export function siegeRefusal(
  att: Castle,
  defId: string,
  defShielded: boolean,
  ap: number,
  now: number,
): SiegeRefusal | null {
  if (att.userId === defId) return 'self';
  if (defShielded) return 'shielded';
  const pair = pairOf(att, defId, now);
  if (pair.fell) return 'fallen';
  if (pair.sieges.length >= ESPIONAGE.PAIR_SIEGES) return 'pairLimit';
  if (att.activeAp + 1e-9 < ap) return 'ap';
  return null;
}

/** The attacker's side of any siege: AP and the day's count spent, the pair noted, and for a siege on a
 *  lord (not a stronghold: session 40) its own shield ended. */
export function launch(att: Castle, defId: string, ap: number, now: number, onLord = true): Castle {
  const today = formatUtcDate(now);
  const pair = pairOf(att, defId, now);
  const launched: Castle = {
    ...att,
    activeAp: Math.max(0, att.activeAp - ap),
    siegesDayUtc: today,
    siegesToday: launchedToday(att, now) + 1,
    shieldUntil: onLord ? Math.min(att.shieldUntil, now) : att.shieldUntil,
  };
  return withPair(launched, { ...pair, sieges: [...pair.sieges, now] }, now);
}

/** Wounds after a battle (capped at 30%), and walls after a breach (never under 50%). */
const wound = (pct: number, add: number, woundsTaken: number) =>
  Math.min(RECOVERY.INFIRMARY_MAX, pct + add * lift(woundsTaken));
const batter = (integrity: number, loss: number) => Math.max(RECOVERY.WALL_FLOOR, integrity - loss);

export interface Spoils {
  raided: number;
  toAttacker: number;
  destroyed: number;
  toChest: number;
}

/** Raided gold, split: the defender loses all of it, the attacker gets 65%, 30% is destroyed, 5% to the
 *  war chest. */
export function splitSpoils(raided: number): Spoils {
  const toAttacker = Math.floor(raided * SIEGE.SPOILS_TO_ATTACKER);
  const toChest = Math.floor(raided * SIEGE.SPOILS_TO_WAR_CHEST);
  return { raided, toAttacker, toChest, destroyed: raided - toAttacker - toChest };
}

export interface SiegeResult {
  attacker: Castle;
  defender: Castle;
  outcome: Outcome;
  r: number;
  attackPower: number;
  defensePower: number;
  genuine: boolean;
  spoils: Spoils;
  attackerMarks: number;
  defenderMarks: number;
  /** The truce shield the defender raised, if this was their third genuine siege in 12 hours. */
  truce: boolean;
  /** Debuffs this siege consumed (each now an immunity). */
  consumed: DebuffKind[];
}

/** Resolves a siege between two synced castles. The attacker has paid the fee and AP (`launch`); `roll` is
 *  in [0, 1); total levels are each lord's, for the required treasury and morale. */
export function resolveSiege(
  att: Castle,
  def: Castle,
  now: number,
  roll: number,
  levels: { attacker: number; defender: number },
): SiegeResult {
  const ratio = brRatio(att, def);
  const fair = ratio <= SIEGE.GENUINE_MAX_RATIO;
  const attSide = castleSide(att, now, 'attack');
  const defSide = castleSide(def, now, 'defense', { totalLevel: levels.defender, fair });
  const { attack, defense, r } = combatRatio(attSide, defSide, roll);
  const outcome = outcomeOf(r);
  const genuine = fair && r >= SIEGE.GENUINE_MIN_R;
  const attMods = modifiers(att, now);
  const defMods = modifiers(def, now);
  const reward = overextensionReward(ratio);

  // Spoils: what is raidable, less vigilance, less for a far weaker castle, never past the raid cap.
  const raidable = Math.min(
    raidableGold(def, now) * (1 - SIEGE.VIGILANCE_RAIDABLE * defSide.vigilance) * reward,
    SIEGE.RAID_CAP_REQUIRED * requiredTreasury(def, levels.defender),
  );
  const factor = Math.min(1, lootFactor(r) * (outcome === 'repelled' ? 0 : lift(attMods.loot)));
  const spoils = splitSpoils(Math.min(def.treasury, Math.max(0, Math.round(raidable * factor))));
  const breach = outcome !== 'repelled';
  const attackerMarks = breach
    ? Math.round(
        (outcome === 'decisive' ? SIEGE.MARKS_DECISIVE : SIEGE.MARKS_GRAZE) * marksReward(ratio) * lift(attMods.marks),
      )
    : 0;
  const defenderMarks = breach ? 0 : Math.round(SIEGE.MARKS_REPELLED * lift(defMods.marks));

  const wallLoss = breach
    ? (outcome === 'decisive' ? RECOVERY.WALL_LOSS_DECISIVE : RECOVERY.WALL_LOSS_GRAZE) * lift(attMods.wallDamage)
    : 0;
  let defender: Castle = {
    ...def,
    treasury: def.treasury - spoils.raided,
    warMarks: def.warMarks + defenderMarks,
    warMarksEarned: def.warMarksEarned + defenderMarks,
    wallIntegrity: batter(def.wallIntegrity, wallLoss),
    infirmaryPct: wound(def.infirmaryPct, breach ? RECOVERY.WOUNDS_LOSER : RECOVERY.WOUNDS_WINNER, defMods.woundsTaken),
  };
  const attacker: Castle = {
    ...att,
    warMarks: att.warMarks + attackerMarks,
    warMarksEarned: att.warMarksEarned + attackerMarks,
    infirmaryPct: wound(att.infirmaryPct, breach ? RECOVERY.WOUNDS_WINNER : RECOVERY.WOUNDS_LOSER, attMods.woundsTaken),
  };

  // A genuine siege: vigilance for the defender, the truce on the third in 12 hours, sabotage consumed.
  let truce = false;
  const consumed: DebuffKind[] = [];
  if (genuine) {
    const recent = [...def.genuineReceived.filter((t) => t > now - SIEGE.VIGILANCE_WINDOW_MS), now];
    truce = recent.length >= SIEGE.TRUCE_AFTER;
    const active = debuffStacks(def, now);
    const immunities = { ...def.immunities };
    for (const kind of ['poison', 'sabotage', 'forge'] as const)
      if (active[kind] > 0) {
        consumed.push(kind);
        immunities[kind] = now + ESPIONAGE.IMMUNITY_MS;
      }
    defender = {
      ...defender,
      genuineReceived: truce ? [] : recent,
      shieldUntil: truce ? Math.max(defender.shieldUntil, now + SIEGE.TRUCE_MS) : defender.shieldUntil,
      debuffs: defender.debuffs.filter((d) => !consumed.includes(d.kind)),
      immunities,
    };
  }
  return {
    attacker,
    defender,
    outcome,
    r,
    attackPower: attack,
    defensePower: defense,
    genuine,
    spoils,
    attackerMarks,
    defenderMarks,
    truce,
    consumed,
  };
}

/** The fee is burned whatever the outcome (DESIGN.md 5.10). */
export const burnFee = (gold: number) => splitBurn(gold);
