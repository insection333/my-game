// Every HTTP route of the server shell: its method, path, who may call it, its input schema and a
// valid example input. The server validates against these, the page is typed by them, and the
// hostile-input suite is generated from them.
import { Command, type AwaySummary, type GameEvent, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { Email, Password, plainText, PlayerName, RequestId, Token } from './fields.ts';
import { PASSWORD_MAX } from './limits.ts';
import { PATHS } from './paths.ts';

export const SignUp = z.object({ name: PlayerName, password: Password, ageConfirmed: z.literal(true) }).strict();
export const SignIn = z.object({ name: plainText(64), password: plainText(PASSWORD_MAX) }).strict();
export const CommandRequest = z.object({ requestId: RequestId, command: Command }).strict();
export const FeatureRequest = z.object({ requestId: RequestId, input: z.unknown() }).strict();
export const ErrorReport = z
  .object({
    message: plainText(500),
    stack: z.string().max(4000).optional(),
    url: plainText(500),
    line: z.number().int().nonnegative().optional(),
    column: z.number().int().nonnegative().optional(),
  })
  .strict();
export const SetEmail = z.object({ email: Email }).strict();
export const ConfirmEmail = z.object({ token: Token }).strict();
export const Recover = z.object({ name: plainText(64) }).strict();
export const ResetPassword = z.object({ token: Token, password: Password }).strict();

export interface RouteContract {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  /** none: anyone; player: a signed-in player. */
  auth: 'none' | 'player';
  input: z.ZodType | null;
  example: unknown;
  /** Only mounted when transactional email is switched on. */
  email?: true;
}

const route = (r: RouteContract) => r;

export const ROUTES = {
  health: route({ id: 'health', method: 'GET', path: PATHS.health, auth: 'none', input: null, example: null }),
  me: route({ id: 'me', method: 'GET', path: PATHS.me, auth: 'none', input: null, example: null }),
  signUp: route({
    id: 'signUp',
    method: 'POST',
    path: PATHS.signUp,
    auth: 'none',
    input: SignUp,
    example: { name: 'Rowan', password: 'a long enough secret', ageConfirmed: true },
  }),
  signIn: route({
    id: 'signIn',
    method: 'POST',
    path: PATHS.signIn,
    auth: 'none',
    input: SignIn,
    example: { name: 'Rowan', password: 'a long enough secret' },
  }),
  signOut: route({
    id: 'signOut',
    method: 'POST',
    path: PATHS.signOut,
    auth: 'player',
    input: null,
    example: null,
  }),
  game: route({ id: 'game', method: 'GET', path: PATHS.game, auth: 'player', input: null, example: null }),
  notices: route({ id: 'notices', method: 'GET', path: PATHS.notices, auth: 'player', input: null, example: null }),
  hiscores: route({ id: 'hiscores', method: 'GET', path: PATHS.hiscores, auth: 'player', input: null, example: null }),
  command: route({
    id: 'command',
    method: 'POST',
    path: PATHS.command,
    auth: 'player',
    input: CommandRequest,
    example: { requestId: 'req-0000001', command: { type: 'stoke' } },
  }),
  errors: route({
    id: 'errors',
    method: 'POST',
    path: PATHS.errors,
    auth: 'none',
    input: ErrorReport,
    example: { message: 'x is not a function', url: '/skills', line: 3, column: 9 },
  }),
  setEmail: route({
    id: 'setEmail',
    method: 'POST',
    path: PATHS.setEmail,
    auth: 'player',
    input: SetEmail,
    example: { email: 'rowan@example.com' },
    email: true,
  }),
  confirmEmail: route({
    id: 'confirmEmail',
    method: 'POST',
    path: PATHS.confirmEmail,
    auth: 'none',
    input: ConfirmEmail,
    example: { token: 'aaaaaaaaaaaaaaaaaaaaaaaa' },
    email: true,
  }),
  recover: route({
    id: 'recover',
    method: 'POST',
    path: PATHS.recover,
    auth: 'none',
    input: Recover,
    example: { name: 'Rowan' },
    email: true,
  }),
  resetPassword: route({
    id: 'resetPassword',
    method: 'POST',
    path: PATHS.resetPassword,
    auth: 'none',
    input: ResetPassword,
    example: { token: 'aaaaaaaaaaaaaaaaaaaaaaaa', password: 'a new long secret' },
    email: true,
  }),
} satisfies Record<string, RouteContract>;

export type RouteId = keyof typeof ROUTES;

// Responses: what the page receives.
export interface PlayerView {
  id: string;
  name: string;
}
export interface MeResponse {
  player: PlayerView | null;
  flags: Record<string, boolean>;
  email: { enabled: boolean };
}
export interface AuthResponse {
  player: PlayerView;
}
export interface GameResponse {
  state: State;
  /** The server's clock when it answered; the page corrects its own clock by this. */
  now: number;
  /** On reading the game after a quarter of an hour away: what happened meanwhile (the recap). */
  away?: AwaySummary | null;
}
/** One hiscore entry: a place on a ladder. */
export interface HiscoreRow {
  rank: number;
  name: string;
  level: number;
  xp: number;
  /** Milestones claimed (shown on the Total ladder). */
  milestones: number;
}
export interface Ladder {
  /** A skill's id, or 'total'. */
  skill: string;
  rows: HiscoreRow[];
  /** The asking player's own entry, wherever it is; null before their first XP. */
  you: HiscoreRow | null;
}
export interface HiscoresResponse {
  /** Pages open now. */
  online: number;
  ladders: Ladder[];
}
/** The notices tray: notable events and lane stops, newest first. */
export interface NoticesResponse {
  notices: GameEvent[];
}
/** A command's or feature route's answer: the result, and the save as it now stands. */
export interface ActResponse<R = unknown> extends GameResponse {
  result: R;
  /** True when this request id had already been handled: nothing happened twice. */
  duplicate: boolean;
  events: GameEvent[];
}
export const ErrorCode = z.enum([
  'invalidInput',
  'unsupportedType',
  'tooLarge',
  'notSignedIn',
  'forbiddenOrigin',
  'nameTaken',
  'wrongNameOrPassword',
  'banned',
  'tooManyTries',
  'notFound',
  'tokenInvalid',
  'serverError',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;
export interface ErrorResponse {
  error: { code: ErrorCode; fields?: string[]; retryAfterSeconds?: number };
}
