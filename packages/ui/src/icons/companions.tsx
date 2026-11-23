// The companions by id (session 179; seventeen since session 210), for the icon registry (honours-index.tsx).
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
import { CompanionBarrowRaven, CompanionMireNewt, CompanionRocChick } from './companions-c.tsx';

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
  'barrow-raven': CompanionBarrowRaven,
  'stone-whelp': CompanionStoneWhelp,
  'mire-newt': CompanionMireNewt,
  'lantern-frog': CompanionLanternFrog,
  'roc-chick': CompanionRocChick,
  wyrmling: CompanionWyrmling,
} as const;
