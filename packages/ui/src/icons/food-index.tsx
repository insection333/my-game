// Fishing's and Cooking's icons (session 13), registered beside the rest (index.tsx).
import { CarpPie, CharPie, EelStew, PikePie, SalmonStew, SturgeonStew } from './dishes.tsx';
import {
  CauldronOfPlenty,
  EverWarmPot,
  GrandmothersRecipe,
  SaffronThreads,
  SilverLadle,
  WildHerbs,
} from './finds-cooking.tsx';
import {
  DrownedSignet,
  FenKingsCrown,
  MessageInABottle,
  PearlMussel,
  RiverPearl,
  ScaleOfTheDeep,
} from './finds-fishing.tsx';
import { CookedPerch, CookedPike, CookedSalmon, CookedTrout, Perch, Pike, Salmon, Trout } from './fish.tsx';
import {
  CookedDawnSturgeon,
  CookedEmberChar,
  CookedMoonCarp,
  CookedSilverEel,
  DawnSturgeon,
  EmberChar,
  MoonCarp,
  SilverEel,
} from './fish-late.tsx';
import type { IconDef } from './index.tsx';
import { CookingSeal, FishingSeal } from './seals.tsx';

const FISH: [string, string, IconDef['draw'], IconDef['draw']][] = [
  ['perch', 'Perch', Perch, CookedPerch],
  ['trout', 'Trout', Trout, CookedTrout],
  ['pike', 'Pike', Pike, CookedPike],
  ['salmon', 'Salmon', Salmon, CookedSalmon],
  ['moon-carp', 'Moon carp', MoonCarp, CookedMoonCarp],
  ['silver-eel', 'Silver eel', SilverEel, CookedSilverEel],
  ['ember-char', 'Ember char', EmberChar, CookedEmberChar],
  ['dawn-sturgeon', 'Dawn sturgeon', DawnSturgeon, CookedDawnSturgeon],
];

export const FOOD_ICONS: Record<string, IconDef> = {
  fishing: { draw: FishingSeal, family: 'skill', title: 'Fishing' },
  cooking: { draw: CookingSeal, family: 'skill', title: 'Cooking' },
  ...Object.fromEntries(
    FISH.flatMap(([id, name, raw, cooked]): [string, IconDef][] => [
      [id, { draw: raw, family: 'resource', title: name }],
      [`cooked-${id}`, { draw: cooked, family: 'food', title: `Cooked ${name.toLowerCase()}` }],
    ]),
  ),
  'pike-pie': { draw: PikePie, family: 'food', title: 'Pike pie' },
  'salmon-stew': { draw: SalmonStew, family: 'food', title: 'Salmon stew' },
  'carp-pie': { draw: CarpPie, family: 'food', title: 'Carp pie' },
  'eel-stew': { draw: EelStew, family: 'food', title: 'Eel stew' },
  'char-pie': { draw: CharPie, family: 'food', title: 'Char pie' },
  'sturgeon-stew': { draw: SturgeonStew, family: 'food', title: 'Sturgeon stew' },
  'pearl-mussel': { draw: PearlMussel, family: 'find', title: 'Pearl mussel (Uncommon find)' },
  'river-pearl': { draw: RiverPearl, family: 'find', title: 'River pearl (Uncommon find)' },
  'message-in-a-bottle': { draw: MessageInABottle, family: 'find', title: 'Message in a bottle (Rare find)' },
  'drowned-signet': { draw: DrownedSignet, family: 'find', title: 'Drowned signet (Rare find)' },
  'scale-of-the-deep': { draw: ScaleOfTheDeep, family: 'find', title: 'Scale of the deep (Legendary find)' },
  'fen-kings-crown': { draw: FenKingsCrown, family: 'find', title: "Fen-king's crown (Legendary find)" },
  'wild-herbs': { draw: WildHerbs, family: 'find', title: 'Wild herbs (Uncommon find)' },
  'saffron-threads': { draw: SaffronThreads, family: 'find', title: 'Saffron threads (Uncommon find)' },
  'grandmothers-recipe': { draw: GrandmothersRecipe, family: 'find', title: "Grandmother's recipe (Rare find)" },
  'silver-ladle': { draw: SilverLadle, family: 'find', title: 'Silver ladle (Rare find)' },
  'ever-warm-pot': { draw: EverWarmPot, family: 'find', title: 'Ever-warm pot (Legendary find)' },
  'cauldron-of-plenty': { draw: CauldronOfPlenty, family: 'find', title: 'Cauldron of plenty (Legendary find)' },
};
