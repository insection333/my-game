// The lanes as the shell shows them: full cards in the desktop panel and on the phone's Hearth,
// chips in the phone's strip. Each lane says what it is doing, how far along, and why it stopped.
import { formatStop, t } from '@idle-clash/content';
import { LANE_IDS, type LaneId, type State } from '@idle-clash/kernel';
import { Button, LaneCard } from '@idle-clash/ui';
import { game } from '../game/store.ts';
import { navigate, withPanel } from '../router.ts';
import s from './shell.module.css';

export interface LaneView {
  id: LaneId;
  name: string;
  doing: string;
  idle: boolean;
  progress?: number;
  note?: string;
}

const actionName = (a: { feature: string; id: string }) => t(`action.${a.feature}.${a.id}`);

export function laneViews(state: State, now: number): LaneView[] {
  const fire = now < state.fireUntil;
  return LANE_IDS.filter((id) => id !== 'gathering2' || fire || state.lanes.gathering2.current).map((id) => {
    const l = state.lanes[id];
    const run = l.current;
    const note = l.next
      ? t('lane.next', { action: actionName(l.next) })
      : !run && l.stopped
        ? formatStop(l.stopped.reason)
        : undefined;
    return {
      id,
      name: t(`lane.${id}`),
      doing: run ? actionName(run.action) : t('lane.resting'),
      idle: !run,
      progress: run ? Math.min(1, Math.max(0, (now - run.startedAt) / (run.endsAt - run.startedAt))) : undefined,
      note,
    };
  });
}

export function LaneList({ lanes }: { lanes: LaneView[] }) {
  return (
    <div data-slot="shell.lane">
      {lanes.map((l) => (
        <LaneCard
          key={l.id}
          lane={l.name}
          doing={l.doing}
          idle={l.idle}
          progress={l.progress}
          note={l.note}
          actions={
            !l.idle && (
              <Button variant="secondary" onClick={() => game.command({ type: 'stop', lane: l.id })}>
                {t('lane.stop')}
              </Button>
            )
          }
        />
      ))}
    </div>
  );
}

export function LaneStrip({ lanes }: { lanes: LaneView[] }) {
  return (
    <div className={s.strip} data-slot="shell.lane">
      {lanes.map((l) => (
        <LaneCard
          key={l.id}
          compact
          lane={l.name}
          doing={l.idle ? l.name : l.doing}
          idle={l.idle}
          progress={l.progress}
          onOpen={() => navigate(withPanel('lanes'))}
        />
      ))}
    </div>
  );
}
