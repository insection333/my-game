// How expeditions read on the Combat page's Expeditions tab: each region (open or not), the route the
// next run would take with its twists and the fork's two roads, the run under way stage by stage,
// the bosses with Your odds, and the relics with their ranks. Formatted already; the page draws it.
import { dayTurns, fmt, formatStop, midSentence, t } from '@idle-clash/content';
import { actionKey, LANE_IDS, type State } from '@idle-clash/kernel';
import { BEATS, FOES, regionOf } from '../shared/combat/data.ts';
import type { Style } from '@idle-clash/content';
import { oddsFor } from '../shared/combat/odds.ts';
import { HITPOINTS } from '../shared/combat/data.ts';
import {
  BOSSES,
  LENGTHS,
  REGIONS,
  ROADS,
  openFoes,
  STAGE_MINUTES,
  TWISTS,
  type Boss,
  type Region,
  type Twist,
} from '../shared/expeditions/data.ts';
import { expeditionsOf, type Last, type Route, type Run } from '../shared/expeditions/state.ts';
import { storyOf } from '../shared/expeditions/story.ts';
import { skillLevel } from '../shared/skill.ts';
import { bossFights } from '../shared/expeditions/bank.ts';
import { unfit } from './fit.ts';
import { bossOfRun, nextRoute, type Hours } from './route.ts';
import { stageCount } from './stage.ts';
import { twistText } from './words.ts';

export interface StageChip {
  foe: string;
  name: string;
  after: 'cache' | 'camp' | null;
  state: 'done' | 'now' | 'ahead';
  /** Past the fork: the road's changes hold. */
  afterFork: boolean;
}
export interface TwistView {
  id: string;
  name: string;
  text: string;
}
export interface RouteView {
  region: Region;
  hours: Hours;
  /** "1 h: 6 fight stages, a cache and a camp, then the Troll-chief of the hill" */
  summary: string;
  stages: StageChip[];
  twists: TwistView[];
  roads: (TwistView & { label: string })[];
  boss: { id: string; name: string };
}
export interface RegionTab {
  id: Region;
  name: string;
  short: string;
  /** Null when open; otherwise "Opens at Hitpoints 40". */
  locked: string | null;
}
export interface RunView {
  region: Region;
  title: string;
  road: string;
  twists: TwistView[];
  /** "Stage 4 of 12" or "The boss". */
  stage: string;
  progress: number;
  stages: StageChip[];
  boss: { id: string; name: string; now: boolean };
  /** "12 marks so far", or null before the first is won (session 56: "0 marks so far" ran into the
   *  stage, "Stage 1 of 12 0 marks so far"); and the finds. */
  marks: string | null;
  finds: string[];
  /** Whether the Combat lane is on it now. */
  running: boolean;
}
export interface ExpeditionView {
  regions: RegionTab[];
  lengths: { hours: Hours; label: string }[];
  run: RunView | null;
  marks: string;
  /** The last run home, told while no run is under way (session 74) or above the run that set out again after
   *  it (session 239): its story, when, and its boss. */
  last: { title: string; body: string; when: string; boss: string } | null;
  /** Whether a run home with its boss beaten sets out again (session 239). */
  again: boolean;
  /** Every twist and road there is, with what each changes: what a run may meet. */
  legend: TwistView[];
}

const regionName = (r: Region) => t(`combat.region.${r}`);
const twistView = (tw: Twist): TwistView => ({ id: tw.id, name: t(`twist.${tw.id}`), text: twistText(tw) });
const byId = (id: string) => [...TWISTS, ...ROADS].find((x) => x.id === id)!;

function chips(route: Route | Run, at: number, count: number): StageChip[] {
  return route.stages.slice(0, count).map((s, i) => ({
    foe: s.foe,
    name: t(`action.combat.${s.foe}`),
    after: s.after,
    state: i < at ? 'done' : i === at ? 'now' : 'ahead',
    afterFork: i >= route.fork,
  }));
}

/** The route the next run into a region would take, as the page shows it before setting out. */
export function routeView(state: State, region: Region, hours: Hours): RouteView | null {
  const route = nextRoute(state, region, hours);
  if (!route) return null;
  const boss = bossOfRun(route);
  const count = stageCount(route);
  return {
    region,
    hours,
    summary: t('expedition.summary', {
      time: fmt.duration(count * STAGE_MINUTES * 60_000),
      stages: fmt.int(count),
      boss: midSentence(t(`boss.${boss.id}`)),
    }),
    stages: chips(route, -1, count),
    twists: route.twists.map((id) => twistView(byId(id))),
    roads: route.roads.map((id) => ({
      ...twistView(byId(id)),
      label: t('expedition.take', { road: midSentence(t(`twist.${id}`)) }),
    })),
    boss: { id: boss.id, name: t(`boss.${boss.id}`) },
  };
}

