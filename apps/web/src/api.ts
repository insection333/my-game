// The page's side of the server's contracts: one function per route, typed by the same contracts the
// server checks against (their paths and types only, so the schemas stay out of the first page). A
// refused request throws ApiError with the server's error code.
import {
  featurePath,
  PATHS,
  type ActResponse,
  type AuthResponse,
  type ErrorCode,
  type ErrorResponse,
  type GameResponse,
  type AdminPlayersResponse,
  type AdminTestResponse,
  type AdminOverviewResponse,
  type AuditResponse,
  type BroadcastResult,
  type LiveResponse,
  type SystemResponse,
  type GrantResult,
  type RecordResponse,
  type XpResult,
  type DirectoryFilter,
  type DirectoryResponse,
  type DirectorySort,
  type AdminPlayerView,
  type AdminResetResponse,
  type AdminSaveResponse,
  type HiscoresResponse,
  type NoticesResponse,
  type MeResponse,
  type CastleAction,
  type AdminReportsResponse,
  type AdminSiegeFlowsResponse,
  type ReportReason,
  type Profile,
  type InboxResponse,
  type SendResult,
  type AdminMailResponse,
  type PushKeyResponse,
  type ActivityResponse,
  type NoteResult,
  type BannerView,
} from '@idle-clash/contracts';
import type { castleEngine } from '@idle-clash/features';
import { heardBuild } from './deploys.ts';
import type { Command, CommandResult } from '@idle-clash/kernel';

type CastleView = castleEngine.CastleView;
type CastleTargets = castleEngine.CastleTargets;
type CastleActResponse = castleEngine.CastleActResponse;

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | 'offline';
  readonly retryAfterSeconds: number | undefined;
  readonly fields: string[];
  constructor(status: number, body: Partial<ErrorResponse> | null) {
    super(body?.error?.code ?? 'offline');
    this.status = status;
    this.code = body?.error?.code ?? (status === 0 ? 'offline' : 'serverError');
    this.retryAfterSeconds = body?.error?.retryAfterSeconds;
    this.fields = body?.error?.fields ?? [];
  }
}

// The player this page shows (session 208): named on every request, so a page of one player under the
// session a second tab signed into is refused (otherPlayer) and loads afresh as the session's player,
// rather than changing the other player's save.
let shown: string | null = null;
export const showPlayer = (id: string | null): void => void (shown = id);
export const shownPlayer = (): string | null => shown;

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(shown ? { 'x-player': shown } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, null);
  }
  heardBuild(res.headers.get('x-build'));
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err = new ApiError(res.status, json as ErrorResponse | null);
    if (err.code === 'otherPlayer') location.reload();
    throw err;
  }
  return json as T;
}

const get = <T>(path: string) => call<T>('GET', path);
const post = <T>(path: string, body?: unknown) => call<T>('POST', path, body);

/** A fresh id for a request that changes the save: sent again on a retry so it acts once. */
export const requestId = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

