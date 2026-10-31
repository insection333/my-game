// A relic's effect reaches every place its words cover: the Four-leaf charm's "more finds" in the
// lanes' work and in fights alike (both roll their finds through rollFind, which adds it).
import { createEngine, HOUR, newState, seeded, type GameEvent, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { FOES, regionOf } from '../src/shared/combat/data.ts';
import { expeditionsOf, setExpeditions } from '../src/shared/expeditions/state.ts';
import { fighterAt, T0 } from './helpers/expedition.ts';

const engine = createEngine(actionRegistry(FEATURES, () => true));
const withCharm = (s: State, rank: number): State => {
  const out = structuredClone(s);
  setExpeditions(out, { ...expeditionsOf(out), relics: { 'four-leaf-charm': rank } });
  return out;
};

/** Finds in a day of one action, coming back every half hour. */
function findsIn(start: State, action: { feature: string; id: string }, lane: 'gathering' | 'combat'): number {
  let s = engine.command(start, T0, { type: 'start', lane, action }, seeded(start.seed)).state;
  let found = 0;
  for (let at = T0 + HOUR / 2; at <= T0 + 24 * HOUR; at += HOUR / 2) {
    const out = engine.advance({ ...s, lastSeen: at }, at, seeded(start.seed));
    s = out.state;
    found += out.events.filter((e: GameEvent) => e.type === 'find').length;
  }
  return found;
}

describe('the Four-leaf charm', () => {
  it('brings more finds in fights', () => {
    const foe = FOES.filter((f) => regionOf(f.tier) === 'march').at(-1)!;
    const plain = findsIn(fighterAt('march', 7), { feature: 'combat', id: foe.id }, 'combat');
    const charmed = findsIn(withCharm(fighterAt('march', 7), 5), { feature: 'combat', id: foe.id }, 'combat');
    expect(plain).toBeGreaterThan(5);
    expect(charmed).toBeGreaterThan(plain);
  });

  it('brings more finds in the lanes’ work', () => {
    const chopper = { ...newState(7, T0), skills: { woodcutting: { xp: 0 } } };
    const plain = findsIn(chopper, { feature: 'woodcutting', id: 'pine-tree' }, 'gathering');
    const charmed = findsIn(withCharm(chopper, 5), { feature: 'woodcutting', id: 'pine-tree' }, 'gathering');
    expect(charmed).toBeGreaterThan(plain);
  });
});