function runView(state: State, run: Run, now: number): RunView {
  const count = stageCount(run);
  const boss = bossOfRun(run);
  const running = LANE_IDS.some((l) => {
    const c = state.lanes[l].current;
    return c !== null && actionKey(c.action) === `expeditions:${run.region}`;
  });
  // The stage under way fills the run's bar as it fills the lane's (session 46), not at its end.
  const c = state.lanes.combat.current;
  const within =
    c && actionKey(c.action) === `expeditions:${run.region}`
      ? Math.min(1, Math.max(0, (now - c.startedAt) / Math.max(1, c.endsAt - c.startedAt)))
      : 0;
  return {
    region: run.region,
    title: t('expedition.runTitle', { region: regionName(run.region), time: fmt.duration(run.hours * 3_600_000) }),
    road: t('expedition.road', { road: midSentence(t(`twist.${run.road}`)) }),
    twists: run.twists.map((id) => twistView(byId(id))),
    stage:
      run.at < count
        ? t('expedition.stage', { stage: fmt.int(run.at + 1), stages: fmt.int(count) })
        : t('expedition.bossStage', { boss: midSentence(t(`boss.${boss.id}`)) }),
    progress: Math.min(1, (run.at + within) / (count + 1)),
    stages: chips(run, run.at, count),
    boss: { id: boss.id, name: t(`boss.${boss.id}`), now: run.at >= count },
    marks:
      run.marks === 0
        ? null
        : run.marks === 1
          ? t('expedition.runMarksOne')
          : t('expedition.runMarks', { marks: fmt.int(run.marks) }),
    finds: run.finds,
    running,
  };
}

export function expeditionView(state: State, now: number): ExpeditionView {
  const e = expeditionsOf(state);
  const hp = skillLevel(state, HITPOINTS);
  return {
    regions: REGIONS.map((r) => {
      const first = Math.min(...FOES.filter((f) => regionOf(f.tier) === r).map((f) => f.hitpoints));
      return {
        id: r,
        name: regionName(r),
        short: t(`combat.region.${r}.short`),
        locked: openFoes(r, hp).length ? null : t('combat.opensAt', { level: fmt.int(first) }),
      };
    }),
    lengths: LENGTHS.map((hours) => ({ hours, label: fmt.duration(hours * 3_600_000) })),
    run: e.run ? runView(state, e.run, now) : null,
    marks: e.marks === 1 ? t('expedition.marksOne') : t('expedition.marks', { marks: fmt.int(e.marks) }),
    // A run that set out again keeps the last one home in view above it (session 239); one set out by hand
    // clears it.
    last: e.last ? lastView(e.last, now) : null,
    again: e.again !== false,
    legend: [...TWISTS, ...ROADS].map(twistView),
  };
}

function lastView(last: Last, now: number): NonNullable<ExpeditionView['last']> {
  const story = storyOf({ type: 'expeditionDone', ...last });
  return { title: story.title, body: story.body, when: fmt.when(last.at, now), boss: last.boss };
}

export interface BossRow {
  id: string;
  name: string;
  region: string;
  style: string;
  styleId: string;
  /** Your odds' verdict, or why it cannot be fought now. */
  verdict: string | null;
  verdictId: string | null;
  status: string | null;
  wins: string;
  ready: boolean;
  /** Its way of fighting (session 211), so it can be prepared for. */
  trait: string | null;
  /** The fights banked past today's (session 253): "3 fights banked", or null with one or none. */
  banked: string | null;
  /** The fights waiting today, banked ones among them. */
  fights: number;
}

/** The style that beats each style. */
const STYLE_BEATING = Object.fromEntries(Object.entries(BEATS).map(([a, b]) => [b, a])) as Record<Style, Style>;

/** A boss's way of fighting, in words: what to prepare (session 211). */
export function traitWords(b: Boss): string | null {
  const tr = b.trait;
  if (!tr) return null;
  if (tr.kind === 'ward') return t('boss.trait.ward', { style: t(`skill.${STYLE_BEATING[b.style]}`) });
  if (tr.kind === 'shift') return t('boss.trait.shift', { style: t(`skill.${tr.to}`) });
  return t(`boss.trait.${tr.kind}`);
}

export function bossRows(state: State, now: number): BossRow[] {
  const e = expeditionsOf(state);
  const hp = skillLevel(state, HITPOINTS);
  return BOSSES.map((b) => {
    const locked = hp < b.hitpoints;
    const fights = locked ? 0 : bossFights(state, b.id, now);
    const rested = !locked && fights === 0;
    const o = locked ? null : oddsFor(state, b);
    // What the lane's own check refuses besides (session 268: no room for the boss's drop said nothing).
    const held = locked || rested || !o ? null : unfit(state, now, b, [b.drop]);
    const wins = Object.hasOwn(e.wins, b.id) ? e.wins[b.id] : 0;
    return {
      id: b.id,
      name: t(`boss.${b.id}`),
      region: regionName(b.region),
      style: t(`skill.${b.style}`),
      styleId: b.style,
      verdict: o ? t(`verdict.${o.verdict}`) : null,
      verdictId: o?.verdict ?? null,
      status: locked
        ? t('combat.opensAt', { level: fmt.int(b.hitpoints) })
        : rested
          ? t('boss.rested', { back: dayTurns(now) })
          : !o
            ? t('stop.noWeapon')
            : held
              ? formatStop(held)
              : null,
      wins: wins === 0 ? t('boss.winsNone') : wins === 1 ? t('boss.winsOne') : t('boss.wins', { count: fmt.int(wins) }),
      ready: !locked && !rested && o !== null && !held,
      trait: traitWords(b),
      banked: !locked && fights > 1 ? t('boss.banked', { count: fmt.int(fights) }) : null,
      fights,
    };
  });
}
