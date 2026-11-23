// What will happen while a player is away (session 171). The server does not play a save while its player
// is away (it plays the absence when they come back), so when their last page closes it plays a copy a
// day ahead, once, and keeps what is worth a notice: the first lane to stop with nothing to set it going
// again, and the hour before the lanes rest at the away cap if any is still at work.
import { isQuietStop } from '@idle-clash/content';
import { DEFAULT_CONFIG, LANE_IDS, seeded, type Engine, type GameEvent, type State } from '@idle-clash/kernel';

export const HOUR = 3_600_000;

type Stopped = Extract<GameEvent, { type: 'laneStopped' }>;

export type Foreseen = { kind: 'stop'; at: number; event: Stopped } | { kind: 'rest'; at: number; restsAt: number };

export function foresee(engine: Engine, state: State, leftAt: number): Foreseen[] {
  const restsAt = state.lastSeen + DEFAULT_CONFIG.awayCap;
  if (restsAt <= leftAt) return [];
  const ahead = engine.advance(state, restsAt, seeded(state.seed)).state;
  const out: Foreseen[] = [];
  // The first lane to stop after the player left, and stay stopped: a lane that waits for an ingredient
  // and starts again by itself (session 149) is not stopped at the end.
  const stops = LANE_IDS.flatMap((lane) => {
    const s = ahead.lanes[lane].stopped;
    if (!s || ahead.lanes[lane].current || isQuietStop(s.reason.code) || s.at <= leftAt) return [];
    const event: Stopped = { type: 'laneStopped', at: s.at, lane, reason: s.reason, action: s.action ?? null };
    return [event];
  }).sort((a, b) => a.at - b.at);
  if (stops.length) out.push({ kind: 'stop', at: stops[0].at, event: stops[0] });
  // Still at work when the lanes rest: said an hour before, while there is time to come back.
  if (LANE_IDS.some((lane) => ahead.lanes[lane].current) && restsAt - HOUR > leftAt)
    out.push({ kind: 'rest', at: restsAt - HOUR, restsAt });
  return out;
}
