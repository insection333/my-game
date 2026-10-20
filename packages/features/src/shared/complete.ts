// One completed skill action, the same way in every skill: a find may turn up, the action gives its
// items, XP arrives (more while the fire burns and for each Legendary mark), and levels and mastery
// steps are announced. Finds roll first, so the luck guarantee counts from the moment before this one.
import {
  FIRE_XP_PCT,
  GREATER_FROM_TIER,
  LEGENDARY_CHANCE,
  LEGENDARY_MARK_PCT,
  LUCK_GUARANTEE_MS,
  LUCK_STEP,
  masteryStep,
  RARE_CHANCE,
  type Find,
  type Ladder,
} from '@idle-clash/content';
import { addXp, countOf, give, take, type ActionContext, type Rarity, type State } from '@idle-clash/kernel';
import { actionModifiers, perksAt, skillLevel, yieldOf } from './skill.ts';

export interface SkillDefinition {
  feature: string;
  skill: string;
  ladder: Ladder;
  finds: readonly Find[];
}

export interface CompletedAction {
  id: string;
  tier: number;
  xp: number;
  gives: readonly { item: string; count: number }[];
  /** What one completion uses up (Smithing's ores, bars and logs); checked before the action starts. */
  takes?: readonly { item: string; count: number }[];
  /** Rare and Legendary chances per action are multiplied by this (rich actions: 1.5). */
  findMultiple: number;
}

/** Lasting marks in a skill: how many of its Legendary finds have ever been found. */
export const marksIn = (state: State, finds: readonly Find[]): number =>
  finds.filter((f) => f.rarity === 'legendary' && Object.hasOwn(state.found, f.item)).length;

/** The rarity this completion finds, if any. Draws one roll, and a second only for Uncommon luck. */
function rollRarity(ctx: ActionContext, findMult: number): Rarity | null {
  const r = ctx.roll();
  if (r < LEGENDARY_CHANCE * findMult) return 'legendary';
  if (r < RARE_CHANCE * findMult) return 'rare';
  const luck = ctx.state.luck;
  luck.misses += 1;
  const certain = ctx.fireBurning && ctx.at - luck.lastMoment >= LUCK_GUARANTEE_MS;
  if (ctx.roll() < LUCK_STEP * luck.misses || certain) {
    luck.misses = 0;
    return 'uncommon';
  }
  return null;
}

function rollFind(ctx: ActionContext, def: SkillDefinition, act: CompletedAction, findChancePct: number) {
  const rarity = rollRarity(ctx, act.findMultiple * (1 + findChancePct / 100));
  if (!rarity) return;
  const choices = def.finds.filter((f) => f.rarity === rarity && (!f.greater || act.tier >= GREATER_FROM_TIER));
  if (!choices.length) return;
  const find = choices.length > 1 && ctx.roll() < 0.5 ? choices[1] : choices[0];
  const first = !Object.hasOwn(ctx.state.found, find.item);
  give(ctx.state, find.item, 1);
  if (first) ctx.state.found[find.item] = ctx.at;
  ctx.emit({ type: 'find', at: ctx.at, skill: def.skill, item: find.item, rarity, first });
}

/** The first ingredient there is not enough of, or null when all are there. */
export function missingInput(state: State, takes: CompletedAction['takes']): string | null {
  return (takes ?? []).find((t) => countOf(state, t.item) < t.count)?.item ?? null;
}

/** Uses up the ingredients; with a saving perk, one roll may keep one unit of the largest. */
function takeInputs(ctx: ActionContext, takes: NonNullable<CompletedAction['takes']>, savePct: number): boolean {
  if (missingInput(ctx.state, takes)) return false;
  const largest = takes.reduce((a, b) => (b.count > a.count ? b : a));
  const saved = savePct > 0 && ctx.roll() < savePct / 100;
  for (const t of takes) take(ctx.state, t.item, t.count - (saved && t === largest ? 1 : 0));
  return true;
}

export function completeSkillAction(ctx: ActionContext, def: SkillDefinition, act: CompletedAction): void {
  const { state } = ctx;
  const m = actionModifiers(state, def.skill, def.ladder, def.feature, act.id);
  // Ingredients are checked before every repetition starts; should one have gone since, nothing is made.
  if (act.takes?.length && !takeInputs(ctx, act.takes, m.saveInput)) return;
  rollFind(ctx, def, act, m.findChance);

  for (const g of act.gives)
    give(
      state,
      g.item,
      yieldOf(g.count, m.extraYield, () => ctx.roll()),
    );

  const before = skillLevel(state, def.skill);
  const bonusPct = (ctx.fireBurning ? FIRE_XP_PCT : 0) + LEGENDARY_MARK_PCT * marksIn(state, def.finds);
  addXp(state, def.skill, act.xp * (1 + bonusPct / 100));
  const after = skillLevel(state, def.skill);
  for (let level = before + 1; level <= after; level++)
    ctx.emit({ type: 'levelUp', at: ctx.at, skill: def.skill, level });

  // The kernel counts this completion once the rules return; the step is judged with it included.
  const key = `${def.feature}:${act.id}`;
  const done = Object.hasOwn(state.mastery, key) ? state.mastery[key] : 0;
  const gain = perksAt(def.ladder, after).masteryGain;
  const step = masteryStep(done + 1, gain);
  if (step > masteryStep(done, gain))
    ctx.emit({ type: 'masteryStep', at: ctx.at, action: { feature: def.feature, id: act.id }, step });
}
