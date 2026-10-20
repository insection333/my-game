// Finds: every completion may turn up a find at one of three rarities. Each skill has six, a lesser
// and a greater at each rarity; greater ones come only from tier 3 and 4 actions. The numbers match
// GAME_DESIGN.md section 8 (verify compares them with the model).
import type { Rarity } from '@idle-clash/kernel';
import { z } from 'zod';
import { Id } from './schemas.ts';

export const RARITIES = ['uncommon', 'rare', 'legendary'] as const satisfies readonly Rarity[];

/** Plain chances per action, raised by find perks and by rich actions. */
export const RARE_CHANCE = 1 / 500;
export const LEGENDARY_CHANCE = 1 / 5000;
/** Uncommon finds use luck: each action that finds nothing raises the next chance by this. */
export const LUCK_STEP = 0.00062;
/** After this long of active play (the fire burning) with no notable moment, the next find is certain. */
export const LUCK_GUARANTEE_MS = 240_000;
/** Each Legendary find's first finding adds this much XP in its skill, for good. */
export const LEGENDARY_MARK_PCT = 2;
/** Greater finds come only from actions of this tier and above. */
export const GREATER_FROM_TIER = 3;

export const Find = z.object({ item: Id, rarity: z.enum(RARITIES), greater: z.boolean() }).strict();
export type Find = z.infer<typeof Find>;
