// Questions about items, answered by asking every registered feature's content: what an item is, where
// it comes from (actions that give it, finds), and what uses it (actions that take it). A feature that
// arrives later answers by declaring its content; nothing here names a feature.
import type { Item } from '@idle-clash/content';
import type { Feature } from '../define.ts';

export interface ItemSource {
  feature: string;
  /** The skill whose page it is on, if any. */
  skill: string | null;
  /** The action that gives or takes it; null for a find. */
  action: string | null;
  /** A find's rarity, when it comes as a find. */
  rarity: string | null;
  count: number;
}

/** Every item any feature defines, in the order the features list them. */
export function catalog(features: readonly Feature[]): Item[] {
  return features.flatMap((f) => f.content.items ?? []);
}

export function itemDef(features: readonly Feature[], item: string): Item | null {
  return catalog(features).find((i) => i.id === item) ?? null;
}

export function comesFrom(features: readonly Feature[], item: string): ItemSource[] {
  return features.flatMap((f) => {
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
}

export function usedIn(features: readonly Feature[], item: string): ItemSource[] {
  return features.flatMap((f) =>
    (f.content.actions ?? []).flatMap((a) =>
      (a.takes ?? [])
        .filter((g) => g.item === item)
        .map((g) => ({ feature: f.id, skill: f.content.skill?.id ?? null, action: a.id, rarity: null, count: g.count })),
    ),
  );
}
