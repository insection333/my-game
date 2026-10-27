// Combat's rules: a foe fought in the Combat lane. Each fight is decided by the seed its repetition
// drew, so it lasts as long as it plays and ends as it began. A defeat pays style and Hitpoints XP for
// the damage dealt, gold, a drop and maybe a find; a retreat costs nothing but the food eaten (and
// there is none left by then): the lane stops and says so.
import { seeded, take, type ActionContext, type ActionRules, type StopReason } from '@idle-clash/kernel';
import { FOES, HITPOINTS, type Foe } from '../shared/combat/data.ts';
import { fight, maxHealth, retreatShare, type Fought } from '../shared/combat/fight.ts';
import { countWin, fightXp, spoils } from '../shared/combat/spoils.ts';
import { combatOf, fighterOf, healthAt, mealsOf, setCombat } from '../shared/combat/state.ts';
import { skillLevel } from '../shared/skill.ts';
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

function battle(foe: Foe): ActionRules {
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
      // One supply for the foe fought, won or not.
      if (p.supply) take(ctx.state, p.supply.item, 1);
      const c = combatOf(ctx.state);
      setCombat(ctx.state, {
        ...c,
        health: f.health,
        healthAt: ctx.at,
        retreated: f.retreated ? { foe: foe.id, at: ctx.at } : null,
      });
      fightXp(ctx, p, foe, f.dealt);
      if (f.retreated) return false;
      spoils(ctx, p, foe);
      countWin(ctx, foe.id, true);
    },
  };
}

export const RULES: Record<string, ActionRules> = Object.fromEntries(FOES.map((f) => [f.id, battle(f)]));
