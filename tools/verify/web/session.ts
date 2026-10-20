// What steps 6 to 9 share: one build of the web app, the game's own server on a scratch database
// with every built feature on, the three browser engines, a newcomer's session, and the list of
// views to open (from IA.md, plus the two sheets).
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
import { exec, ROOT } from '../exec.ts';
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

/** Views to open: every row of IA.md's "Visible without scrolling" tables, and the two sheets. */
export function views(): View[] {
  const map = readPageMap(readFileSync(join(ROOT, 'IA.md'), 'utf8'));
  const sheets: ViewSpec[] = [
    { page: 'The notices tray (panel)', path: '/?panel=tray', phone: ['tray.list'], desktop: ['tray.list'] },
    {
      page: 'Settings (account menu)',
      path: '/?panel=settings',
      phone: ['settings.account'],
      desktop: ['settings.account'],
    },
  ];
  return [...map.views, ...sheets].map((v) => ({
    ...v,
    name: v.path.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'hearth',
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

/** Signs a new player up and returns their session cookie. */
export async function newcomer(url: string, name: string): Promise<{ name: string; value: string }> {
  const res = await fetch(`${url}/api/auth/sign-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: url },
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
  const { app, close } = await buildApp({
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
  });
  await app.listen({ port, host: '127.0.0.1' });
  const cookie = await newcomer(url, 'Newcomer');
  return {
    url,
    cookie,
    close: async () => {
      await close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

let server: Promise<Served> | null = null;
export const ensureServer = (): Promise<Served> => (server ??= start());

/** Welcome views are opened signed out; every other view as the run's newcomer. */
export const signedOut = (path: string) => path.startsWith('/welcome');

/** A page for one view, in its own browser context, signed in unless the view is for visitors. */
export async function openPage(engine: Engine, path: string, options: BrowserContextOptions): Promise<Page> {
  const served = await ensureServer();
  const ctx = await (await browser(engine)).newContext(options);
  if (!signedOut(path)) await ctx.addCookies([{ ...served.cookie, url: served.url }]);
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
