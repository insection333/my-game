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
import {
  BattleTrophy,
  BowmansRing,
  EagleFeatherCirclet,
  GooseFletchings,
  HuntersCharm,
  MoonlitBowstring,
  RaidersWarHorn,
  ShardOfAKingsBlade,
  SilverArrowhead,
  TornBanner,
  TrollChiefsTooth,
  WarlordsSeal,
} from './finds-combat.tsx';
import {
  GlimmerStone,
  RuneScratchedTablet,
  SorcerersEye,
  StarGlassOrb,
  WightsRing,
  WispLantern,
} from './finds-magic.tsx';
import {
  FellHuntsman,
  GoblinSlinger,
  GraveWight,
  HeartyStew,
  HillTroll,
  MarshWisp,
  MeatPie,
  OrcBowman,
  OrcRaider,
} from './foes.tsx';
import { Body, Bow, Helm, Legs, Staff, Sword } from './gear.tsx';
import { SupplyCache } from './rewards.tsx';
import { BogLurker, BogWitch, DrownedAcolyte, FenReaver, MireHulk, ReedStalker } from './foes-fen.tsx';
import {
  AshShaman,
  AshTroll,
  EmberSorcerer,
  HuntersFeast,
  ObsidianGolem,
  PeakSlinger,
  RoastFowl,
  SkyReaver,
  WardensFeast,
} from './foes-peaks.tsx';
import {
  AncientLogs,
  Dawnstone,
  DawnsteelBar,
  ElderwoodLogs,
  EmberOre,
  EmbersteelBar,
  MapleLogs,
  MoonsilverBar,
  MoonsilverOre,
  SilverbarkLogs,
  StarIronBar,
  StarIronOre,
} from './tiers-late.tsx';
import { ArcherySeal, HitpointsSeal, MagicSeal, MeleeSeal, MiningSeal, SmithingSeal } from './seals.tsx';
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

