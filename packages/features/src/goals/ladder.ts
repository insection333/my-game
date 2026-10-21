// The goals that follow First steps (GAME_DESIGN.md section 11): three short goals, each sized to 10–15
// minutes of the player's pace in one lane and paying about 10 minutes of that lane's gold; a daily
// goal of about 40 minutes of play paying about an hour's gold; and milestones. Choices are drawn from
// the save's seed and a count, so the server and the page make the same goal.
import { masteryStep } from '@idle-clash/content';
import { seeded, xpOf, type State } from '@idle-clash/kernel';
import { skillActions } from '../shared/catalog.ts';
import { HITPOINTS, STYLE_SKILLS } from '../shared/combat/data.ts';
import { skillLevel } from '../shared/skill.ts';
import { MILESTONES, type Milestone } from './content.ts';
import { bestIn, paces, type Pace } from './pace.ts';
import { dayOf, type DailyGoal, type GoalsState, type ShortGoal } from './state.ts';

/** A round number for a target or a reward: 7, 15, 60, 340, 12,300. */
export function nice(n: number): number {
  if (n < 20) return Math.max(1, Math.round(n));
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 10) * 10;
  const unit = 10 ** (Math.floor(Math.log10(n)) - 2);
  return Math.round(n / unit) * unit;
}

const SHORT_S = 12.5 * 60;
const SHORT_PAY_S = 10 * 60;
const DAILY_S = 40 * 60;

/** Skills the player has trained, each with its best pace (Hitpoints rises with a style, so not alone). */
function trained(state: State, list: readonly Pace[]): Pace[] {
  const skills = [...new Set(list.map((p) => p.skill))].filter((s) => xpOf(state, s) > 0);
  return skills.flatMap((s) => bestIn(list, s) ?? []);
}

/** The next short goal: a trained skill not already asked for when there is one, its best action. */
export function makeShort(state: State, g: GoalsState): ShortGoal | null {
  const list = paces(state);
  const options = trained(state, list);
  if (!options.length) return null;
  const busy = new Set(g.short.map((s) => s.skill));
  const fresh = options.filter((p) => !busy.has(p.skill));
  const pool = fresh.length ? fresh : options;
  const r = seeded(state.seed);
  const p = pool[Math.floor(r('goals', g.made) * pool.length)];
  const reward = nice((p.goldEach * SHORT_PAY_S) / p.secondsEach);
  const base = { id: `short-${g.made}`, action: p.action, skill: p.skill, lane: p.lane, reward: Math.max(10, reward) };
  // The next mastery step, when it is 8 to 18 minutes away, makes a goal of its own.
  const left = p.nextStep ? (p.nextStep.at - p.done) * p.secondsEach : Infinity;
  if (p.nextStep && left >= 8 * 60 && left <= 18 * 60 && r('goals', g.made + 0.5) < 0.5)
    return { ...base, kind: 'mastery', target: p.nextStep.step, base: p.done };
  return { ...base, kind: 'count', target: Math.max(5, nice(SHORT_S / p.secondsEach)), base: p.done };
}

/** Today's daily goal: about 40 minutes of XP in a trained skill. */
export function makeDaily(state: State, now: number): DailyGoal | null {
  const options = trained(state, paces(state));
  if (!options.length) return null;
  const day = dayOf(now);
  const r = seeded(state.seed);
  const p = options[Math.floor(r('daily', Number(day.replaceAll('-', ''))) * options.length)];
  const xpPerS = p.xpEach / p.secondsEach;
  return {
    day,
    skill: p.skill,
    target: nice(xpPerS * DAILY_S),
    base: xpOf(state, p.skill),
    reward: nice((p.goldEach * 3600) / p.secondsEach),
    claimed: false,
  };
}

/** How far a short goal has come: completions since it began, or the mastery reached. */
export function shortProgress(state: State, s: ShortGoal): { now: number; of: number } {
  const key = `${s.action.feature}:${s.action.id}`;
  const done = Object.hasOwn(state.mastery, key) ? state.mastery[key] : 0;
  return s.kind === 'count'
    ? { now: Math.min(s.target, done - s.base), of: s.target }
    : { now: Math.min(s.target, masteryStep(done)), of: s.target };
}

export const dailyProgress = (state: State, d: DailyGoal) => ({
  now: Math.min(d.target, Math.floor(xpOf(state, d.skill) - d.base)),
  of: d.target,
});

/** Every skill: those with actions of their own, the three styles and Hitpoints. */
export const allSkills = (): string[] => [...skillActions().map((s) => s.skill), ...STYLE_SKILLS, HITPOINTS];

/** The sum of every skill's level (a newcomer's is 7; the top of version 1 is 280). */
export const totalLevel = (state: State): number => allSkills().reduce((n, s) => n + skillLevel(state, s), 0);

export function milestoneProgress(state: State, m: Milestone): { now: number; of: number } {
  switch (m.kind) {
    case 'total':
      return { now: Math.min(m.level, totalLevel(state)), of: m.level };
    case 'forged': {
      const made = Object.keys(state.mastery).some((k) => k.startsWith(`smithing:${m.metal}-`) && state.mastery[k] > 0);
      return { now: made ? 1 : 0, of: 1 };
    }
    case 'log':
      return { now: Math.min(m.count, Object.keys(state.found).length), of: m.count };
    case 'mastery': {
      const best = Math.max(0, ...Object.values(state.mastery).map((n) => masteryStep(n)));
      return { now: Math.min(m.step, best), of: m.step };
    }
  }
}

/** The milestone to show: the nearest to done among those not yet claimed. */
export function nextMilestone(state: State, g: GoalsState): Milestone | null {
  const open = MILESTONES.filter((m) => !g.milestones.includes(m.id));
  const share = (m: Milestone) => {
    const p = milestoneProgress(state, m);
    return p.now / p.of;
  };
  return open.reduce<Milestone | null>((a, b) => (!a || share(b) > share(a) ? b : a), null);
}