export const api = {
  me: () => get<MeResponse>(PATHS.me),
  signUp: (name: string, password: string) => post<AuthResponse>(PATHS.signUp, { name, password, ageConfirmed: true }),
  feedback: (text: string, page: string) => post<void>(PATHS.feedback, { text, page }),
  signIn: (name: string, password: string) => post<AuthResponse>(PATHS.signIn, { name, password }),
  signOut: () => post<void>(PATHS.signOut),
  deleteAccount: (password: string) => post<void>(PATHS.deleteAccount, { password, confirm: true }),
  changePassword: (current: string, password: string) => post<void>(PATHS.changePassword, { current, password }),
  report: (name: string, reason: ReportReason) => post<void>(PATHS.reportPlayer, { name, reason }),
  profile: (name: string) => post<Profile>(PATHS.profile, { name }),
  mail: {
    inbox: () => post<InboxResponse>(PATHS.mailInbox),
    send: (to: string, body: string) => post<SendResult>(PATHS.mailSend, { to, body }),
    read: () => post<void>(PATHS.mailRead),
    remove: (id: number) => post<void>(PATHS.mailDelete, { id }),
    block: (name: string, blocked: boolean) => post<InboxResponse>(PATHS.mailBlock, { name, blocked }),
  },
  admin: {
    mail: (query: { player?: string; other?: string; text?: string; flagged: boolean }) =>
      post<AdminMailResponse>(PATHS.adminMail, query),
    mailAction: (player: string, action: 'warn' | 'mute' | 'unmute') =>
      post<void>(PATHS.adminMailAction, { player, action }),
    test: () => post<AdminTestResponse>(PATHS.adminTest),
    players: (query: string) => post<AdminPlayersResponse>(PATHS.adminPlayers, { query }),
    save: (playerId: string) => post<AdminSaveResponse>(PATHS.adminSave, { playerId }),
    rename: (playerId: string, name: string) => post<AdminPlayerView>(PATHS.adminRename, { playerId, name }),
    ban: (playerId: string, banned: boolean) => post<AdminPlayerView>(PATHS.adminBan, { playerId, banned }),
    mend: (playerId: string) => post<AdminSaveResponse>(PATHS.adminMend, { playerId }),
    resetPassword: (playerId: string) => post<AdminResetResponse>(PATHS.adminResetPassword, { playerId }),
    reports: () => post<AdminReportsResponse>(PATHS.adminReports),
    settleReports: (playerId: string) => post<void>(PATHS.adminSettleReports, { playerId }),
    siegeFlows: () => post<AdminSiegeFlowsResponse>(PATHS.adminSiegeFlows),
    overview: () => post<AdminOverviewResponse>(PATHS.adminOverview),
    directory: (q: { query: string; filter: DirectoryFilter; sort: DirectorySort; page: number; file?: true }) =>
      post<DirectoryResponse>(PATHS.adminDirectory, q),
    audit: (query: string, before: number | null, file?: true) =>
      post<AuditResponse>(PATHS.adminAudit, file ? { query, before, file } : { query, before }),
    record: (playerId: string) => post<RecordResponse>(PATHS.adminRecord, { playerId }),
    grant: (playerId: string, item: string, count: number, reason: string) =>
      post<GrantResult>(PATHS.adminGrant, { playerId, item, count, reason }),
    xp: (playerId: string, skill: string, xp: number, reason: string) =>
      post<XpResult>(PATHS.adminXp, { playerId, skill, xp, reason }),
    signOut: (playerId: string) => post<void>(PATHS.adminSignOut, { playerId }),
    remove: (playerId: string, name: string) => post<void>(PATHS.adminDelete, { playerId, name }),
    live: () => post<LiveResponse>(PATHS.adminLive),
    broadcast: (text: string, to: number) => post<BroadcastResult>(PATHS.adminBroadcast, { text, to }),
    system: () => post<SystemResponse>(PATHS.adminSystem),
    note: (playerId: string, text: string) => post<NoteResult>(PATHS.adminNote, { playerId, text }),
    unnote: (playerId: string, noteId: number) => post<void>(PATHS.adminNoteDelete, { playerId, noteId }),
    activity: (playerId: string) => post<ActivityResponse>(PATHS.adminActivity, { playerId }),
    endSession: (playerId: string, handle: string) => post<void>(PATHS.adminEndSession, { playerId, handle }),
    banner: (text: string, hours: number) => post<BannerView>(PATHS.adminBanner, { text, hours }),
    bannerDown: () => post<void>(PATHS.adminBannerDown),
  },
  push: {
    key: () => get<PushKeyResponse>(PATHS.pushKey),
    on: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }, tz: string) =>
      post<void>(PATHS.pushOn, { endpoint: sub.endpoint, keys: sub.keys, tz }),
    off: (endpoint: string) => post<void>(PATHS.pushOff, { endpoint }),
  },
  game: () => get<GameResponse>(PATHS.game),
  notices: () => get<NoticesResponse>(PATHS.notices),
  hiscores: () => get<HiscoresResponse>(PATHS.hiscores),
  castle: {
    view: () => get<CastleView>(PATHS.castle),
    targets: () => get<CastleTargets>(PATHS.castleTargets),
    open: (id: string) => post<CastleActResponse>(PATHS.castleOpen, { requestId: id }),
    act: (id: string, action: CastleAction) => post<CastleActResponse>(PATHS.castleAct, { requestId: id, action }),
  },
  command: (id: string, command: Command) =>
    post<ActResponse<CommandResult>>(PATHS.command, { requestId: id, command }),
  feature: <R>(feature: string, route: string, id: string, input: unknown) =>
    call<ActResponse<R>>('POST', featurePath(feature, route), { requestId: id, input }),
  reportError: (message: string, url: string, stack?: string) =>
    post<void>(PATHS.errors, { message: message.slice(0, 500), url: url.slice(0, 500), ...(stack ? { stack } : {}) }),
};
