// The lanes as the shell shows them: full cards in the desktop panel and on the phone's Hearth,
// chips in the phone's strip. Each lane says what it is doing, how far along, and why it stopped.
import { formatStop, hasString, isQuietStop, midSentence, t } from '@idle-clash/content';
import { remedyFor, type Feature } from '@idle-clash/features';
import { LANE_IDS, queueOf, type ActionRef, type LaneId, type State } from '@idle-clash/kernel';
import { Button, hasIcon, ItemIcon, LaneCard } from '@idle-clash/ui';
import { game } from '../game/store.ts';
import { betterFor, type Better } from './better.ts';
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
  /** What it is doing, in the words a phone's chip has room for. */
  chip?: string;
  /** Whether anything waits to come in it (session 240), which Clear Next lets go. */
  queued?: boolean;
  /** What the action makes (or the foe fought), for its icon. */
  icon?: string;
  /** Stopped by itself (not by the player), so it needs the player: out of ore, the fire out. */
  halted?: boolean;
  /** What puts it right, where the page can take the player there: an item's panel, or a page. */
  fix?: { label: string; item?: string; path?: string };
  /** Put right (the engine would take it now): the stopped action, offered to start again (session 89). */
  again?: { label: string; action: ActionRef };
  /** A running lane's better action, open and startable now, paying a fifth more XP or better (session 152). */
  better?: Better;
  /** Out of what the lane can make itself (session 147): the action that makes it, which the engine would start. */
  make?: { label: string; action: ActionRef };
}

/** Whether the engine would start this action on this lane now (the page's own engine, tried on a copy). */
export type CanStart = (lane: LaneId, action: ActionRef) => boolean;

/** Where a stop is put right (the same remedy the away recap offers): what ran out or is missing (its
 *  panel says where it comes from), food, a weapon, room in the Storehouse. */
const fixFor = (reason: { code: string; detail?: Record<string, string | number> }): LaneView['fix'] =>
  remedyFor(reason, null) ?? undefined;

const actionName = (a: { feature: string; id: string }) => t(`action.${a.feature}.${a.id}`);
/** What a working lane's chip says: the action's name, but an expedition by where it went ("To the Fen"),
 *  where "Expedition into the Sunken Fen" split mid-word in a phone's narrow chip (session 103). */
// A run's action is its region; a boss fought in the lane is an expeditions action too, named as itself
// (session 108: asking it for a region's short name blanked the page).
const chipDoing = (a: { feature: string; id: string }) =>
  a.feature === 'expeditions' && hasString(`combat.region.${a.id}.short`)
    ? t('expedition.chip', { region: t(`combat.region.${a.id}.short`) })
    : actionName(a);

/** A lane stopped by itself, on an action the engine would now take again: bought food, mined ore, made
 *  room (session 89). A stop the player made, or one still unmet, offers nothing. */
function againOf(lane: LaneId, stopped: State['lanes'][LaneId]['stopped'], canStart?: CanStart): LaneView['again'] {
  if (!stopped?.action || !canStart || isQuietStop(stopped.reason.code)) return undefined;
  if (!canStart(lane, stopped.action)) return undefined;
  return { label: t(lane === 'combat' ? 'lane.againFight' : 'lane.again'), action: stopped.action };
}

/** A lane out of an ingredient it can make itself, now: the copper bar a sword wanted, the ore held to smelt
 *  it (session 147: a newcomer was sent to the bar's panel, then Smithing, then its row). */
function makeOf(
  features: readonly Feature[],
  lane: LaneId,
  stopped: State['lanes'][LaneId]['stopped'],
  canStart?: CanStart,
): LaneView['make'] {
  const item = stopped?.reason.code === 'outOfInputs' ? stopped.reason.detail?.item : undefined;
  if (typeof item !== 'string' || !canStart) return undefined;
  for (const f of features) {
    const made = f.content.actions?.find((a) => a.gives?.[0]?.item === item);
    const action = made && { feature: f.id, id: made.id };
    if (action && canStart(lane, action)) {
      return { label: t('lane.make', { item: midSentence(t(`item.${item}`)) }), action };
    }
  }
  return undefined;
}

/** Whether a lane out of an ingredient will have it brought in: another lane is making it now, and the
 *  engine starts the waiting lane again as it comes (session 149). */
