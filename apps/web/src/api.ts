// The page's side of the server's contracts: one function per route, typed by the same contracts the
// server checks against. A refused request throws ApiError with the server's error code.
import {
  ROUTES,
  type ActResponse,
  type AuthResponse,
  type ErrorCode,
  type ErrorResponse,
  type GameResponse,
  type MeResponse,
  type RouteContract,
} from '@idle-clash/contracts';
import type { Command, CommandResult } from '@idle-clash/kernel';

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

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, null);
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) throw new ApiError(res.status, json as ErrorResponse | null);
  return json as T;
}

const get = <T>(route: RouteContract) => call<T>('GET', route.path);
const post = <T>(route: RouteContract, body?: unknown) => call<T>('POST', route.path, body);

/** A fresh id for a request that changes the save: sent again on a retry so it acts once. */
export const requestId = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

export const api = {
  me: () => get<MeResponse>(ROUTES.me),
  signUp: (name: string, password: string) => post<AuthResponse>(ROUTES.signUp, { name, password, ageConfirmed: true }),
  signIn: (name: string, password: string) => post<AuthResponse>(ROUTES.signIn, { name, password }),
  signOut: () => post<void>(ROUTES.signOut),
  game: () => get<GameResponse>(ROUTES.game),
  command: (id: string, command: Command) =>
    post<ActResponse<CommandResult>>(ROUTES.command, { requestId: id, command }),
  feature: <R>(feature: string, route: string, id: string, input: unknown) =>
    call<ActResponse<R>>('POST', `/api/f/${feature}/${route}`, { requestId: id, input }),
  reportError: (message: string, url: string, stack?: string) =>
    post<void>(ROUTES.errors, { message: message.slice(0, 500), url: url.slice(0, 500), ...(stack ? { stack } : {}) }),
};
