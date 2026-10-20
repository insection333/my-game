import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createEngine, HOUR, load, mend, SaveDoc, seeded, type SaveDoc as Doc } from '../src/index.ts';
import { registry, T0 } from './fixtures.ts';

const read = (file: string): Doc =>
  JSON.parse(readFileSync(new URL(`./saves/${file}`, import.meta.url), 'utf8')) as Doc;
/** The sample save of the current version. */
const sample = (): Doc => read('v2.json');
const NOW = T0 + 4 * HOUR;
/** The sample save, damaged by a change. */
function damaged(change: (doc: Doc) => void): unknown {
  const doc = sample();
  change(doc);
  return doc;
}

describe('mend', () => {
  it('leaves a sound save exactly as it is', () => {
    const doc = sample();
    expect(mend(doc, NOW)).toEqual({ doc, repairs: [] });
  });

  it('drops impossible items and keeps the rest', () => {
    const raw = damaged((d) => {
      d.state.items['copper-ore'] = -5;
      d.state.items.gold = 1.5;
      d.state.items['Bad Name'] = 3;
    });
    const { doc, repairs } = mend(raw, NOW);
    expect(doc.state.items).toEqual({ 'pine-logs': 1440, 'copper-bar': 1, 'copper-sword': 19, 'birds-nest': 31 });
    expect(repairs).toHaveLength(3);
  });

  it('keeps a key named __proto__ out of the state', () => {
    const raw = JSON.parse(JSON.stringify(sample()).replace('"items":{', '"items":{"__proto__":{"x":1},')) as unknown;
    const { doc } = mend(raw, NOW);
    expect(Object.hasOwn(doc.state.items, '__proto__')).toBe(false);
    expect(Object.getPrototypeOf(doc.state.items)).toBe(Object.prototype);
    expect((doc.state.items as Record<string, unknown>).x).toBeUndefined();
  });

  it('stops a lane whose action is damaged, and says so', () => {
    const raw = damaged((d) => {
      d.state.lanes.gathering.current!.endsAt = d.state.lanes.gathering.current!.startedAt - 1;
    });
    const { doc, repairs } = mend(raw, NOW);
    expect(doc.state.lanes.gathering.current).toBeNull();
    expect(doc.state.lanes.gathering.stopped?.reason).toEqual({ code: 'mended' });
    expect(doc.state.lanes.gathering.next).toEqual({ feature: 'mining', id: 'copper-vein' });
    expect(repairs).toEqual(["The gathering lane's action was damaged and was stopped"]);
  });

  it('resets a clock that lies in the future', () => {
    const raw = damaged((d) => {
      d.state.clock = NOW + 365 * 24 * HOUR;
    });
    const { doc, repairs } = mend(raw, NOW);
    expect(doc.state.clock).toBe(NOW);
    expect(repairs).toContain('The clock time was damaged and was reset');
  });

  it('makes a fresh start from a save that cannot be read at all', () => {
    for (const raw of [undefined, null, 'text', 42, []]) {
      const { doc, repairs } = mend(raw, NOW);
      expect(SaveDoc.safeParse(doc).success).toBe(true);
      expect(doc.state.clock).toBe(NOW);
      expect(repairs.length).toBeGreaterThan(0);
    }
  });

  it('always returns a valid save the engine can advance, whatever the damage', () => {
    const engine = createEngine(registry);
    const paths = [
      'state',
      'state.items',
      'state.lanes',
      'state.lanes.artisan',
      'state.lanes.gathering.current',
      'state.skills',
      'state.seed',
      'requests',
      'version',
    ];
    fc.assert(
      fc.property(fc.constantFrom(...paths), fc.anything(), (path, junk) => {
        const raw = sample() as unknown as Record<string, unknown>;
        const keys = path.split('.');
        const last = keys.pop()!;
        let at = raw;
        for (const k of keys) at = at[k] as Record<string, unknown>;
        at[last] = junk;
        const { doc } = mend(raw, NOW);
        expect(SaveDoc.safeParse(doc).success).toBe(true);
        expect(() => engine.advance(doc.state, NOW + HOUR, seeded(doc.state.seed))).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });
});

describe('load', () => {
  it('reads every sample save without repairs', () => {
    expect(load(read('v1.json'), NOW)).toMatchObject({ from: 1, repairs: [] });
    expect(load(read('v2.json'), NOW)).toMatchObject({ from: 2, repairs: [] });
  });

  it('upgrades a version 1 save: luck starts afresh and nothing is in the collection log yet', () => {
    const { doc } = load(read('v1.json'), NOW);
    expect(doc.version).toBe(2);
    expect(doc.state.luck).toEqual({ misses: 0, lastMoment: doc.state.clock });
    expect(doc.state.found).toEqual({});
    expect({ ...doc.state, luck: undefined, found: undefined }).toEqual({
      ...read('v1.json').state,
      luck: undefined,
      found: undefined,
    });
  });

  it('resets damaged luck and drops a damaged first-find date, saying so', () => {
    const raw = damaged((d) => {
      d.state.luck.lastMoment = d.state.clock + 1;
      d.state.found['amber-nugget'] = -3;
    });
    const { doc, repairs } = mend(raw, NOW);
    expect(doc.state.luck).toEqual({ misses: 0, lastMoment: doc.state.clock });
    expect(doc.state.found).toEqual({ 'birds-nest': sample().state.found['birds-nest'] });
    expect(repairs).toEqual(['Luck was damaged and was reset', 'First finds: dropped "amber-nugget" (-3)']);
  });

  it('refuses a save from a newer version rather than guessing', () => {
    expect(() => load({ ...sample(), version: 99 }, NOW)).toThrow('newer than this server');
  });
});
