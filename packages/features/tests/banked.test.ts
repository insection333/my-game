// Session 253: days banked. A boss's daily fight and the realm's strike were lost when a day passed unplayed, so a
// friend who plays every other day struck the realm's boss half as often as one who plays daily. A day not
// fought now banks its fight, up to three.
import { HOUR, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { BANK_DAYS, dayOf, fightsBanked, realmFights, spendRealm } from '../src/shared/expeditions/bank.ts';
import { expeditionsOf, setExpeditions } from '../src/shared/expeditions/state.ts';
import { planRound, roundFoes } from '../src/expeditions/round.ts';
import { bossRows } from '../src/expeditions/views.ts';
import { expeditionErrands } from '../src/expeditions/errands.ts';
import { engine, fighterAt, T0 } from './helpers/expedition.ts';

const DAY = 24 * HOUR;
const BOSSES = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'bosses' } } as const;

/** A save whose bosses were last fought `days` ago with nothing banked. */
function lastFought(s: State, days: number): State {
  const out = structuredClone(s);
  const ids = bossRows(s, T0).map((b) => b.id);
  const e = expeditionsOf(out);
  const day = dayOf(T0 - days * DAY);
  setExpeditions(out, {
    ...e,
    bossDay: Object.fromEntries(ids.map((id) => [id, day])),
    bossLeft: Object.fromEntries(ids.map((id) => [id, 0])),
  });
  return out;
}

describe('a day not fought', () => {
  it('banks its fight, up to three', () => {
    const today = dayOf(T0);
    expect(fightsBanked(null, undefined, today)).toBe(1);
    expect(fightsBanked(today, 0, today)).toBe(0);
    expect(fightsBanked(today, 2, today)).toBe(2);
    expect(fightsBanked(dayOf(T0 - DAY), 0, today)).toBe(1);
    expect(fightsBanked(dayOf(T0 - 2 * DAY), 0, today)).toBe(2);
    expect(fightsBanked(dayOf(T0 - 9 * DAY), 0, today)).toBe(BANK_DAYS);
    expect(fightsBanked(dayOf(T0 - DAY), 2, today)).toBe(BANK_DAYS);
    expect(fightsBanked('2026-99-99', 0, today)).toBe(1);
  });

  it("lets a friend who plays every other day strike the realm's boss as often as one who plays daily", () => {
    const strikes = (every: number) => {
      let s = fighterAt('march', 5);
      let n = 0;
      for (let d = 0; d < 14; d += every)
        for (let at = T0 + d * DAY; realmFights(s, at) > 0; n++)
          s = { ...s, features: { ...s.features, expeditions: spendRealm(s, expeditionsOf(s), at) } };
      return n;
    };
    expect(strikes(1)).toBe(14);
    // The first visit has one; each after, the two days since.
    expect(strikes(2)).toBe(13);
    expect(strikes(3)).toBe(13);
  });
});

describe('banked fights', () => {
  it("are fought one after another by the day's bosses, then rest", () => {
    const s = lastFought(fighterAt('march', 13), 3);
    const ready = bossRows(s, T0).filter((b) => b.ready && (b.verdictId === 'easy' || b.verdictId === 'fair'));
    expect(ready.length).toBeGreaterThan(0);
    expect(ready.every((b) => b.fights === 3 && b.banked === '3 fights banked')).toBe(true);
    const foes = roundFoes(s, T0);
    expect(foes).toEqual(ready.flatMap((b) => [b.id, b.id, b.id]));
    const set = engine.command(planRound(s, T0).state, T0, BOSSES, seeded(13)).state;
    const out = engine.advance({ ...set, lastSeen: T0 + 6 * HOUR }, T0 + 6 * HOUR, seeded(13));
    const fought = out.events.filter((e) => e.type === 'bossFought').map((e) => e.type === 'bossFought' && e.boss);
    expect(fought).toEqual(foes);
    const ids = ready.map((b) => b.id);
    expect(
      bossRows(out.state, T0 + 6 * HOUR)
        .filter((b) => ids.includes(b.id))
        .every((b) => b.fights === 0),
    ).toBe(true);
    // Tomorrow, one waits again.
    expect(bossRows(out.state, T0 + DAY).find((b) => b.id === ready[0].id)?.fights).toBe(1);
  });

  it('are counted on the Hearth', () => {
    const s = lastFought(fighterAt('march', 13), 2);
    const ready = bossRows(s, T0).filter((b) => b.ready && (b.verdictId === 'easy' || b.verdictId === 'fair'));
    const words =
      ready.length === 1
        ? `${ready[0].name} can be fought 2 times today`
        : `${(ready.length * 2).toString()} boss fights wait today`;
    expect(expeditionErrands(s, T0).map((r) => r.text)).toContain(words);
  });
});
