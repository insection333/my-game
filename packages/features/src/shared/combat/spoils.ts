// What a fight pays, the same in the Combat lane and on an expedition: style and Hitpoints XP for the
// damage dealt (more while the fire burns, for each Legendary mark and for the skill's relic); and for
// a win, gold, the foe's drop and maybe a find. An expedition's fights also count towards each foe's
// mastery, as the lane's do (the kernel counts the lane's).
import { fireXpPct, LEGENDARY_MARK_PCT, masteryStep } from '@idle-clash/content';
import { addXp, give, type ActionContext } from '@idle-clash/kernel';
import { marksIn, rollFind } from '../complete.ts';
import { relicXpPct } from '../expeditions/relics.ts';
import { skillLevel, yieldOf } from '../skill.ts';
import { HITPOINTS, HITPOINTS_XP_SHARE, LADDERS, MASTERY_DROPS_PER_STEP, STYLE_FINDS, type Foe } from './data.ts';
import { styleXp, type Fighter } from './fight.ts';

/** XP for a skill from a fight, with the fire, the skill's lasting marks and its relic. */
function gainXp(ctx: ActionContext, skill: string, base: number) {
  const marks = skill === HITPOINTS ? 0 : marksIn(ctx.state, STYLE_FINDS[skill as keyof typeof STYLE_FINDS]);
  const before = skillLevel(ctx.state, skill);
  const pct =
    (ctx.fireBurning ? fireXpPct(ctx.fireMinutes) : 0) + LEGENDARY_MARK_PCT * marks + relicXpPct(ctx.state, skill);
  addXp(ctx.state, skill, base * (1 + pct / 100));
  const after = skillLevel(ctx.state, skill);
  for (let level = before + 1; level <= after; level++) ctx.emit({ type: 'levelUp', at: ctx.at, skill, level });
}

/** Style and Hitpoints XP for the damage dealt in a fight (times `xp`, a twist's). */
export function fightXp(ctx: ActionContext, p: Fighter, foe: Foe, dealt: number, xp = 1) {
  const base = styleXp(p, foe, dealt) * xp;
  gainXp(ctx, p.style, base);
  gainXp(ctx, HITPOINTS, base * HITPOINTS_XP_SHARE);
}

/** A win's spoils: gold (times `gold`), the drop (times `drops`) and a chance of a find (times `finds`). */
export function spoils(
  ctx: ActionContext,
  p: Fighter,
  foe: Foe,
  more: { drops?: number; finds?: number; gold?: number } = {},
) {
  const extra = p.perks.spoils + MASTERY_DROPS_PER_STEP * p.mastery;
  give(ctx.state, 'gold', Math.round(foe.gold * (1 + p.perks.spoils / 100) * (more.gold ?? 1)));
  // More drops (an expedition's twist) count as more extra yield: ×1.5 is +50%.
  const drops = extra + ((more.drops ?? 1) - 1) * 100;
  give(
    ctx.state,
    foe.drop,
    yieldOf(1, drops, () => ctx.roll()),
  );
  const style = { feature: p.style, skill: p.style, ladder: LADDERS[p.style], finds: STYLE_FINDS[p.style] };
  const findMultiple = more.finds ?? 1;
  rollFind(ctx, style, { id: foe.id, tier: foe.tier, xp: 0, gives: [], findMultiple }, p.perks.findChance);
}

/** One more win against a foe, counted towards its mastery (with the step's moment when it rises). */
export function countWin(ctx: ActionContext, foe: string, counted = false) {
  const key = `combat:${foe}`;
  const done = Object.hasOwn(ctx.state.mastery, key) ? ctx.state.mastery[key] : 0;
  // The lane's own fight is counted by the kernel once the rules return; an expedition's, here.
  if (!counted) ctx.state.mastery[key] = done + 1;
  const step = masteryStep(done + 1);
  if (step > masteryStep(done))
    ctx.emit({ type: 'masteryStep', at: ctx.at, action: { feature: 'combat', id: foe }, step });
}
