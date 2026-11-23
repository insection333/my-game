// The icon registry. Each icon belongs to a family; the reference set (one or more per family) is the
// bar every later icon is reviewed against, at 24, 48 and 96 px in both themes. The registry starts with the
// welcome page's four alone; every other icon is added as the game's own code loads (late.ts, session 215),
// so the first page weighs what the welcome page needs.
import type { ComponentType } from 'react';
import { Sword } from './gear.tsx';
import { M } from './style.tsx';
import { CopperOre, HollowRat, IronBar } from './world.tsx';

export type IconFamily =
  | 'weapon'
  | 'armour'
  | 'resource'
  | 'supply'
  | 'foe'
  | 'food'
  | 'find'
  | 'skill'
  | 'reward'
  | 'relic'
  | 'path'
  | 'castle'
  | 'crest'
  | 'picture'
  | 'badge'
  | 'companion';

export interface IconDef {
  draw: ComponentType;
  family: IconFamily;
  /** What it shows, for the review sheet; the game names items through the strings file. */
  title: string;
}

/** The welcome page's loop (Welcome.tsx): ore, a bar, a sword and the first foe. */
export const ICONS: Record<string, IconDef> = {
  'copper-ore': { draw: CopperOre, family: 'resource', title: 'Copper ore' },
  'iron-bar': { draw: IronBar, family: 'resource', title: 'Iron bar' },
  'copper-sword': { draw: () => <Sword metal={M.copper} />, family: 'weapon', title: 'Copper sword' },
  'hollow-rat': { draw: HollowRat, family: 'foe', title: 'Hollow rat' },
};

export type IconName = string;

/** The reference set, approved by the owner: twelve icons covering every family (20 October 2026), and
 *  the fish family's four (27 October 2026). */
export const REFERENCE_SET: IconName[] = [
  'copper-sword',
  'bronze-bow',
  'iron-staff',
  'bronze-helm',
  'steel-body',
  'pine-logs',
  'copper-ore',
  'iron-bar',
  'hollow-rat',
  'bread',
  'birds-nest',
  'woodcutting',
  'perch',
  'cooked-perch',
  'salmon',
  'pike-pie',
];

export const hasIcon = (name: string): name is IconName => Object.hasOwn(ICONS, name);
