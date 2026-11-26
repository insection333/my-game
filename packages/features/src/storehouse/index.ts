// The Storehouse: its space and the vendor. Items themselves belong to the features that make them;
// this feature counts the slots, enlarges them, sells to the vendor and buys its food.
import { fmt, Id, midSentence, t } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { FOODS, HITPOINTS } from '../shared/combat/data.ts';
import { healsFor } from '../shared/combat/state.ts';
import { pedlarKeeps } from '../shared/pedlar-lots.ts';
import { skillLevel } from '../shared/skill.ts';
import { steadingKeeps } from '../shared/steading.ts';
import { capacity, ENLARGE_COSTS, noRoom, SLOTS_PER_ENLARGEMENT, slotsUsed, storeOf } from '../shared/storehouse.ts';
import { useFind } from './finds.ts';
import { buy, enlarge, findsToSell, priceOf, sell, sellFinds } from './rules.ts';
import { oldGear, sellGear, setLock } from './tidy.ts';

/** The Storehouse's space, as the page shows it. */
export interface CapacityView {
  used: number;
  total: number;
  text: string;
  /** The next enlargement, or null once the Storehouse is as large as it gets. */
  enlarge: { label: string; affordable: boolean } | null;
  /** The finds kept to sell, sold at one press after asking (session 187), or null when none is held. */
  sellFinds: { label: string; ask: string } | null;
  /** The old gear held, sold at one press after asking (session 241), or null when none is held. */
  sellGear: { label: string; ask: string } | null;
}

/** The finds named as a sentence says them: two by name and the rest counted. */
function findsWords(held: string[]): string {
  const names = held.map((id) => midSentence(t(`item.${id}`)));
  if (names.length <= 3)
    return names.length === 1 ? names[0] : t('list.and', { first: names.slice(0, -1).join(', '), last: names.at(-1)! });
  return t('store.sellFinds.more', { first: names.slice(0, 2).join(', '), count: fmt.int(names.length - 2) });
}

function sellFindsView(state: State, now: number): CapacityView['sellFinds'] {
  const held = findsToSell(state, now);
  if (!held.length) return null;
  const gold = fmt.int(held.reduce((n, x) => n + priceOf(x.item) * x.count, 0));
  const finds = findsWords(held.map((x) => x.item));
  const ask = t('store.sellFinds.ask', { finds, gold });
  // The pedlar's find of the day, kept back (session 226), said so the count left behind is no surprise.
  const kept = held.find((x) => pedlarKeeps(state, now, x.item) > 0)?.item;
  const keeps = kept
    ? t('store.sellFinds.pedlar', {
        count: fmt.int(pedlarKeeps(state, now, kept)),
        item: t(`item.${kept}`),
      })
    : '';
  // And what the steading's next stages take (session 244).
  const forWorks = Object.keys(state.items).filter((id) => countOf(state, id) > 0 && steadingKeeps(state, id) > 0);
  const works = forWorks.length ? t('store.sellFinds.steading', { finds: findsWords(forWorks) }) : '';
  return { label: t('store.sellFinds', { gold }), ask: [ask, keeps, works].filter(Boolean).join(' ') };
}

function sellGearView(state: State): CapacityView['sellGear'] {
  const held = oldGear(state);
  if (!held.length) return null;
  const gold = fmt.int(held.reduce((n, x) => n + priceOf(x.item) * x.count, 0));
  return {
    label: t('store.sellGear', { gold }),
    ask: t('store.sellGear.ask', { gear: findsWords(held.map((x) => x.item)), gold }),
  };
}

/** Food: what is carried, and what the vendor sells at this Hitpoints level. */
export interface FoodView {
  shop: {
    item: string;
    name: string;
    /** What it heals and costs. */
    facts: string[];
    /** How many are carried ("×12"), when any are. */
    have: string | null;
    price: number;
    /** How many the player carries. */
    carried: number;
    /** Whether the player has the gold for ten. */
    affordable: boolean;
    /** Why ten cannot be bought: a food not carried with every space taken (session 101), or null. */
    noRoom: string | null;
    locked: boolean;
    opensAt: string | null;
  }[];
}

const Count = z.number().int().min(1).max(1_000_000_000);

function capacityView(state: State, now: number): CapacityView {
  const { enlargements } = storeOf(state);
  const [used, total] = [slotsUsed(state), capacity(state)];
  const cost = ENLARGE_COSTS[enlargements];
  return {
    used,
    total,
    // A find is kept even when every space is taken, so the count can pass the spaces; it says why (session 162).
    text: t(used > total ? 'store.capacityOver' : 'store.capacity', { used: fmt.int(used), total: fmt.int(total) }),
    enlarge:
      cost === undefined
        ? null
        : {
            label: t('store.enlarge', { slots: fmt.int(SLOTS_PER_ENLARGEMENT), gold: fmt.int(cost) }),
            affordable: countOf(state, 'gold') >= cost,
          },
    sellFinds: sellFindsView(state, now),
    sellGear: sellGearView(state),
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
        t('food.heals', { health: fmt.int(healsFor(state, f.heals)) }),
        t('food.price', { gold: fmt.int(f.price) }),
      ],
      have: countOf(state, f.id) > 0 ? t('food.have', { count: fmt.int(countOf(state, f.id)) }) : null,
      price: f.price,
      carried: countOf(state, f.id),
      affordable: gold >= f.price * 10,
      noRoom: noRoom(state, [f.id]) ? t('food.noRoom') : null,
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
      input: z
        .object({
          item: Id,
          action: z.object({ feature: Id, id: Id }).strict(),
          count: z.number().int().min(1).max(1000).optional(),
        })
        .strict(),
      example: { item: 'carved-acorn', action: { feature: 'woodcutting', id: 'pine-tree' } },
      run: (state, input, now) => useFind(state, input.item, input.action, now, input.count ?? 1),
    }),
    sellFinds: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state, _input, now) => sellFinds(state, now),
    }),
    // Old gear at one press, and locks against selling (session 241).
    sellGear: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state) => sellGear(state),
    }),
    lock: defineRoute({
      input: z.object({ item: Id, on: z.boolean() }).strict(),
      example: { item: 'copper-sword', on: true },
      run: (state, input) => setLock(state, input.item, input.on),
    }),
    enlarge: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state) => enlarge(state),
    }),
  },
  slots: {
    'store.capacity': ({ state, now }) => capacityView(state, now) as unknown as Json,
    'combat.food': ({ state }) => foodView(state) as unknown as Json,
  },
  help: { title: 'help.storehouse.title', body: 'help.storehouse.body' },
});
