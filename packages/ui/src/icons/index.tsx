// The icon registry. Each icon belongs to a family; the reference set (one or more per family) is the
// bar every later icon is reviewed against, at 24, 48 and 96 px in both themes.
import type { ComponentType } from 'react';
import { AmberNugget, CarvedAcorn, CrownOfTheOldWood, HeartwoodKnot, SilverbarkSeed } from './finds.tsx';
import {
  AncientCoin,
  CrystalGeode,
  HeartOfTheMountain,
  RoughGarnet,
  RoughSapphire,
  StarIronShard,
} from './finds-mining.tsx';
import {
  EmberOfTheFirstForge,
  GuildSmithsSeal,
  LuckyHorseshoe,
  MasterworkRivets,
  OldKingsHammer,
  QuenchingFlask,
} from './finds-smithing.tsx';
import { Body, Bow, Helm, Legs, Staff, Sword } from './gear.tsx';
import { M, type Tone } from './style.tsx';
import {
  AshLogs,
  Bread,
  BirdsNest,
  Coal,
  CopperBar,
  CopperOre,
  BronzeBar,
  HollowRat,
  IronBar,
  IronOre,
  OakLogs,
  PineLogs,
  SteelBar,
  TinOre,
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

/** Gear of every tier: the tier's metal, and its wood for bows and staves. */
const TIERS: [string, Tone, Tone][] = [
  ['copper', M.copper, M.pine],
  ['bronze', M.bronze, M.ash],
  ['iron', M.iron, M.oak],
  ['steel', M.steel, M.yew],
];
const GEAR: Record<string, IconDef> = Object.fromEntries(
  TIERS.flatMap(([metal, m, wood]) => {
    const name = metal[0].toUpperCase() + metal.slice(1);
    return [
      [`${metal}-sword`, { draw: () => <Sword metal={m} />, family: 'weapon', title: `${name} sword` }],
      [`${metal}-staff`, { draw: () => <Staff metal={m} wood={wood} />, family: 'weapon', title: `${name} staff` }],
      [`${metal}-bow`, { draw: () => <Bow metal={m} wood={wood} />, family: 'weapon', title: `${name} bow` }],
      [`${metal}-helm`, { draw: () => <Helm metal={m} />, family: 'armour', title: `${name} helm` }],
      [`${metal}-legs`, { draw: () => <Legs metal={m} />, family: 'armour', title: `${name} legs` }],
      [`${metal}-body`, { draw: () => <Body metal={m} />, family: 'armour', title: `${name} body` }],
    ] as [string, IconDef][];
  }),
);

const NAMED = {
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
  // Session 7: ores, bars, and Mining's and Smithing's finds.
  'tin-ore': { draw: TinOre, family: 'resource', title: 'Tin ore' },
  'iron-ore': { draw: IronOre, family: 'resource', title: 'Iron ore' },
  coal: { draw: Coal, family: 'resource', title: 'Coal' },
  'copper-bar': { draw: CopperBar, family: 'resource', title: 'Copper bar' },
  'bronze-bar': { draw: BronzeBar, family: 'resource', title: 'Bronze bar' },
  'steel-bar': { draw: SteelBar, family: 'resource', title: 'Steel bar' },
  'rough-garnet': { draw: RoughGarnet, family: 'find', title: 'Rough garnet (Uncommon find)' },
  'rough-sapphire': { draw: RoughSapphire, family: 'find', title: 'Rough sapphire (Uncommon find)' },
  'ancient-coin': { draw: AncientCoin, family: 'find', title: 'Ancient coin (Rare find)' },
  'crystal-geode': { draw: CrystalGeode, family: 'find', title: 'Crystal geode (Rare find)' },
  'star-iron-shard': { draw: StarIronShard, family: 'find', title: 'Star-iron shard (Legendary find)' },
  'heart-of-the-mountain': {
    draw: HeartOfTheMountain,
    family: 'find',
    title: 'Heart of the mountain (Legendary find)',
  },
  'lucky-horseshoe': { draw: LuckyHorseshoe, family: 'find', title: 'Lucky horseshoe (Uncommon find)' },
  'masterwork-rivets': { draw: MasterworkRivets, family: 'find', title: 'Masterwork rivets (Uncommon find)' },
  'guild-smiths-seal': { draw: GuildSmithsSeal, family: 'find', title: "Guild smith's seal (Rare find)" },
  'quenching-flask': { draw: QuenchingFlask, family: 'find', title: 'Quenching flask (Rare find)' },
  'ember-of-the-first-forge': {
    draw: EmberOfTheFirstForge,
    family: 'find',
    title: 'Ember of the first forge (Legendary find)',
  },
  'old-kings-hammer': { draw: OldKingsHammer, family: 'find', title: "Old king's hammer (Legendary find)" },
} satisfies Record<string, IconDef>;

export const ICONS: Record<string, IconDef> = { ...GEAR, ...NAMED };

export type IconName = string;

/** The reference set, approved by the owner: twelve icons covering every family. */
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
];

export const hasIcon = (name: string): name is IconName => Object.hasOwn(ICONS, name);
