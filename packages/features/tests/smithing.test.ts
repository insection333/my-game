// Smithing: recipes take their ingredients, stop with the reason when one runs out, and the queued
// Next action starts at that moment, whether the player is there or away.
import { formatStop, XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const rng = seeded(4);
const smith = (id: string) => ({ feature: 'smithing', id });
const withSmithing = (level: number, items: Record<string, number>): State => ({
  ...newState(4, T0),
  skills: { smithing: { xp: XP_TABLE[level] } },
  items,
});

describe('smithing', () => {
  it('smelts a bar from its ore, and forges a sword from three bars', () => {
    let s = engine.command(
      withSmithing(2, { 'copper-ore': 3 }),
      T0,
      { type: 'start', lane: 'artisan', action: smith('copper-bar') },
      rng,
    ).state;
    s = engine.advance(s, T0 + 23_000, rng).state;
    expect(s.items['copper-bar']).toBeGreaterThanOrEqual(3);
    expect(s.items['copper-ore']).toBeUndefined();
    s = engine.command(s, T0 + 23_000, { type: 'start', lane: 'artisan', action: smith('copper-sword') }, rng).state;
    s = engine.advance(s, T0 + 23_000 + 23_000, rng).state;
    expect(s.items['copper-sword']).toBe(1);
  });

  it('refuses to start without the ingredients, and says which one', () => {
    const r = engine.command(
      withSmithing(10, { 'copper-ore': 5 }),
      T0,
      { type: 'start', lane: 'artisan', action: smith('bronze-bar') },
      rng,
    );
    expect(r.result).toEqual({ ok: false, reason: { code: 'outOfInputs', detail: { item: 'tin-ore' } } });
    if (!r.result.ok) expect(formatStop(r.result.reason)).toBe('Out of tin ore');
  });

  it('stops when the ore runs out, says why, and starts the queued Next action while the player is away', () => {
    // 60 ore lasts beyond the fire's five minutes: the lane runs out after the player has gone.
    let s = engine.command(
      withSmithing(2, { 'copper-ore': 60 }),
      T0,
      { type: 'start', lane: 'artisan', action: smith('copper-bar') },
      rng,
    ).state;
    s = engine.command(s, T0, { type: 'queueNext', lane: 'artisan', action: smith('copper-sword') }, rng).state;
    const away = engine.advance(s, T0 + 8 * HOUR, rng);
    const stopped = away.events.find((e) => e.type === 'laneStopped');
    const started = away.events.find((e) => e.type === 'nextStarted');
    expect(stopped).toMatchObject({ lane: 'artisan', reason: { code: 'outOfInputs', detail: { item: 'copper-ore' } } });
    expect(started).toMatchObject({ lane: 'artisan', action: smith('copper-sword'), at: stopped!.at });
    expect(stopped!.at).toBeGreaterThan(s.fireUntil);
    expect(away.state.items['copper-sword']).toBeGreaterThanOrEqual(2);
    expect(away.state.lanes.artisan.stopped?.reason).toEqual({ code: 'outOfInputs', detail: { item: 'copper-bar' } });
  });

  it('with Thrifty, sometimes saves an ingredient', () => {
    let s = engine.command(
      withSmithing(9, { 'copper-ore': 2000 }),
      T0,
      { type: 'start', lane: 'artisan', action: smith('copper-bar') },
      rng,
    ).state;
    s = engine.advance(s, T0 + 2 * HOUR, rng).state;
    const made = s.mastery['smithing:copper-bar'];
    const used = 2000 - (s.items['copper-ore'] ?? 0);
    expect(made - used).toBeGreaterThan(made * 0.02);
    expect(made - used).toBeLessThan(made * 0.07);
  });
});
