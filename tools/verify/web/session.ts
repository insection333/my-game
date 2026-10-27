// What steps 6 to 9 share: one build of the web app, the game's own server on a scratch database
// with every built feature on, the three browser engines, a newcomer's session, and the list of
// views to open (from IA.md, plus the sheets).
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  chromium,
  firefox,
  webkit,
  type Browser,
  type BrowserContextOptions,
  type BrowserType,
  type Page,
} from 'playwright';
import { buildApp } from '../../../apps/server/src/app.ts';
import { flagsFrom } from '../../../apps/server/src/config.ts';
import type { Ctx } from '../../../apps/server/src/context.ts';
import type { State } from '@idle-clash/kernel';
import { exec, ROOT } from '../exec.ts';
import { elder } from './elder.ts';
import { withHonours } from './honours.ts';
import { crowd, CROWD, veteran } from './veteran.ts';
import { readPageMap, type ViewSpec } from '../ia.ts';

export const DIST = join(ROOT, 'apps/web/dist');
export const OUT = join(ROOT, '.verify');
export const WIDTHS = [320, 390, 1440] as const;
export type Width = (typeof WIDTHS)[number];
export const height = (w: number) => (w < 1000 ? 844 : 900);
export type Engine = 'chromium' | 'firefox' | 'webkit';
export const ENGINES: Engine[] = ['chromium', 'firefox', 'webkit'];

export interface View extends ViewSpec {
  /** A short name for files and reports. */
  name: string;
}

/** Views to open: every row of IA.md's "Visible without scrolling" tables, and the sheets (the tray, an item, settings). */
export function views(): View[] {
  const map = readPageMap(readFileSync(join(ROOT, 'IA.md'), 'utf8'));
  const sheets: ViewSpec[] = [
    { page: 'The notices tray (panel)', path: '/?panel=tray', phone: ['tray.list'], desktop: ['tray.list'] },
    {
      page: 'Storehouse',
      path: '/storehouse?panel=item&item=copper-bar',
      phone: ['item.panel'],
      desktop: ['item.panel'],
    },
    {
      page: 'Hiscores',
      path: '/hiscores/deeds?panel=honours',
      phone: ['hiscores.choose'],
      desktop: ['hiscores.choose'],
    },
    {
      page: 'Hiscores',
      path: '/hiscores/deeds?view=skills&panel=deed&deed=level-woodcutting-10',
      phone: ['hiscores.deed'],
      desktop: ['hiscores.deed'],
    },
    {
      page: 'Settings (account menu)',
      path: '/?panel=settings',
      phone: ['settings.account'],
      desktop: ['settings.account'],
    },
  ];
  // The same pages for a player three weeks in, whose rows carry odds, pills and long names.
  const veteran: ViewSpec[] = [
    ...map.views.filter((v) => !signedOut(v.path)).map((v) => ({ ...v, as: 'veteran' as const })),
    { page: 'Combat', path: '/combat?panel=gear&slot=weapon', phone: [], desktop: [], as: 'veteran' },
    // A region still ahead: its foes locked, each saying the Hitpoints level that opens it.
    { page: 'Combat', path: '/combat?region=peaks', phone: [], desktop: [], as: 'veteran' },
    { page: 'Skill', path: '/skills/melee', phone: [], desktop: [], as: 'veteran' },
    { page: 'Storehouse', path: '/storehouse?panel=item&item=carved-acorn', phone: [], desktop: [], as: 'veteran' },
  ];
  // Two months into the climb, in the Sunken Fen: the longest names and the largest numbers.
  const elders: ViewSpec[] = [
    '/',
    '/skills',
    '/skills/mining',
    '/skills/fishing',
    '/skills/cooking',
    '/skills/runecraft',
    '/skills/fletching',
    '/combat',
    '/storehouse',
    // Deeds two months in: honours open, families half done, a sheet of choices.
    '/hiscores/deeds',
    '/hiscores/deeds?view=skills',
    '/hiscores/deeds?view=combat',
    '/hiscores/deeds?panel=honours',
  ].map((path) => ({
    page:
      map.views.find((v) => v.path === path)?.page ??
      (path.startsWith('/skills/') ? 'Skill' : path.startsWith('/hiscores') ? 'Hiscores' : 'Hearth'),
    path,
    phone: [],
    desktop: [],
    as: 'elder' as const,
  }));
  // The privacy page and the terms, as a visitor reads them from the welcome page.
  const visitor: ViewSpec[] = map.views
    .filter((v) => v.path === '/privacy' || v.path === '/terms')
    .map((v) => ({ ...v, as: 'visitor' as const }));
  // The admin page is the admin's: a newcomer gets the page that does not exist.
  const newcomer = map.views.filter((v) => v.path !== '/admin');
  return [...newcomer, ...sheets, ...veteran, ...elders, ...visitor].map((v) => ({
    ...v,
    name: (v.as ? `${v.as}-` : '') + (v.path.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'hearth'),
  }));
}

let built: Promise<string | null> | null = null;
/** Builds the web app once per verify run; resolves to an error message, or null when built. */
export function ensureBuilt(): Promise<string | null> {
  // The web app's own Vite, from its package folder (pnpm does not hoist it to the root).
  built ??= exec(join(ROOT, 'apps/web/node_modules/.bin/vite'), ['build', 'apps/web', '--logLevel', 'warn']).then(
    (r) => (r.code === 0 ? null : r.output),
  );
  return built;
}

