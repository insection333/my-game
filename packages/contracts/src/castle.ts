// Castle Clash's routes (docs/castle-clash/): read your castle, open it, act on it (one route for every
// action, each a strict shape), and find targets. Ids are checked by shape here and against the content
// by the engine, which refuses an unknown one.
import { z } from 'zod';
import { RequestId } from './fields.ts';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

const Id = z.string().regex(/^[a-z][a-zA-Z-]{0,40}$/);
const Pct = z.number().int().min(0).max(100);
const Shares = z.tuple([Pct, Pct, Pct]);
const Gold = z.number().int().min(1).max(1e15);
/** A lord (a player id) or one of today's mercenary strongholds. */
const Target = z.union([z.string().uuid(), z.string().regex(/^merc:\d{4}-\d{2}-\d{2}:[0-4]$/)]);
const Unit = z.enum(['vanguard', 'outriders', 'siege']);

const act = <K extends string, T extends z.ZodRawShape>(type: K, shape: T) =>
  z.object({ type: z.literal(type), ...shape }).strict();

export const CastleAction = z.discriminatedUnion('type', [
  act('callToArms', {}),
  act('deposit', { gold: Gold }),
  act('withdraw', { gold: Gold }),
  act('edict', { edict: Id.nullable() }),
  act('payFrom', { treasury: z.boolean() }),
  act('upgrade', { id: Id }),
  act('research', { tech: Id }),
  act('forgeRelic', { relic: Id }),
  act('temperRelic', { relic: Id }),
  act('equipRelics', { relics: z.array(Id).max(3) }),
  act('offense', { shares: Shares }),
  act('defense', { defense: Shares.optional(), trap: Id.nullable().optional(), castellan: Id.nullable().optional() }),
  act('mend', { what: z.enum(['walls', 'wounds']) }),
  act('drill', { unit: Unit, times: z.number().int().min(1).max(50) }),
  act('excavate', {}),
  act('scoutIncursion', {}),
  act('incursion', {}),
  act('spy', { target: Target, mission: z.enum(['scout', 'poison', 'sabotage', 'forge']) }),
  act('siege', { target: Target }),
]);
export type CastleAction = z.infer<typeof CastleAction>;

export const CastleRequest = z.object({ requestId: RequestId, action: CastleAction }).strict();
export const CastleOpen = z.object({ requestId: RequestId }).strict();

const route = (r: RouteContract) => r;
export const CASTLE_ROUTES = {
  castle: route({ id: 'castle', method: 'GET', path: PATHS.castle, auth: 'player', input: null, example: null }),
  castleTargets: route({
    id: 'castleTargets',
    method: 'GET',
    path: PATHS.castleTargets,
    auth: 'player',
    input: null,
    example: null,
  }),
  castleOpen: route({
    id: 'castleOpen',
    method: 'POST',
    path: PATHS.castleOpen,
    auth: 'player',
    input: CastleOpen,
    example: { requestId: 'req-castle-01' },
  }),
  castleAct: route({
    id: 'castleAct',
    method: 'POST',
    path: PATHS.castleAct,
    auth: 'player',
    input: CastleRequest,
    example: { requestId: 'req-castle-02', action: { type: 'callToArms' } },
  }),
} satisfies Record<string, RouteContract>;
