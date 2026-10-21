// The lanes as the shell shows them: full cards in the desktop panel and on the phone's Hearth,
// chips in the phone's strip. Each lane says what it is doing, how far along, and why it stopped.
import { formatStop, t } from '@idle-clash/content';
import type { Feature } from '@idle-clash/features';
import { LANE_IDS, type ActionRef, type LaneId, type State } from '@idle-clash/kernel';
import { Button, hasIcon, ItemIcon, LaneCard } from '@idle-clash/ui';
import { game } from '../game/store.ts';
import { navigate, withPanel } from '../router.ts';
import s from './shell.module.css';

export interface LaneView {
  id: LaneId;
  name: string;
  doing: string;
  idle: boolean;
  progress?: number;
  /** The current run, so its bar fills smoothly: its start, and the time left. */
  run?: { key: number; msLeft: number };
  note?: string;
  /** What the action makes (or the foe fought), for its icon. */
  icon?: string;
  /** Stopped by itself (not by the player), so it needs the player: out of ore, the fire out. */
  halted?: boolean;
}

const actionName = (a: { feature: string; id: string }) => t(`action.${a.feature}.${a.id}`);

/** An action's icon: its first output's, or the action's own (a foe), when drawn. */
function iconOf(features: readonly Feature[], a: ActionRef): string | undefined {
  const out = features.find((f) => f.id === a.feature)?.content.actions?.find((x) => x.id === a.id)?.gives?.[0]?.item;
  return [out, a.id].find((n): n is string => !!n && hasIcon(n));
}

export function laneViews(state: State, now: number, features: readonly Feature[] = []): LaneView[] {
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
      run: run ? { key: run.startedAt, msLeft: run.endsAt - now } : undefined,
      icon: run ? iconOf(features, run.action) : undefined,
      note,
      halted: !run && !!l.stopped && l.stopped.reason.code !== 'stoppedByPlayer',
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
          run={l.run}
          icon={l.icon && <ItemIcon name={l.icon} size={32} />}
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
          doing={l.halted && l.note ? l.note : l.idle ? l.name : l.doing}
          idle={l.idle}
          halted={l.halted}
          progress={l.progress}
          run={l.run}
          icon={l.icon && <ItemIcon name={l.icon} size={24} />}
          onOpen={() => navigate(withPanel('lanes'))}
        />
      ))}
    </div>
  );
}