export interface Served {
  url: string;
  /** The session cookie of a newcomer signed up for this run. */
  cookie: { name: string; value: string };
  /** The session cookie of a player three weeks in (`veteran.ts`). */
  veteran: { name: string; value: string };
  /** And of one two months into the climb (`elder.ts`). */
  elder: { name: string; value: string };
  /** The server's insides, for flows that set up a save the way the admin page will. */
  ctx: Ctx;
  close: () => Promise<void>;
}

const freePort = () =>
  new Promise<number>((resolve) => {
    const probe = createServer();
    probe.listen(0, '127.0.0.1', () => {
      const addr = probe.address();
      probe.close(() => resolve(typeof addr === 'object' && addr ? addr.port : 0));
    });
  });

let signups = 0;
/** Signs a new player up and returns their session cookie. Each comes as if from its own address
 *  (through the loopback proxy the server trusts), so the run stays clear of the sign-up limit. */
export async function newcomer(url: string, name: string): Promise<{ name: string; value: string }> {
  const res = await fetch(`${url}/api/auth/sign-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: url, 'x-forwarded-for': `10.77.0.${++signups}` },
    body: JSON.stringify({ name, password: 'verify-newcomer-pass', ageConfirmed: true }),
  });
  if (res.status !== 201) throw new Error(`Signing up a newcomer failed: ${res.status} ${await res.text()}`);
  const [pair] = (res.headers.get('set-cookie') ?? '').split(';');
  const [cookieName, value] = pair.split('=');
  return { name: cookieName, value };
}

async function start(): Promise<Served> {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const dir = mkdtempSync(join(tmpdir(), 'idle-clash-verify-'));
  const { app, ctx, close } = await buildApp({
    port,
    host: '127.0.0.1',
    dbPath: join(dir, 'verify.db'),
    webDist: DIST,
    origins: [url],
    secureCookies: false,
    emailEnabled: false,
    flags: flagsFrom('all'),
    log: false,
    now: () => Date.now(),
    adminNames: [],
    backupStatusDir: null,
  });
  await app.listen({ port, host: '127.0.0.1' });
  const cookie = await newcomer(url, 'Newcomer');
  const now = Date.now();
  /** Signs a player up and gives their save a history (written as the admin page can). */
  const settle = async (name: string, make: (s: State) => State) => {
    const c = await newcomer(url, name);
    const me = (await (await fetch(`${url}/api/me`, { headers: { cookie: `${c.name}=${c.value}` } })).json()) as {
      player: { id: string };
    };
    const saved = ctx.store.read(me.player.id, now)!;
    // Deeds done by the time the page opens are recorded, and the best honours shown (honours.ts).
    const state = withHonours(ctx, make(saved.doc.state), now);
    ctx.store.write(me.player.id, { ...saved.doc, state }, saved.rev, now);
    ctx.hiscores.update(me.player.id, state, now);
    return c;
  };
  const vet = await settle('Veteran', (s) => veteran(ctx, s, now));
  const eld = await settle('Elder', (s) => elder(ctx, s, now));
  // The veteran keeps the game's admin page, so it is screenshot with players on it. Named on the list
  // once signed up, as the owner is: a name already on it cannot be signed up for.
  ctx.config.adminNames.push('Veteran');
  // Others on the hiscores, so the ladders read as they will with players on them.
  for (const [i, name] of CROWD.entries()) await settle(name, (s) => crowd(s, i));
  return {
    url,
    cookie,
    veteran: vet,
    elder: eld,
    ctx,
    close: async () => {
      await close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

let server: Promise<Served> | null = null;
export const ensureServer = (): Promise<Served> => (server ??= start());

/** Welcome views are opened signed out; every other view as the run's newcomer, or its veteran. */
export const signedOut = (path: string) => path.startsWith('/welcome');

/** A page for one view, in its own browser context, signed in unless the view is for visitors. */
export async function openPage(
  engine: Engine,
  path: string,
  options: BrowserContextOptions,
  as?: 'veteran' | 'elder' | 'visitor',
): Promise<Page> {
  const served = await ensureServer();
  const ctx = await (await browser(engine)).newContext(options);
  const cookie = as === 'veteran' ? served.veteran : as === 'elder' ? served.elder : served.cookie;
  if (!signedOut(path) && as !== 'visitor') await ctx.addCookies([{ ...cookie, url: served.url }]);
  const page = await ctx.newPage();
  page.on('close', () => void ctx.close().catch(() => undefined));
  return page;
}

/** Chromium from Playwright's own download, or the one preinstalled here when that cannot be fetched. */
function chromiumPath(): string | undefined {
  try {
    if (existsSync(chromium.executablePath())) return undefined;
  } catch {
    /* fall through */
  }
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  const found = existsSync(base)
    ? readdirSync(base)
        .filter((d) => /^chromium-\d+$/.test(d))
        .sort()
    : [];
  const path = found.length ? join(base, found.at(-1)!, 'chrome-linux/chrome') : undefined;
  return path && existsSync(path) ? path : undefined;
}

const TYPES: Record<Engine, BrowserType> = { chromium, firefox, webkit };
const browsers = new Map<Engine, Promise<Browser>>();
export function browser(engine: Engine): Promise<Browser> {
  if (!browsers.has(engine)) {
    browsers.set(engine, TYPES[engine].launch(engine === 'chromium' ? { executablePath: chromiumPath() } : {}));
  }
  return browsers.get(engine)!;
}

/** The address of a view on the run's server. */
export const viewUrl = (base: string, path: string) => `${base}${path}`;

/** Closes browsers and the server; verify calls this once at the end. */
export async function closeSession(): Promise<void> {
  for (const b of browsers.values()) await (await b).close().catch(() => undefined);
  browsers.clear();
  if (server) await (await server).close();
  server = null;
}
