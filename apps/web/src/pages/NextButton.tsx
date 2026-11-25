// A row's Next (session 240): a lane holds three to come, so Next adds the row to its lane's queue, and a row
// already to come offers to let it go (by its place in the queue) where its Next stood greyed. A lane holding
// three refuses a fourth, said in the header as any refused press is.
import { t } from '@idle-clash/content';
import { actionKey, LANE_IDS, queueOf, type ActionRef, type LaneId, type State } from '@idle-clash/kernel';
import { Button } from '@idle-clash/ui';
import { game } from '../game/store.ts';

/** Where an action waits to come: its lane and place, or null. */
export function queuedAt(state: State, action: ActionRef): { lane: LaneId; at: number } | null {
  for (const lane of LANE_IDS) {
    const at = queueOf(state.lanes[lane]).findIndex((a) => actionKey(a) === actionKey(action));
    if (at >= 0) return { lane, at };
  }
  return null;
}

export function NextButton({
  state,
  lane,
  action,
  name,
  running,
}: {
  state: State;
  lane: LaneId;
  action: ActionRef;
  name: string;
  running: boolean;
}) {
  const waits = queuedAt(state, action);
  if (waits)
    return (
      <Button
        variant="quiet"
        aria-label={t('action.unqueueLabel', { action: name })}
        onClick={() => game.command({ type: 'clearNext', lane: waits.lane, at: waits.at })}
      >
        {t('action.unqueue')}
      </Button>
    );
  return (
    <Button variant="secondary" disabled={running} onClick={() => game.command({ type: 'queueNext', lane, action })}>
      {t('action.queue')}
    </Button>
  );
}
