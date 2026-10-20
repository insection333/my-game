// What steps 6 to 9 share: one build of the web app, one server, the three browser engines, and the
// list of views to open (from IA.md, plus the two sheets).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, firefox, webkit, type Browser, type BrowserType } from 'playwright';
import { exec, ROOT } from '../exec.ts';
import { readPageMap, type ViewSpec } from '../ia.ts';
import { serve, type Served } from './serve.ts';

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

let server: Promise<Served> | null = null;
export const ensureServer = (): Promise<Served> => (server ??= serve(DIST));

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

/** The address of a view as a newcomer with every built feature switched on. */
export const viewUrl = (base: string, path: string) => `${base}${path}${path.includes('?') ? '&' : '?'}features=all`;

/** Closes browsers and the server; verify calls this once at the end. */
export async function closeSession(): Promise<void> {
  for (const b of browsers.values()) await (await b).close().catch(() => undefined);
  browsers.clear();
  if (server) await (await server).close();
  server = null;
}