function comingIn(
  state: State,
  features: readonly Feature[],
  reason: { code: string; detail?: Record<string, string | number> },
): boolean {
  const item = reason.code === 'outOfInputs' ? reason.detail?.item : undefined;
  return LANE_IDS.some((id) => {
    const a = state.lanes[id].current?.action;
    const made = a && features.find((f) => f.id === a.feature)?.content.actions?.find((x) => x.id === a.id);
    return !!item && !!made?.gives?.some((g) => g.item === item);
  });
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
    const make = !run && !l.next && !again && l.stopped ? makeOf(features, id, l.stopped, canStart) : undefined;
    // Each of the three a lane holds to come (session 240): "Next: Oak bow, then Oak arrows".
    const queue = queueOf(l);
    const note = queue.length
      ? t('lane.next', { action: queue.map(actionName).reduce((a, b) => t('lane.then', { first: a, then: b })) })
      : !run && l.stopped
        ? comingIn(state, features, l.stopped.reason)
          ? t('lane.waiting', { why: formatStop(l.stopped.reason) })
          : formatStop(l.stopped.reason)
        : undefined;
    // A lane stopped by itself names what it was doing, with its picture, and says why below (session 122:
    // "Storehouse full" under Combat said nothing of the run waiting). Older saves keep no action.
    const halted = !run && !!l.stopped && !isQuietStop(l.stopped.reason.code);
    const on = halted ? l.stopped?.action : undefined;
    return {
      id,
      name: t(`lane.${id}`),
      doing: run ? actionName(run.action) : on ? actionName(on) : halted && note ? note : t('lane.resting'),
      idle: !run,
      progress: run ? Math.min(1, Math.max(0, (now - run.startedAt) / (run.endsAt - run.startedAt))) : undefined,
      run: run ? { key: run.startedAt, msLeft: run.endsAt - now } : undefined,
      icon: run ? iconOf(features, run.action, id) : on ? iconOf(features, on, id) : undefined,
      note: halted && !on ? undefined : note,
      short: !run && l.stopped ? formatStop(l.stopped.reason, 'short') : undefined,
      chip: run ? chipDoing(run.action) : undefined,
      queued: queue.length > 0,
      halted,
      fix: !run && !l.next && l.stopped && !((again || make) && fix?.item) ? fix : undefined,
      again,
      make,
      better:
        run && !l.next && canStart && id !== 'combat'
          ? betterFor(state, now, features, id, run.action, canStart)
          : undefined,
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
          doing={l.doing}
          idle={l.idle}
          halted={l.halted}
          progress={l.progress}
          run={l.run}
          icon={l.icon && <ItemIcon name={l.icon} size={32} />}
          note={l.note ?? l.better?.note}
          actions={
            l.idle ? (
              <>
                {l.halted && l.fix && (
                  <Button variant="secondary" onClick={() => fix(l.fix!)}>
                    {l.fix.label}
                  </Button>
                )}
                {l.make && (
                  <Button
                    variant="primary"
                    onClick={() => game.command({ type: 'start', lane: l.id, action: l.make!.action })}
                  >
                    {l.make.label}
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
              <>
                {l.better && (
                  <Button
                    variant="secondary"
                    onClick={() => game.command({ type: 'start', lane: l.id, action: l.better!.action })}
                  >
                    {l.better.label}
                  </Button>
                )}
                {l.queued && (
                  <Button variant="quiet" onClick={() => game.command({ type: 'clearNext', lane: l.id })}>
                    {t('lane.clearNext')}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => game.command({ type: 'stop', lane: l.id })}>
                  {t('lane.stop')}
                </Button>
              </>
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
          doing={l.halted && l.short ? l.short : l.idle ? chipName(l.id) : (l.chip ?? l.doing)}
          label={`${l.name}: ${l.halted && l.note ? l.note : l.doing}`}
          idle={l.idle}
          halted={l.halted}
          progress={l.progress}
          run={l.run}
          // A stopped lane's chip has room only for why (session 122: its picture cut "Out of copper ore").
          icon={!l.idle && l.icon && <ItemIcon name={l.icon} size={24} />}
          onOpen={() => navigate(withPanel('lanes'))}
        />
      ))}
    </div>
  );
}
