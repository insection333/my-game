// How a goal reads on the Hearth: one row each, with its progress, its reward and one button (start
// its action, run a feature's route, or claim it). Shared by First steps and the ladder after them.
import { t } from '@idle-clash/content';
import {
  actionKey,
  LANE_IDS,
  laneFor,
  type ActionRef,
  type Command,
  type LaneId,
  type LaneKind,
  type State,
} from '@idle-clash/kernel';
import type { Json } from '../define.ts';

export interface GoalRow {
  id: string;
  name: string;
  reward: string;
  progress: number;
  /** "34 of 60" for goals that count (not First steps). */
  count?: string;
  state: 'todo' | 'working' | 'ready' | 'claimed';
  /** What its button does: start the step's action, or claim it. Null when there is nothing to press. */
  button:
    | { label: string; command: Command }
    | { label: string; claim: string }
    | { label: string; route: { feature: string; route: string; input: Json } }
    | null;
  note: string | null;
}

export interface GoalsView {
  title: string;
  /** "2 of 6 done" while on First steps; null afterwards. */
  progress: string | null;
  rows: GoalRow[];
  /** The page asks the server to make the goals it lacks (new short goals, today's daily goal). */
  refresh: boolean;
}

const LANE_NAMES: Record<LaneId, string> = {
  gathering: 'lane.gathering',
  gathering2: 'lane.gathering2',
  artisan: 'lane.artisan',
  combat: 'lane.combat',
};

/** The lane already doing this action, if any. */
export const workingIn = (state: State, action: ActionRef): LaneId | undefined =>
  LANE_IDS.find((l) => {
    const run = state.lanes[l].current;
    return run && actionKey(run.action) === actionKey(action);
  });

export const inLane = (lane: LaneId) => t('goals.inLane', { lane: t(LANE_NAMES[lane]) });

/** The command that starts an action in the lane the kernel would choose for it. */
export const startCommand = (state: State, now: number, action: ActionRef, kind: LaneKind): Command => ({
  type: 'start',
  lane: laneFor(state, now, action, kind),
  action,
});
