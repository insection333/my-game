// The icon registry. Each icon belongs to a family; the reference set (one or more per family) is the
// bar every later icon is reviewed against, at 24, 48 and 96 px in both themes.
import type { ComponentType } from 'react';
import { AshBow, BronzeHelm, CopperSword, IronStaff, SteelBody } from './gear.tsx';
import { Bread, BirdsNest, CopperOre, HollowRat, IronBar, PineLogs, WoodcuttingSeal } from './world.tsx';

export type IconFamily = 'weapon' | 'armour' | 'resource' | 'foe' | 'food' | 'find' | 'skill';

export interface IconDef {
  draw: ComponentType;
  family: IconFamily;
  /** What it shows, for the review sheet; the game names items through the strings file. */
  title: string;
}

export const ICONS = {
  'copper-sword': { draw: CopperSword, family: 'weapon', title: 'Copper sword' },
  'ash-bow': { draw: AshBow, family: 'weapon', title: 'Bronze bow (ash, bronze fittings)' },
  'iron-staff': { draw: IronStaff, family: 'weapon', title: 'Iron staff' },
  'bronze-helm': { draw: BronzeHelm, family: 'armour', title: 'Bronze helm' },
  'steel-body': { draw: SteelBody, family: 'armour', title: 'Steel body' },
  'pine-logs': { draw: PineLogs, family: 'resource', title: 'Pine logs' },
  'copper-ore': { draw: CopperOre, family: 'resource', title: 'Copper ore' },
  'iron-bar': { draw: IronBar, family: 'resource', title: 'Iron bar' },
  'hollow-rat': { draw: HollowRat, family: 'foe', title: 'Hollow rat' },
  bread: { draw: Bread, family: 'food', title: 'Bread' },
  'birds-nest': { draw: BirdsNest, family: 'find', title: "Bird's nest (Uncommon find)" },
  woodcutting: { draw: WoodcuttingSeal, family: 'skill', title: 'Woodcutting' },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

/** The reference set: twelve icons covering every family. */
export const REFERENCE_SET = Object.keys(ICONS) as IconName[];

export const hasIcon = (name: string): name is IconName => Object.hasOwn(ICONS, name);
