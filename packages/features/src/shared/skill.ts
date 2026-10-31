// Shared skill machinery: levels, perks from the ladder, mastery, and unlock text. Every skill feature
// uses these, so a perk works and reads the same in every skill. Not a feature; any feature may import it.
import {
  applyEffects,
  formatEffect,
  levelFor,
  masteryEffects,
  masteryStep,
  t,
  type Effect,
  type Ladder,
  type Modifiers,
  type Unlock,
} from '@idle-clash/content';
import { xpOf, type State } from '@idle-clash/kernel';

export const skillLevel = (state: State, skill: string): number => levelFor(xpOf(state, skill));

const perkCache = new WeakMap<Ladder, Modifiers[]>();
/** The ladder's perk effects reached by a level (worked out once per ladder and level: fights ask often). */
export function perksAt(ladder: Ladder, level: number): Modifiers {
  let byLevel = perkCache.get(ladder);
  if (!byLevel) perkCache.set(ladder, (byLevel = []));
  byLevel[level] ??= applyEffects(
    ladder.slice(0, level).flatMap((us) => us.flatMap((u) => (u.type === 'perk' ? [u.effect] : []))),
  );
  return { ...byLevel[level] };
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

/** An unlock as the player reads it: an action's name, or a perk with its effect. A perk that comes in
 *  ranks says its first rank as it is, and each later one as the perk now stands, all its ranks so far
 *  added together ("Quick swing (26.25% faster in all)"). */
export function unlockText(feature: string, ladder: Ladder, u: Unlock): string {
  if (u.type === 'action') return t(`action.${feature}.${u.action}`);
  if (u.type === 'tier')
    return u.use === 'wield'
      ? t('unlock.wield', { metal: t(`tier.metal.${u.tier}`), weapons: t(`weapons.${u.style ?? 'melee'}`) })
      : t('unlock.wear', { metal: t(`tier.metal.${u.tier}`) });
  if (u.type === 'foe') return t('unlock.foe', { foe: t(`action.combat.${u.foe}`) });
  if (u.type === 'food') return t('unlock.food', { food: t(`item.${u.item}`) });
  const name = t(`perk.${u.perk}`);
  const ranks = ladder.flat().filter((x) => x.type === 'perk' && x.perk === u.perk);
  if (ranks.length < 2) return t('unlock.perkOnce', { name, effect: formatEffect(u.effect) });
  if (u.rank === 1) return t('unlock.perkFirst', { name, effect: formatEffect(u.effect) });
  // A perk's ranks share one kind of effect: their amounts add up.
  const size = (e: Effect) => ('pct' in e ? e.pct : e.amount);
  const total = ranks.reduce((n, x) => n + (x.type === 'perk' && x.rank <= u.rank ? size(x.effect) : 0), 0);
  const effect = 'pct' in u.effect ? { ...u.effect, pct: total } : { ...u.effect, amount: total };
  return t('unlock.perk', { name, effect: formatEffect(effect) });
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
