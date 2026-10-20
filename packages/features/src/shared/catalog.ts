// Every registered feature's items, for rules that must know what an item is at play time (combat
// reads a worn sword's tier and style). registry.ts fills it once as the features load; nothing here
// names a feature.
import type { Item } from '@idle-clash/content';

let items = new Map<string, Item>();

export function setCatalog(list: readonly Item[]): void {
  items = new Map(list.map((i) => [i.id, i]));
}

export const itemOf = (id: string): Item | undefined => items.get(id);
