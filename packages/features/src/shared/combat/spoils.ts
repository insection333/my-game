// What a fight pays, the same in the Combat lane and on an expedition: style and Hitpoints XP for the
// damage dealt (more while the fire burns, for each Legendary mark and for the skill's relic); and for
// a win, gold, the foe's drop and maybe a find. An expedition's fights also count towards each foe's
// mastery, as the lane's do (the kernel counts the lane's).
import { masteryStep } from '@idle-clash/content';
import { addXp, give, xpOf, type ActionContext, type State } from '@idle-clash/kernel';
import { rollFind, xpBonusPct } from '../complete.ts';
import { edictPct } from '../castle/mirror.ts';
import { announceKindling, pathBonus } from '../kindling.ts';
import { skillLevel, yieldOf } from '../skill.ts';
import { HITPOINTS, HITPOINTS_XP_SHARE, LADDERS, MASTERY_DROPS_PER_STEP, STYLE_FINDS, type Foe } from './data.ts';
import { styleXp, type Fighter } from './fight.ts';

/** The finds whose Legendary marks raise a fighting skill's XP (Hitpoints has none). */
export const findsOf = (skill: string) => (skill === HITPOINTS ? [] : STYLE_FINDS[skill as keyof typeof STYLE_FINDS]);

/** XP for a skill from a fight, with the fire, the skill's lasting marks and its relic. */
function gainXp(ctx: ActionContext, skill: string, base: number) {
  const before = skillLevel(ctx.state, skill);
  const pct = xpBonusPct(ctx.state, skill, findsOf(skill), ctx.at, ctx.fireMinutes, ctx.fireBurning);
  const xpBefore = xpOf(ctx.state, skill);
  addXp(ctx.state, skill, base * (1 + pct / 100));
  announceKindling(ctx, skill, xpBefore);
  const after = skillLevel(ctx.state, skill);
  for (let level = before + 1; level <= after; level++) ctx.emit({ type: 'levelUp', at: ctx.at, skill, level });
}

/** Style and Hitpoints XP for the damage dealt in a fight (times `xp`, a twist's). */
export function fightXp(ctx: ActionContext, p: Fighter, foe: Foe, dealt: number, xp = 1) {
  const base = styleXp(p, foe, dealt) * xp;
  gainXp(ctx, p.style, base);
  gainXp(ctx, HITPOINTS, base * HITPOINTS_XP_SHARE);
}

/** What lifts a won fight's gold, multiplied as it always has been: the style's spoils perks, its Path of
 *  Bounty, and a Sovereign Edict of Harvest. A boss's gold too (session 160: a boss paid its gold bare). */
export function goldLift(state: State, at: number, p: Fighter): number {
  const bounty = pathBonus(state, p.style, 'items');
  return (1 + p.perks.spoils / 100) * (1 + bounty / 100) * (1 + edictPct(state, at, 'fightGold') / 100);
}

/** What makes a fight's Rare and Legendary finds likelier, in percent: the style's perks, its Path of
 *  Fortune and a Sovereign Edict of Fortune. A boss's finds too (session 160). */
export const fightFindPct = (state: State, at: number, p: Fighter): number =>
  p.perks.findChance + pathBonus(state, p.style, 'finds') + edictPct(state, at, 'finds');

/** Gold in whole coins, the part of a coin paid by chance, so a lift is paid on average however small the
 *  purse (session 161: rounded, a goblin slinger's 4 gold at +12% was 4, and at +23% 5). A whole sum draws
 *  no roll. */
export function coins(gold: number, roll: () => number): number {
  const whole = Math.floor(gold);
  return gold > whole && roll() < gold - whole ? whole + 1 : whole;
}

/** A win's spoils: gold (times `gold`), the drop (times `drops`) and a chance of a find (times `finds`). */
export function spoils(
  ctx: ActionContext,
  p: Fighter,
  foe: Foe,
  more: { drops?: number; finds?: number; gold?: number } = {},
) {
  // A style on the Path of Bounty brings home more gold and drops; on Fortune, more finds (past 99).
  const bounty = pathBonus(ctx.state, p.style, 'items');
  const extra = p.perks.spoils + MASTERY_DROPS_PER_STEP * p.mastery + bounty;
  give(
    ctx.state,
    'gold',
    coins(foe.gold * goldLift(ctx.state, ctx.at, p) * (more.gold ?? 1), () => ctx.roll()),
  );
  // More drops (an expedition's twist) count as more extra yield: ×1.5 is +50%.
  const drops = extra + ((more.drops ?? 1) - 1) * 100;
  give(
    ctx.state,
    foe.drop,
    yieldOf(1, drops, () => ctx.roll()),
  );
  const style = { feature: p.style, skill: p.style, ladder: LADDERS[p.style], finds: STYLE_FINDS[p.style] };
  const findMultiple = more.finds ?? 1;
  rollFind(
    ctx,
    style,
    { id: foe.id, tier: foe.tier, xp: 0, gives: [], findMultiple },
    fightFindPct(ctx.state, ctx.at, p),
  );
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
