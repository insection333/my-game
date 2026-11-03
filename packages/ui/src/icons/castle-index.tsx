// Castle Clash's icons (session 41), registered beside the rest (index.tsx): the four buildings, the
// three edicts' banners, the three units at each of their four evolutions (by the evolution's id), the
// War College's four studies, the Reliquary's nine war relics (by the relic's id), and the arms a lord or
// a stronghold bears (heraldry.tsx; ItemIcon draws them from an id with its `crest`).
import type { IconDef } from './index.tsx';
import { Outriders, Siege, Vanguard } from './castle-troops.tsx';
import { DeepVault, Walls, Watchtower, SpyGuild } from './castle-works.tsx';
import { EdictFortune, EdictHarvest, EdictVigor } from './castle-edicts.tsx';
import {
  AegisShard,
  BannerOfTheFirstKing,
  EmberOfSieges,
  GildedLedger,
  MendersMortar,
  OathboundHorn,
  SentinelsEye,
  TidingsStone,
  WyrmglassLens,
} from './castle-relics.tsx';
import { Espionage, Fortification, Logistics, Siegecraft } from './castle-techs.tsx';
import { Coins, GoldLost, SpyForge, SpyPoison, SpySabotage, SpyScout, WarMarks } from './castle-spies.tsx';
import { Crest } from './heraldry.tsx';

const UNITS: readonly [string, (p: { stage: number }) => React.JSX.Element, readonly string[]][] = [
  ['Vanguard', Vanguard, ['levy-spearmen', 'ironclad-halberdiers', 'sunforged-phalanx', 'immortal-aegis']],
  ['Outriders', Outriders, ['border-scouts', 'lancer-dragoons', 'shadowmane-cavaliers', 'stormhoof-cataphracts']],
  ['Siege', Siege, ['timber-trebuchets', 'dwarven-bombardiers', 'alchemical-hellcannons', 'arcane-conflux-engines']],
];

export const CASTLE_ICONS: Record<string, IconDef> = {
  'castle-walls': { draw: Walls, family: 'castle', title: 'Walls' },
  'castle-deep-vault': { draw: DeepVault, family: 'castle', title: 'Deep vault' },
  'castle-watchtower': { draw: Watchtower, family: 'castle', title: 'Watchtower' },
  'castle-spy-guild': { draw: SpyGuild, family: 'castle', title: 'Spy guild' },
  'edict-harvest': { draw: EdictHarvest, family: 'castle', title: 'Edict of Harvest' },
  'edict-vigor': { draw: EdictVigor, family: 'castle', title: 'Edict of Vigor' },
  'edict-fortune': { draw: EdictFortune, family: 'castle', title: 'Edict of Fortune' },
  ...Object.fromEntries(
    UNITS.flatMap(([unit, Draw, ids]) =>
      ids.map((id, stage): [string, IconDef] => [
        id,
        { draw: () => <Draw stage={stage} />, family: 'castle', title: `${unit}, evolution ${stage + 1}` },
      ]),
    ),
  ),
  // A battle report's (session 42): the spy missions, and what a battle moves.
  'spy-scout': { draw: SpyScout, family: 'castle', title: 'Scout the castle (spy mission)' },
  'spy-poison': { draw: SpyPoison, family: 'castle', title: 'Poison the wells (spy mission)' },
  'spy-sabotage': { draw: SpySabotage, family: 'castle', title: 'Sabotage the gatehouse (spy mission)' },
  'spy-forge': { draw: SpyForge, family: 'castle', title: 'Forge orders (spy mission)' },
  'castle-gold': { draw: Coins, family: 'castle', title: 'Gold won' },
  'castle-marks': { draw: WarMarks, family: 'castle', title: 'War marks' },
  'castle-gold-lost': { draw: GoldLost, family: 'castle', title: 'Gold lost to a raid' },
  // The War College's studies.
  'tech-logistics': { draw: Logistics, family: 'castle', title: 'Logistics (War College)' },
  'tech-siegecraft': { draw: Siegecraft, family: 'castle', title: 'Siegecraft (War College)' },
  'tech-fortification': { draw: Fortification, family: 'castle', title: 'Fortification (War College)' },
  'tech-espionage': { draw: Espionage, family: 'castle', title: 'Espionage (War College)' },
  // The Reliquary's war relics, by the relic's id.
  'banner-of-the-first-king': {
    draw: BannerOfTheFirstKing,
    family: 'relic',
    title: 'Banner of the First King (war relic)',
  },
  'aegis-shard': { draw: AegisShard, family: 'relic', title: 'Aegis shard (war relic)' },
  'wyrmglass-lens': { draw: WyrmglassLens, family: 'relic', title: 'Wyrmglass lens (war relic)' },
  'sentinels-eye': { draw: SentinelsEye, family: 'relic', title: "Sentinel's eye (war relic)" },
  'oathbound-horn': { draw: OathboundHorn, family: 'relic', title: 'Oathbound horn (war relic)' },
  'gilded-ledger': { draw: GildedLedger, family: 'relic', title: 'Gilded ledger (war relic)' },
  'ember-of-sieges': { draw: EmberOfSieges, family: 'relic', title: 'Ember of sieges (war relic)' },
  'menders-mortar': { draw: MendersMortar, family: 'relic', title: "Mender's mortar (war relic)" },
  'tidings-stone': { draw: TidingsStone, family: 'relic', title: 'Tidings stone (war relic)' },
  crest: { draw: () => <Crest seed="crest" />, family: 'crest', title: 'Arms (each lord and stronghold its own)' },
};
