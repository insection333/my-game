// Castle Clash's luck (session 35): tempering a relic without end, and the spoils of a fortress taken.
import { RELIC, SINKS, TEMPER } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import {
  bastionRating,
  launchIncursion,
  modifiers,
  newCastle,
  spoilsOf,
  temperChance,
  temperCost,
  temperMult,
  temperRelic,
  type Castle,
} from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 9);
const lord = (extra: Partial<Castle> = {}): Castle => ({
  ...newCastle('a', T0),
  warMarks: 10_000,
  relics: { 'banner-of-the-first-king': RELIC.LEVELS, 'aegis-shard': 2 },
  equippedRelics: ['banner-of-the-first-king'],
  ...extra,
});

describe('relic tempering', () => {
  it('opens at a relic’s last level, and costs more and succeeds less each time, never below 5%', () => {
    const c = lord();
    expect(temperCost(c, 'aegis-shard')).toBeNull();
    expect(temperCost(c, 'tidings-stone')).toBeNull();
    expect(temperChance(0)).toBeCloseTo(TEMPER.CHANCE_BASE, 9);
    for (let n = 1; n < 60; n++) {
      expect(temperChance(n)).toBeLessThanOrEqual(temperChance(n - 1));
      expect(temperChance(n)).toBeGreaterThanOrEqual(TEMPER.CHANCE_MIN);
    }
    expect(temperChance(100)).toBe(TEMPER.CHANCE_MIN);
    const at = (t: number) =>
      temperCost({ ...c, tempers: { 'banner-of-the-first-king': t } }, 'banner-of-the-first-king')!;
    expect(at(5).gold).toBeGreaterThan(at(4).gold);
    expect(at(5).marks).toBeGreaterThan(at(4).marks);
  });

  it('takes its price whatever comes of it: held, tempered, or a masterstroke worth two', () => {
    const w = { castle: lord(), purse: 1e12 };
    const cost = temperCost(w.castle, 'banner-of-the-first-king')!;
    const held = temperRelic(w, 'banner-of-the-first-king', 0.99, 0);
    expect(held).toMatchObject({ ok: true, outcome: 'held', tempers: 0, burned: cost.gold });
    if (!held.ok) return;
    expect(held.castle.warMarks).toBe(10_000 - cost.marks);
    expect(held.purse).toBe(1e12 - cost.gold);
    expect(temperRelic(w, 'banner-of-the-first-king', 0, 0.99)).toMatchObject({ outcome: 'tempered', tempers: 1 });
    expect(temperRelic(w, 'banner-of-the-first-king', 0, 0)).toMatchObject({ outcome: 'masterstroke', tempers: 2 });
    expect(temperRelic({ ...w, purse: 0 }, 'banner-of-the-first-king', 0, 0)).toEqual({ ok: false, reason: 'gold' });
    expect(temperRelic({ castle: lord({ warMarks: 0 }), purse: 1e12 }, 'banner-of-the-first-king', 0, 0)).toEqual({
      ok: false,
      reason: 'marks',
    });
    expect(temperRelic(w, 'aegis-shard', 0, 0)).toEqual({ ok: false, reason: 'locked' });
  });

  it('strengthens the relic it tempers, towards half again, and lifts the rating with it', () => {
    expect(temperMult(0)).toBe(1);
    for (let n = 1; n < 200; n++) expect(temperMult(n)).toBeGreaterThan(temperMult(n - 1));
    expect(temperMult(1000)).toBeLessThanOrEqual(1 + TEMPER.BONUS_MAX);
    const plain = lord();
    const tempered = lord({ tempers: { 'banner-of-the-first-king': 10 } });
    expect(modifiers(tempered, T0).attack).toBeCloseTo(modifiers(plain, T0).attack * temperMult(10), 9);
    expect(bastionRating(tempered)).toBeGreaterThan(bastionRating(plain));
  });
});

describe('the spoils of a fortress', () => {
  it('finds the hoard 1 in 100 and the armoury 1 in 10, and multiplies the war marks', () => {
    expect(spoilsOf(0.005)).toBe('hoard');
    expect(spoilsOf(0.05)).toBe('armoury');
    expect(spoilsOf(0.2)).toBeNull();
    const strong = { ...lord(), activeAp: 200, levels: { ...lord().levels, vanguard: 40, outriders: 40, siege: 40 } };
    const plain = launchIncursion(strong, T0, 0.5, 0.5);
    const armoury = launchIncursion(strong, T0, 0.5, 0.05);
    const hoard = launchIncursion(strong, T0, 0.5, 0.005);
    if (plain === 'ap' || armoury === 'ap' || hoard === 'ap') throw new Error('AP');
    expect(plain.won).toBe(true);
    expect(plain.marks).toBeGreaterThanOrEqual(SINKS.INCURSION_MARKS_BASE);
    expect(armoury).toMatchObject({ spoils: 'armoury', marks: plain.marks * 2 });
    expect(hoard).toMatchObject({ spoils: 'hoard', marks: plain.marks * 5 });
  });
});
