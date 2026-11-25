// The kernel's own commands: what a player can ask of a lane. Features add commands of their own
// (claim a goal, buy food) through their routes in session 3; every command lights the fire.
import { z } from 'zod';
import { ActionRef, LANE_IDS } from './schema.ts';

const lane = z.enum(LANE_IDS);

export const Command = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start'), lane, action: ActionRef }).strict(),
  z.object({ type: z.literal('queueNext'), lane, action: ActionRef }).strict(),
  /** `at`: one of the actions to come by its place (0 is Next); without it, all of them (session 240). */
  z.object({ type: z.literal('clearNext'), lane, at: z.number().int().min(0).max(2).optional() }).strict(),
  z.object({ type: z.literal('stop'), lane }).strict(),
  z.object({ type: z.literal('stoke') }).strict(),
]);
export type Command = z.infer<typeof Command>;
