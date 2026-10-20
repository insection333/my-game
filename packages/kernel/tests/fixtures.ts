// Sample actions for kernel tests, shaped like the real features to come: gathering with finds,
// smelting that runs out of ore, forging that needs bars, and fights of random length that eat food.
import { addXp, give, registryOf, take, countOf, type ActionRules, type ActionContext } from '../src/index.ts';

const xp = (ctx: ActionContext, base: number) => (ctx.fireBurning ? Math.round(base * 1.15) : base);

const gather = (item: string, skill: string): ActionRules => ({
  lane: 'gathering',
  check: () => null,
  duration: () => 7500,
  complete: (ctx) => {
    give(ctx.state, item, 1);
    addXp(ctx.state, skill, xp(ctx, 11));
    if (ctx.roll() < 0.02) give(ctx.state, 'birds-nest', 1);
  },
});

const craft = (inputs: Record<string, number>, output: string, ms: number): ActionRules => ({
  lane: 'artisan',
  check: (ctx) => {
    for (const [item, n] of Object.entries(inputs)) {
      if (countOf(ctx.state, item) < n) return { code: 'outOfInputs', detail: { item } };
    }
    return null;
  },
  duration: () => ms,
  complete: (ctx) => {
    for (const [item, n] of Object.entries(inputs)) take(ctx.state, item, n);
    give(ctx.state, output, 1);
    addXp(ctx.state, 'smithing', xp(ctx, 11));
  },
});

const fight: ActionRules = {
  lane: 'combat',
  check: (ctx) => (countOf(ctx.state, 'bread') ? null : { code: 'outOfFood' }),
  duration: (ctx) => 3000 * (4 + Math.floor(ctx.roll() * 4)),
  complete: (ctx) => {
    give(ctx.state, 'gold', 1 + Math.floor(ctx.roll() * 5));
    addXp(ctx.state, 'melee', xp(ctx, 30));
    if (ctx.roll() < 0.25) take(ctx.state, 'bread', 1);
  },
};

export const registry = registryOf({
  woodcutting: { 'pine-tree': gather('pine-logs', 'woodcutting') },
  mining: { 'copper-vein': gather('copper-ore', 'mining') },
  smithing: {
    'copper-bar': craft({ 'copper-ore': 1 }, 'copper-bar', 5000), // faster than mining, so the forge can run dry
    'copper-sword': craft({ 'copper-bar': 3 }, 'copper-sword', 22500),
  },
  combat: { 'hollow-rat': fight },
});

export const A = {
  pine: { feature: 'woodcutting', id: 'pine-tree' },
  copper: { feature: 'mining', id: 'copper-vein' },
  bar: { feature: 'smithing', id: 'copper-bar' },
  sword: { feature: 'smithing', id: 'copper-sword' },
  rat: { feature: 'combat', id: 'hollow-rat' },
} as const;

export const T0 = Date.UTC(2026, 9, 20, 9, 0, 0);
