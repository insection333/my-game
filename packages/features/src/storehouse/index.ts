// The Storehouse: its space and the vendor. Items themselves belong to the features that make them;
// this feature counts the slots, enlarges them, sells to the vendor and buys its food.
import { fmt, Id, t } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { FOODS, HITPOINTS } from '../shared/combat/data.ts';
import { skillLevel } from '../shared/skill.ts';
import { capacity, ENLARGE_COSTS, SLOTS_PER_ENLARGEMENT, slotsUsed, storeOf } from '../shared/storehouse.ts';
import { useFind } from './finds.ts';
import { buy, enlarge, sell } from './rules.ts';

/** The Storehouse's space, as the page shows it. */
export interface CapacityView {
  used: number;
  total: number;
  text: string;
  /** The next enlargement, or null once the Storehouse is as large as it gets. */
  enlarge: { label: string; affordable: boolean } | null;
}

/** Food: what is carried, and what the vendor sells at this Hitpoints level. */
export interface FoodView {
  shop: {
    item: string;
    name: string;
    facts: string[];
    price: number;
    /** Whether the player has the gold for ten. */
    affordable: boolean;
    locked: boolean;
    opensAt: string | null;
  }[];
}

const Count = z.number().int().min(1).max(1_000_000_000);

function capacityView(state: State): CapacityView {
  const { enlargements } = storeOf(state);
  const [used, total] = [slotsUsed(state), capacity(state)];
  const cost = ENLARGE_COSTS[enlargements];
  return {
    used,
    total,
    text: t('store.capacity', { used: fmt.int(used), total: fmt.int(total) }),
    enlarge:
      cost === undefined
        ? null
        : {
            label: t('store.enlarge', { slots: fmt.int(SLOTS_PER_ENLARGEMENT), gold: fmt.int(cost) }),
            affordable: countOf(state, 'gold') >= cost,
          },
  };
}

function foodView(state: State): FoodView {
  const level = skillLevel(state, HITPOINTS);
  const gold = countOf(state, 'gold');
  return {
    shop: FOODS.map((f) => ({
      item: f.id,
      name: t(`item.${f.id}`),
      facts: [
        t('food.heals', { health: fmt.int(f.heals) }),
        t('food.price', { gold: fmt.int(f.price) }),
        t('item.panel.have', { count: fmt.int(countOf(state, f.id)) }),
      ],
      price: f.price,
      affordable: gold >= f.price * 10,
      locked: f.level > level,
      opensAt: f.level > level ? t('combat.opensAt', { level: fmt.int(f.level) }) : null,
    })),
  };
}

export const storehouse = defineFeature({
  id: 'storehouse',
  flag: { on: true, note: 'Space, selling and the vendor since session 9' },
  content: {},
  effects: [],
  stops: [],
  rules: {},
  routes: {
    sell: defineRoute({
      input: z.object({ item: Id, count: Count }).strict(),
      example: { item: 'pine-logs', count: 1 },
      run: (state, input) => sell(state, input.item, input.count),
    }),
    buy: defineRoute({
      input: z.object({ item: Id, count: Count }).strict(),
      example: { item: 'bread', count: 10 },
      run: (state, input) => buy(state, input.item, input.count),
    }),
    useFind: defineRoute({
      input: z.object({ item: Id, action: z.object({ feature: Id, id: Id }).strict() }).strict(),
      example: { item: 'carved-acorn', action: { feature: 'woodcutting', id: 'pine-tree' } },
      run: (state, input, now) => useFind(state, input.item, input.action, now),
    }),
    enlarge: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state) => enlarge(state),
    }),
  },
  slots: {
    'store.capacity': ({ state }) => capacityView(state) as unknown as Json,
    'combat.food': ({ state }) => foodView(state) as unknown as Json,
  },
  help: { title: 'help.storehouse.title', body: 'help.storehouse.body' },
});
