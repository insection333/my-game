// Shared skill machinery: levels, perks from the ladder, mastery, and unlock text. Every skill feature
// uses these, so a perk works and reads the same in every skill. Not a feature; any feature may import it.
import {
  applyEffects,
  fmt,
  formatEffect,
  levelFor,
  masteryEffects,
  masteryStep,
  t,
  type Ladder,
  type Modifiers,
  type Unlock,
} from '@idle-clash/content';
import { xpOf, type State } from '@idle-clash/kernel';

export const skillLevel = (state: State, skill: string): number => levelFor(xpOf(state, skill));

/** The ladder's perk effects reached by a level. */
export function perksAt(ladder: Ladder, level: number): Modifiers {
  const effects = ladder.slice(0, level).flatMap((us) => us.flatMap((u) => (u.type === 'perk' ? [u.effect] : [])));
  return applyEffects(effects);
}

/** Modifiers for one action: the skill's perks at its level plus the action's own mastery. */
export function actionModifiers(
  state: State,
  skill: string,
  ladder: Ladder,
  feature: string,
  action: string,
): Modifiers {
  const m = perksAt(ladder, skillLevel(state, skill));
  const done = Object.hasOwn(state.mastery, `${feature}:${action}`) ? state.mastery[`${feature}:${action}`] : 0;
  return applyEffects(masteryEffects(masteryStep(done, m.masteryGain)), m);
}

export const actionMastery = (state: State, ladder: Ladder, skill: string, feature: string, action: string) => {
  const done = Object.hasOwn(state.mastery, `${feature}:${action}`) ? state.mastery[`${feature}:${action}`] : 0;
  return masteryStep(done, perksAt(ladder, skillLevel(state, skill)).masteryGain);
};

/** An unlock as the player reads it: an action's name, or a perk with its rank and effect. */
export function unlockText(feature: string, ladder: Ladder, u: Unlock): string {
  if (u.type === 'action') return t(`action.${feature}.${u.action}`);
  const name = t(`perk.${u.perk}`);
  const ranked = ladder.some((us) => us.some((x) => x.type === 'perk' && x.perk === u.perk && x.rank > 1));
  return ranked
    ? t('unlock.perk', { name, rank: fmt.roman(u.rank), effect: formatEffect(u.effect) })
    : t('unlock.perkOnce', { name, effect: formatEffect(u.effect) });
}

/** The first level above `level` and what it unlocks, or null at the top. */
export function nextUnlock(ladder: Ladder, level: number): { level: number; unlocks: Unlock[] } | null {
  for (let l = level + 1; l <= ladder.length; l++)
    if (ladder[l - 1].length) return { level: l, unlocks: ladder[l - 1] };
  return null;
}

/** How many of an item an action gives, with the extra-item chance (which may pass 100%). */
export function yieldOf(base: number, extraPct: number, roll: () => number): number {
  const whole = Math.floor(extraPct / 100);
  return base + whole + (roll() < (extraPct % 100) / 100 ? 1 : 0);
}
