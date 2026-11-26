// The castle raised from the land (session 247): Castle Clash took gold alone, so a player's logs, ore, bars
// and runes never mattered to it. Each of the Citadel's buildings takes one family of the player's own
// materials, at the tier their skill has opened, and with the lord's leave up to a quarter of a Level up's
// gold is paid in them, each at its price. Gold alone pays as before, so no lord is ever held up by
// a lane they do not run. Shared, because the server pays by it and the page says it.
import { TIER_LEVELS, type BuildingId } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { itemOf } from './catalog.ts';
import { laneUsing } from './in-use.ts';
import { isLocked } from './storehouse.ts';
import { skillLevel } from './skill.ts';
import { FAMILY } from './steading.ts';

/** The share of a Level up's gold materials may pay, and what each is worth to the castle against its price. */
export const MATERIAL_SHARE = 1 / 4;
export const MATERIAL_WORTH = 1;

type Kind = 'logs' | 'ore' | 'bars' | 'runes';
/** What each building is raised from: walls of stone and ore, the vault of bars, the watchtower of timber, the
 *  Spy Guild's ciphers in runes. The troops stay gold alone: their levels set the evolutions' pace, which a
 *  third evolution about three weeks early showed in the year's simulation. */
export const MATERIAL_OF: Readonly<Record<BuildingId, Kind>> = {
  walls: 'ore',
  deepVault: 'bars',
  watchtower: 'logs',
  spyGuild: 'runes',
};
const SKILL: Record<Kind, string> = {
  logs: 'woodcutting',
  ore: 'mining',
  bars: 'smithing',
  runes: 'runecraft',
};
const itemsOf = (kind: Kind): readonly string[] => FAMILY[kind];

/** The material a building or troop takes for this player: its family at the tier their skill has opened. */
export function materialFor(state: State, id: BuildingId): string {
  const kind = MATERIAL_OF[id];
  const tier = TIER_LEVELS.filter((l) => l <= skillLevel(state, SKILL[kind])).length;
  return itemsOf(kind)[Math.max(0, tier - 1)];
}

export interface MaterialsPaid {
  item: string;
  /** How many are taken, and the gold they stand in for. */
  count: number;
  credit: number;
}

/** Whether a running lane needs the material (an artisan's ingredient, the food a fight eats, the style's
 *  supply): then gold pays all (session 266: a Level up took the runes a Magic fighter carried, or the bars
 *  the Artisan lane was forging with, and stopped it without a word). */
export const materialInUse = (state: State, id: BuildingId): boolean =>
  laneUsing(state, materialFor(state, id)) !== null || isLocked(state, materialFor(state, id));

/** What materials pay towards a Level up costing `gold`: as many of the material held as cover up to a quarter
 *  of it, each at its price; null when none is held, it is worth nothing, a running lane needs it or it is locked. */
export function materialsFor(state: State, id: BuildingId, gold: number): MaterialsPaid | null {
  if (materialInUse(state, id)) return null;
  const item = materialFor(state, id);
  const worth = (itemOf(item)?.value ?? 0) * MATERIAL_WORTH;
  const most = Math.floor(gold * MATERIAL_SHARE);
  if (worth <= 0 || most <= 0 || !Number.isFinite(gold)) return null;
  const count = Math.min(countOf(state, item), Math.ceil(most / worth));
  if (count <= 0) return null;
  return { item, count, credit: Math.min(most, Math.floor(count * worth)) };
}
