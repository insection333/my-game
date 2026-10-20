// The registry: every feature, in one list. A feature folder not listed here fails the manifest check.
import { registryOf, type ActionRegistry } from '@idle-clash/kernel';
import { archery } from './archery/index.ts';
import { combat } from './combat/index.ts';
import type { Feature } from './define.ts';
import { goals } from './goals/index.ts';
import { hitpoints } from './hitpoints/index.ts';
import { magic } from './magic/index.ts';
import { melee } from './melee/index.ts';
import { mining } from './mining/index.ts';
import { smithing } from './smithing/index.ts';
import { setCatalog } from './shared/catalog.ts';
import { catalog } from './shared/items.ts';
import { woodcutting } from './woodcutting/index.ts';

export const FEATURES: readonly Feature[] = [
  woodcutting,
  mining,
  smithing,
  melee,
  archery,
  magic,
  hitpoints,
  combat,
  goals,
];
// Rules that must know what an item is while playing (a worn sword's tier) read this catalog.
setCatalog(catalog(FEATURES));

/** The kernel's action registry: rules of every feature whose flag is on (or of those named). */
export function actionRegistry(
  features: readonly Feature[] = FEATURES,
  on = (f: Feature) => f.flag.on,
): ActionRegistry {
  return registryOf(Object.fromEntries(features.filter(on).map((f) => [f.id, f.rules])));
}
