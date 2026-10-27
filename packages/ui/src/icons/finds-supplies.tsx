// Fletching's and Runecraft's finds (session 14), registered beside the rest (index.tsx).
import {
  ArrowOfTheFirstHunt,
  FletchersKnife,
  HawkFeather,
  HeronQuill,
  QuiverOfTheWildHunt,
  WaxedBowstring,
} from './finds-fletching.tsx';
import {
  ChalkStub,
  CrackedRune,
  RubbingOfALostRune,
  RuneOfTheOldKings,
  SeersStone,
  StarChartOfTheAncients,
} from './finds-runecraft.tsx';
import type { IconDef } from './index.tsx';

export const SUPPLY_FINDS: Record<string, IconDef> = {
  'heron-quill': { draw: HeronQuill, family: 'find', title: 'Heron quill (Uncommon find)' },
  'hawk-feather': { draw: HawkFeather, family: 'find', title: 'Hawk feather (Uncommon find)' },
  'fletchers-knife': { draw: FletchersKnife, family: 'find', title: "Fletcher's knife (Rare find)" },
  'waxed-bowstring': { draw: WaxedBowstring, family: 'find', title: 'Waxed bowstring (Rare find)' },
  'arrow-of-the-first-hunt': {
    draw: ArrowOfTheFirstHunt,
    family: 'find',
    title: 'Arrow of the first hunt (Legendary find)',
  },
  'quiver-of-the-wild-hunt': {
    draw: QuiverOfTheWildHunt,
    family: 'find',
    title: 'Quiver of the wild hunt (Legendary find)',
  },
  'chalk-stub': { draw: ChalkStub, family: 'find', title: 'Chalk stub (Uncommon find)' },
  'cracked-rune': { draw: CrackedRune, family: 'find', title: 'Cracked rune (Uncommon find)' },
  'seers-stone': { draw: SeersStone, family: 'find', title: "Seer's stone (Rare find)" },
  'rubbing-of-a-lost-rune': { draw: RubbingOfALostRune, family: 'find', title: 'Rubbing of a lost rune (Rare find)' },
  'rune-of-the-old-kings': { draw: RuneOfTheOldKings, family: 'find', title: 'Rune of the old kings (Legendary find)' },
  'star-chart-of-the-ancients': {
    draw: StarChartOfTheAncients,
    family: 'find',
    title: 'Star chart of the ancients (Legendary find)',
  },
};
