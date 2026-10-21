// Every registered feature's items, for rules that must know what an item is at play time (combat
// reads a worn sword's tier and style). registry.ts fills it once as the features load; nothing here
// names a feature.
import type { Item, Ladder } from '@idle-clash/content';
import type { ContentAction } from '../define.ts';

let items = new Map<string, Item>();

export function setCatalog(list: readonly Item[]): void {
  items = new Map(list.map((i) => [i.id, i]));
}

export const itemOf = (id: string): Item | undefined => items.get(id);

/** A skill's actions as its feature declares them, for features that plan around them (goals). */
export interface SkillActions {
  feature: string;
  skill: string;
  ladder: Ladder;
  actions: readonly ContentAction[];
}

let skills: readonly SkillActions[] = [];

export function setSkills(list: readonly SkillActions[]): void {
  skills = list;
}

/** Every skill with actions of its own (not the combat skills, whose actions are combat's foes). */
export const skillActions = (): readonly SkillActions[] => skills;
