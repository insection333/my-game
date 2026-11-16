// A row's place in the lanes, said on the row (session 124): the action a lane runs is "In your lane", the
// one a lane takes next "Next in your lane", where a queued row only greyed its Next and said nothing.
import { t } from '@idle-clash/content';
import { actionKey, LANE_IDS, type ActionRef, type State } from '@idle-clash/kernel';

export function laneStatus(state: State, action: ActionRef): string | null {
  const key = actionKey(action);
  const lanes = LANE_IDS.map((l) => state.lanes[l]);
  if (lanes.some((l) => l.current && actionKey(l.current.action) === key)) return t('action.working');
  if (lanes.some((l) => l.next && actionKey(l.next) === key)) return t('action.queued');
  return null;
}
