// Castle Clash's ids to their strings, each written out, so every key is literal and checked (verify's
// content step), and an unknown id reads as nothing rather than a key.
import { t } from '@idle-clash/content';
import { castleEngine } from '@idle-clash/features';

export const { fortressName, outcomeName, mercName } = castleEngine;

const read = (map: Record<string, string>) => (id: string | null | undefined, params?: Record<string, string>) =>
  id && Object.hasOwn(map, id) ? t(map[id], params) : '';

export const buildingName = read({
  walls: 'castle.building.walls',
  deepVault: 'castle.building.deepVault',
  watchtower: 'castle.building.watchtower',
  spyGuild: 'castle.building.spyGuild',
});
export const buildingDoes = read({
  walls: 'castle.building.walls.does',
  deepVault: 'castle.building.deepVault.does',
  watchtower: 'castle.building.watchtower.does',
  spyGuild: 'castle.building.spyGuild.does',
});
export const unitName = read({
  vanguard: 'castle.unit.vanguard',
  outriders: 'castle.unit.outriders',
  siege: 'castle.unit.siege',
});
export const evolutionName = read({
  'levy-spearmen': 'castle.evolution.levy-spearmen',
  'ironclad-halberdiers': 'castle.evolution.ironclad-halberdiers',
  'sunforged-phalanx': 'castle.evolution.sunforged-phalanx',
  'immortal-aegis': 'castle.evolution.immortal-aegis',
  'border-scouts': 'castle.evolution.border-scouts',
  'lancer-dragoons': 'castle.evolution.lancer-dragoons',
  'shadowmane-cavaliers': 'castle.evolution.shadowmane-cavaliers',
  'stormhoof-cataphracts': 'castle.evolution.stormhoof-cataphracts',
  'timber-trebuchets': 'castle.evolution.timber-trebuchets',
  'dwarven-bombardiers': 'castle.evolution.dwarven-bombardiers',
  'alchemical-hellcannons': 'castle.evolution.alchemical-hellcannons',
  'arcane-conflux-engines': 'castle.evolution.arcane-conflux-engines',
});
export const trapName = read({
  'boiling-pitch': 'castle.trap.boiling-pitch',
  'spiked-palisades': 'castle.trap.spiked-palisades',
  'counter-battery': 'castle.trap.counter-battery',
});
export const presetName = read({
  even: 'castle.preset.even',
  vanguard: 'castle.preset.vanguard',
  outriders: 'castle.preset.outriders',
  siege: 'castle.preset.siege',
});
export const castellanName = read({
  'iron-marshal': 'castle.castellan.iron-marshal',
  'whisper-weaver': 'castle.castellan.whisper-weaver',
  'golden-archon': 'castle.castellan.golden-archon',
});
export const castellanDoes = read({
  'iron-marshal': 'castle.castellan.iron-marshal.does',
  'whisper-weaver': 'castle.castellan.whisper-weaver.does',
  'golden-archon': 'castle.castellan.golden-archon.does',
});
export const edictName = read({
  harvest: 'castle.edict.harvest',
  vigor: 'castle.edict.vigor',
  fortune: 'castle.edict.fortune',
});
export const edictGives = read({
  fightGold: 'castle.edict.gives.fightGold',
  xp: 'castle.edict.gives.xp',
  finds: 'castle.edict.gives.finds',
});
export const decreeName = read({
  'iron-ramparts': 'castle.decree.iron-ramparts',
  'long-shadows': 'castle.decree.long-shadows',
  'open-coffers': 'castle.decree.open-coffers',
  'war-banners': 'castle.decree.war-banners',
  'forge-fires': 'castle.decree.forge-fires',
});
export const decreeDoes = read({
  'iron-ramparts': 'castle.decree.does.iron-ramparts',
  'long-shadows': 'castle.decree.does.long-shadows',
  'open-coffers': 'castle.decree.does.open-coffers',
  'war-banners': 'castle.decree.does.war-banners',
  'forge-fires': 'castle.decree.does.forge-fires',
});
export const techName = read({
  logistics: 'castle.tech.logistics',
  siegecraft: 'castle.tech.siegecraft',
  fortification: 'castle.tech.fortification',
  espionage: 'castle.tech.espionage',
});
export const techDoes = read({
  logistics: 'castle.tech.logistics.does',
  siegecraft: 'castle.tech.siegecraft.does',
  fortification: 'castle.tech.fortification.does',
  espionage: 'castle.tech.espionage.does',
});
export const missionName = read({
  scout: 'castle.mission.scout',
  poison: 'castle.mission.poison',
  sabotage: 'castle.mission.sabotage',
  forge: 'castle.mission.forge',
});
export const missionDoes = read({
  scout: 'castle.mission.scout.does',
  poison: 'castle.mission.poison.does',
  sabotage: 'castle.mission.sabotage.does',
  forge: 'castle.mission.forge.does',
});
export const relicName = read({
  'banner-of-the-first-king': 'castle.relic.banner-of-the-first-king',
  'aegis-shard': 'castle.relic.aegis-shard',
  'wyrmglass-lens': 'castle.relic.wyrmglass-lens',
  'sentinels-eye': 'castle.relic.sentinels-eye',
  'oathbound-horn': 'castle.relic.oathbound-horn',
  'gilded-ledger': 'castle.relic.gilded-ledger',
  'ember-of-sieges': 'castle.relic.ember-of-sieges',
  'menders-mortar': 'castle.relic.menders-mortar',
  'tidings-stone': 'castle.relic.tidings-stone',
});
export const relicGives = read({
  attack: 'castle.relic.gives.attack',
  defense: 'castle.relic.gives.defense',
  stealth: 'castle.relic.gives.stealth',
  detection: 'castle.relic.gives.detection',
  marks: 'castle.relic.gives.marks',
  vaultProtect: 'castle.relic.gives.vaultProtect',
  penetration: 'castle.relic.gives.penetration',
  recovery: 'castle.relic.gives.recovery',
  apRate: 'castle.relic.gives.apRate',
});
export const refusal = read({
  gold: 'castle.refused.gold',
  marks: 'castle.refused.marks',
  ap: 'castle.refused.ap',
  top: 'castle.refused.top',
  unknown: 'castle.refused.unknown',
  locked: 'castle.refused.locked',
  cooling: 'castle.refused.cooling',
  unchanged: 'castle.refused.unchanged',
  invalid: 'castle.refused.invalid',
  notOwned: 'castle.refused.notOwned',
  claimed: 'castle.refused.claimed',
  self: 'castle.refused.self',
  shielded: 'castle.refused.shielded',
  pairLimit: 'castle.refused.pairLimit',
  immune: 'castle.refused.immune',
  full: 'castle.refused.full',
  closed: 'castle.refused.closed',
  noCastle: 'castle.refused.noCastle',
});
