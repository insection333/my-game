// The lanes as the shell shows them: full cards in the desktop panel and on the phone's Hearth,
// chips in the phone's strip. Each lane says what it is doing, how far along, and why it stopped.
import { formatStop, isQuietStop, t } from '@idle-clash/content';
import { remedyFor, type Feature } from '@idle-clash/features';
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
  /** Why it stopped, in the few words a phone's chip has room for. */
  short?: string;
  /** What the action makes (or the foe fought), for its icon. */
  icon?: string;
  /** Stopped by itself (not by the player), so it needs the player: out of ore, the fire out. */
  halted?: boolean;
  /** What puts it right, where the page can take the player there: an item's panel, or a page. */
  fix?: { label: string; item?: string; path?: string };
  /** Put right (the engine would take it now): the stopped action, offered to start again (session 89). */
  again?: { label: string; action: ActionRef };
}

/** Whether the engine would start this action on this lane now (the page's own engine, tried on a copy). */
export type CanStart = (lane: LaneId, action: ActionRef) => boolean;

/** Where a stop is put right (the same remedy the away recap offers): what ran out or is missing (its
 *  panel says where it comes from), food, a weapon, room in the Storehouse. */
const fixFor = (reason: { code: string; detail?: Record<string, string | number> }): LaneView['fix'] =>
  remedyFor(reason, null) ?? undefined;

const actionName = (a: { feature: string; id: string }) => t(`action.${a.feature}.${a.id}`);

/** A lane stopped by itself, on an action the engine would now take again: bought food, mined ore, made
 *  room (session 89). A stop the player made, or one still unmet, offers nothing. */
function againOf(lane: LaneId, stopped: State['lanes'][LaneId]['stopped'], canStart?: CanStart): LaneView['again'] {
  if (!stopped?.action || !canStart || isQuietStop(stopped.reason.code)) return undefined;
  if (!canStart(lane, stopped.action)) return undefined;
  return { label: t(lane === 'combat' ? 'lane.againFight' : 'lane.again'), action: stopped.action };
}

/** An action's icon: a foe's own, or what an action makes, when drawn. */
export function iconOf(features: readonly Feature[], a: ActionRef, lane: LaneId): string | undefined {
  // A fight shows its foe, a boss too (its drop is incidental); any other action what it makes.
  const out = features.find((f) => f.id === a.feature)?.content.actions?.find((x) => x.id === a.id)?.gives?.[0]?.item;
  return (lane === 'combat' ? [a.id, out] : [out, a.id]).find((n): n is string => !!n && hasIcon(n));
}

export function laneViews(
  state: State,
  now: number,
  features: readonly Feature[] = [],
  canStart?: CanStart,
): LaneView[] {
  const fire = now < state.fireUntil;
  return LANE_IDS.filter((id) => id !== 'gathering2' || fire || state.lanes.gathering2.current).map((id) => {
    const l = state.lanes[id];
    const run = l.current;
    // Put right, the stop offers its action again; an item it wanted is then held, so it no longer
    // points to where to get it (food is another matter: a fight starts without it, so Buy food stays).
    const again = !run && !l.next ? againOf(id, l.stopped, canStart) : undefined;
    const fix = l.stopped ? fixFor(l.stopped.reason) : undefined;
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
      icon: run ? iconOf(features, run.action, id) : undefined,
      note,
      short: !run && l.stopped ? formatStop(l.stopped.reason, 'short') : undefined,
      halted: !run && !!l.stopped && !isQuietStop(l.stopped.reason.code),
      fix: !run && !l.next && l.stopped && !(again && fix?.item) ? fix : undefined,
      again,
    };
  });
}

export function LaneList({ lanes }: { lanes: LaneView[] }) {
  // A stopped lane leads with why, and offers what puts it right.
  const fix = (f: NonNullable<LaneView['fix']>) =>
    navigate(f.item ? `${location.pathname}?panel=item&item=${encodeURIComponent(f.item)}` : f.path!);
  return (
    <div data-slot="shell.lane" role="list">
      {lanes.map((l) => (
        <LaneCard
          key={l.id}
          lane={l.name}
          doing={l.halted && l.note ? l.note : l.doing}
          idle={l.idle}
          halted={l.halted}
          progress={l.progress}
          run={l.run}
          icon={l.icon && <ItemIcon name={l.icon} size={32} />}
          note={l.halted ? undefined : l.note}
          actions={
            l.idle ? (
              <>
                {l.halted && l.fix && (
                  <Button variant="secondary" onClick={() => fix(l.fix!)}>
                    {l.fix.label}
                  </Button>
                )}
                {l.again && (
                  <Button
                    variant="primary"
                    onClick={() => game.command({ type: 'start', lane: l.id, action: l.again!.action })}
                  >
                    {l.again.label}
                  </Button>
                )}
              </>
            ) : (
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

/** A resting lane's name on its chip: short enough for four chips on a phone ("Fire lane"). */
const chipName = (id: LaneId) => (id === 'gathering2' ? t('lane.gathering2.chip') : t(`lane.${id}`));

export function LaneStrip({ lanes }: { lanes: LaneView[] }) {
  return (
    <div className={s.strip} data-slot="shell.lane">
      {lanes.map((l) => (
        <LaneCard
          key={l.id}
          compact
          lane={l.name}
          doing={l.halted && l.short ? l.short : l.idle ? chipName(l.id) : l.doing}
          label={`${l.name}: ${l.halted && l.note ? l.note : l.doing}`}
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
