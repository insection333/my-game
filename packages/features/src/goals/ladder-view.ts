// The Hearth's rows for the goals after First steps: three short goals, today's daily goal and the
// nearest milestone, each with its progress, reward and one button.
import { fmt, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { combatOf } from '../shared/combat/state.ts';
import type { Milestone } from './content.ts';
import { dailyProgress, milestoneProgress, nextMilestone, shortProgress } from './ladder.ts';
import { bestIn, paces } from './pace.ts';
import { dayOf, goalsOf, type DailyGoal, type ShortGoal } from './state.ts';
import { inLane, startCommand, workingIn, type GoalRow } from './view.ts';

const gold = (n: number) => t('goals.reward.gold', { amount: fmt.int(n) });
const of = (p: { now: number; of: number }) => t('goals.count', { now: fmt.int(p.now), of: fmt.int(p.of) });
const actionName = (a: { feature: string; id: string }) => t(`action.${a.feature}.${a.id}`);

function row(
  id: string,
  name: string,
  reward: number,
  p: { now: number; of: number },
  todo: () => Pick<GoalRow, 'button' | 'note' | 'state'>,
): GoalRow {
  const base = { id, name, reward: gold(reward), count: of(p), progress: p.of ? p.now / p.of : 0 };
  if (p.now >= p.of)
    return {
      ...base,
      state: 'ready',
      button: { label: t('goals.claim', { reward: gold(reward) }), claim: id },
      note: null,
    };
  return { ...base, ...todo() };
}

export const shortName = (s: ShortGoal) =>
  s.kind === 'count'
    ? t('goal.short.count', { skill: t(`skill.${s.skill}`), action: actionName(s.action), count: fmt.int(s.target) })
    : t('goal.short.mastery', { action: actionName(s.action), step: fmt.int(s.target) });

export const dailyName = (d: DailyGoal) => t('goal.daily', { xp: fmt.int(d.target), skill: t(`skill.${d.skill}`) });

function shortRow(state: State, now: number, s: ShortGoal): GoalRow {
  return row(s.id, shortName(s), s.reward, shortProgress(state, s), () => {
    const lane = workingIn(state, s.action);
    if (lane) return { state: 'working', button: null, note: inLane(lane) };
    if (s.lane === 'combat' && combatOf(state).worn.weapon === undefined)
      return { state: 'todo', button: null, note: t('stop.noWeapon') };
    return {
      state: 'todo',
      button: { label: t('goals.start'), command: startCommand(state, now, s.action, s.lane) },
      note: null,
    };
  });
}

function dailyRow(state: State, now: number, d: DailyGoal): GoalRow {
  const name = dailyName(d);
  if (d.claimed)
    return {
      id: 'daily',
      name,
      reward: gold(d.reward),
      progress: 1,
      state: 'claimed',
      button: null,
      note: t('goals.doneToday'),
    };
  return row('daily', name, d.reward, dailyProgress(state, d), () => {
    const best = bestIn(paces(state), d.skill);
    const lane = best && workingIn(state, best.action);
    if (!best || lane) return { state: lane ? 'working' : 'todo', button: null, note: lane ? inLane(lane) : null };
    return {
      state: 'todo',
      button: { label: t('goals.start'), command: startCommand(state, now, best.action, best.lane) },
      note: null,
    };
  });
}

export const milestoneName = (m: Milestone) => {
  switch (m.kind) {
    case 'total':
      return t('goal.milestone.total', { level: fmt.int(m.level) });
    case 'forged':
      return t('goal.milestone.forged', { metal: t(`tier.metal.${m.tier}`).toLowerCase() });
    case 'log':
      return t('goal.milestone.log', { count: fmt.int(m.count) });
    case 'mastery':
      return t('goal.milestone.mastery', { step: fmt.int(m.step) });
  }
};

export function ladderRows(state: State, now: number): GoalRow[] {
  const g = goalsOf(state);
  const rows = g.short.map((s) => shortRow(state, now, s));
  if (g.daily && g.daily.day === dayOf(now)) rows.push(dailyRow(state, now, g.daily));
  const m = nextMilestone(state, g);
  if (m)
    rows.push(
      row(`m-${m.id}`, milestoneName(m), m.reward, milestoneProgress(state, m), () => ({
        state: 'todo',
        button: null,
        note: t('goals.milestone'),
      })),
    );
  return rows;
}
