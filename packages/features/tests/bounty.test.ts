// The bounty board (session 175): three bounties a day on foes the player fares well against, each about an
// hour of fights, one held at a time and done by fighting that foe in the lane; done, it pays marks and gold
// once. Past 99 in a style some are elite: the same foe, tougher, its finds likelier, fought while the
// bounty is held (and only in fights begun after it was taken), so the lane and Your odds meet it alike.
import { XP_TABLE } from '@idle-clash/content';
import { HOUR, seeded } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { combat } from '../src/combat/index.ts';
import { openOffers } from '../src/combat/bounty.ts';
import { asFought, bountyOf, ELITE, winsOver } from '../src/shared/bounty.ts';
import { foeById } from '../src/shared/combat/data.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { engine, fighterAt, T0 } from './helpers/expedition.ts';
import type { State } from '@idle-clash/kernel';
import { FEATURES } from '../src/index.ts';

const store = FEATURES.find((f) => f.id === 'storehouse')!;

describe('the bounty board', () => {
  it('offers three bounties on foes fared well against, each about an hour of fights', () => {
    const s = fighterAt('fen', 2);
    const offers = openOffers(s, T0);
    expect(offers).toHaveLength(3);
    for (const o of offers) {
      const odds = oddsFor(s, foeById(o.foe)!)!;
      expect(['easy', 'fair']).toContain(odds.verdict);
      const hours = (o.count * odds.secondsPerFight) / 3600;
      expect(hours).toBeGreaterThan(0.7);
      expect(hours).toBeLessThan(1.4);
      expect(o.elite).toBe(false);
    }
  });

  it('is done by fighting its foe in the lane, and pays once', () => {
    let s = fighterAt('fen', 2);
    const offer = openOffers(s, T0)[0];
    s = combat.routes.bounty.run(s, { foe: offer.foe }, T0).state;
    expect(bountyOf(s).taken?.foe).toBe(offer.foe);
    expect(combat.routes.bounty.run(s, { foe: openOffers(s, T0)[0]?.foe ?? offer.foe }, T0).result).toMatchObject({
      ok: false,
    });
    expect(openOffers(s, T0).some((o) => o.foe === offer.foe)).toBe(false);
    s = engine.command(
      s,
      T0,
      { type: 'start', lane: 'combat', action: { feature: 'combat', id: offer.foe } },
      seeded(2),
    ).state;
    const out = engine.advance({ ...s, lastSeen: T0 + 3 * HOUR }, T0 + 3 * HOUR, seeded(2));
    s = out.state;
    expect(winsOver(s, offer.foe) - bountyOf(s).taken!.base).toBeGreaterThanOrEqual(offer.count);
    const marks = expeditionsOf(s).marks;
    const r = combat.routes.bountyClaim.run(s, {}, T0 + 3 * HOUR);
    expect(r.result).toEqual({ ok: true });
    expect(r.events?.[0]).toMatchObject({ type: 'bountyDone', foe: offer.foe, elite: false });
    expect(expeditionsOf(r.state).marks).toBe(marks + 5);
    expect(bountyOf(r.state)).toMatchObject({ taken: null, done: 1 });
    expect(combat.routes.bountyClaim.run(r.state, {}, T0 + 3 * HOUR).result).toEqual({ ok: false, reason: 'none' });
  });

  it('offers elite foes past 99, tougher only in fights begun once it is held', () => {
    const top = fighterAt('peaks', 5);
    const s0 = { ...top, skills: { ...top.skills, archery: { xp: XP_TABLE[99] } } };
    const elites = [5, 6, 7, 8, 9, 10, 11, 12]
      .flatMap((d) => openOffers(s0, T0 + d * 24 * HOUR))
      .filter((o) => o.elite);
    expect(elites.length).toBeGreaterThan(0);
    const day = [5, 6, 7, 8, 9, 10, 11, 12].find((d) => openOffers(s0, T0 + d * 24 * HOUR).some((o) => o.elite))!;
    const at = T0 + day * 24 * HOUR;
    const offer = openOffers(s0, at).find((o) => o.elite)!;
    const s = combat.routes.bounty.run(s0, { foe: offer.foe }, at).state;
    const foe = foeById(offer.foe)!;
    expect(asFought(s, foe).hp).toBe(Math.round(foe.hp * ELITE.HP));
    expect(asFought(s, foe, at - 1)).toBe(foe);
    expect(oddsFor(s, foe)!.secondsPerFight).toBeGreaterThan(oddsFor(s0, foe)!.secondsPerFight);
  });

  it('is not done by a Rare find spent on its foe: a find gives mastery, not wins (session 181)', () => {
    let s = fighterAt('march', 2, 'melee');
    const offer = openOffers(s, T0)[0];
    s = combat.routes.bounty.run(s, { foe: offer.foe }, T0).state;
    s = { ...s, items: { ...s.items, 'torn-banner': 3 } };
    const used = store.routes.useFind.run(
      s,
      { item: 'torn-banner', action: { feature: 'combat', id: offer.foe }, count: 3 },
      T0,
    ) as {
      state: State;
      result: { ok: boolean };
    };
    expect(used.result.ok).toBe(true);
    expect(winsOver(used.state, offer.foe)).toBe(winsOver(s, offer.foe));
    expect(combat.routes.bountyClaim.run(used.state, {}, T0).result).toMatchObject({ ok: false, reason: 'notDone' });
  });

  it("counts only the Combat lane's own fights of its foe, not an expedition's (session 183)", () => {
    let s = fighterAt('march', 2, 'melee');
    const offer = openOffers(s, T0)[0];
    s = combat.routes.bounty.run(s, { foe: offer.foe }, T0).state;
    // An expedition's stage fights of the foe raise its wins (its mastery), at the foe's usual strength.
    const key = `combat:${offer.foe}`;
    const away = { ...s, mastery: { ...s.mastery, [key]: (s.mastery[key] ?? 0) + offer.count } };
    expect(combat.routes.bountyClaim.run(away, {}, T0).result).toMatchObject({ ok: false, reason: 'notDone' });
  });

  it("says when new bounties come once the day's three are taken (session 183)", () => {
    let s = fighterAt('march', 2, 'melee');
    for (let i = 0; i < 3; i++) {
      s = combat.routes.bounty.run(s, { foe: openOffers(s, T0)[0].foe }, T0).state;
      s = combat.routes.bountyLetGo.run(s, {}, T0).state;
    }
    const view = combat.slots['combat.bounty']({ state: s, now: T0 }) as unknown as { offers: unknown[]; note: string };
    expect(view.offers).toHaveLength(0);
    expect(view.note).toMatch(/new bounties come/);
  });
});
