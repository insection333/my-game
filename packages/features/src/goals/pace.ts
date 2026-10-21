// The player's pace, as goals size themselves by it (GAME_DESIGN.md section 11): for every action open
// now, the seconds one completion takes, the gold it brings and the XP it earns. Skills come from the
// shared catalog and foes from shared/combat, so goals name no feature's code.
import { masteryStep, MASTERY_STEPS } from '@idle-clash/content';
import type { ActionRef, State } from '@idle-clash/kernel';
import { itemOf, skillActions } from '../shared/catalog.ts';
import { FOES } from '../shared/combat/data.ts';
import { oddsFor } from '../shared/combat/odds.ts';
import { fighterOf } from '../shared/combat/state.ts';
import { actionModifiers, skillLevel } from '../shared/skill.ts';

export interface Pace {
  action: ActionRef;
  /** The skill it trains (a foe trains the worn weapon's style). */
  skill: string;
  lane: 'gathering' | 'artisan' | 'combat';
  secondsEach: number;
  goldEach: number;
  xpEach: number;
  /** Completions so far (mastery counts them), and the next mastery step's count. */
  done: number;
  nextStep: { step: number; at: number } | null;
}

const value = (list: readonly { item: string; count: number }[] | undefined) =>
  (list ?? []).reduce((n, g) => n + (itemOf(g.item)?.value ?? 0) * g.count, 0);

function doneOf(state: State, key: string) {
  const done = Object.hasOwn(state.mastery, key) ? state.mastery[key] : 0;
  const step = masteryStep(done);
  return { done, nextStep: step < MASTERY_STEPS.length ? { step: step + 1, at: MASTERY_STEPS[step] } : null };
}

/** Every action open to the player now, with its pace. Foes count only when Easy or Fair. */
export function paces(state: State): Pace[] {
  const out: Pace[] = [];
  for (const s of skillActions()) {
    const level = skillLevel(state, s.skill);
    for (const a of s.actions) {
      if (a.level > level || !a.seconds || a.xp === undefined) continue;
      const m = actionModifiers(state, s.skill, s.ladder, s.feature, a.id);
      const takes = value(a.takes);
      out.push({
        action: { feature: s.feature, id: a.id },
        skill: s.skill,
        lane: takes > 0 ? 'artisan' : 'gathering',
        secondsEach: a.seconds / (1 + m.speed / 100),
        // An artisan's gold is what the work adds to its ingredients.
        goldEach: Math.max(1, value(a.gives) - takes),
        xpEach: a.xp,
        ...doneOf(state, `${s.feature}:${a.id}`),
      });
    }
  }
  const hp = skillLevel(state, 'hitpoints');
  for (const foe of FOES.filter((f) => f.hitpoints <= hp)) {
    const p = fighterOf(state, foe);
    const o = oddsFor(state, foe);
    if (!p || !o) break;
    if (o.verdict !== 'easy' && o.verdict !== 'fair') continue;
    out.push({
      action: { feature: 'combat', id: foe.id },
      skill: p.style,
      lane: 'combat',
      secondsEach: o.secondsPerFight,
      goldEach: foe.gold + (itemOf(foe.drop)?.value ?? 0),
      xpEach: (o.xpPerHour * o.secondsPerFight) / 3600,
      ...doneOf(state, `combat:${foe.id}`),
    });
  }
  return out;
}

/** The best pace in a skill: the most XP an hour among its open actions. */
export function bestIn(list: readonly Pace[], skill: string): Pace | undefined {
  return list
    .filter((p) => p.skill === skill)
    .reduce<Pace | undefined>((a, b) => (!a || b.xpEach / b.secondsEach > a.xpEach / a.secondsEach ? b : a), undefined);
}
