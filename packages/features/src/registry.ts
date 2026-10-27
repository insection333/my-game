// The registry: every feature, in one list. A feature folder not listed here fails the manifest check.
import { registryOf, type ActionRegistry } from '@idle-clash/kernel';
import { archery } from './archery/index.ts';
import { combat } from './combat/index.ts';
import { cooking } from './cooking/index.ts';
import { deeds } from './deeds/index.ts';
import { expeditions } from './expeditions/index.ts';
import type { Feature } from './define.ts';
import { fishing } from './fishing/index.ts';
import { fletching } from './fletching/index.ts';
import { goals } from './goals/index.ts';
import { hitpoints } from './hitpoints/index.ts';
import { magic } from './magic/index.ts';
import { melee } from './melee/index.ts';
import { mining } from './mining/index.ts';
import { runecraft } from './runecraft/index.ts';
import { smithing } from './smithing/index.ts';
import { setCatalog, setFinds, setSkills } from './shared/catalog.ts';
import { storehouse } from './storehouse/index.ts';
import { catalog } from './shared/items.ts';
import { woodcutting } from './woodcutting/index.ts';

export const FEATURES: readonly Feature[] = [
  woodcutting,
  mining,
  fishing,
  runecraft,
  smithing,
  cooking,
  fletching,
  melee,
  archery,
  magic,
  hitpoints,
  combat,
  expeditions,
  storehouse,
  goals,
  deeds,
];
// Rules that must know what an item is while playing (a worn sword's tier) read this catalog.
setCatalog(catalog(FEATURES));
// Every find, by the skill it belongs to; a feature without a skill (the bosses' finds) is its own.
setFinds(
  FEATURES.flatMap((f) =>
    (f.content.finds ?? []).map((x) => ({
      item: x.item,
      rarity: x.rarity,
      skill: f.content.skill?.id ?? f.id,
      feature: f.id,
      ladder: f.content.skill?.ladder ?? [],
    })),
  ),
);
setSkills(
  FEATURES.flatMap((f) =>
    f.content.skill && f.content.actions?.length
      ? [{ feature: f.id, skill: f.content.skill.id, ladder: f.content.skill.ladder, actions: f.content.actions }]
      : [],
  ),
);

/** The kernel's action registry: rules of every feature whose flag is on (or of those named). */
export function actionRegistry(
  features: readonly Feature[] = FEATURES,
  on = (f: Feature) => f.flag.on,
): ActionRegistry {
  return registryOf(Object.fromEntries(features.filter(on).map((f) => [f.id, f.rules])));
}
