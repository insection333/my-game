// The lanes drawn for every action the game has (session 109): session 103 named an expedition's chip by
// its region and never tried a boss, which is an expeditions action too, so Fight on a boss blanked the
// page. Every action of every feature is drawn here running, queued next and stopped on, and said in the
// moments and notices its mastery and its stops raise.
import { FEATURES, recap } from '@idle-clash/features';
import { laneKind, LANE_IDS, newState, type GameEvent, type LaneId, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { iconOf, laneViews } from '../src/shell/Lanes.tsx';
import { momentsFrom } from '../src/shell/moments.ts';

const T0 = Date.UTC(2026, 10, 15, 9);
const every = FEATURES.flatMap((f) =>
  Object.entries(f.rules).map(([id, rules]) => ({ action: { feature: f.id, id }, kind: rules.lane })),
);

describe('the lanes, for every action', () => {
  it('has actions to draw', () => {
    expect(every.length).toBeGreaterThan(100);
    expect(every.some((a) => a.action.feature === 'expeditions')).toBe(true);
  });

  it.each(every.map((a) => [`${a.action.feature}:${a.action.id}`, a] as const))('draws %s', (_, { action, kind }) => {
    const lane = LANE_IDS.find((l: LaneId) => laneKind(l) === kind)!;
    const s: State = newState(1, T0);
    const at = (l: State['lanes'][LaneId]): State => ({ ...s, lanes: { ...s.lanes, [lane]: l } });
    const base = s.lanes[lane];
    const states = [
      at({ ...base, current: { action, startedAt: T0, endsAt: T0 + 1000 } }),
      at({ ...base, current: null, next: action }),
      at({ ...base, current: null, stopped: { reason: { code: 'stoppedByPlayer' }, at: T0, action } }),
      at({ ...base, current: null, stopped: { reason: { code: 'storehouseFull' }, at: T0, action } }),
    ];
    for (const st of states) {
      const view = laneViews(st, T0 + 500, FEATURES).find((v) => v.id === lane)!;
      for (const words of [view.doing, view.chip, view.short]) if (words) expect(words).not.toMatch(/[{}]/);
    }
    expect(() => iconOf(FEATURES, action, lane)).not.toThrow();
  });
});

describe('moments and notices, for every action', () => {
  it.each(every.map((a) => [`${a.action.feature}:${a.action.id}`, a] as const))('say %s', (_, { action, kind }) => {
    const lane = LANE_IDS.find((l: LaneId) => laneKind(l) === kind)!;
    const events: GameEvent[] = [
      { type: 'masteryStep', at: T0, action, step: 3 },
      { type: 'laneStopped', at: T0 + 10_000, lane, action, reason: { code: 'storehouseFull' } },
      { type: 'refused', at: T0 + 20_000, lane, action, reason: { code: 'storehouseFull' } },
    ];
    for (const m of momentsFrom(events, T0 - 1, FEATURES)) expect(`${m.title} ${m.body}`).not.toMatch(/[{}]/);
    for (const e of events) {
      const line = recap.noticeLine(e);
      if (line) expect(line.text).not.toMatch(/[{}]/);
    }
  });
});
