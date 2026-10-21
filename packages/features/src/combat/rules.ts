// Combat's rules: a foe fought in the Combat lane. Each fight is decided by the seed its repetition
// drew, so it lasts as long as it plays and ends as it began. A defeat pays style and Hitpoints XP for
// the damage dealt, gold, a drop and maybe a find; a retreat costs nothing but the food eaten (and
// there is none left by then): the lane stops and says so.
import { FIRE_XP_PCT, LEGENDARY_MARK_PCT, masteryStep } from '@idle-clash/content';
import { addXp, give, seeded, take, type ActionContext, type ActionRules, type StopReason } from '@idle-clash/kernel';
import { marksIn, rollFind } from '../shared/complete.ts';
import {
  FOES,
  HITPOINTS,
  HITPOINTS_XP_SHARE,
  LADDERS,
  MASTERY_DROPS_PER_STEP,
  STYLE_FINDS,
  type Foe,
} from '../shared/combat/data.ts';
import { fight, maxHealth, retreatShare, styleXp, type Fought } from '../shared/combat/fight.ts';
import { combatOf, fighterOf, healthAt, mealsOf, setCombat } from '../shared/combat/state.ts';
import { skillLevel, yieldOf } from '../shared/skill.ts';
import { noRoom } from '../shared/storehouse.ts';

export const FEATURE = 'combat';

/** The fight this repetition plays: the same in `duration` (from its start) and `complete`. */
function play(ctx: ActionContext, foe: Foe): Fought | null {
  const p = fighterOf(ctx.state, foe);
  if (!p) return null;
  const r = seeded(ctx.seed ?? 0);
  let i = 0;
  return fight(p, foe, () => r('fight', i++), healthAt(ctx.state, ctx.startedAt), mealsOf(ctx.state));
}

/** XP for a skill from a fight, with the fire and the skill's lasting marks. */
function gainXp(ctx: ActionContext, skill: string, base: number) {
  const marks = skill === HITPOINTS ? 0 : marksIn(ctx.state, STYLE_FINDS[skill as keyof typeof STYLE_FINDS]);
  const before = skillLevel(ctx.state, skill);
  addXp(ctx.state, skill, base * (1 + ((ctx.fireBurning ? FIRE_XP_PCT : 0) + LEGENDARY_MARK_PCT * marks) / 100));
  const after = skillLevel(ctx.state, skill);
  for (let level = before + 1; level <= after; level++) ctx.emit({ type: 'levelUp', at: ctx.at, skill, level });
}

function battle(foe: Foe): ActionRules {
  const key = `${FEATURE}:${foe.id}`;
  return {
    lane: 'combat',
    seeded: true,
    check: (ctx): StopReason | null => {
      if (skillLevel(ctx.state, HITPOINTS) < foe.hitpoints)
        return { code: 'hitpointsTooLow', detail: { level: foe.hitpoints } };
      const p = fighterOf(ctx.state, foe);
      if (!p) return { code: 'noWeapon' };
      const c = combatOf(ctx.state);
      if (c.retreated && c.retreated.at === ctx.at && c.retreated.foe === foe.id)
        return { code: 'retreated', detail: { foe: foe.id } };
      const low = healthAt(ctx.state, ctx.at) < maxHealth(p) * retreatShare(p);
      if (low && mealsOf(ctx.state).length === 0) return { code: 'tooHurt' };
      return noRoom(ctx.state, [foe.drop]);
    },
    duration: (ctx) => (play(ctx, foe)?.seconds ?? 3) * 1000,
    complete: (ctx) => {
      const f = play(ctx, foe);
      const p = fighterOf(ctx.state, foe);
      if (!f || !p) return false;
      for (const [item, n] of Object.entries(f.eaten)) take(ctx.state, item, n);
      const c = combatOf(ctx.state);
      setCombat(ctx.state, {
        ...c,
        health: f.health,
        healthAt: ctx.at,
        retreated: f.retreated ? { foe: foe.id, at: ctx.at } : null,
      });
      const base = styleXp(p, foe, f.dealt);
      gainXp(ctx, p.style, base);
      gainXp(ctx, HITPOINTS, base * HITPOINTS_XP_SHARE);
      if (f.retreated) return false;

      const spoils = p.perks.spoils + MASTERY_DROPS_PER_STEP * p.mastery;
      give(ctx.state, 'gold', Math.round(foe.gold * (1 + p.perks.spoils / 100)));
      give(
        ctx.state,
        foe.drop,
        yieldOf(1, spoils, () => ctx.roll()),
      );
      const style = { feature: p.style, skill: p.style, ladder: LADDERS[p.style], finds: STYLE_FINDS[p.style] };
      rollFind(ctx, style, { id: foe.id, tier: foe.tier, xp: 0, gives: [], findMultiple: 1 }, p.perks.findChance);
      const done = Object.hasOwn(ctx.state.mastery, key) ? ctx.state.mastery[key] : 0;
      const step = masteryStep(done + 1);
      if (step > masteryStep(done))
        ctx.emit({ type: 'masteryStep', at: ctx.at, action: { feature: FEATURE, id: foe.id }, step });
    },
  };
}

export const RULES: Record<string, ActionRules> = Object.fromEntries(FOES.map((f) => [f.id, battle(f)]));
