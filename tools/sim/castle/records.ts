// What a realm of castles records as it plays (realm.ts), for the checks (checks.ts).
import type { castleEngine as E } from '@idle-clash/features';
import type { LordKind } from './realm.ts';

export interface SiegeRecord {
  day: number;
  attacker: string;
  defender: string;
  ratio: number;
  r: number;
  outcome: E.Outcome;
  raided: number;
  /** The defender's required treasury at the time. */
  required: number;
  fee: number;
}
export interface MercRecord {
  day: number;
  lord: string;
  scale: number;
  /** Its place among the day's five, easiest first. */
  n: number;
  outcome: E.Outcome;
  bounty: number;
  fee: number;
  marks: number;
  rout: boolean;
}
export interface Lord {
  id: string;
  kind: LordKind;
  castle: E.Castle;
  purse: number;
  /** Per day: the edict powered at the day's end, the tier, war marks earned, gold the treasury lost. */
  powered: boolean[];
  tiers: number[];
  marks: number[];
  levels: number[];
  raidedOn: number[];
}
export interface Realm {
  lords: Lord[];
  sieges: SiegeRecord[];
  mercs: MercRecord[];
  incursions: { day: number; r: number; won: boolean; tier: number; spoils: string | null }[];
  /** Tempering across the realm: tries, tempers taken, masterstrokes. */
  tempers: { tries: number; taken: number; masterstrokes: number };
  chest: number;
  destroyed: number;
  /** Gold burned, by what burned it. */
  burned: Record<string, number>;
  /** Gold that came in from play, and the realm's gold at the start. */
  income: number;
  start: number;
}
