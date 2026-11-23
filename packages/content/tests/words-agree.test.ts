// Numbers written into words, held to the constants the engine plays by (session 193): the castle's
// castellans, decrees, studies and spy missions, the treasury's edict and the trap say their numbers in
// their words ("Spies +25% stealth"), not through a placeholder, so a constant tuned would leave its words
// saying the old one, as session 125 found of "5 an hour". Each number in such words is one the content
// gives, and each of the content's is said.
import { describe, expect, it } from 'vitest';
import {
  COMBAT,
  DECREES,
  DOCTRINES,
  ECONOMY,
  ESPIONAGE,
  POISON_PCT,
  SIEGE,
  SPY_MISSIONS,
  TECHS,
  t,
  type CastleEffect,
} from '../src/index.ts';

const HOUR = 3_600_000;
const numbers = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).map(Number);
const valuesOf = (effects: readonly CastleEffect[]) =>
  effects.flatMap((e) => {
    const x = e as { pct?: number; amount?: number; share?: number };
    return [x.pct, x.amount, x.share === undefined ? undefined : x.share * 100]
      .filter((v): v is number => v !== undefined)
      .map(Math.abs);
  });

/** Every number the words say is one the effects give; every effect's number is said, or is a half said in
 *  words ("repairs at half", "upkeep is halved") or a share of the walls said as "breached more". */
function agrees(words: string, effects: readonly CastleEffect[]) {
  const said = numbers(words);
  const given = valuesOf(effects);
  for (const n of said) expect(given, `${words}: ${n}`).toContain(n);
  for (const e of effects) {
    const x = e as { pct?: number; amount?: number; share?: number };
    const v = Math.abs(x.pct ?? x.amount ?? 0);
    if (x.share !== undefined && !said.includes(x.share * 100)) expect(words).toMatch(/breached more|walls breached/);
    else if (v === 50 && !said.includes(50)) expect(words).toMatch(/half|halved/);
    else if (x.share === undefined) expect(said, words).toContain(v);
  }
}

describe('numbers in words', () => {
  it("agree with the castellans', the decrees' and the studies' effects", () => {
    for (const d of DOCTRINES) agrees(t(`castle.castellan.${d.id}.does`), d.effects);
    for (const d of DECREES) agrees(t(`castle.decree.does.${d.id}`), d.effects);
    for (const s of TECHS) agrees(t(`castle.tech.${s.id}.does`), s.perRank);
  });

  it("agree with the spy missions' debuffs and the watch put on guard", () => {
    const of = (id: string) => SPY_MISSIONS.find((m) => m.id === id)!.debuff!;
    expect(numbers(t('castle.mission.poison.does'))).toEqual([POISON_PCT, of('poison').lasts / HOUR]);
    expect(t('castle.mission.poison.does')).toContain(of('poison').max === 2 ? 'twice' : String(of('poison').max));
    for (const id of ['sabotage', 'forge'])
      expect(numbers(t(`castle.mission.${id}.does`))).toContain(of(id).lasts / HOUR);
    expect(numbers(t('castle.mission.sabotage.foeDoes'))).toEqual([of('sabotage').lasts / HOUR]);
    expect(numbers(t('castle.target.spies'))).toEqual([POISON_PCT, of('poison').lasts / HOUR]);
    expect(numbers(t('castle.spy.foeLead', { pct: 'half' }))).toContain(ESPIONAGE.COMPROMISED_MS / HOUR);
  });

  it("agree with the edict's treasury, the trap and a new castle's shield", () => {
    expect(numbers(t('castle.treasury.required', { gold: 'X' }))).toEqual([ECONOMY.UNPAID_MORALE * 100]);
    expect(numbers(t('castle.treasury.upkeep'))).toEqual([ECONOMY.UPKEEP_PER_DAY * 100]);
    expect(t('castle.treasury.upkeep')).toContain(ECONOMY.UPKEEP_PAUSE_MS === 48 * HOUR ? 'two days' : '?');
    expect(numbers(t('castle.trap.against', { unit: 'U' }))).toEqual([(1 - COMBAT.TRAP_PENALTY) * 100]);
    expect(numbers(t('castle.raise.lead'))).toContain(SIEGE.NOVICE_MS / HOUR);
  });
});
