// Expeditions' icons (session 16), registered beside the rest (index.tsx): the three bosses and their
// six finds, each region's vista (a run's icon), the camp, the fork's signpost, the marks, and the
// fourteen relics.
import type { IconDef } from './index.tsx';
import {
  ChieftainsTorc,
  CrownOfTheHill,
  DrownedWarden,
  EmberWyrm,
  HeartOfTheWyrm,
  SunkenLocket,
  TrollChief,
  WardensLantern,
  WyrmScale,
} from './bosses.tsx';
import { Camp, ExpeditionMark, FenVista, MarchVista, PeaksVista, Signpost } from './journey.tsx';
import {
  BuildersCord,
  FourLeafCharm,
  HawkEyeBead,
  HearthWitchsLadle,
  Hearthstone,
  HeartwoodCharm,
  OldOakHeart,
  PearlLure,
  SeamFindersStone,
  SmithSpiritsNail,
  StarlitFocus,
  StoneSpeakersChalk,
  VeteransSwordKnot,
  WrenFeatherFletch,
} from './relics.tsx';

export const EXPEDITION_ICONS: Record<string, IconDef> = {
  'troll-chief': { draw: TrollChief, family: 'foe', title: 'The Troll-chief of the hill (boss)' },
  'drowned-warden': { draw: DrownedWarden, family: 'foe', title: 'The Drowned Warden (boss)' },
  'ember-wyrm': { draw: EmberWyrm, family: 'foe', title: 'The Ember Wyrm (boss)' },
  'chieftains-torc': { draw: ChieftainsTorc, family: 'find', title: "Chieftain's torc (Rare boss find)" },
  'crown-of-the-hill': { draw: CrownOfTheHill, family: 'find', title: 'Crown of the hill (Legendary boss find)' },
  'sunken-locket': { draw: SunkenLocket, family: 'find', title: 'Sunken locket (Rare boss find)' },
  'wardens-lantern': { draw: WardensLantern, family: 'find', title: "Warden's lantern (Legendary boss find)" },
  'wyrm-scale': { draw: WyrmScale, family: 'find', title: 'Wyrm scale (Rare boss find)' },
  'heart-of-the-wyrm': { draw: HeartOfTheWyrm, family: 'find', title: 'Heart of the wyrm (Legendary boss find)' },
  march: { draw: MarchVista, family: 'reward', title: 'The march (an expedition)' },
  fen: { draw: FenVista, family: 'reward', title: 'The Sunken Fen (an expedition)' },
  peaks: { draw: PeaksVista, family: 'reward', title: 'The Ashen Peaks (an expedition)' },
  camp: { draw: Camp, family: 'reward', title: 'Camp (a run heals)' },
  fork: { draw: Signpost, family: 'reward', title: "Fork (a run's road)" },
  'expedition-mark': { draw: ExpeditionMark, family: 'reward', title: 'Expedition marks' },
  'relic-woodcutting': { draw: HeartwoodCharm, family: 'relic', title: 'Heartwood charm (Woodcutting relic)' },
  'relic-mining': { draw: SeamFindersStone, family: 'relic', title: "Seam-finder's stone (Mining relic)" },
  'relic-fishing': { draw: PearlLure, family: 'relic', title: 'Pearl lure (Fishing relic)' },
  'relic-runecraft': { draw: StoneSpeakersChalk, family: 'relic', title: "Stone-speaker's chalk (Runecraft relic)" },
  'relic-smithing': { draw: SmithSpiritsNail, family: 'relic', title: "Smith-spirit's nail (Smithing relic)" },
  'relic-cooking': { draw: HearthWitchsLadle, family: 'relic', title: "Hearth-witch's ladle (Cooking relic)" },
  'relic-fletching': { draw: WrenFeatherFletch, family: 'relic', title: 'Wren-feather fletch (Fletching relic)' },
  'relic-melee': { draw: VeteransSwordKnot, family: 'relic', title: "Veteran's sword-knot (Melee relic)" },
  'relic-archery': { draw: HawkEyeBead, family: 'relic', title: 'Hawk-eye bead (Archery relic)' },
  'relic-magic': { draw: StarlitFocus, family: 'relic', title: 'Starlit focus (Magic relic)' },
  'relic-hitpoints': { draw: OldOakHeart, family: 'relic', title: 'Old oak heart (Hitpoints relic)' },
  hearthstone: { draw: Hearthstone, family: 'relic', title: 'Hearthstone (food heals more)' },
  'four-leaf-charm': { draw: FourLeafCharm, family: 'relic', title: 'Four-leaf charm (finds more likely)' },
  'builders-cord': { draw: BuildersCord, family: 'relic', title: "Builder's cord (Storehouse spaces)" },
};
