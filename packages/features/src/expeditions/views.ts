// How expeditions read on the Combat page's Expeditions tab: each region (open or not), the route the
// next run would take with its twists and the fork's two roads, the run under way stage by stage,
// the bosses with Your odds, and the relics with their ranks. Formatted already; the page draws it.
import { fmt, midSentence, t } from '@idle-clash/content';
import { actionKey, LANE_IDS, type State } from '@idle-clash/kernel';
import { FOES, regionOf } from '../shared/combat/data.ts';
import { oddsFor } from '../shared/combat/odds.ts';
import { HITPOINTS } from '../shared/combat/data.ts';
import {
  BOSSES,
  bossIn,
  LENGTHS,
  REGIONS,
  ROADS,
  openFoes,
  STAGE_MINUTES,
  TWISTS,
  type Region,
  type Twist,
} from '../shared/expeditions/data.ts';
import { expeditionsOf, type Route, type Run } from '../shared/expeditions/state.ts';
import { skillLevel } from '../shared/skill.ts';
import { restedToday } from './boss.ts';
import { nextRoute, type Hours } from './route.ts';
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
  /** "12 marks so far" and the finds. */
  marks: string;
  finds: string[];
  /** Whether the Combat lane is on it now. */
  running: boolean;
}
export interface ExpeditionView {
  regions: RegionTab[];
  lengths: { hours: Hours; label: string }[];
  run: RunView | null;
  marks: string;
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
  const boss = bossIn(region);
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

function runView(state: State, run: Run): RunView {
  const count = stageCount(run);
  const boss = bossIn(run.region);
  const running = LANE_IDS.some((l) => {
    const c = state.lanes[l].current;
    return c !== null && actionKey(c.action) === `expeditions:${run.region}`;
  });
  return {
    region: run.region,
    title: t('expedition.runTitle', { region: regionName(run.region), time: fmt.duration(run.hours * 3_600_000) }),
    road: t('expedition.road', { road: midSentence(t(`twist.${run.road}`)) }),
    twists: run.twists.map((id) => twistView(byId(id))),
    stage:
      run.at < count
        ? t('expedition.stage', { stage: fmt.int(run.at + 1), stages: fmt.int(count) })
        : t('expedition.bossStage', { boss: midSentence(t(`boss.${boss.id}`)) }),
    progress: run.at / (count + 1),
    stages: chips(run, run.at, count),
    boss: { id: boss.id, name: t(`boss.${boss.id}`), now: run.at >= count },
    marks: t('expedition.runMarks', { marks: fmt.int(run.marks) }),
    finds: run.finds,
    running,
  };
}

export function expeditionView(state: State): ExpeditionView {
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
    run: e.run ? runView(state, e.run) : null,
    marks: t('expedition.marks', { marks: fmt.int(e.marks) }),
    legend: [...TWISTS, ...ROADS].map(twistView),
  };
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
}

export function bossRows(state: State, now: number): BossRow[] {
  const e = expeditionsOf(state);
  const hp = skillLevel(state, HITPOINTS);
  return BOSSES.map((b) => {
    const locked = hp < b.hitpoints;
    const rested = restedToday(state, b, now);
    const o = locked ? null : oddsFor(state, b);
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
          ? t('boss.rested')
          : !o
            ? t('stop.noWeapon')
            : null,
      wins: wins === 0 ? t('boss.winsNone') : wins === 1 ? t('boss.winsOne') : t('boss.wins', { count: fmt.int(wins) }),
      ready: !locked && !rested && o !== null,
    };
  });
}
