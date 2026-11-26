// The castle raised from the land (session 247): Castle Clash took gold alone, so a player's logs, ore, bars
// and runes never mattered to it. Each of the Citadel's buildings takes one family of the player's own
// materials, at the tier their skill has opened, and with the lord's leave up to a quarter of a Level up's
// gold is paid in them, each at its price. Gold alone pays as before, so no lord is ever held up by
// a lane they do not run. Shared, because the server pays by it and the page says it.
import { TIER_LEVELS, type BuildingId } from '@idle-clash/content';
import { countOf, LANE_IDS, type State } from '@idle-clash/kernel';
import { itemOf, skillActions } from './catalog.ts';
import { styleOf, supplyOf } from './combat/state.ts';
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

const DAY_SECONDS = 86_400;
/** A fight at its quickest, for a day of a style's supply (one a fight). */
const FIGHT_SECONDS = 6;

/** What a day of the running lanes uses of an item (session 266: a Level up took the bars the Artisan lane
 *  was forging with, or the runes a Magic fighter carried, and stopped it without a word): an artisan's
 *  ingredient at its action's pace, and a style's supply at a fight every few seconds. Kept back. */
export function dayOfUse(state: State, item: string): number {
  let use = 0;
  for (const lane of LANE_IDS) {
    const run = state.lanes[lane].current;
    if (!run) continue;
    const action = skillActions()
      .find((sk) => sk.feature === run.action.feature)
      ?.actions.find((a) => a.id === run.action.id);
    const takes = action?.takes?.find((g) => g.item === item);
    if (takes && action) use += Math.ceil((takes.count * DAY_SECONDS) / Math.max(1, action.seconds ?? 60));
  }
  const style = state.lanes.combat.current ? styleOf(state) : null;
  if (style && supplyOf(state, style)?.item === item) use += DAY_SECONDS / FIGHT_SECONDS;
  return use;
}

/** What materials pay towards a Level up costing `gold`: as many of the material held as cover up to a quarter
 *  of it, each at its price, keeping back a day of what the running lanes use; null when none is spare, it is
 *  worth nothing or it is locked in the Storehouse. */
export function materialsFor(state: State, id: BuildingId, gold: number): MaterialsPaid | null {
  const item = materialFor(state, id);
  if (isLocked(state, item)) return null;
  const worth = (itemOf(item)?.value ?? 0) * MATERIAL_WORTH;
  const most = Math.floor(gold * MATERIAL_SHARE);
  if (worth <= 0 || most <= 0 || !Number.isFinite(gold)) return null;
  const count = Math.min(countOf(state, item) - dayOfUse(state, item), Math.ceil(most / worth));
  if (count <= 0) return null;
  return { item, count, credit: Math.min(most, Math.floor(count * worth)) };
}
