// A boss from the middle of a fight (session 72): pressing Fight on a boss replaced the fight the lane was
// on, and the lane fell idle once the boss was done (it rests until tomorrow). The fight it was on is now
// queued next, so the lane goes back to it.
import { HOUR, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { engine, fighterAt, T0 } from '../../../packages/features/tests/helpers/expedition.ts';
import { bossCommands } from '../src/pages/boss-start.ts';
import { nextRoute } from '../../../packages/features/src/expeditions/route.ts';
import { setOut } from '../../../packages/features/src/expeditions/routes.ts';
import { planRound } from '../../../packages/features/src/expeditions/round.ts';
import { expeditionsOf } from '../../../packages/features/src/shared/expeditions/state.ts';

const run = (s: State, cmds: ReturnType<typeof bossCommands>) =>
  cmds.reduce((x, c) => {
    const out = engine.command(x, T0, c, seeded(3));
    expect(out.result).toEqual({ ok: true });
    return out.state;
  }, s);

describe('a boss fought from the middle of a fight', () => {
  it('goes back to the fight once the boss is done', () => {
    const fighting = run(fighterAt('march', 3), [
      { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'orc-raider' } },
    ]);
    const s = run(fighting, bossCommands(fighting, 'troll-chief'));
    expect(s.lanes.combat.current?.action).toEqual({ feature: 'expeditions', id: 'troll-chief' });
    const later = engine.advance({ ...s, lastSeen: T0 + HOUR }, T0 + HOUR, seeded(3)).state;
    expect(later.lanes.combat.current?.action).toEqual({ feature: 'combat', id: 'orc-raider' });
  });

  it('queues nothing from an idle lane, nor over a Next already chosen', () => {
    const idle = fighterAt('march', 3);
    expect(bossCommands(idle, 'troll-chief')).toHaveLength(1);
    const fighting = run(idle, [
      { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'orc-raider' } },
      { type: 'queueNext', lane: 'combat', action: { feature: 'combat', id: 'goblin-slinger' } },
    ]);
    expect(bossCommands(fighting, 'troll-chief')).toHaveLength(1);
  });

  // Session 239: the day's bosses pressed in the middle of a run took the lane and left the run behind.
  it("takes up a run again once the day's bosses are fought", () => {
    let s = fighterAt('peaks', 4);
    s = setOut(s, 'peaks', 8, nextRoute(s, 'peaks', 8)!.roads[0]).state;
    const peaks = { feature: 'expeditions', id: 'peaks' };
    s = run(s, [{ type: 'start', lane: 'combat', action: peaks }]);
    s = run(planRound(s, T0).state, bossCommands(s, 'bosses'));
    expect(s.lanes.combat.next).toEqual(peaks);
    const later = engine.advance({ ...s, lastSeen: T0 + 3 * HOUR }, T0 + 3 * HOUR, seeded(3)).state;
    expect(later.lanes.combat.current?.action).toEqual(peaks);
    expect(expeditionsOf(later).run?.at).toBeGreaterThan(0);
  });
});
