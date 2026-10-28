// A server for each test: an in-memory database, a clock the test moves, mail kept in memory.
import { defineFeature, defineRoute, FEATURES, type Feature } from '@idle-clash/features';
import { z } from 'zod';
import { buildApp, type Built } from '../src/app.ts';
import { MemoryMailer } from '../src/auth/mailer.ts';
import { flagsFrom, type Config } from '../src/config.ts';

export const ORIGIN = 'http://localhost:3000';
export const T0 = Date.UTC(2026, 9, 20, 9);

/** A feature with one route of its own, to test how feature routes are mounted and guarded. */
export const notes = defineFeature({
  id: 'notes',
  flag: { on: true, note: 'Test fixture' },
  content: {},
  effects: [],
  stops: [],
  rules: {},
  routes: {
    add: defineRoute({
      input: z.object({ text: z.string().min(1).max(40) }).strict(),
      example: { text: 'hello' },
      run: (state, input) => {
        const list = (state.features.notes as string[] | undefined) ?? [];
        return {
          state: { ...state, features: { ...state.features, notes: [...list, input.text] } },
          result: { count: list.length + 1 },
        };
      },
    }),
  },
  slots: { 'hearth.today': () => null },
  help: { title: 'help.woodcutting.title', body: 'help.woodcutting.body' },
});

export interface TestServer extends Built {
  clock: { now: number };
  mailer: MemoryMailer;
  config: Config;
}

export async function server(
  over: Partial<Config> = {},
  features: readonly Feature[] = [...FEATURES, notes],
): Promise<TestServer> {
  const clock = { now: T0 };
  const mailer = new MemoryMailer();
  const config: Config = {
    port: 0,
    host: '127.0.0.1',
    dbPath: ':memory:',
    webDist: null,
    origins: [ORIGIN],
    secureCookies: false,
    emailEnabled: false,
    flags: { ...flagsFrom('all'), notes: true },
    log: false,
    now: () => clock.now,
    adminNames: [],
    backupStatusDir: null,
    invitesRequired: false,
    ...over,
  };
  const built = await buildApp(config, { mailer, features });
  return { ...built, clock, mailer, config };
}

/** Signs a new player up and returns the session cookie. */
export async function signUp(s: TestServer, name = 'Rowan', password = 'a long enough secret'): Promise<string> {
  const r = await s.app.inject({
    method: 'POST',
    url: '/api/auth/sign-up',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ name, password, ageConfirmed: true }),
  });
  if (r.statusCode !== 201) throw new Error(`sign-up failed: ${r.statusCode} ${r.body}`);
  return String(r.headers['set-cookie']).split(';')[0];
}

/** Signs a player up, then names them on the admin list (the order the owner follows). */
export async function signUpAdmin(s: TestServer, name: string, password?: string): Promise<string> {
  const cookie = await signUp(s, name, password);
  s.config.adminNames.push(name);
  return cookie;
}

/** A JSON POST. An empty string sends no body (for routes that take none). */
export const post = (
  s: TestServer,
  url: string,
  body: unknown,
  cookie?: string,
  headers: Record<string, string> = {},
) =>
  s.app.inject({
    method: 'POST',
    url,
    headers: {
      ...(body === '' ? {} : { 'content-type': 'application/json' }),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    ...(body === '' ? {} : { payload: typeof body === 'string' ? body : JSON.stringify(body) }),
  });

export const code = (r: { body: string }) => (JSON.parse(r.body || '{}') as { error?: { code: string } }).error?.code;
