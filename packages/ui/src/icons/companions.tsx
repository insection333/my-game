// The fourteen companions by id (session 179), for the icon registry (honours-index.tsx).
import {
  CompanionSquirrel,
  CompanionMole,
  CompanionOtter,
  CompanionMoth,
  CompanionSalamander,
  CompanionCat,
  CompanionGoose,
} from './companions-a.tsx';
import {
  CompanionHound,
  CompanionFalcon,
  CompanionToad,
  CompanionTortoise,
  CompanionStoneWhelp,
  CompanionLanternFrog,
  CompanionWyrmling,
} from './companions-b.tsx';

export const COMPANION_ART = {
  squirrel: CompanionSquirrel,
  mole: CompanionMole,
  otter: CompanionOtter,
  moth: CompanionMoth,
  salamander: CompanionSalamander,
  cat: CompanionCat,
  goose: CompanionGoose,
  hound: CompanionHound,
  falcon: CompanionFalcon,
  toad: CompanionToad,
  tortoise: CompanionTortoise,
  'stone-whelp': CompanionStoneWhelp,
  'lantern-frog': CompanionLanternFrog,
  wyrmling: CompanionWyrmling,
} as const;
