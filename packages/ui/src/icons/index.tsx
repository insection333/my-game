// The icon registry. Each icon belongs to a family; the reference set (one or more per family) is the
// bar every later icon is reviewed against, at 24, 48 and 96 px in both themes.
import type { ComponentType } from 'react';
import { AshBow, BronzeHelm, CopperSword, IronStaff, SteelBody } from './gear.tsx';
import { AmberNugget, CarvedAcorn, CrownOfTheOldWood, HeartwoodKnot, SilverbarkSeed } from './finds.tsx';
import {
  AshLogs,
  Bread,
  BirdsNest,
  CopperOre,
  HollowRat,
  IronBar,
  OakLogs,
  PineLogs,
  WoodcuttingSeal,
  YewLogs,
} from './world.tsx';

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
  // Session 6: the other logs and Woodcutting's finds.
  'ash-logs': { draw: AshLogs, family: 'resource', title: 'Ash logs' },
  'oak-logs': { draw: OakLogs, family: 'resource', title: 'Oak logs' },
  'yew-logs': { draw: YewLogs, family: 'resource', title: 'Yew logs' },
  'amber-nugget': { draw: AmberNugget, family: 'find', title: 'Amber nugget (Uncommon find)' },
  'carved-acorn': { draw: CarvedAcorn, family: 'find', title: 'Carved acorn (Rare find)' },
  'heartwood-knot': { draw: HeartwoodKnot, family: 'find', title: 'Heartwood knot (Rare find)' },
  'silverbark-seed': { draw: SilverbarkSeed, family: 'find', title: 'Silverbark seed (Legendary find)' },
  'crown-of-the-old-wood': { draw: CrownOfTheOldWood, family: 'find', title: 'Crown of the old wood (Legendary find)' },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

/** The reference set, approved by the owner: twelve icons covering every family. */
export const REFERENCE_SET: IconName[] = [
  'copper-sword',
  'ash-bow',
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
];

export const hasIcon = (name: string): name is IconName => Object.hasOwn(ICONS, name);