export type IconFamily = 'weapon' | 'armour' | 'resource' | 'foe' | 'food' | 'find' | 'skill' | 'reward';

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
  // Tiers 5 to 8 (session 12).
  ['moonsilver', M.moonsilver, M.mapleWood],
  ['star-iron', M.starIron, M.silverWood],
  ['embersteel', M.embersteel, M.elderWood],
  ['dawnsteel', M.dawnsteel, M.ancientWood],
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
  // Session 9: the other six skills' seals.
  mining: { draw: MiningSeal, family: 'skill', title: 'Mining' },
  smithing: { draw: SmithingSeal, family: 'skill', title: 'Smithing' },
  melee: { draw: MeleeSeal, family: 'skill', title: 'Melee' },
  archery: { draw: ArcherySeal, family: 'skill', title: 'Archery' },
  magic: { draw: MagicSeal, family: 'skill', title: 'Magic' },
  hitpoints: { draw: HitpointsSeal, family: 'skill', title: 'Hitpoints' },
  // Session 8: the foes after the rat, the better foods, and the combat styles' finds.
  'goblin-slinger': { draw: GoblinSlinger, family: 'foe', title: 'Goblin slinger' },
  'marsh-wisp': { draw: MarshWisp, family: 'foe', title: 'Marsh wisp' },
  'orc-raider': { draw: OrcRaider, family: 'foe', title: 'Orc raider' },
  'orc-bowman': { draw: OrcBowman, family: 'foe', title: 'Orc bowman' },
  'grave-wight': { draw: GraveWight, family: 'foe', title: 'Grave wight' },
  'hill-troll': { draw: HillTroll, family: 'foe', title: 'Hill troll' },
  'fell-huntsman': { draw: FellHuntsman, family: 'foe', title: 'Fell huntsman' },
  'meat-pie': { draw: MeatPie, family: 'food', title: 'Meat pie' },
  'hearty-stew': { draw: HeartyStew, family: 'food', title: 'Hearty stew' },
  'battle-trophy': { draw: BattleTrophy, family: 'find', title: 'Battle trophy (Uncommon find)' },
  'raiders-war-horn': { draw: RaidersWarHorn, family: 'find', title: "Raider's war-horn (Uncommon find)" },
  'torn-banner': { draw: TornBanner, family: 'find', title: 'Torn banner (Rare find)' },
  'warlords-seal': { draw: WarlordsSeal, family: 'find', title: "Warlord's seal (Rare find)" },
  'shard-of-a-kings-blade': {
    draw: ShardOfAKingsBlade,
    family: 'find',
    title: "Shard of a king's blade (Legendary find)",
  },
  'troll-chiefs-tooth': { draw: TrollChiefsTooth, family: 'find', title: "Troll-chief's tooth (Legendary find)" },
  'goose-fletchings': { draw: GooseFletchings, family: 'find', title: 'Goose fletchings (Uncommon find)' },
  'hunters-charm': { draw: HuntersCharm, family: 'find', title: "Hunter's charm (Uncommon find)" },
  'silver-arrowhead': { draw: SilverArrowhead, family: 'find', title: 'Silver arrowhead (Rare find)' },
  'bowmans-ring': { draw: BowmansRing, family: 'find', title: "Bowman's ring (Rare find)" },
  'moonlit-bowstring': { draw: MoonlitBowstring, family: 'find', title: 'Moonlit bowstring (Legendary find)' },
  'eagle-feather-circlet': {
    draw: EagleFeatherCirclet,
    family: 'find',
    title: 'Eagle-feather circlet (Legendary find)',
  },
  'glimmer-stone': { draw: GlimmerStone, family: 'find', title: 'Glimmer stone (Uncommon find)' },
  'wisp-lantern': { draw: WispLantern, family: 'find', title: 'Wisp lantern (Uncommon find)' },
  'rune-scratched-tablet': { draw: RuneScratchedTablet, family: 'find', title: 'Rune-scratched tablet (Rare find)' },
  'wights-ring': { draw: WightsRing, family: 'find', title: "Wight's ring (Rare find)" },
  'star-glass-orb': { draw: StarGlassOrb, family: 'find', title: 'Star-glass orb (Legendary find)' },
  'sorcerers-eye': { draw: SorcerersEye, family: 'find', title: "Sorcerer's eye (Legendary find)" },
  // Session 12: tiers 5 to 8.
  'maple-logs': { draw: MapleLogs, family: 'resource', title: 'Maple logs' },
  'silverbark-logs': { draw: SilverbarkLogs, family: 'resource', title: 'Silverbark logs' },
  'elderwood-logs': { draw: ElderwoodLogs, family: 'resource', title: 'Elderwood logs' },
  'ancient-logs': { draw: AncientLogs, family: 'resource', title: 'Ancient logs' },
  'moonsilver-ore': { draw: MoonsilverOre, family: 'resource', title: 'Moonsilver ore' },
  'star-iron-ore': { draw: StarIronOre, family: 'resource', title: 'Star-iron ore' },
  'ember-ore': { draw: EmberOre, family: 'resource', title: 'Ember ore' },
  dawnstone: { draw: Dawnstone, family: 'resource', title: 'Dawnstone' },
  'moonsilver-bar': { draw: MoonsilverBar, family: 'resource', title: 'Moonsilver bar' },
  'star-iron-bar': { draw: StarIronBar, family: 'resource', title: 'Star-iron bar' },
  'embersteel-bar': { draw: EmbersteelBar, family: 'resource', title: 'Embersteel bar' },
  'dawnsteel-bar': { draw: DawnsteelBar, family: 'resource', title: 'Dawnsteel bar' },
  // Session 12: the Sunken Fen's and the Ashen Peaks' foes, and the vendor's later foods.
  'bog-lurker': { draw: BogLurker, family: 'foe', title: 'Bog lurker' },
  'reed-stalker': { draw: ReedStalker, family: 'foe', title: 'Reed stalker' },
  'drowned-acolyte': { draw: DrownedAcolyte, family: 'foe', title: 'Drowned acolyte' },
  'mire-hulk': { draw: MireHulk, family: 'foe', title: 'Mire hulk' },
  'fen-reaver': { draw: FenReaver, family: 'foe', title: 'Fen reaver' },
  'bog-witch': { draw: BogWitch, family: 'foe', title: 'Bog witch' },
  'ash-troll': { draw: AshTroll, family: 'foe', title: 'Ash troll' },
  'peak-slinger': { draw: PeakSlinger, family: 'foe', title: 'Peak slinger' },
  'ash-shaman': { draw: AshShaman, family: 'foe', title: 'Ash shaman' },
  'obsidian-golem': { draw: ObsidianGolem, family: 'foe', title: 'Obsidian golem' },
  'sky-reaver': { draw: SkyReaver, family: 'foe', title: 'Sky reaver' },
  'ember-sorcerer': { draw: EmberSorcerer, family: 'foe', title: 'Ember sorcerer' },
  'roast-fowl': { draw: RoastFowl, family: 'food', title: 'Roast fowl' },
  'hunters-feast': { draw: HuntersFeast, family: 'food', title: "Hunter's feast" },
  'wardens-feast': { draw: WardensFeast, family: 'food', title: "Warden's feast" },
  // Session 11: the cache a goal pays in.
  'supply-cache': { draw: SupplyCache, family: 'reward', title: "Supply cache (a goal's reward)" },
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
