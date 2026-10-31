// Questions about items, answered by asking every registered feature's content: what an item is, where
// it comes from (actions that give it, finds, the vendor's shelf), and what uses it (actions that take
// it, and what a fighter eats, wears and carries, by the item's own kind). A feature that arrives later
// answers by declaring its content.
import { fmt, t, type Item } from '@idle-clash/content';
import type { Feature } from '../define.ts';
import { FOODS } from './combat/data.ts';

export interface ItemSource {
  feature: string;
  /** The skill whose page it is on, if any. */
  skill: string | null;
  /** The action that gives or takes it; null for a find. */
  action: string | null;
  /** A find's rarity, when it comes as a find. */
  rarity: string | null;
  count: number;
  /** A line made for the item rather than for an action (the vendor, a fighter's kit): its words and
   *  where it leads. */
  label?: string;
  href?: string;
}

/** Where each piece of armour is worn, in the item panel's words. */
const WORN = { helm: 'item.panel.worn.helm', body: 'item.panel.worn.body', legs: 'item.panel.worn.legs' } as const;

const COMBAT = { feature: 'combat', skill: null, action: null, rarity: null, count: 0, href: '/combat' } as const;

/** Every item any feature defines, in the order the features list them. */
export function catalog(features: readonly Feature[]): Item[] {
  return features.flatMap((f) => f.content.items ?? []);
}

export function itemDef(features: readonly Feature[], item: string): Item | null {
  return catalog(features).find((i) => i.id === item) ?? null;
}

export function comesFrom(features: readonly Feature[], item: string): ItemSource[] {
  const out = features.flatMap((f): ItemSource[] => {
    const skill = f.content.skill?.id ?? null;
    const made = (f.content.actions ?? []).flatMap((a) =>
      (a.gives ?? [])
        .filter((g) => g.item === item)
        .map((g) => ({ feature: f.id, skill, action: a.id, rarity: null, count: g.count })),
    );
    const found = (f.content.finds ?? [])
      .filter((x) => x.item === item)
      .map((x) => ({ feature: f.id, skill, action: null, rarity: x.rarity, count: 1 }));
    return [...made, ...found];
  });
  // Food the vendor sells, and from which Hitpoints level.
  const sold = FOODS.find((f) => f.id === item);
  if (sold)
    out.push({
      ...COMBAT,
      label:
        sold.level > 1
          ? t('item.panel.vendorFrom', { gold: fmt.int(sold.price), level: fmt.int(sold.level) })
          : t('item.panel.vendor', { gold: fmt.int(sold.price) }),
    });
  return out;
}

/** What a fighter does with an item, by its kind: eats it, wears or wields it, carries it into fights;
 *  and a Legendary find, which is kept, has its page in the collection log. */
function kept(def: Item | null): ItemSource[] {
  if (!def) return [];
  if (def.kind === 'food') return [{ ...COMBAT, label: t('item.panel.eaten') }];
  if (def.gear)
    return [
      {
        ...COMBAT,
        label: def.gear.style
          ? t('item.panel.wielded', { style: t(`skill.${def.gear.style}`) })
          : t(WORN[def.gear.slot as keyof typeof WORN]),
      },
    ];
  if (def.supply) return [{ ...COMBAT, label: t('item.panel.carried', { style: t(`skill.${def.supply.style}`) }) }];
  if (def.kind === 'find' && def.value === 0)
    return [{ ...COMBAT, feature: 'storehouse', label: t('item.panel.inLog'), href: '/storehouse/log' }];
  return [];
}

export function usedIn(features: readonly Feature[], item: string): ItemSource[] {
  const taken = features.flatMap((f) =>
    (f.content.actions ?? []).flatMap((a) => [
      ...(a.takes ?? [])
        .filter((g) => g.item === item)
        .map((g) => ({
          feature: f.id,
          skill: f.content.skill?.id ?? null,
          action: a.id,
          rarity: null,
          count: g.count,
        })),
      // An item an action needs but keeps (a key) counts 0: it is used for the action, never used up.
      ...(a.needs ?? [])
        .filter((g) => g.item === item)
        .map(() => ({ feature: f.id, skill: f.content.skill?.id ?? null, action: a.id, rarity: null, count: 0 })),
    ]),
  );
  return [...taken, ...kept(itemDef(features, item))];
}

/** A source as the item panel lists it: "Woodcutting: Pine tree (×1)"; a page with no skill (Combat)
 *  is named by its title, "Combat: Goblin slinger (×1)". */
export function sourceLabel(src: ItemSource): string {
  if (src.label) return src.label;
  const skill = src.skill ? t(`skill.${src.skill}`) : t(`${src.feature}.title`);
  if (src.rarity) return t('item.panel.find', { skill, rarity: t(`rarity.${src.rarity}`) });
  if (src.count === 0) return t('item.panel.kept', { skill, action: t(`action.${src.feature}.${src.action}`) });
  return t('item.panel.action', { skill, action: t(`action.${src.feature}.${src.action}`), count: fmt.int(src.count) });
}
