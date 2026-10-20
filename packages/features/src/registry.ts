// The registry: every feature, in one list. A feature folder not listed here fails the manifest check.
import { registryOf, type ActionRegistry } from '@idle-clash/kernel';
import type { Feature } from './define.ts';
import { goals } from './goals/index.ts';
import { woodcutting } from './woodcutting/index.ts';

export const FEATURES: readonly Feature[] = [woodcutting, goals];

/** The kernel's action registry: rules of every feature whose flag is on (or of those named). */
export function actionRegistry(
  features: readonly Feature[] = FEATURES,
  on = (f: Feature) => f.flag.on,
): ActionRegistry {
  return registryOf(Object.fromEntries(features.filter(on).map((f) => [f.id, f.rules])));
}
