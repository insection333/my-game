// Every HTTP route of the server shell: its method, path, who may call it, its input schema and a
// valid example input. The server validates against these, the page is typed by them, and the
// hostile-input suite is generated from them.
import { Command, type AwaySummary, type GameEvent, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { Email, Password, plainText, PlayerName, RequestId, Token } from './fields.ts';
import { PASSWORD_MAX } from './limits.ts';
import { CASTLE_ROUTES } from './castle.ts';
import { MODERATION_ROUTES } from './moderation.ts';
import { MAIL_ROUTES } from './mail.ts';
import { PUSH_ROUTES } from './push.ts';
import { PROFILE_ROUTES } from './profile.ts';
import { CLOSED_TEST_ROUTES } from './closed-test.ts';
import { CONSOLE_ROUTES } from './console.ts';
import { CONSOLE_LIVE_ROUTES } from './console-live.ts';
import { CONSOLE_MORE_ROUTES } from './console-more.ts';
import { CONSOLE_BANNER_ROUTES, type Banner } from './console-banner.ts';
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
export const DeleteAccount = z.object({ password: plainText(PASSWORD_MAX), confirm: z.literal(true) }).strict();
export const ChangePassword = z.object({ current: plainText(PASSWORD_MAX), password: Password }).strict();
const PlayerId = z.string().uuid();
export const AdminSearch = z.object({ query: plainText(64, 0) }).strict();
export const AdminPlayer = z.object({ playerId: PlayerId }).strict();
export const AdminRename = z.object({ playerId: PlayerId, name: PlayerName }).strict();
export const AdminBan = z.object({ playerId: PlayerId, banned: z.boolean() }).strict();

export interface RouteContract {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  /** none: anyone; player: a signed-in player; admin: a player named in the server's admin list. */
  auth: 'none' | 'player' | 'admin';
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
  deleteAccount: route({
    id: 'deleteAccount',
    method: 'POST',
    path: PATHS.deleteAccount,
    auth: 'player',
    input: DeleteAccount,
    example: { password: 'a long enough secret', confirm: true },
  }),
  consolePassword: route({
    id: 'consolePassword',
    method: 'POST',
    path: PATHS.consolePassword,
    auth: 'admin',
    input: ChangePassword,
    example: { current: 'Password', password: 'a new long secret' },
  }),
  changePassword: route({
    id: 'changePassword',
    method: 'POST',
    path: PATHS.changePassword,
    auth: 'player',
    input: ChangePassword,
    example: { current: 'a long enough secret', password: 'a new long secret' },
  }),
  adminPlayers: route({
    id: 'adminPlayers',
    method: 'POST',
    path: PATHS.adminPlayers,
    auth: 'admin',
    input: AdminSearch,
    example: { query: 'Rowan' },
  }),
  adminSave: route({
    id: 'adminSave',
    method: 'POST',
    path: PATHS.adminSave,
    auth: 'admin',
    input: AdminPlayer,
    example: { playerId: '00000000-0000-4000-8000-000000000000' },
  }),
  adminRename: route({
    id: 'adminRename',
    method: 'POST',
    path: PATHS.adminRename,
    auth: 'admin',
    input: AdminRename,
    example: { playerId: '00000000-0000-4000-8000-000000000000', name: 'Renamed' },
  }),
  adminBan: route({
    id: 'adminBan',
    method: 'POST',
    path: PATHS.adminBan,
    auth: 'admin',
    input: AdminBan,
    example: { playerId: '00000000-0000-4000-8000-000000000000', banned: true },
  }),
  adminMend: route({
    id: 'adminMend',
    method: 'POST',
    path: PATHS.adminMend,
    auth: 'admin',
    input: AdminPlayer,
    example: { playerId: '00000000-0000-4000-8000-000000000000' },
  }),
  adminResetPassword: route({
    id: 'adminResetPassword',
    method: 'POST',
    path: PATHS.adminResetPassword,
    auth: 'admin',
    input: AdminPlayer,
    example: { playerId: '00000000-0000-4000-8000-000000000000' },
  }),
  ...CLOSED_TEST_ROUTES,
  ...CONSOLE_ROUTES,
  ...CONSOLE_LIVE_ROUTES,
  ...CONSOLE_MORE_ROUTES,
  ...CONSOLE_BANNER_ROUTES,
  ...CASTLE_ROUTES,
  ...MODERATION_ROUTES,
  ...PROFILE_ROUTES,
  ...MAIL_ROUTES,
  ...PUSH_ROUTES,
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
  /** Whether this player may open the admin page. */
  admin: boolean;
  /** Whether this is the admin console's own account (session 227), which never plays. */
  staff: boolean;
  /** The console's account still holding its first password, to be changed before anything else (session 237). */
  mustChangePassword?: boolean;
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
  /** The realm's banner standing now (session 235), if any. */
  banner?: Banner | null;
}
/** One hiscore entry: a place on a ladder. */
export interface HiscoreRow {
  rank: number;
  name: string;
  level: number;
  xp: number;
  /** Milestones claimed (shown on the Total ladder). */
  milestones: number;
  /** The title the player shows (an honour's id, worded by the page), and their banner's colour. */
  title: string | null;
  banner: string | null;
  /** How the player looks (session 43): their picture, its frame and glow, the badge beside their title
   *  and the scene behind their profile, each an honour's id; null before their save is first read. */
  look: Look | null;
}
export interface Look {
  picture: string;
  frame: string | null;
  glow: string | null;
  badge: string | null;
  scene: string;
  /** The companion beside the picture (session 179); absent from a look kept before it. */
  companion?: string | null;
}
export interface Ladder {
  /** A skill's id, or 'total'. */
  skill: string;
  rows: HiscoreRow[];
  /** The asking player's own entry, wherever it is; null before their first XP. */
  you: HiscoreRow | null;
  /** Rivals (session 173): who stands just above and just below the asking player, wherever they are;
   *  absent where the player is not listed, or alone. */
  near?: { above: HiscoreRow | null; below: HiscoreRow | null };
}
export interface HiscoresResponse {
  /** Pages open now. */
  online: number;
  /** Whether others see the asking player on the ladders: a player is listed once one of their
   *  actions comes half an hour or more after their first. Until then only they see their place, and
   *  nothing tells players the rule (it would show those making throwaway accounts how to be seen). */
  listed: boolean;
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
  'nameNotAllowed',
  'wrongPassword',
  'notAdmin',
  // A page of one player under another's session in the same browser (session 208): it loads afresh.
  'otherPlayer',
  // The admin console's own account, which never plays (session 227).
  'staffAccount',
  // An admin banning or deleting themselves from the console (session 231).
  'yourself',
  // The console's account still holding its first password (session 237): it chooses its own first.
  'mustChangePassword',
  // A new password the same as the one it replaces, or the console's first (session 237).
  'samePassword',
  'serverError',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;
export interface ErrorResponse {
  error: { code: ErrorCode; fields?: string[]; retryAfterSeconds?: number };
}
